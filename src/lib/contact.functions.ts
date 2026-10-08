import { createServerFn } from "@tanstack/react-start";
import { contactSubmissionSchema } from "@/lib/contact-schema";

// A public, validated, insert-only operation. Never return submitted personal data.
export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => contactSubmissionSchema.parse(input))
  .handler(async ({ data }) => {
    const { website: _website, ...submission } = data;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_submissions").insert(submission);
    if (error) return { ok: false, error: "Versturen is niet gelukt. Probeer het opnieuw." };
    return { ok: true, error: "" };
  });