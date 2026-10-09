import { describe, expect, it } from "vitest";
import { arrangeMixed, layoutFor, parseLayouts } from "@/lib/collection-layout";

const it6 = Array.from({ length: 6 }, (_, i) => ({ id: String(i) as string, size: undefined as "large" | "small" | undefined }));

describe("collection layout", () => {
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
