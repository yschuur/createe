import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LinkItem = { text: string; link: string };
export type HeroSide = { label: string; link: string; show_video: boolean; video_url?: string; image_url?: string };
export type HomepageSettings = {
  announcements: LinkItem[];
  golf: HeroSide;
  padel: HeroSide;
  studio_button: { label: string; link: string };
  show_ratings: boolean;
  carousel_title: string;
  featured_slugs: string[];
};

export const defaultHomepage: HomepageSettings = {
  announcements: [
    { text: "Ontdek onze Design Studio", link: "/design-studio" },
    { text: "Shop exclusieve designs", link: "/collections/golf" },
    { text: "Binnen 1-3 werkdagen verzonden", link: "" },
    { text: "Gratis verzending vanaf €75", link: "" },
    { text: "Ervaar de signature HYBR™ POLO", link: "/pages/de-hybr-polo" },
  ],
  golf: { label: "Golf", link: "/collections/golf", show_video: true },
  padel: { label: "Padel", link: "/collections/padel", show_video: true },
  studio_button: { label: "Studio", link: "/design-studio" },
  show_ratings: true,
  carousel_title: "",
  featured_slugs: ["padelo-picasso", "red-hot-chili-putters", "bogeymian-rhapsody", "bandeja-vu", "at-the-19th"],
};

export const homepageQuery = () => queryOptions({
  queryKey: ["site-settings", "homepage"],
  queryFn: async (): Promise<HomepageSettings> => {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "homepage").maybeSingle();
    return { ...defaultHomepage, ...((data?.value as Partial<HomepageSettings> | null) ?? {}) };
  },
  staleTime: 60_000,
});
