import { z } from "zod";

export const contactSubmissionSchema = z.object({
  name: z.string().trim().min(1, "Vul je naam in.").max(100, "Je naam mag maximaal 100 tekens bevatten."),
  email: z.string().trim().email("Vul een geldig e-mailadres in.").max(255),
  phone: z.string().trim().max(40).regex(/^[\d\s+().-]*$/, "Vul een geldig telefoonnummer in."),
  order_number: z.string().trim().max(100),
  message: z.string().trim().min(1, "Vul je bericht in.").max(5000, "Je bericht mag maximaal 5000 tekens bevatten."),
  website: z.string().max(0, "Je bericht kon niet worden verstuurd."),
});
export type ContactSubmission = z.infer<typeof contactSubmissionSchema>;
export const faqInitiallyExpanded = false;