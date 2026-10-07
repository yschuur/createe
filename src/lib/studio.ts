import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import polo from "@/assets/studio-polo.jpg.asset.json";
import tee from "@/assets/studio-tee.jpg.asset.json";
import hoodie from "@/assets/studio-hoodie.jpg.asset.json";
import performance from "@/assets/studio-performance.jpg.asset.json";
import photo1 from "@/assets/studio-1.jpg.asset.json";
import photo2 from "@/assets/studio-2.jpg.asset.json";
import photo3 from "@/assets/studio-3.jpg.asset.json";
import photo4 from "@/assets/studio-4.jpg.asset.json";
import photo5 from "@/assets/studio-5.jpg.asset.json";
import photo6 from "@/assets/studio-6.jpg.asset.json";

type G = "Heren" | "Dames" | "Beide";
export type StudioProduct = { name: string; gender: G; image: string; tiers: [number, number, number]; colors: { name: string; hex: string; gender: G }[] };

// Productkeuzes, staffelprijzen en kleuren uit de originele Shopify-configurator.
export const studioProducts: StudioProduct[] = [
  { name: "HYBR™ polo", gender: "Beide", image: polo.url, tiers: [70,60,50], colors: [{name:"Beige",hex:"#d7c4a5",gender:"Beide"},{name:"Leaf Green",hex:"#41835f",gender:"Beide"},{name:"Ocean Blue",hex:"#4d708f",gender:"Beide"}] },
  { name: "Loose fit tee", gender: "Heren", image: tee.url, tiers: [50,40,30], colors: [{name:"Sand",hex:"#d7c4a5",gender:"Heren"},{name:"Antracite",hex:"#5e6065",gender:"Heren"},{name:"Black",hex:"#000000",gender:"Heren"},{name:"Luxe White",hex:"#ffffff",gender:"Heren"}] },
  { name: "Hoodie", gender: "Beide", image: hoodie.url, tiers: [80,70,60], colors: [{name:"Off-white",hex:"#e9decb",gender:"Beide"},{name:"Misty Blue",hex:"#6693b8",gender:"Beide"},{name:"Leaf Green",hex:"#41835f",gender:"Beide"},{name:"Navy",hex:"#38526a",gender:"Beide"},{name:"Luxe White",hex:"#ffffff",gender:"Beide"},{name:"Black",hex:"#000000",gender:"Beide"}] },
  { name: "Performance shirt", gender: "Heren", image: performance.url, tiers: [40,35,25], colors: [{name:"Vanilla",hex:"#d7c4a5",gender:"Heren"},{name:"Arctic White",hex:"#ffffff",gender:"Heren"},{name:"Bottle Green",hex:"#275c38",gender:"Heren"},{name:"Jet Black",hex:"#333333",gender:"Heren"}] },
  { name: "Performance tee", gender: "Dames", image: performance.url, tiers: [40,35,25], colors: [{name:"Arctic White",hex:"#ffffff",gender:"Dames"},{name:"Jet Black",hex:"#333333",gender:"Dames"},{name:"Bottle Green",hex:"#275c38",gender:"Dames"},{name:"Electric Orange",hex:"#f59920",gender:"Dames"},{name:"Sapphire Blue",hex:"#00b7cf",gender:"Dames"}] },
];

export type StudioReview = { id: string; image: string; name: string; text: string; rating: number };
export type StudioSettings = { reviews: StudioReview[]; color_images: Record<string, string> };

export const colorKey = (product: string, color: string) => `${product}|${color}`;
export const builtinImages = [polo, tee, hoodie, performance, photo1, photo2, photo3, photo4, photo5, photo6].map((a) => a.url);

export const defaultStudio: StudioSettings = {
  reviews: [photo1, photo2, photo3, photo4, photo5, photo6].map((p, i) => ({ id: `default-${i}`, image: p.url, name: "", text: "", rating: 5 })),
  color_images: {},
};

export const studioQuery = () => queryOptions({
  queryKey: ["site-settings", "studio"],
  queryFn: async (): Promise<StudioSettings> => {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "studio").maybeSingle();
    return { ...defaultStudio, ...((data?.value as Partial<StudioSettings> | null) ?? {}) };
  },
  staleTime: 60_000,
});
