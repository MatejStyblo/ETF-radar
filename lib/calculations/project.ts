import { scenarioSchema } from "@/lib/validation/schemas";

export type Scenario = { initial: number; monthly: number; years: number; grossReturnPct: number };
export type AnnualPoint = { year: number; balance: number; baseline: number; contributed: number; costImpact: number };
export type Projection = AnnualPoint & { annual: AnnualPoint[] };

/** Fixed gross return; proportional annual cost; contributions at month end. */
export function project(scenario: Scenario, chargePct: number): Projection {
  scenarioSchema.parse(scenario);
  if (!Number.isFinite(chargePct) || chargePct < 0 || chargePct >= 100) throw new RangeError("Neplatný roční náklad.");
  const { initial, monthly, years, grossReturnPct } = scenario;
  const gross = (1 + grossReturnPct / 100) ** (1 / 12);
  const net = ((1 + grossReturnPct / 100) * (1 - chargePct / 100)) ** (1 / 12);
  let balance = initial;
  let baseline = initial;
  const annual: AnnualPoint[] = [{ year: 0, balance, baseline, contributed: initial, costImpact: 0 }];
  for (let month = 1; month <= years * 12; month++) {
    balance = balance * net + monthly;
    baseline = baseline * gross + monthly;
    if (month % 12 === 0) annual.push({ year: month / 12, balance, baseline, contributed: initial + monthly * month, costImpact: baseline - balance });
  }
  return { ...annual[annual.length - 1], annual };
}
