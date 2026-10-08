import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const shippingSchema = z.object({
  rate: z.number().min(0).max(1000),
  free_threshold: z.number().min(0).max(100000),
  label: z.string().trim().min(1).max(80),
});
export type ShippingSettings = z.infer<typeof shippingSchema>;

export const defaultShipping: ShippingSettings = { rate: 4.95, free_threshold: 75, label: "Verzending" };

export function parseShipping(value: unknown): ShippingSettings {
  const r = shippingSchema.safeParse({ ...defaultShipping, ...((value as object | null) ?? {}) });
  return r.success ? r.data : defaultShipping;
}

/** Shipping cost for a subtotal: free from the threshold, otherwise the flat rate. */
export function shippingCost(subtotal: number, s: ShippingSettings): number {
  return subtotal >= s.free_threshold ? 0 : s.rate;
}

export async function fetchShipping(): Promise<ShippingSettings> {
  const { data } = await supabase.from("site_settings").select("value").eq("key", "shipping").maybeSingle();
  return parseShipping(data?.value);
}

export const shippingQuery = () => queryOptions({ queryKey: ["site-settings", "shipping"], queryFn: fetchShipping, staleTime: 60_000 });
