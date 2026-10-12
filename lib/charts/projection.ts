import type { Projection } from '@/lib/calculations/project';

export type ChartMode = 'balance' | 'costImpact';
export type ChartPoint = { year: number; first: number; second: number; baseline: number };

/** Plot the existing annual model; never recalculate returns or exaggerate the scale. */
export function projectionPoints(results: [Projection, Projection], mode: ChartMode): ChartPoint[] {
  return results[0].annual.map((point, i) => ({
    year: point.year,
    first: point[mode],
    second: results[1].annual[i][mode],
    baseline: mode === 'balance' ? point.baseline : 0,
  }));
}

/** Four equal intervals on a common scale beginning at zero, including all years. */
export function chartCeiling(points: ChartPoint[]): number {
  const maximum = Math.max(0, ...points.flatMap(p => [p.first, p.second, p.baseline]));
  if (maximum <= 1) return 1;
  const rawStep = maximum / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude;
  return Math.ceil(maximum / step) * step;
}

/** Coordinates in the normalized 1000×300 SVG view box. Straight annual segments. */
export function chartPath(points: ChartPoint[], series: 'first' | 'second' | 'baseline', ceiling: number): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${(i / Math.max(1, points.length - 1) * 1000).toFixed(2)},${(300 - p[series] / ceiling * 300).toFixed(2)}`).join(' ');
}
