import { describe, expect, it } from "vitest";
import { filterSportShop } from "@/lib/shop";

const products = [{ id: "golf-tee", sport_id: "golf" }, { id: "padel-tee", sport_id: "padel" }];
const tees = new Set(["golf-tee", "padel-tee"]);

describe("sport shop", () => {
  it("a golf tee never shows under padel tees, even in the same collection", () => {
    expect(filterSportShop(products, "padel", tees).map((p) => p.id)).toEqual(["padel-tee"]);
  });
  it("the golf shop only shows golf products", () => {
    expect(filterSportShop(products, "golf").map((p) => p.id)).toEqual(["golf-tee"]);
  });
});
