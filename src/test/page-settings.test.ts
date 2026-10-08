import { describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: vi.fn() } }));
import { PAGE_DEFS, buildPageCss, pageDefaults, pageSettingsQuery, makePageView } from "@/lib/page-settings";

describe("missing page definition", () => {
  it("keeps styles, defaults and reads safe while a page is absent from the registry", async () => {
    const index = PAGE_DEFS.findIndex(p => p.key === "contact");
    const definition = PAGE_DEFS[index];
    if (!definition) throw new Error("Contact definition missing before test");
    PAGE_DEFS.splice(index, 1);
    try {
      expect(buildPageCss("contact", { sections: { "contact-form": { visible: false } } })).toBe("");
      expect(pageDefaults("contact")).toEqual({ sections: {} });
      expect(makePageView("contact", undefined).t("contact-form", "intro")).toBe("");
      const query = pageSettingsQuery("contact");
      if (typeof query.queryFn !== "function") throw new Error("Missing query function");
      expect(await query.queryFn({} as Parameters<typeof query.queryFn>[0])).toEqual({ sections: {} });
    } finally { PAGE_DEFS.splice(index, 0, definition); }
  });
  it("preserves registered contact defaults and custom styles", () => {
    expect(pageDefaults("contact").sections["contact-form"]?.content?.["submit_label"]).toBe("Verstuur bericht");
    expect(buildPageCss("contact", { sections: { "contact-form": { visible: false } } })).toContain("display:none");
  });
});

describe("independent footer configuration", () => {
  it("starts both owner-managed link columns empty", () => {
    const footer = makePageView("footer", undefined);
    for (const prefix of ["d", "i"]) for (let n = 1; n <= 8; n++) {
      expect(footer.t("footer-main", `${prefix}${n}_label`)).toBe("");
      expect(footer.t("footer-main", `${prefix}${n}_url`)).toBe("");
    }
  });
  it("has exactly one footer management entry and does not inherit the global footer", () => {
    expect(PAGE_DEFS.filter((p) => p.sections.some((s) => s.id === "footer-main")).map((p) => p.slug)).toEqual(["footer"]);
    expect(pageDefaults("global").sections["site-footer"]).toBeUndefined();
    const legacy = { sections: { "site-footer": { content: { d1_label: "Home", d1_url: "/" } } } };
    expect(makePageView("footer", legacy).t("footer-main", "d1_label")).toBe("");
  });
});