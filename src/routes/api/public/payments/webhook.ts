import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

// Defer client construction until first use so env var availability is not
// assumed at module load time.
let _supabase: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<Database>(
      process.env['SUPABASE_URL']!,
      process.env['SUPABASE_SERVICE_ROLE_KEY']!,
    );
  }
  return _supabase;
}

type OrderItemRow = { variant_id: string | null; quantity: number };

/** Mark the order paid, store customer/shipping data and decrement stock.
 * Idempotent: only transitions a pending order. */
async function fulfillOrder(session: any, env: StripeEnv) {
  const orderId = session?.metadata?.order_id;
  if (!orderId) return;

  const db = getSupabase();
  const { data: order } = await db
    .from("orders")
    .select("id, status, environment")
    .eq("id", orderId)
    .eq("environment", env)
    .maybeSingle();
  if (!order || order.status !== "pending") return;

  const shippingAddress =
    session.collected_information?.shipping_details?.address ??
    session.shipping_details?.address ??
    null;
  const shippingName =
    session.collected_information?.shipping_details?.name ??
    session.shipping_details?.name ??
    null;

  const { error: upErr } = await db
    .from("orders")
    .update({
      status: "paid",
      stripe_session_id: session.id,
      email: session.customer_details?.email ?? null,
      name: shippingName ?? session.customer_details?.name ?? null,
      phone: session.customer_details?.phone ?? null,
      shipping_address: shippingAddress,
      shipping_total: (session.total_details?.amount_shipping ?? 0) / 100,
      total: (session.amount_total ?? 0) / 100,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("environment", env)
    .eq("status", "pending");
  if (upErr) {
    console.error("Order fulfillment update failed:", upErr);
    return;
  }

  const { data: items } = await db
    .from("order_items")
    .select("variant_id, quantity")
    .eq("order_id", orderId);
  for (const item of (items ?? []) as OrderItemRow[]) {
    if (!item.variant_id || item.quantity < 1) continue;
    // Deny policy: stock never goes negative; original quantity is kept
    // separately in original_inventory_qty for audit purposes.
    const { error: decErr } = await db.rpc("decrement_variant_stock", {
      _variant: item.variant_id,
      _qty: item.quantity,
    });
    if (decErr) console.error("Stock decrement failed:", decErr);
  }
}

async function markOrder(session: any, env: StripeEnv, status: "failed" | "cancelled") {
  const orderId = session?.metadata?.order_id;
  if (!orderId) return;
  await getSupabase()
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("environment", env)
    .eq("status", "pending");
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "checkout.session.completed": {
      // Delayed-notification payment methods fire this when the payment is
      // SUBMITTED, not when money arrives. Fulfill unless payment_status is
      // "unpaid"; wait for async_payment_succeeded in that case.
      const session = event.data.object;
      if (session.payment_status !== "unpaid") {
        await fulfillOrder(session, env);
      }
      break;
    }
    case "checkout.session.async_payment_succeeded":
      await fulfillOrder(event.data.object, env);
      break;
    case "checkout.session.async_payment_failed":
      await markOrder(event.data.object, env, "failed");
      break;
    case "checkout.session.expired":
      await markOrder(event.data.object, env, "cancelled");
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook received with invalid or missing env query parameter:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        const env: StripeEnv = rawEnv;
        try {
          await handleWebhook(request, env);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
