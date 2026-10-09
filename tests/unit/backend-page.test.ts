import { expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
const mocks = vi.hoisted(() => ({ token: '', getReport: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => mocks.token ? { value: mocks.token } : undefined }) }));
vi.mock('@/lib/db/leads', () => ({ getReport: mocks.getReport }));
vi.mock('@/components/report/report-view', () => ({ ReportView: () => 'authorized-report' }));
test('report page explains missing access and database outage instead of inventing success', async () => {
 const { default: Page } = await import('@/app/report/page');
 mocks.token = ''; mocks.getReport.mockResolvedValue(null);
 expect(renderToStaticMarkup(await Page())).toContain('vypršel');
 mocks.token = 'test'; mocks.getReport.mockRejectedValue(new Error('DB unavailable'));
 expect(renderToStaticMarkup(await Page())).toContain('nedostupný');
 mocks.getReport.mockResolvedValue({ scenario: {} });
 expect(renderToStaticMarkup(await Page())).toContain('authorized-report');
});
