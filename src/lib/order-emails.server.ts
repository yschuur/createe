import { sendTemplateEmail } from "@/lib/email-templates/send-email";
import { parseOrderEmails, fill, type EmailKey } from "@/lib/order-emails";

type Db = { from: (t: string) => any };

function formatAddress(a: any): string {
  if (!a || typeof a !== "object") return "";
  return [a.line1, a.line2, [a.postal_code, a.city].filter(Boolean).join(" "), a.country].filter(Boolean).join(", ");
}

/** Send one order email (customer) and, for confirmations, the owner notice. Never throws. */
export async function sendOrderEmail(db: Db, orderId: string, kind: EmailKey) {
  try {
    const { data: order } = await db.from("orders").select("*").eq("id", orderId).maybeSingle();
    if (!order) return;
    const { data: items } = await db.from("order_items").select("product_name, variant_label, quantity, line_total").eq("order_id", orderId);
    const { data: s } = await db.from("site_settings").select("value").eq("key", "order_emails").maybeSingle();
    const cfg = parseOrderEmails(s?.value);
    const e = cfg[kind];
    const vars = { order: order.order_number, name: order.name };
    const base = {
      orderNumber: order.order_number,
      customerName: order.name ?? "",
      lines: (items ?? []).map((i: any) => ({ name: i.product_name, label: i.variant_label, quantity: i.quantity, total: Number(i.line_total) })),
      shipping: Number(order.shipping_total ?? 0),
      total: Number(order.total ?? 0),
    };
    if (order.email) {
      const r = await sendTemplateEmail("order-email", order.email, {
        idempotencyKey: `order-${kind}-${orderId}`,
        replyTo: cfg.owner_email,
        templateData: {
          ...base,
          subject: fill(e.subject, vars), heading: fill(e.heading, vars), body: fill(e.body, vars),
          button: e.button, buttonUrl: kind === "shipped" ? order.tracking_url ?? undefined : undefined,
        },
      });
      if (!r.sent) console.log("Order email suppressed", kind, order.order_number);
    }
    if (kind === "confirmation") {
      await sendTemplateEmail("order-email", cfg.owner_email, {
        idempotencyKey: `order-owner-${orderId}`,
        templateData: {
          ...base, owner: true, email: order.email ?? "", phone: order.phone ?? "",
          address: formatAddress(order.shipping_address),
          subject: `Nieuwe bestelling ${order.order_number}`,
          heading: `Nieuwe bestelling ${order.order_number}`,
          body: `Er is zojuist een bestelling betaald door ${order.name ?? order.email ?? "een klant"}.`,
        },
      });
    }
  } catch (err) {
    console.error("Order email failed:", kind, err);
  }
}
