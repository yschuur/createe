import { describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: vi.fn() } }));
import { defaultShipping, shippingCost } from "@/lib/shipping";

describe("shipping", () => {
  it("charges €4,95 below €75", () => expect(shippingCost(74.99, defaultShipping)).toBe(4.95));
  it("is free from €75", () => expect(shippingCost(75, defaultShipping)).toBe(0));
});
