import { describe, expect, it } from "vitest";
import { arrangeMixed, layoutFor, parseLayouts, sectionSchema } from "@/lib/collection-layout";

const it6 = Array.from({ length: 6 }, (_, i) => ({ id: String(i) as string, size: undefined as "large" | "small" | undefined }));

describe("collection layout", () => {
  it("keeps zero gutters for full-width sections and independent left/right spacing", () => {
    for (const type of ["banner", "mixed", "featured", "regular"]) {
      expect(sectionSchema.parse({ id: type, type, leftSpacing: 0, rightSpacing: 0, mobileLeftSpacing: 12, mobileRightSpacing: 24 })).toMatchObject({ leftSpacing: 0, rightSpacing: 0, mobileLeftSpacing: 12, mobileRightSpacing: 24 });
    }
  });
  it("preserves legacy spacing when no override is set", () => {
    expect(sectionSchema.parse({ id: "legacy", type: "mixed" }).leftSpacing).toBeUndefined();
  });
  it("preserves independently configured desktop and mobile banner heights", () => {
    const s = sectionSchema.parse({ id: "banner", type: "banner", height: 350, mobileHeight: 180 });
    expect(s).toMatchObject({ height: 350, mobileHeight: 180 });
  });
  it("preserves large image heights in mixed and featured sections", () => {
    for (const type of ["mixed", "featured"]) {
      expect(sectionSchema.parse({ id: type, type, largeHeight: 500, mobileLargeHeight: 320 })).toMatchObject({ largeHeight: 500, mobileLargeHeight: 320 });
    }
  });
  it("keeps legacy sections on automatic sizing", () => {
    expect(sectionSchema.parse({ id: "banner", type: "banner" })).toMatchObject({ height: 0, mobileHeight: 0 });
    expect(sectionSchema.parse({ id: "mixed", type: "mixed" })).toMatchObject({ largeHeight: 0, mobileLargeHeight: 0 });
  });
  it("reference layout gives 2 large and 4 small cards", () => {
    const r = arrangeMixed("2l-4s", it6);
    expect(r.large.map((x) => x.id)).toEqual(["0", "1"]);
    expect(r.small).toHaveLength(4);
    expect(r.warning).toBeNull();
  });
  it("items marked large take the large slots", () => {
    const items = it6.map((x, i) => (i === 4 ? { ...x, size: "large" as const } : x));
    expect(arrangeMixed("2l-4s", items).large.map((x) => x.id)).toEqual(["4", "0"]);
  });
  it("warns on a count mismatch without dropping products", () => {
    const r = arrangeMixed("2l-4s", it6.slice(0, 3));
    expect(r.warning).not.toBeNull();
    expect(r.large.length + r.small.length).toBe(3);
  });
  it("collection sections win over sport sections", () => {
    const map = parseLayouts({ golf: [{ id: "a", type: "banner" }], polos: [{ id: "b", type: "regular" }] });
    expect(layoutFor(map, "golf", "polos")?.[0]?.id).toBe("b");
    expect(layoutFor(map, "golf", "tees")?.[0]?.id).toBe("a");
    expect(layoutFor(map, "padel")).toBeNull();
  });
});
