import { expect, it } from 'vitest';
import { project } from '@/lib/calculations/project';
import { chartCeiling, chartPath, projectionPoints } from '@/lib/charts/projection';

it('plots actual annual balances and the no-fee baseline, including year zero', () => {
  const scenario = { initial: 100000, monthly: 3000, years: 20, grossReturnPct: 5 };
  const a = project(scenario, .0945), b = project(scenario, .03);
  const points = projectionPoints([a, b], 'balance');
  expect(points).toHaveLength(21);
  expect(points[0]).toEqual({ year: 0, first: 100000, second: 100000, baseline: 100000 });
  expect(points[20]).toEqual({ year: 20, first: a.balance, second: b.balance, baseline: a.baseline });
  expect(chartCeiling(points)).toBeGreaterThanOrEqual(a.baseline);
});

it('shows cost impact rather than subtracting percentage points or inventing fees', () => {
  const scenario = { initial: 1000, monthly: 0, years: 1, grossReturnPct: 0 };
  const points = projectionPoints([project(scenario, 1), project(scenario, 2)], 'costImpact');
  expect(points[0]).toEqual({ year: 0, first: 0, second: 0, baseline: 0 });
  expect(points[1].first).toBeCloseTo(10, 8);
  expect(points[1].second).toBeCloseTo(20, 8);
});

it('keeps a finite zero-based chart for zero amounts and declining portfolios', () => {
  const zero = project({ initial: 0, monthly: 0, years: 50, grossReturnPct: -50 }, .03);
  const points = projectionPoints([zero, zero], 'balance');
  expect(chartCeiling(points)).toBe(1);
  expect(chartPath(points, 'first', 1)).not.toMatch(/NaN|Infinity/);
  const tiny = project({ initial: 1e-320, monthly: 0, years: 1, grossReturnPct: 0 }, .03);
  expect(chartCeiling(projectionPoints([tiny, tiny], 'balance'))).toBe(1);
  const declining = project({ initial: 100000, monthly: 0, years: 10, grossReturnPct: -30 }, .03);
  const decreasing = projectionPoints([declining, declining], 'balance');
  expect(chartCeiling(decreasing)).toBeGreaterThanOrEqual(decreasing[0].baseline);
  expect(decreasing.at(-1)!.first).toBeLessThan(decreasing[0].first);
});
