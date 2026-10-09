import { expect, it } from "vitest";
import { leadSchema, DEFAULT_SCENARIO, scenarioSchema } from "@/lib/validation/schemas";

it("validates the full lead request, not just the email", () => {
  const input = { email: "reader@example.com", marketingConsent: false, website: "", attemptId: "1a832d46-2835-44e7-924c-59959634336c", scenario: DEFAULT_SCENARIO, etfIds: ["spy", "ivv"], attribution: { ad_variant: "a" } };
  expect(leadSchema.safeParse(input).success).toBe(true);
  expect(leadSchema.safeParse({ ...input, email: "bad" }).success).toBe(false);
  expect(leadSchema.safeParse({ ...input, etfIds: ["spy", "spy"] }).success).toBe(false);
  expect(leadSchema.safeParse({ ...input, etfIds: ["fake", "ivv"] }).success).toBe(false);
  expect(leadSchema.safeParse({ ...input, website: "spam" }).success).toBe(false);
  expect(scenarioSchema.safeParse({ ...DEFAULT_SCENARIO, monthly: -1 }).success).toBe(false);
});
