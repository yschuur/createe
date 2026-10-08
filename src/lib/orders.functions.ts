import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Admin: set an order to production/shipped and email the customer. */
export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    orderId: z.string().uuid(),
    status: z.enum(["paid", "production", "shipped"]),
    trackingUrl: z.string().trim().url().max(500).or(z.literal("")).optional(),
    sendEmail: z.boolean(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Geen toegang");
    const { error } = await context.supabase.from("orders").update({
      status: data.status,
      tracking_url: data.trackingUrl || null,
      updated_at: new Date().toISOString(),
    }).eq("id", data.orderId);
    if (error) throw new Error("Opslaan mislukt");
    if (data.sendEmail && data.status !== "paid") {
      const { sendOrderEmail } = await import("@/lib/order-emails.server");
      await sendOrderEmail(context.supabase, data.orderId, data.status);
    }
    return { ok: true };
  });
