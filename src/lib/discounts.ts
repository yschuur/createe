export type DiscountRow = {
  type: string;
  value?: number;
  active: boolean;
  min_order_amount: number | null;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  times_used: number;
};

export const DISCOUNT_TYPE_LABELS: Record<string, string> = {
  percentage: "Percentage",
  fixed: "Vast bedrag (€)",
  free_shipping: "Gratis bezorging",
};

/** Returns null when usable, otherwise a Dutch reason. */
export function discountProblem(d: DiscountRow | null, subtotal: number, now = new Date()): string | null {
  if (!d || !d.active) return "Deze kortingscode is ongeldig.";
  if (d.starts_at && new Date(d.starts_at) > now) return "Deze kortingscode is nog niet geldig.";
  if (d.ends_at && new Date(d.ends_at).getTime() + 86_400_000 <= now.getTime()) return "Deze kortingscode is verlopen.";
  if (d.usage_limit != null && d.times_used >= d.usage_limit) return "Deze kortingscode is al maximaal gebruikt.";
  if (d.min_order_amount != null && subtotal < Number(d.min_order_amount)) return `Deze code geldt vanaf €${Number(d.min_order_amount).toFixed(2).replace(".", ",")}.`;
  return null;
}

/** Amount off the product subtotal (shipping is handled separately). */
export function discountAmount(d: { type: string; value?: number }, subtotal: number): number {
  const v = Number(d.value ?? 0);
  if (d.type === "percentage") return Math.round(subtotal * Math.min(100, v)) / 100;
  if (d.type === "fixed") return Math.min(subtotal, v);
  return 0;
}

export function discountLabel(d: { type: string; value?: number }): string {
  if (d.type === "free_shipping") return "Gratis bezorging";
  if (d.type === "percentage") return `${Number(d.value)}% korting`;
  return `€${Number(d.value).toFixed(2).replace(".", ",")} korting`;
}
