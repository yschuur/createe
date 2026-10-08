import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Photos under the product grid, chosen per sport or collection slug (site_settings "collection_banners"). */
import type { ImageFocus } from "@/lib/image-focus";

export type Banner = { url: string; link: string; focus?: ImageFocus };
export type BannerMap = Record<string, Banner[]>;

export const bannersQuery = () => queryOptions({
  queryKey: ["site-settings", "collection_banners"],
  queryFn: async (): Promise<BannerMap> => {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "collection_banners").maybeSingle();
    return (data?.value as BannerMap | null) ?? {};
  },
  staleTime: 60_000,
});

/** An active collection with its own photos wins; otherwise the sport's photos show. */
export function bannersFor(map: BannerMap, sportSlug: string, collectionSlug?: string): Banner[] {
  const own = collectionSlug ? (map[collectionSlug] ?? []).filter((b) => b.url) : [];
  return own.length ? own : (map[sportSlug] ?? []).filter((b) => b.url);
}

export async function saveBanners(map: BannerMap) {
  return supabase.from("site_settings").upsert({ key: "collection_banners", value: map as never });
}

/** Section height in px per slug (site_settings "collection_banner_heights"); 0/missing = automatic 3:4 photos. */
export type HeightMap = Record<string, number>;
export const bannerHeightsQuery = () => queryOptions({
  queryKey: ["site-settings", "collection_banner_heights"],
  queryFn: async (): Promise<HeightMap> => {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "collection_banner_heights").maybeSingle();
    return (data?.value as HeightMap | null) ?? {};
  },
  staleTime: 60_000,
});
export async function saveBannerHeights(map: HeightMap) {
  return supabase.from("site_settings").upsert({ key: "collection_banner_heights", value: map as never });
}
