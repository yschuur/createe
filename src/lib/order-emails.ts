import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const EMAIL_KEYS = ["confirmation", "production", "shipped"] as const;
export type EmailKey = (typeof EMAIL_KEYS)[number];

const entry = z.object({
  subject: z.string().trim().min(1).max(150),
  heading: z.string().trim().min(1).max(200),
  body: z.string().max(4000),
  button: z.string().max(60),
});
export const orderEmailsSchema = z.object({
  owner_email: z.string().trim().email(),
  confirmation: entry,
  production: entry,
  shipped: entry,
});
export type OrderEmails = z.infer<typeof orderEmailsSchema>;
export type OrderEmailEntry = z.infer<typeof entry>;

export const EMAIL_LABELS: Record<EmailKey, string> = {
  confirmation: "Orderbevestiging",
  production: "In productie",
  shipped: "Verzonden",
};

export const defaultOrderEmails: OrderEmails = {
  owner_email: "contact@createe.nl",
  confirmation: {
    subject: "Goede swing! Je bestelling {order} is binnen",
    heading: "Goede swing! We hebben je bestelling in goede orde ontvangen!",
    body: "Gefeliciteerd! Je bent zojuist de best geklede persoon op de baan geworden. We hebben je order ontvangen en gaan direct aan de slag om je items in te pakken.",
    button: "",
  },
  production: {
    subject: "Je bestelling {order} wordt gemaakt",
    heading: "Je items gaan in productie!",
    body: "Goed nieuws: je bestelling ligt op de werkbank. We maken je items nu met de grootste zorg, zodat je straks met stijl de baan op stapt. Zodra alles verzonden is, hoor je weer van ons.",
    button: "",
  },
  shipped: {
    subject: "Je bestelling {order} is onderweg",
    heading: "Je bestelling is onderweg!",
    body: "Je items zijn ingepakt en verzonden. Met de knop hieronder volg je je pakket. Alvast veel plezier op de baan!",
    button: "Volg je pakket",
  },
};

export function parseOrderEmails(value: unknown): OrderEmails {
  const v = (value ?? {}) as Partial<OrderEmails>;
  const merged = {
    ...defaultOrderEmails, ...v,
    confirmation: { ...defaultOrderEmails.confirmation, ...(v.confirmation ?? {}) },
    production: { ...defaultOrderEmails.production, ...(v.production ?? {}) },
    shipped: { ...defaultOrderEmails.shipped, ...(v.shipped ?? {}) },
  };
  const r = orderEmailsSchema.safeParse(merged);
  return r.success ? r.data : defaultOrderEmails;
}

export async function fetchOrderEmails(): Promise<OrderEmails> {
  const { data } = await supabase.from("site_settings").select("value").eq("key", "order_emails").maybeSingle();
  return parseOrderEmails(data?.value);
}

export const orderEmailsQuery = () => queryOptions({ queryKey: ["site-settings", "order_emails"], queryFn: fetchOrderEmails });

/** Replace {order} and {name} placeholders. */
export function fill(text: string, vars: { order: string; name?: string | null }) {
  return text.replaceAll("{order}", vars.order).replaceAll("{name}", vars.name?.trim() || "");
}
