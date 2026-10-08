import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TextRole = "heading" | "body" | "label";
export type TextStyle = { font?: string | undefined; size?: number | undefined; weight?: number | undefined; uppercase?: "" | "yes" | "no" | undefined; color?: string | undefined; lineHeight?: number | undefined };
export type SectionStyles = Record<string, Partial<Record<TextRole, TextStyle>>>;

export const PAGES: { label: string; sections: { id: string; label: string }[] }[] = [
  { label: "Algemeen (alle pagina's)", sections: [
    { id: "site-header", label: "Menu" }, { id: "site-reviews", label: "Reviews" }, { id: "site-footer", label: "Footer" } ] },
  { label: "Homepage", sections: [
    { id: "home-hero", label: "Header met video's" }, { id: "home-products", label: "Productcarrousel" } ] },
  { label: "Design Studio", sections: [
    { id: "studio-intro", label: "Intro & stappen" }, { id: "studio-scorecard", label: "Scorecard" }, { id: "studio-form", label: "Aanvraagformulier" } ] },
  { label: "Ons verhaal", sections: [
    { id: "story-intro", label: "Intro" }, { id: "story-mission", label: "Onze missie" }, { id: "story-begin", label: "Hoe het begon" },
    { id: "story-values", label: "Kernwaarden" }, { id: "story-cta", label: "Afsluiter" } ] },
  { label: "De HYBR™ polo", sections: [ { id: "hybr-1", label: "Eerste blok" }, { id: "hybr-2", label: "Tweede blok" } ] },
];

export const ROLES: { id: TextRole; label: string; selector: string }[] = [
  { id: "heading", label: "Koppen", selector: "h1,h2,h3,h4,.editorial-title" },
  { id: "body", label: "Tekst", selector: "p,li,blockquote,label,figcaption,span:not([data-slot] *)" },
  { id: "label", label: "Knoppen & links", selector: "button,a,[data-slot=button]" },
];

export const FONTS: Record<string, string> = {
  Jost: '"Jost", system-ui, sans-serif',
  Fraunces: '"Fraunces", Georgia, serif',
  Montserrat: '"Montserrat", system-ui, sans-serif',
};
export const COLORS: Record<string, string> = {
  Groen: "var(--primary)", Donker: "var(--foreground)", Grijs: "var(--muted-foreground)", Wit: "var(--primary-foreground)", Rood: "var(--destructive)",
};

const clamp = (n: unknown, lo: number, hi: number) => (typeof n === "number" && isFinite(n) ? Math.min(hi, Math.max(lo, n)) : undefined);

/** Builds CSS only from whitelisted values, so admin input can never inject arbitrary CSS. */
export function buildCss(styles: SectionStyles): string {
  const valid = new Set(PAGES.flatMap((p) => p.sections.map((s) => s.id)));
  const out: string[] = [];
  for (const [sid, roles] of Object.entries(styles ?? {})) {
    if (!valid.has(sid)) continue;
    for (const r of ROLES) {
      const st = roles?.[r.id]; if (!st) continue;
      const decl: string[] = [];
      if (st.font && FONTS[st.font]) decl.push(`font-family:${FONTS[st.font]}`);
      const size = clamp(st.size, 8, 120); if (size) decl.push(`font-size:${size}px`);
      const w = clamp(st.weight, 100, 900); if (w) decl.push(`font-weight:${Math.round(w / 100) * 100}`);
      const lh = clamp(st.lineHeight, 0.8, 3); if (lh) decl.push(`line-height:${lh}`);
      if (st.uppercase === "yes") decl.push("text-transform:uppercase");
      if (st.uppercase === "no") decl.push("text-transform:none");
      if (st.color && COLORS[st.color]) decl.push(`color:${COLORS[st.color]}`);
      if (!decl.length) continue;
      const sel = r.selector.split(",").map((x) => `.storefront [data-section="${sid}"] :is(${x}):not(.cms-rich *)`).join(",");
      out.push(`${sel}{${decl.map((d) => d + " !important").join(";")}}`);
    }
  }
  return out.join("\n");
}

export const sectionStylesQuery = () => queryOptions({
  queryKey: ["site-settings", "section-styles"],
  queryFn: async (): Promise<SectionStyles> => {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "section_styles").maybeSingle();
    return (data?.value as SectionStyles | null) ?? {};
  },
  staleTime: 60_000,
});
