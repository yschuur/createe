import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";

/**
 * Shopify product CSV importer. Shopify spreads one product over several rows;
 * rows are grouped by Handle (primary key → products.slug).
 */
type Row = Record<string, string>;

export type ParsedVariant = {
  sku: string | null; color: string | null; size: string | null;
  option1_name: string | null; option1_value: string | null;
  option2_name: string | null; option2_value: string | null;
  option3_name: string | null; option3_value: string | null;
  price: number; compare_at_price: number | null;
  inventory_quantity: number; original_inventory_qty: number;
  allow_backorder: boolean; track_inventory: boolean; barcode: string | null;
  weight: number | null; weight_unit: string | null; sort_order: number;
  variant_image: string | null;
};
export type ParsedImage = { source_url: string; alt_text: string | null; sort_order: number };
export type ParsedProduct = {
  slug: string; name: string; description_html: string | null; vendor: string | null;
  product_category: string | null; product_type: string | null; tags: string[];
  status: string; published: boolean; is_service: boolean; featured: boolean;
  fit: string | null; fabric: string | null; target_gender: string | null;
  seo_title: string | null; seo_description: string | null; metadata: Record<string, string | null>;
  variants: ParsedVariant[]; images: ParsedImage[];
};
export type ParseResult = { products: ParsedProduct[]; errors: { row: number; message: string }[]; rowCount: number };

const META: Record<string, string> = {
  "Fit (product.metafields.custom.fit)": "fit",
  "Age group (product.metafields.shopify.age-group)": "age_group",
  "Clothing features (product.metafields.shopify.clothing-features)": "clothing_features",
  "Color (product.metafields.shopify.color-pattern)": "color_pattern",
  "Fabric (product.metafields.shopify.fabric)": "fabric",
  "Neckline (product.metafields.shopify.neckline)": "neckline",
  "Size (product.metafields.shopify.size)": "size",
  "Sleeve length type (product.metafields.shopify.sleeve-length-type)": "sleeve_length_type",
  "Target gender (product.metafields.shopify.target-gender)": "target_gender",
  "Top length type (product.metafields.shopify.top-length-type)": "top_length_type",
  "Google Shopping / Gender": "google_gender",
  "Google Shopping / Age Group": "google_age_group",
};

const s = (v: string | undefined) => (v && v.trim() !== "" ? v.trim() : null);
const n = (v: string | undefined) => (s(v) != null && !isNaN(Number(v)) ? Number(v) : null);
const kind = (name: string | null) => {
  const l = (name ?? "").toLowerCase();
  if (["kleur", "color", "colour", "vanille"].includes(l)) return "color";
  if (["maat", "size"].includes(l)) return "size";
  return null;
};

export function parseShopifyCsv(text: string): ParseResult {
  const res = Papa.parse<Row>(text, { header: true, skipEmptyLines: true });
  const errors: ParseResult["errors"] = res.errors.map((e) => ({ row: (e.row ?? 0) + 2, message: e.message }));
  const rows = res.data;
  if (!rows[0] || !("Handle" in rows[0])) {
    return { products: [], errors: [{ row: 1, message: "Geen Shopify product-CSV: kolom 'Handle' ontbreekt." }], rowCount: 0 };
  }
  const groups = new Map<string, { row: Row; line: number }[]>();
  rows.forEach((r, i) => {
    const h = s(r["Handle"]);
    if (!h) { errors.push({ row: i + 2, message: "Regel zonder Handle overgeslagen" }); return; }
    if (!groups.has(h)) groups.set(h, []);
    groups.get(h)!.push({ row: r, line: i + 2 });
  });

  const products: ParsedProduct[] = [];
  for (const [handle, g] of groups) {
    const head = g.find((x) => s(x.row["Title"]));
    if (!head) { errors.push({ row: g[0]?.line ?? 0, message: `${handle}: geen regel met Title` }); continue; }
    const f = head.row;
    const tags = (s(f["Tags"]) ?? "").split(",").map((t) => t.trim()).filter(Boolean);
    const meta: Record<string, string | null> = {};
    for (const [col, key] of Object.entries(META)) if (s(f[col])) meta[key] = s(f[col]);
    meta["shopify_status"] = s(f["Status"]);
    const is_service = handle === "createe-design-studio" || tags.some((t) => /service/i.test(t));
    const names = [s(f["Option1 Name"]), s(f["Option2 Name"]), s(f["Option3 Name"])];
    const variants: ParsedVariant[] = [];
    const images: ParsedImage[] = [];
    g.forEach(({ row: r, line }) => {
      if (s(r["Option1 Value"])) {
        const vals = [s(r["Option1 Value"]), s(r["Option2 Value"]), s(r["Option3 Value"])];
        const isDefault = names[0] === "Title" && vals[0] === "Default Title";
        let color: string | null = null, size: string | null = null;
        names.forEach((nm, i) => { if (kind(nm) === "color") color = vals[i] ?? null; if (kind(nm) === "size") size = vals[i] ?? null; });
        const qty = Math.trunc(n(r["Variant Inventory Qty"]) ?? 0);
        const price = n(r["Variant Price"]);
        if (price == null) errors.push({ row: line, message: `${handle}: variant zonder prijs` });
        variants.push({
          sku: s(r["Variant SKU"]), color, size,
          option1_name: isDefault ? null : (names[0] ?? null), option1_value: isDefault ? null : (vals[0] ?? null),
          option2_name: isDefault ? null : (names[1] ?? null), option2_value: isDefault ? null : (vals[1] ?? null),
          option3_name: isDefault ? null : (names[2] ?? null), option3_value: isDefault ? null : (vals[2] ?? null),
          price: price ?? 0, compare_at_price: n(r["Variant Compare At Price"]),
          inventory_quantity: is_service ? 0 : Math.max(0, qty), original_inventory_qty: qty,
          allow_backorder: s(r["Variant Inventory Policy"]) === "continue", track_inventory: !is_service,
          barcode: s(r["Variant Barcodes"]) ?? s(r["Variant Barcode"]),
          weight: n(r["Variant Grams"]), weight_unit: n(r["Variant Grams"]) != null ? "g" : s(r["Variant Weight Unit"]),
          sort_order: variants.length, variant_image: s(r["Variant Image"]),
        });
      }
      if (s(r["Image Src"])) images.push({ source_url: s(r["Image Src"])!, alt_text: s(r["Image Alt Text"]), sort_order: n(r["Image Position"]) ?? images.length + 1 });
    });
    images.sort((a, b) => a.sort_order - b.sort_order);
    products.push({
      slug: handle, name: s(f["Title"])!, description_html: s(f["Body (HTML)"]), vendor: s(f["Vendor"]),
      product_category: s(f["Product Category"]), product_type: s(f["Type"]), tags,
      status: (s(f["Status"]) ?? "draft").toLowerCase(), published: (s(f["Published"]) ?? "").toLowerCase() === "true",
      is_service, featured: tags.some((t) => t.toLowerCase() === "nieuw"),
      fit: meta["fit"] ?? null, fabric: meta["fabric"] ?? null, target_gender: meta["target_gender"] ?? null,
      seo_title: s(f["SEO Title"]), seo_description: s(f["SEO Description"]), metadata: meta, variants, images,
    });
  }
  return { products, errors, rowCount: rows.length };
}

export type ImportSummary = { found: number; created: number; updated: number; skipped: number; variants: number; images: number; errors: string[] };

export async function runImport(products: ParsedProduct[], onExisting: "skip" | "update", onProgress?: (i: number) => void): Promise<ImportSummary> {
  const sum: ImportSummary = { found: products.length, created: 0, updated: 0, skipped: 0, variants: 0, images: 0, errors: [] };
  const { data: existing } = await supabase.from("products").select("id, slug");
  const bySlug = new Map((existing ?? []).map((p) => [p.slug, p.id]));

  for (const [i, p] of products.entries()) {
    onProgress?.(i);
    try {
      const { variants, images, ...fields } = p;
      let id = bySlug.get(p.slug);
      if (id && onExisting === "skip") { sum.skipped++; continue; }
      if (id) {
        const { error } = await supabase.from("products").update(fields as never).eq("id", id);
        if (error) throw error;
        // replace variants/images only after product update succeeded
        await supabase.from("product_images").delete().eq("product_id", id);
        await supabase.from("product_variants").delete().eq("product_id", id);
        sum.updated++;
      } else {
        const { data, error } = await supabase.from("products").insert({ ...fields, sort_order: i } as never).select("id").single();
        if (error) throw error;
        id = (data as { id: string }).id;
        sum.created++;
      }
      const vRows = variants.map(({ variant_image: _vi, ...v }) => ({ ...v, product_id: id! }));
      const { data: vIns, error: vErr } = vRows.length ? await supabase.from("product_variants").insert(vRows).select("id") : { data: [], error: null };
      if (vErr) throw vErr;
      sum.variants += vIns?.length ?? 0;
      const imgVariant = new Map<string, string>();
      variants.forEach((v, idx) => { const row = vIns?.[idx]; if (v.variant_image && row && !imgVariant.has(v.variant_image)) imgVariant.set(v.variant_image, row.id); });
      const iRows = images.map((im) => ({
        product_id: id!, source_url: im.source_url, url: im.source_url, alt_text: im.alt_text, sort_order: im.sort_order,
        is_primary: im.sort_order === 1, variant_id: imgVariant.get(im.source_url) ?? null,
      }));
      for (const [src, vid] of imgVariant) if (!images.some((im) => im.source_url === src)) iRows.push({ product_id: id!, source_url: src, url: src, alt_text: null, sort_order: 999, is_primary: false, variant_id: vid });
      if (iRows.length) {
        const { error } = await supabase.from("product_images").insert(iRows);
        if (error) throw error;
        sum.images += iRows.length;
      }
    } catch (e) {
      sum.errors.push(`${p.slug}: ${(e as Error).message}`);
    }
  }
  const { data: u } = await supabase.auth.getUser();
  await supabase.from("import_logs").insert({ created_by: u.user?.id ?? null, source: "shopify_csv", summary: sum as never, errors: sum.errors as never });
  return sum;
}
