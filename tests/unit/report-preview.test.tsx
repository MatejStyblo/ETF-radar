import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReportPreview } from '@/components/lead-form/report-preview';
import { buildReport } from '@/lib/report/model';
import { money } from '@/lib/format';
import { DEFAULT_SCENARIO } from '@/lib/validation/schemas';

beforeEach(() => vi.stubGlobal('React', React));
afterEach(() => vi.unstubAllGlobals());

test('preview matches the fulfilled report for changed scenarios and funds', () => {
  for (const scenario of [DEFAULT_SCENARIO, { initial: 0, monthly: 2000, years: 7, grossReturnPct: -5 }]) {
    const ids: ['stxf', 'cspx'] = ['stxf', 'cspx'];
    const html = renderToStaticMarkup(<ReportPreview scenario={scenario} etfIds={ids}/>);
    const report = buildReport(scenario, ids);
    expect(html).toContain('STXF / CSPX');
    for (const row of report.horizons.filter(row => [5, 10, 20, 30].includes(row.years))) {
      expect(html).toContain(`${row.years} let`);
      expect(html).toContain(money(Math.abs(row.results[0].balance - row.results[1].balance)));
    }
    expect(html).toContain('ne předpověď');
  }
});

test('invalid inputs do not leave stale preview numbers visible', () => {
  expect(renderToStaticMarkup(<ReportPreview scenario={null} etfIds={['stxf', 'stxg']}/>)).toBe('');
});
