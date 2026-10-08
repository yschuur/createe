import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const ORDER_STATUSES = ["pending", "paid", "production", "shipped", "delivered", "cancelled", "refunded", "failed"] as const;

type Ctx = { supabase: any; userId: string };

async function assertAdmin(ctx: Ctx) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Geen toegang");
}

async function logEvent(ctx: Ctx, orderId: string, text: string) {
  const { data } = await ctx.supabase.from("orders").select("events").eq("id", orderId).maybeSingle();
  const events = Array.isArray(data?.events) ? data.events : [];
  await ctx.supabase.from("orders").update({ events: [...events, { at: new Date().toISOString(), text }] }).eq("id", orderId);
}

const STATUS_NL: Record<string, string> = { pending: "Wacht op betaling", paid: "Betaald", production: "In productie", shipped: "Verzonden", delivered: "Bezorgd", cancelled: "Geannuleerd", refunded: "Terugbetaald", failed: "Mislukt" };
const MAIL_NL: Record<string, string> = { confirmation: "orderbevestiging", production: "productiemail", shipped: "verzendmail" };

/** Admin: change status (optionally emailing the customer). */
export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    orderId: z.string().uuid(),
    status: z.enum(ORDER_STATUSES),
    trackingUrl: z.string().trim().url().max(500).or(z.literal("")).optional(),
    sendEmail: z.boolean(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const patch: { status: string; tracking_url?: string | null } = { status: data.status };
    if (data.trackingUrl !== undefined) patch.tracking_url = data.trackingUrl || null;
    const { error } = await context.supabase.from("orders").update(patch).eq("id", data.orderId);
    if (error) throw new Error("Opslaan mislukt");
    let mailed = false;
    if (data.sendEmail && (data.status === "production" || data.status === "shipped")) {
      const { sendOrderEmail } = await import("@/lib/order-emails.server");
      mailed = await sendOrderEmail(context.supabase, data.orderId, data.status, { nonce: String(Date.now()) });
    }
    await logEvent(context, data.orderId, `Status gewijzigd naar ${STATUS_NL[data.status]}${mailed ? " — mail verstuurd" : ""}`);
    return { ok: true, mailed };
  });

const addressSchema = z.object({
  line1: z.string().trim().max(200), line2: z.string().trim().max(200),
  postal_code: z.string().trim().max(20), city: z.string().trim().max(100), country: z.string().trim().max(2),
});

/** Admin: edit customer, address, shipping, tracking, note and order lines. Totals are recomputed. */
export const saveOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    orderId: z.string().uuid(),
    name: z.string().trim().max(200),
    email: z.string().trim().email().max(255).or(z.literal("")),
    phone: z.string().trim().max(40),
    address: addressSchema,
    shipping: z.number().min(0).max(10000),
    trackingUrl: z.string().trim().url().max(500).or(z.literal("")),
    note: z.string().max(10000),
    items: z.array(z.object({
      id: z.string().uuid().optional(),
      product_name: z.string().trim().min(1).max(300),
      variant_label: z.string().trim().max(300),
      unit_price: z.number().min(0).max(100000),
      quantity: z.number().int().min(1).max(10000),
    })).max(200),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const db = context.supabase;
    const { data: existing } = await db.from("order_items").select("id").eq("order_id", data.orderId);
    const keep = new Set(data.items.map((i) => i.id).filter(Boolean));
    const remove = (existing ?? []).map((r: any) => r.id).filter((id: string) => !keep.has(id));
    if (remove.length) await db.from("order_items").delete().in("id", remove);
    for (const i of data.items) {
      const row = { product_name: i.product_name, variant_label: i.variant_label, unit_price: i.unit_price, quantity: i.quantity, line_total: Math.round(i.unit_price * i.quantity * 100) / 100 };
      if (i.id) await db.from("order_items").update(row).eq("id", i.id);
      else await db.from("order_items").insert({ ...row, order_id: data.orderId });
    }
    const subtotal = data.items.reduce((a, i) => a + i.unit_price * i.quantity, 0);
    const { error } = await db.from("orders").update({
      name: data.name || null, email: data.email || null, phone: data.phone || null,
      shipping_address: data.address, shipping_total: data.shipping,
      total: Math.round((subtotal + data.shipping) * 100) / 100,
      tracking_url: data.trackingUrl || null, admin_note: data.note,
    }).eq("id", data.orderId);
    if (error) throw new Error("Opslaan mislukt");
    await logEvent(context, data.orderId, "Bestelling bewerkt");
    return { ok: true };
  });

/** Admin: (re)send one of the status emails. */
export const resendOrderEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().uuid(), kind: z.enum(["confirmation", "production", "shipped"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { sendOrderEmail } = await import("@/lib/order-emails.server");
    const sent = await sendOrderEmail(context.supabase, data.orderId, data.kind, { nonce: String(Date.now()), owner: false });
    await logEvent(context, data.orderId, sent ? `${MAIL_NL[data.kind]} verstuurd` : `${MAIL_NL[data.kind]} niet verstuurd (adres geblokkeerd of fout)`);
    return { ok: sent };
  });

/** Admin: send a free-form email to the customer of an order. */
export const sendCustomOrderEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    orderId: z.string().uuid(),
    subject: z.string().trim().min(1).max(200),
    message: z.string().trim().min(1).max(10000),
    includeItems: z.boolean(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const db = context.supabase;
    const { data: order } = await db.from("orders").select("*").eq("id", data.orderId).maybeSingle();
    if (!order?.email) return { ok: false, error: "Deze bestelling heeft geen e-mailadres" };
    const { data: items } = await db.from("order_items").select("product_name, variant_label, quantity, line_total").eq("order_id", data.orderId);
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const r = await sendTemplateEmail("order-email", order.email, {
      idempotencyKey: `order-custom-${order.id}-${Date.now()}`,
      replyTo: "contact@createe.nl",
      templateData: {
        subject: data.subject, heading: data.subject, body: data.message,
        orderNumber: order.order_number, customerName: order.name ?? "",
        ...(data.includeItems ? {
          lines: (items ?? []).map((i: any) => ({ name: i.product_name, label: i.variant_label, quantity: i.quantity, total: Number(i.line_total) })),
          shipping: Number(order.shipping_total ?? 0), total: Number(order.total ?? 0),
        } : {}),
      },
    });
    await logEvent(context, data.orderId, r.sent ? `E-mail verstuurd: "${data.subject}"` : `E-mail niet verstuurd: "${data.subject}" (adres geblokkeerd)`);
    return { ok: r.sent, error: r.sent ? "" : "Dit adres ontvangt geen e-mails meer" };
  });

/** Admin: add an internal note to the timeline. */
export const addOrderEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().uuid(), text: z.string().trim().min(1).max(2000) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await logEvent(context, data.orderId, `Notitie: ${data.text}`);
    return { ok: true };
  });
