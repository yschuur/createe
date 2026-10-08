import { describe, expect, it } from "vitest";
import { discountAmount, discountProblem } from "@/lib/discounts";

const base = { type: "free_shipping", active: true, min_order_amount: null, starts_at: null, ends_at: null, usage_limit: null, times_used: 0 };

describe("free shipping code", () => {
  it("is usable when active", () => expect(discountProblem(base, 10)).toBeNull());
  it("is rejected when inactive", () => expect(discountProblem({ ...base, active: false }, 10)).not.toBeNull());
  it("respects usage limit", () => expect(discountProblem({ ...base, usage_limit: 2, times_used: 2 }, 10)).not.toBeNull());
  it("respects minimum order", () => expect(discountProblem({ ...base, min_order_amount: 50 }, 49)).not.toBeNull());
});

describe("discount amounts", () => {
  it("20% of €50 is €10", () => expect(discountAmount({ type: "percentage", value: 20 }, 50)).toBe(10));
  it("fixed never exceeds subtotal", () => expect(discountAmount({ type: "fixed", value: 30 }, 20)).toBe(20));
  it("free shipping takes nothing off products", () => expect(discountAmount({ type: "free_shipping", value: 0 }, 50)).toBe(0));
});
