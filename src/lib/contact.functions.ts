import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { contactSubmissionSchema } from "@/lib/contact-schema";

// A public, validated, insert-only operation. Never return submitted personal data.
export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => contactSubmissionSchema.parse(input))
  .handler(async ({ data }) => {
    const { website: _website, ...submission } = data;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("contact_submissions").insert(submission).select("id").single();
    if (error || !row) return { ok: false, error: "Versturen is niet gelukt. Probeer het opnieuw." };
    const { sendFormEmails } = await import("@/lib/form-emails.server");
    await sendFormEmails({
      kind: "contact", id: row.id, name: submission.name, email: submission.email,
      fields: [
        { label: "Telefoon", value: submission.phone },
        { label: "Bestelnummer", value: submission.order_number },
        { label: "Bericht", value: submission.message },
      ],
    });
    return { ok: true, error: "" };
  });

const studioSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional(),
  quantity: z.number().int().min(1).max(10000).optional(),
  message: z.string().trim().min(1).max(6000),
});

export const submitStudio = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => studioSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("design_requests").insert(data).select("id").single();
    if (error || !row) return { ok: false };
    const { sendFormEmails } = await import("@/lib/form-emails.server");
    await sendFormEmails({
      kind: "studio", id: row.id, name: data.name, email: data.email,
      fields: [
        { label: "Telefoon", value: data.phone ?? "" },
        { label: "Aantal", value: data.quantity ? String(data.quantity) : "" },
        { label: "Aanvraag", value: data.message },
      ],
    });
    return { ok: true };
  });
