import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const replySchema = z.object({
  kind: z.enum(["contact", "studio"]),
  id: z.string().uuid(),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(10000),
});

/** Admin sends a reply email to the person who submitted a form. */
export const replyToSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => replySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const table = data.kind === "contact" ? "contact_submissions" : "design_requests";
    const { data: row, error } = await context.supabase.from(table).select("id, name, email, message, replies").eq("id", data.id).maybeSingle();
    if (error || !row) return { ok: false, error: "Inzending niet gevonden" };
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const replies = Array.isArray(row.replies) ? row.replies : [];
    const r = await sendTemplateEmail("form-email", row.email, {
      idempotencyKey: `${data.kind}-reply-${row.id}-${replies.length}`,
      replyTo: "contact@createe.nl",
      templateData: {
        subject: data.subject,
        label: data.kind === "contact" ? "Reactie op je bericht" : "Reactie op je designaanvraag",
        heading: `Hoi ${row.name},`,
        body: data.message,
        fields: [{ label: "Jouw oorspronkelijke bericht", value: row.message.split("\n\n").slice(0, data.kind === "studio" ? 1 : undefined).join("\n\n") }],
      },
    });
    if (!r.sent) return { ok: false, error: "Dit adres ontvangt geen e-mails meer (afgemeld of onbereikbaar)." };
    const next = [...replies, { at: new Date().toISOString(), subject: data.subject, message: data.message }];
    await context.supabase.from(table).update({ replies: next }).eq("id", row.id);
    return { ok: true, error: "" };
  });
