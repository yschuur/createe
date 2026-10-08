import { describe, expect, it } from "vitest";
import { filterProducts, sortProducts, type ProductWithRelations } from "@/lib/shop";

function product(over: Partial<ProductWithRelations> & { name: string }): ProductWithRelations {
  return {
    id: over.name, slug: over.name, created_at: "2026-01-01T00:00:00Z",
    product_variants: [], product_images: [], ...over,
  } as unknown as ProductWithRelations;
}
function variant(over: Record<string, unknown>) {
  return { active: true, track_inventory: true, allow_backorder: false, inventory_quantity: 5, price: 50, ...over } as never;
}

const a = product({ name: "Alpha", created_at: "2026-01-01T00:00:00Z", product_variants: [variant({ price: 30, color: "Groen" })] });
const b = product({ name: "Beta", created_at: "2026-03-01T00:00:00Z", product_variants: [variant({ price: 80, color: "Zwart" })] });
const soldOut = product({ name: "Charlie", created_at: "2026-02-01T00:00:00Z", product_variants: [variant({ price: 50, inventory_quantity: 0 })] });
const all = [b, soldOut, a];

describe("shop filters", () => {
  it("availability: in-stock hides sold-out products, out shows only sold-out", () => {
    expect(filterProducts(all, { avail: "in" }).map((p) => p.name)).toEqual(["Beta", "Alpha"]);
    expect(filterProducts(all, { avail: "out" }).map((p) => p.name)).toEqual(["Charlie"]);
  });
  it("price range filters on lowest variant price", () => {
    expect(filterProducts(all, { min: 40, max: 90 }).map((p) => p.name)).toEqual(["Beta", "Charlie"]);
  });
  it("color filter keeps only products with a variant in that color", () => {
    expect(filterProducts(all, { color: "Groen" }).map((p) => p.name)).toEqual(["Alpha"]);
  });
  it("combined swatches match both color names", () => {
    const beige = product({ name: "Beige", product_variants: [variant({ color: "beige" })] });
    const sand = product({ name: "Sand", product_variants: [variant({ color: "sand" })] });
    const navy = product({ name: "Navy", product_variants: [variant({ color: "navy" })] });
    const ocean = product({ name: "Ocean", product_variants: [variant({ color: "oceaan-blauw" })] });
    const list = [beige, sand, navy, ocean, soldOut];
    expect(filterProducts(list, { color: "beige" }).map((p) => p.name)).toEqual(["Beige", "Sand"]);
    expect(filterProducts(list, { color: "sand" }).map((p) => p.name)).toEqual(["Beige", "Sand"]);
    expect(filterProducts(list, { color: "navy" }).map((p) => p.name)).toEqual(["Navy", "Ocean"]);
    expect(filterProducts(list, { color: "oceaan-blauw" }).map((p) => p.name)).toEqual(["Navy", "Ocean"]);
  });
});

describe("shop sorting", () => {
  it("alphabetical sorts by name", () => {
    expect(sortProducts(all, "alpha").map((p) => p.name)).toEqual(["Alpha", "Beta", "Charlie"]);
  });
  it("price sorts low-to-high and high-to-low", () => {
    expect(sortProducts(all, "price-asc").map((p) => p.name)).toEqual(["Alpha", "Charlie", "Beta"]);
    expect(sortProducts(all, "price-desc").map((p) => p.name)).toEqual(["Beta", "Charlie", "Alpha"]);
  });
  it("date sorts newest-first and oldest-first", () => {
    expect(sortProducts(all, "date-desc").map((p) => p.name)).toEqual(["Beta", "Charlie", "Alpha"]);
    expect(sortProducts(all, "date-asc").map((p) => p.name)).toEqual(["Alpha", "Charlie", "Beta"]);
  });
  it("unknown sort keeps the existing order", () => {
    expect(sortProducts(all, undefined).map((p) => p.name)).toEqual(["Beta", "Charlie", "Alpha"]);
  });
});
