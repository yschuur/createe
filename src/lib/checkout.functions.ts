import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type Stripe from "stripe";
import { supabase } from "@/integrations/supabase/client";
import { optionLabel } from "@/lib/shop";
import { fetchShipping, shippingCost } from "@/lib/shipping";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";

const checkoutInput = z.object({
  items: z.array(z.object({
    variantId: z.string().uuid(),
    quantity: z.number().int().min(1).max(99),
  })).min(1).max(50),
  environment: z.enum(["sandbox", "live"]),
  returnUrl: z.string().url(),
  userId: z.string().uuid().nullish(),
});

type CheckoutSessionResult = { clientSecret: string } | { error: string };

type ResolvedItem = {
  productId: string | null;
  variantId: string;
  productName: string;
  label: string;
  price: number;
  quantity: number;
};

/** Create an embedded checkout session from cart items.
 * Prices and availability are always resolved server-side from the database;
 * out-of-stock variants are denied per the deny policy. */
export const createCheckoutSession = createServerFn({ method: "POST" })
  .validator((data: unknown) => checkoutInput.parse(data))
  .handler(async ({ data }): Promise<CheckoutSessionResult> => {
    try {
      const ids = data.items.map((i) => i.variantId);
      const { data: rows, error: rErr } = await supabase
        .from("product_variants")
        .select("id, price, active, track_inventory, allow_backorder, inventory_quantity, option1_value, option2_value, option3_value, product_id, products!inner(id, name, status, published, is_service)")
        .in("id", ids);
      if (rErr) return { error: "Kon de producten niet ophalen. Probeer het opnieuw." };

      const soldOut: string[] = [];
      const resolved: ResolvedItem[] = [];
      for (const item of data.items) {
        const v = rows?.find((r) => r.id === item.variantId);
        const p = (v as { products?: { id: string; name: string; status: string; published: boolean; is_service: boolean } } | undefined)?.products;
        if (!v || !p || p.status !== "active" || !p.published || p.is_service) {
          soldOut.push("een verwijderd product");
          continue;
        }
        let quantity = item.quantity;
        if (v.track_inventory && !v.allow_backorder) {
          quantity = Math.min(quantity, Math.max(0, v.inventory_quantity));
        }
        if (quantity < 1) {
          soldOut.push(p.name);
          continue;
        }
        resolved.push({
          productId: p.id,
          variantId: v.id,
          productName: p.name,
          label: optionLabel(v as never),
          price: Number(v.price),
          quantity,
        });
      }

      if (!resolved.length) {
        return { error: soldOut.length ? `Niet op voorraad: ${soldOut.join(", ")}` : "Je winkelmand is leeg." };
      }

      const total = resolved.reduce((s, i) => s + i.price * i.quantity, 0);
      if (total <= 0) return { error: "Je winkelmand bevat geen betaalbare producten." };

      const orderNumber = `CR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      let order: { id: string } | null = null;
      for (let attempt = 0; attempt < 3 && !order; attempt++) {
        const num = attempt === 0 ? orderNumber : `CR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        const { data: inserted, error } = await supabaseAdmin
          .from("orders")
          .insert({
            order_number: num,
            environment: data.environment,
            status: "pending",
            total,
            currency: "eur",
            user_id: data.userId ?? null,
          })
          .select("id")
          .single();
        if (!error && inserted) order = inserted;
        else if (error?.code !== "23505") return { error: "Kon de bestelling niet starten. Probeer het opnieuw." };
      }
      if (!order) return { error: "Kon de bestelling niet starten. Probeer het opnieuw." };

      const { error: iErr } = await supabaseAdmin.from("order_items").insert(
        resolved.map((i) => ({
          order_id: order!.id,
          product_id: i.productId,
          variant_id: i.variantId,
          product_name: i.productName,
          variant_label: i.label,
          unit_price: i.price,
          quantity: i.quantity,
          line_total: i.price * i.quantity,
        })),
      );
      if (iErr) return { error: "Kon de bestelling niet starten. Probeer het opnieuw." };

      const stripe = createStripeClient(data.environment);
      const shipSettings = await fetchShipping();
      const shipping = shippingCost(total, shipSettings);
      const session = await createSession(stripe, {
        resolved,
        total,
        orderNumber,
        orderId: order.id,
        userId: data.userId ?? null,
        returnUrl: data.returnUrl,
        withAutomaticTax: true,
        shipping,
        shippingLabel: shipping === 0 ? "Gratis verzending" : shipSettings.label,
      });
      if (!session.ok) {
        // Stripe Tax may not be enabled on the account yet — fall back to a
        // session without automatic tax; VAT is already included in the prices.
        const retry = await createSession(stripe, {
          resolved, total, orderNumber, orderId: order.id,
          userId: data.userId ?? null, returnUrl: data.returnUrl, withAutomaticTax: false,
          shipping, shippingLabel: shipping === 0 ? "Gratis verzending" : shipSettings.label,
        });
        if (!retry.ok) return { error: retry.error };
        return { clientSecret: retry.clientSecret };
      }
      return { clientSecret: session.clientSecret };
    } catch (error) {
      if (error instanceof z.ZodError) return { error: "Ongeldige aanvraag." };
      return { error: getStripeErrorMessage(error) };
    }
  });

type SessionArgs = {
  resolved: ResolvedItem[];
  total: number;
  orderNumber: string;
  orderId: string;
  userId: string | null;
  returnUrl: string;
  withAutomaticTax: boolean;
  shipping: number;
  shippingLabel: string;
};

async function createSession(
  stripe: ReturnType<typeof createStripeClient>,
  args: SessionArgs,
): Promise<{ ok: true; clientSecret: string } | { ok: false; error: string }> {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded_page",
      locale: "nl",
      return_url: args.returnUrl,
      line_items: args.resolved.map((i) => ({
        quantity: i.quantity,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(i.price * 100),
          tax_behavior: "inclusive",
          product_data: { name: `${i.productName} — ${i.label}` },
        },
      })),
      shipping_address_collection: { allowed_countries: ["NL", "BE"] },
      shipping_options: [{
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: args.shippingLabel,
          fixed_amount: { amount: Math.round(args.shipping * 100), currency: "eur" },
          tax_behavior: "inclusive",
        },
      }],
      metadata: {
        order_id: args.orderId,
        order_number: args.orderNumber,
        ...(args.userId ? { userId: args.userId } : {}),
      },
      payment_intent_data: {
        description: `CREATEE bestelling ${args.orderNumber}`,
        metadata: { order_id: args.orderId },
      },
      ...(args.withAutomaticTax ? { automatic_tax: { enabled: true } } : {}),
    } as Stripe.Checkout.SessionCreateParams);
    if (!session.client_secret) return { ok: false, error: "De betaalomgeving kon niet worden gestart. Probeer het opnieuw." };
    return { ok: true, clientSecret: session.client_secret };
  } catch (error) {
    return { ok: false, error: getStripeErrorMessage(error) };
  }
}

/** Read back the payment state of a finished checkout for the return page. */
export const getCheckoutStatus = createServerFn({ method: "GET" })
  .validator((data: { sessionId: string; environment: StripeEnv }) =>
    z.object({
      sessionId: z.string().regex(/^[A-Za-z0-9_-]+$/),
      environment: z.enum(["sandbox", "live"]),
    }).parse(data))
  .handler(async ({ data }): Promise<{ status: string; orderNumber: string | null; email: string | null } | { error: string }> => {
    try {
      const stripe = createStripeClient(data.environment);
      const session = await stripe.checkout.sessions.retrieve(data.sessionId);
      return {
        status: session.payment_status,
        orderNumber: session.metadata?.['order_number'] ?? null,
        email: session.customer_details?.email ?? null,
      };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
