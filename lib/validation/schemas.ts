import { z } from "zod";
import type { Scenario } from "@/lib/calculations/project";

export const DEFAULT_SCENARIO: Scenario = { initial: 100000, monthly: 3000, years: 20, grossReturnPct: 5 };
export const scenarioSchema = z.object({
  initial: z.number().finite().min(0).max(100000000),
  monthly: z.number().finite().min(0).max(1000000),
  years: z.number().int().min(1).max(50),
  grossReturnPct: z.number().finite().min(-50).max(30),
}).strict();
export const etfIdSchema = z.enum(["spy", "ivv", "cspx"]);
export const etfPairSchema = z.tuple([etfIdSchema, etfIdSchema]).refine(([a, b]) => a !== b, "Zvolte dva různé fondy.");
const campaignValue = z.string().max(64).regex(/^[a-zA-Z0-9_-]*$/);
export const attributionSchema = z.object({ ad_variant: z.enum(["a", "b"]).default("a"), utm_source: campaignValue.optional(), utm_medium: campaignValue.optional(), utm_campaign: campaignValue.optional(), utm_content: campaignValue.optional() }).strict();
export const leadSchema = z.object({
  email: z.string().trim().min(3).max(254).email("Zadejte platný email."),
  marketingConsent: z.boolean().default(false), website: z.literal("").default(""),
  attemptId: z.uuid(), scenario: scenarioSchema, etfIds: etfPairSchema,
  attribution: attributionSchema.default({ ad_variant: "a" }),
}).strict();
export type LeadInput = z.infer<typeof leadSchema>;
