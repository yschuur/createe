import { describe, expect, it } from "vitest";
import { dragFocus, focusPosition, legacyFocus } from "@/lib/image-focus";
describe("owner-controlled image crop", () => {
  it("moves the visible image along its overflow axis", () => {
    expect(dragFocus({ x: 50, y: 50 }, 25, -20, 100, 200)).toEqual({ x: 25, y: 60 });
  });
  it("keeps the frame filled at both edges", () => {
    expect(dragFocus({ x: 50, y: 50 }, 500, -500, 100, 100)).toEqual({ x: 0, y: 100 });
  });
  it("does not move an axis without cropped overflow", () => {
    expect(dragFocus({ x: 50, y: 50 }, 20, 20, 0, 100)).toEqual({ x: 50, y: 30 });
  });
  it("preserves existing focus settings", () => { expect(focusPosition(legacyFocus("top"))).toBe("50% 0%"); });
});