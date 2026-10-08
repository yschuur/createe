import { sendTemplateEmail } from "@/lib/email-templates/send-email";

const OWNER = "contact@createe.nl";

type Field = { label: string; value: string };

/** Confirmation to the submitter + notice to the owner. Never throws. */
export async function sendFormEmails(opts: { kind: "contact" | "studio"; id: string; name: string; email: string; fields: Field[] }) {
  const isStudio = opts.kind === "studio";
  const form = isStudio ? "Design Studio-aanvraag" : "Contactformulier";
  try {
    await sendTemplateEmail("form-email", opts.email, {
      idempotencyKey: `${opts.kind}-confirm-${opts.id}`,
      replyTo: OWNER,
      templateData: {
        subject: isStudio ? "We hebben je designaanvraag ontvangen" : "Bedankt voor je bericht aan CREATEE",
        label: form,
        heading: `Bedankt${opts.name ? `, ${opts.name}` : ""}!`,
        body: isStudio
          ? "We hebben je aanvraag voor de Design Studio goed ontvangen. We bekijken je idee en nemen zo snel mogelijk contact met je op om het samen verder uit te werken.\n\nHieronder vind je een kopie van je aanvraag."
          : "We hebben je bericht goed ontvangen en reageren zo snel mogelijk.\n\nHieronder vind je een kopie van je bericht.",
        fields: opts.fields,
      },
    });
  } catch (e) { console.error("Form confirmation failed", e); }
  try {
    await sendTemplateEmail("form-email", OWNER, {
      idempotencyKey: `${opts.kind}-owner-${opts.id}`,
      replyTo: opts.email,
      templateData: {
        subject: `Nieuwe ${form.toLowerCase()} van ${opts.name}`,
        label: form,
        heading: `Nieuwe inzending van ${opts.name}`,
        body: "Er is zojuist een formulier ingevuld op de website. Je vindt alle inzendingen in Beheer → Inzendingen.",
        fields: [{ label: "Naam", value: opts.name }, { label: "E-mail", value: opts.email }, ...opts.fields],
      },
    });
  } catch (e) { console.error("Form owner notice failed", e); }
}
