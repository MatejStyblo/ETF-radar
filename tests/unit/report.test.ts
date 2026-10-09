import { expect, it } from "vitest";
import { buildReport } from "@/lib/report/model";

it("delivers extra horizons, real structure and a practical selection checklist", () => {
  const report = buildReport({ initial: 100000, monthly: 3000, years: 17, grossReturnPct: 5 }, ["spy", "cspx"], "2026-10-09T12:00:00.000Z");
  expect(report.horizons.map((h) => h.years)).toEqual([5, 10, 17, 20, 30]);
  expect(report.selected[0].annual).toHaveLength(18);
  expect(report.etfs[0].exchange).toBe("NYSE Arca");
  expect(report.etfs[1].exchange).toBe("London Stock Exchange");
  expect(report.checklist.length).toBeGreaterThanOrEqual(6);
  expect(report.assumptions.join(" ")).toContain("Model");
});
