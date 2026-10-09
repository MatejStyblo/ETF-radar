import { describe, expect, it } from "vitest";
import { project } from "@/lib/calculations/project";

describe("month-end contributions", () => {
  it("adds twelve contributions without inventing growth", () => {
    const result = project({ initial: 1000, monthly: 100, years: 1, grossReturnPct: 0 }, 0);
    expect(result.balance).toBeCloseTo(2200, 8);
    expect(result.contributed).toBe(2200);
    expect(result.costImpact).toBe(0);
    expect(result.annual).toHaveLength(2);
  });
});

describe("financial model boundaries", () => {
  it("rejects invalid scenarios rather than yielding misleading values", () => {
    expect(() => project({ initial: -1, monthly: 0, years: 1, grossReturnPct: 0 }, 0)).toThrow();
    expect(() => project({ initial: 100, monthly: 0, years: 0.5, grossReturnPct: 0 }, 0)).toThrow();
    expect(() => project({ initial: 100, monthly: 0, years: 1, grossReturnPct: -100 }, 0)).toThrow();
    expect(() => project({ initial: Infinity, monthly: 0, years: 1, grossReturnPct: 0 }, 0)).toThrow();
    expect(() => project({ initial: 100, monthly: 0, years: 1, grossReturnPct: 0 }, -1)).toThrow();
  });
  it("applies a proportional one-year cost exactly without return", () => {
    expect(project({ initial: 1000, monthly: 0, years: 1, grossReturnPct: 0 }, 1).balance).toBeCloseTo(990, 8);
  });
  it("matches independent annual compounding", () => {
    expect(project({ initial: 1000, monthly: 0, years: 1, grossReturnPct: 10 }, 0).balance).toBeCloseTo(1100, 8);
  });
  it("makes larger costs reduce balance without promising gains", () => {
    const scenario = { initial: 100000, monthly: 3000, years: 30, grossReturnPct: -5 };
    expect(project(scenario, 1).balance).toBeLessThan(project(scenario, 0.03).balance);
    expect(project(scenario, 0.03).costImpact).toBeGreaterThan(0);
  });
  it("adds contributions at month end", () => {
    const result = project({ initial: 0, monthly: 100, years: 1, grossReturnPct: 12 }, 0);
    const q = 1.12 ** (1 / 12);
    expect(result.balance).toBeCloseTo(100 * (q ** 12 - 1) / (q - 1), 8);
  });
});
