import { expect, test, vi } from 'vitest';
import { PDFDocument, PDFName } from 'pdf-lib';
import { buildReport } from '@/lib/report/model';
vi.mock('server-only', () => ({}));
const { renderReportPdf } = await import('@/lib/report/pdf');

for (const scenario of [
  { initial: 100000, monthly: 3000, years: 20, grossReturnPct: 5 },
  { initial: 100000000, monthly: 1000000, years: 50, grossReturnPct: 30 },
  { initial: 0, monthly: 0, years: 1, grossReturnPct: -50 },
]) test(`standalone Czech A4 PDF remains readable by a parser for ${scenario.years} years / ${scenario.initial} initial`, async () => {
  const report = buildReport(scenario, ['stxf', 'cspx']);
  const bytes = await renderReportPdf(report);
  expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe('%PDF-');
  const loaded = await PDFDocument.load(bytes);
  expect(loaded.getTitle()).toContain('STXF / CSPX');
  expect(loaded.catalog.get(PDFName.of('Lang'))?.toString()).toContain('cs-CZ');
  expect(loaded.catalog.has(PDFName.of('OpenAction'))).toBe(false);
  expect(loaded.getPageCount()).toBeGreaterThanOrEqual(4);
  expect(loaded.getPageCount()).toBeLessThan(12);
  for (const page of loaded.getPages()) {
    expect(page.getWidth()).toBeCloseTo(595.28, 1);
    expect(page.getHeight()).toBeCloseTo(841.89, 1);
  }
}, 15000);
