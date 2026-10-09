import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

/** Per-collection section layout, stored in site_settings "collection_layouts" keyed by sport or collection slug. */
const show = z.object({ name: z.boolean().default(true), material: z.boolean().default(true), price: z.boolean().default(true), colors: z.boolean().default(true) });
const item = z.object({
  productId: z.string(),
  size: z.enum(["large", "small"]).optional(),
  image: z.string().max(2000).optional(),
  label: z.string().max(40).optional(),
});
const base = { id: z.string(), hidden: z.boolean().default(false) };
export const MIXED_LAYOUTS = ["2l-4s", "1l-left", "1l-right", "small", "large"] as const;
export const sectionSchema = z.discriminatedUnion("type", [
  z.object({ ...base, type: z.literal("banner"), desktop: z.string().max(2000).default(""), mobile: z.string().max(2000).default("") }),
  z.object({ ...base, type: z.literal("mixed"), layout: z.enum(MIXED_LAYOUTS).default("2l-4s"), columns: z.number().int().min(1).max(6).default(4), items: z.array(item).default([]), show: show.default({}) }),
  z.object({ ...base, type: z.literal("featured"), columns: z.number().int().min(1).max(4).default(2), items: z.array(item).default([]), show: show.default({}) }),
  z.object({ ...base, type: z.literal("regular"), source: z.enum(["manual", "auto"]).default("auto"), limit: z.number().int().min(0).max(200).default(0), columns: z.number().int().min(1).max(6).default(4), items: z.array(item).default([]), show: show.default({}) }),
]);
export type Section = z.infer<typeof sectionSchema>;
export type SectionItem = z.infer<typeof item>;
export type SectionType = Section["type"];
export type LayoutMap = Record<string, Section[]>;

export const SECTION_TYPES: { type: SectionType; label: string; hint: string }[] = [
  { type: "banner", label: "Banner", hint: "Alleen een afbeelding over de volle breedte" },
  { type: "mixed", label: "Gemengd", hint: "Grote en kleine productkaarten samen" },
  { type: "featured", label: "Uitgelicht", hint: "Alleen grote productkaarten" },
  { type: "regular", label: "Regulier", hint: "Kleine productkaarten" },
];
export const LAYOUT_LABELS: Record<(typeof MIXED_LAYOUTS)[number], string> = {
  "2l-4s": "2 groot links + 4 klein rechts",
  "1l-left": "1 groot links + kleine rechts",
  "1l-right": "1 groot rechts + kleine links",
  small: "Alleen kleine kaarten",
  large: "Alleen grote kaarten",
};

export function newSection(type: SectionType): Section {
  return sectionSchema.parse({ type, id: crypto.randomUUID() });
}

export function parseLayouts(raw: unknown): LayoutMap {
  const out: LayoutMap = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [slug, list] of Object.entries(raw)) {
    if (!Array.isArray(list)) continue;
    out[slug] = list.flatMap((s) => { const r = sectionSchema.safeParse(s); return r.success ? [r.data] : []; });
  }
  return out;
}

export const layoutsQuery = () => queryOptions({
  queryKey: ["site-settings", "collection_layouts"],
  queryFn: async (): Promise<LayoutMap> => {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "collection_layouts").maybeSingle();
    return parseLayouts(data?.value);
  },
  staleTime: 60_000,
});
export async function saveLayouts(map: LayoutMap) {
  return supabase.from("site_settings").upsert({ key: "collection_layouts", value: map as never });
}

/** An active collection with its own sections wins; otherwise the sport's sections; none = classic grid. */
export function layoutFor(map: LayoutMap, sportSlug: string, collectionSlug?: string): Section[] | null {
  const own = collectionSlug ? map[collectionSlug] : undefined;
  if (own?.length) return own;
  return map[sportSlug]?.length ? map[sportSlug]! : null;
}

/** Large slots per mixed layout (null = any amount). Small slots: null = any amount. */
export const LAYOUT_SLOTS: Record<(typeof MIXED_LAYOUTS)[number], { large: number | null; small: number | null }> = {
  "2l-4s": { large: 2, small: 4 },
  "1l-left": { large: 1, small: 6 },
  "1l-right": { large: 1, small: 6 },
  small: { large: 0, small: null },
  large: { large: null, small: 0 },
};

/**
 * Splits items into large and small cards for a mixed layout. Items marked "large" take the large slots first,
 * then unmarked items fill up. Extra large-marked items become small; never leaves empty slots.
 */
export function arrangeMixed<T extends { size?: "large" | "small" | undefined }>(layout: (typeof MIXED_LAYOUTS)[number], items: T[]) {
  const slots = LAYOUT_SLOTS[layout];
  if (slots.large === null) return { large: items, small: [] as T[], warning: null as string | null };
  if (slots.large === 0) return { large: [] as T[], small: items, warning: null as string | null };
  const marked = items.filter((i) => i.size === "large");
  const unmarked = items.filter((i) => i.size !== "large" && i.size !== "small");
  const large = [...marked, ...unmarked].slice(0, slots.large);
  const small = items.filter((i) => !large.includes(i));
  const need = slots.large + (slots.small ?? 0);
  const warning = items.length !== need ? `Deze layout is gemaakt voor ${need} producten (${slots.large} groot, ${slots.small} klein); er zijn er ${items.length}.` : null;
  return { large, small, warning };
}
