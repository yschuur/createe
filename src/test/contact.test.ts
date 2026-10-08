import { describe, it, expect } from "vitest";
import { contactSubmissionSchema, faqInitiallyExpanded } from "@/lib/contact-schema";

describe("Contact", () => {
  it("starts FAQ questions collapsed", () => {
    expect(faqInitiallyExpanded).toBe(false);
  });
  it("accepts optional phone and order number while requiring name, email and message", () => {
    const entry = { name: "Test", email: "test@example.com", phone: "", order_number: "", message: "Vraag", website: "" };
    expect(contactSubmissionSchema.safeParse(entry).success).toBe(true);
    for (const key of ["name", "email", "message"]) expect(contactSubmissionSchema.safeParse({ ...entry, [key]: "" }).success).toBe(false);
  });
  it("rejects the honeypot and invalid email", () => {
    const entry = { name: "Test", email: "test@example.com", phone: "", order_number: "", message: "Vraag", website: "" };
    expect(contactSubmissionSchema.safeParse({ ...entry, website: "spam" }).success).toBe(false);
    expect(contactSubmissionSchema.safeParse({ ...entry, email: "invalid" }).success).toBe(false);
  });
});