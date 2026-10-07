import { queryOptions } from "@tanstack/react-query";
import sanitizeHtml from "sanitize-html";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Product = Tables<"products">;
export type Variant = Tables<"product_variants">;
export type ProductImage = Tables<"product_images">;
export type Collection = Tables<"collections">;
export type ProductWithRelations = Product & {
  product_variants: Variant[];
  product_images: ProductImage[];
};

const SELECT = "*, product_variants(*), product_images(*)";

function sortRelations(p: ProductWithRelations): ProductWithRelations {
  return {
    ...p,
    product_variants: [...(p.product_variants ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    product_images: [...(p.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  };
}

/** Publicly listable: active (not unlisted), published, no services. */
export const listProductsQuery = () =>
  queryOptions({
    queryKey: ["products", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(SELECT)
        .eq("status", "active")
        .eq("published", true)
        .eq("is_service", false)
        .order("sort_order");
      if (error) throw error;
      return (data as ProductWithRelations[]).map(sortRelations);
    },
  });

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["products", "slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select(SELECT).eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data ? sortRelations(data as ProductWithRelations) : null;
    },
  });

export const collectionsQuery = () =>
  queryOptions({
    queryKey: ["collections"],
    queryFn: async () => {
      const { data, error } = await supabase.from("collections").select("*").eq("published", true).order("sort_order");
      if (error) throw error;
      return data;
    },
  });

export const collectionQuery = (slug: string) =>
  queryOptions({
    queryKey: ["collections", slug],
    queryFn: async () => {
      const { data: c, error } = await supabase.from("collections").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      if (!c) return null;
      const { data: links } = await supabase.from("collection_products").select("product_id, sort_order").eq("collection_id", c.id);
      const ids = (links ?? []).map((l) => l.product_id);
      if (!ids.length) return { collection: c, products: [] as ProductWithRelations[] };
      const { data: products, error: e2 } = await supabase
        .from("products").select(SELECT).in("id", ids).eq("status", "active").eq("published", true);
      if (e2) throw e2;
      const order = new Map((links ?? []).map((l) => [l.product_id, l.sort_order]));
      return {
        collection: c,
        products: (products as ProductWithRelations[]).map(sortRelations).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)),
      };
    },
  });

export function formatPrice(v: number | string | null | undefined) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(v ?? 0));
}

export function priceRange(p: ProductWithRelations) {
  const prices = p.product_variants.filter((v) => v.active).map((v) => Number(v.price));
  const compare = p.product_variants.map((v) => Number(v.compare_at_price ?? 0));
  const min = prices.length ? Math.min(...prices) : 0;
  const maxCompare = Math.max(0, ...compare);
  return { min, compareAt: maxCompare > min ? maxCompare : null };
}

export function isPurchasable(v: Variant) {
  return v.active && (!v.track_inventory || v.allow_backorder || v.inventory_quantity > 0);
}

export function isSoldOut(p: ProductWithRelations) {
  return !p.is_service && p.product_variants.every((v) => !isPurchasable(v));
}

export function sanitizeDescription(html: string | null) {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "a", "h1", "h2", "h3", "h4", "span", "div"],
    allowedAttributes: { a: ["href", "target", "rel"] },
    transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }) },
  });
}

/** Shopify CDN supports width param for lighter images. */
export function imgUrl(url: string | undefined, width = 800) {
  if (!url) return "";
  if (url.includes("cdn.shopify.com")) return `${url}${url.includes("?") ? "&" : "?"}width=${width}`;
  return url;
}

export function optionLabel(v: Variant) {
  return [v.option1_value, v.option2_value, v.option3_value].filter(Boolean).map((x) => prettyValue(x)).join(" / ") || "Standaard";
}

export function prettyValue(s: string | null | undefined) {
  if (!s) return "";
  if (/^(xxs|xs|s|m|l|xl|xxl|xxxl|\d?xl)$/i.test(s)) return s.toUpperCase();
  return s.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}
