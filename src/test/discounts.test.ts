import { describe, expect, it } from "vitest";
import { discountProblem } from "@/lib/discounts";

const base = { type: "free_shipping", active: true, min_order_amount: null, starts_at: null, ends_at: null, usage_limit: null, times_used: 0 };

describe("free shipping code", () => {
  it("is usable when active", () => expect(discountProblem(base, 10)).toBeNull());
  it("is rejected when inactive", () => expect(discountProblem({ ...base, active: false }, 10)).not.toBeNull());
  it("respects usage limit", () => expect(discountProblem({ ...base, usage_limit: 2, times_used: 2 }, 10)).not.toBeNull());
  it("respects minimum order", () => expect(discountProblem({ ...base, min_order_amount: 50 }, 49)).not.toBeNull());
});
