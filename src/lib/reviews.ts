import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { reviews as defaultReviews, trustpilot } from "@/lib/reviews-data";

export const reviewSchema = z.object({
  author: z.string().trim().max(100),
  date: z.string().trim().max(40),
  title: z.string().trim().max(200),
  text: z.string().trim().max(3000),
});
export const reviewsSettingsSchema = z.object({
  heading: z.string().trim().max(60),
  total: z.string().trim().max(20),
  link: z.string().trim().max(500),
  reviews: z.array(reviewSchema).max(100),
});
export type ReviewsSettings = z.infer<typeof reviewsSettingsSchema>;

export const defaultReviewsSettings: ReviewsSettings = {
  heading: "Uitstekend",
  total: trustpilot.total,
  link: trustpilot.link,
  reviews: defaultReviews,
};

export const reviewsQuery = () => queryOptions({
  queryKey: ["site-settings", "reviews"],
  queryFn: async (): Promise<ReviewsSettings> => {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "reviews").maybeSingle();
    const r = reviewsSettingsSchema.safeParse({ ...defaultReviewsSettings, ...((data?.value as object | null) ?? {}) });
    return r.success ? r.data : defaultReviewsSettings;
  },
  staleTime: 60_000,
});
