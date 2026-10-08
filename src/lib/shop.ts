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

export const sportsQuery = () =>
  queryOptions({
    queryKey: ["sports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sports").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

/** A product only ever appears in the shop of its own sport; collections are filters within that sport. */
export function filterSportShop<T extends { id: string; sport_id: string | null }>(
  products: T[], sportId: string, collectionProductIds?: Set<string>,
): T[] {
  return products.filter((p) => p.sport_id === sportId && (!collectionProductIds || collectionProductIds.has(p.id)));
}

/** /collections/$slug: a sport slug opens that sport's shop; a collection slug resolves to its first sport. */
export const collectionQuery = (slug: string) =>
  queryOptions({
    queryKey: ["collections", slug],
    queryFn: async () => {
      const { data: sports, error: se } = await supabase.from("sports").select("*").order("sort_order");
      if (se) throw se;
      const sport = sports.find((x) => x.slug === slug);
      if (!sport) {
        const { data: c } = await supabase.from("collections").select("slug, sport_ids").eq("slug", slug).eq("published", true).maybeSingle();
        const first = sports.find((x) => c?.sport_ids.includes(x.id));
        return first && c ? { redirect: { sport: first.slug, collection: c.slug } } : null;
      }
      const { data: colls, error: ce } = await supabase.from("collections").select("*").eq("published", true).contains("sport_ids", [sport.id]).order("sort_order");
      if (ce) throw ce;
      const ids = colls.map((c) => c.id);
      const [{ data: products, error: pe }, { data: links }] = await Promise.all([
        supabase.from("products").select(SELECT).eq("sport_id", sport.id).eq("status", "active").eq("published", true).order("sort_order"),
        ids.length ? supabase.from("collection_products").select("collection_id, product_id, sort_order").in("collection_id", ids) : Promise.resolve({ data: [] as { collection_id: string; product_id: string; sort_order: number }[] }),
      ]);
      if (pe) throw pe;
      return { sport, collections: colls, links: links ?? [], products: (products as ProductWithRelations[]).map(sortRelations) };
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

/** Sanitizes owner rich text; only whitelisted inline styles (font, size, color, alignment) survive. */
export function sanitizeDescription(html: string | null) {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "s", "ul", "ol", "li", "a", "h1", "h2", "h3", "h4", "span", "div", "blockquote"],
    allowedAttributes: { a: ["href", "target", "rel"], "*": ["style"] },
    allowedStyles: { "*": {
      color: [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i, /^var\(--[a-z0-9-]+\)$/i],
      "font-family": [/^[\w\s"',-]+$/],
      "font-size": [/^\d{1,3}(\.\d+)?(px|rem|em)$/],
      "text-align": [/^(left|right|center|justify)$/],
    } },
    transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }) },
  });
}

export function stripHtml(html: string | null) {
  return html ? sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).trim() : "";
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
