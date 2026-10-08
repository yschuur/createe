/** Blank garments: physical stock is shared per model + color + size across all printed designs. */
export const BLANK_MODELS = [
  { key: "golf-polo", label: "Golf Polo (HYBR™ polo)" },
  { key: "t-shirt", label: "T-shirt (golf & padel)" },
  { key: "performance-tee", label: "Performance Tee (polyester padel)" },
] as const;

export const DEFAULT_SIZES = ["s", "m", "l", "xl"];

export function blankLabel(key: string | null | undefined) {
  return BLANK_MODELS.find((m) => m.key === key)?.label ?? "Geen (eigen voorraad)";
}

/** Normalizes a color/size the same way the database matches them. */
export function blankKey(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, "-");
}
