import type { ProductImage, ProductWithRelations, Variant } from "@/lib/shop";

export type ProductGallery = { default?: string[]; colors: Record<string, string[]> };

export function getGallery(metadata: unknown): ProductGallery {
  const raw = metadata && typeof metadata === "object" && "gallery" in metadata ? metadata.gallery : null;
  if (!raw || typeof raw !== "object") return { colors: {} };
  const ids = (v: unknown): v is string[] => Array.isArray(v) && v.every((id) => typeof id === "string");
  const colors: Record<string, string[]> = {};
  if ("colors" in raw && raw.colors && typeof raw.colors === "object") {
    for (const [color, list] of Object.entries(raw.colors)) if (ids(list)) colors[color] = list;
  }
  return { colors, ...("default" in raw && ids(raw.default) ? { default: raw.default } : {}) };
}

export function variantColor(v: Variant | undefined) {
  if (!v) return null;
  if (v.color) return v.color;
  const options = [[v.option1_name, v.option1_value], [v.option2_name, v.option2_value], [v.option3_name, v.option3_value]];
  return options.find(([name]) => name && /kleur|color|colour|vanille/i.test(name))?.[1] ?? null;
}

export function galleryImages(product: Pick<ProductWithRelations, "metadata" | "product_images" | "product_variants">, color?: string | null): ProductImage[] {
  const settings = getGallery(product.metadata);
  const images = product.product_images;
  const resolve = (ids: string[] | undefined) => [...new Set(ids ?? [])].flatMap((id) => {
    const image = images.find((im) => im.id === id);
    return image ? [image] : [];
  });
  if (color) {
    const chosen = resolve(settings.colors[color]);
    if (chosen.length) return chosen;
  }
  const defaults = resolve(settings.default);
  const base = defaults.length ? defaults : images;
  if (!color) return base;
  const ids = new Set(product.product_variants.filter((v) => variantColor(v) === color).map((v) => v.id));
  const linked = base.find((im) => im.variant_id && ids.has(im.variant_id));
  return linked ? [linked, ...base.filter((im) => im.id !== linked.id)] : base;
}