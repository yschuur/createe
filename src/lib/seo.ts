import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** SEO overrides for pages, sports and collections live in site_settings "seo", keyed "page:<key>", "policy:<slug>", "sport:<slug>", "collection:<slug>". Products use their own seo_title/seo_description columns. */
export type SeoEntry = { title?: string | undefined; description?: string | undefined };
export type SeoMap = Record<string, SeoEntry>;

export const seoQuery = () => queryOptions({
  queryKey: ["site-settings", "seo"],
  queryFn: async (): Promise<SeoMap> => {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "seo").maybeSingle();
    return (data?.value as SeoMap | null) ?? {};
  },
  staleTime: 60_000,
});

export async function saveSeo(map: SeoMap) {
  return supabase.from("site_settings").upsert({ key: "seo", value: map as never });
}

export type StaticPage = { key: string; label: string; path: string; title: string; description: string };

/** Fixed site pages with their default SEO text. */
export const STATIC_PAGES: StaticPage[] = [
  { key: "home", label: "Home", path: "/", title: "CREATEE | Unieke Kleding & Exclusieve Designs", description: "Weg met de standaard kleding. Shop premium kleding met unieke designs of gebruik onze design studio voor jouw eigen masterpiece." },
  { key: "design-studio", label: "Design Studio", path: "/design-studio", title: "CREATEE Design Studio - jouw eigen design", description: "Unieke premium kleding voor jouw groep. Drie persoonlijke designvoorstellen en twee feedbackrondes bij CREATEE Design Studio." },
  { key: "ons-verhaal", label: "Ons verhaal", path: "/pages/ons-verhaal", title: "Ons verhaal | CREATEE", description: "Exclusieve designs. Echte identiteit. Ontdek het verhaal, de missie en de kernwaarden van CREATEE." },
  { key: "de-hybr-polo", label: "De HYBR™ polo", path: "/pages/de-hybr-polo", title: "De HYBR™ polo | CREATEE", description: "De HYBR™ polo: 360° stretch, premium finish, smart-collar en kreukvrij, ademend draagcomfort." },
  { key: "contact", label: "Contact", path: "/pages/contact", title: "Contact & veelgestelde vragen | CREATEE", description: "Neem contact op met CREATEE en vind antwoorden over bestellingen, verzending, retouren en de Design Studio." },
];

export const staticPage = (key: string) => STATIC_PAGES.find((p) => p.key === key)!;

/** Finds the SEO map a loader returned (as last array element or `seo` field). */
export function seoFrom(loaderData: unknown, key: string): SeoEntry {
  const ld = loaderData as { seo?: SeoMap } | unknown[] | undefined;
  const map = Array.isArray(ld) ? (ld[ld.length - 1] as SeoMap | undefined) : ld?.seo;
  return map?.[key] ?? {};
}

/** Title/description meta tags with the override winning over the default. */
export function seoMeta(override: SeoEntry, def: { title: string; description: string }, opts: { type?: string | undefined; card?: string | undefined } = {}) {
  const title = override.title?.trim() || def.title;
  const description = override.description?.trim() || def.description;
  return [
    { title }, { name: "description", content: description },
    { property: "og:title", content: title }, { property: "og:description", content: description },
    { property: "og:type", content: opts.type ?? "website" }, { name: "twitter:card", content: opts.card ?? "summary_large_image" },
  ];
}

export function pageMeta(loaderData: unknown, key: string, card?: string) {
  const p = staticPage(key);
  return seoMeta(seoFrom(loaderData, `page:${key}`), p, { card });
}
