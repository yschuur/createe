import { describe, expect, it } from "vitest";
import { filterBySport } from "@/lib/shop";

const items = [{ id: "golf-tee", sports: ["golf"] }, { id: "padel-tee", sports: ["padel"] }];

describe("sport filter", () => {
  it("a golf tee is not shown under padel tees", () => {
    expect(filterBySport(items, "t-shirts", "padel").map((p) => p.id)).toEqual(["padel-tee"]);
  });
  it("sport collections only show that sport", () => {
    expect(filterBySport(items, "golf").map((p) => p.id)).toEqual(["golf-tee"]);
  });
});
