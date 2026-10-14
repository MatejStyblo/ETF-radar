import { describe, test, expect, vi, beforeEach } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
const root = fileURLToPath(new URL('../..', import.meta.url)).replace(/\/$/, '');
const mocks = vi.hoisted(() => ({ allowed: vi.fn(), data: vi.fn(), parse: vi.fn(), headers: vi.fn() }));
vi.mock('next/headers', () => ({ headers: mocks.headers }));
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NOT_FOUND'); } }));
vi.mock('@/lib/dashboard/access', () => ({ dashboardAccessAllowed: mocks.allowed }));
vi.mock('@/lib/dashboard/data', () => ({ getDashboardData: mocks.data, parseDashboardFilter: mocks.parse }));
beforeEach(() => { vi.clearAllMocks(); mocks.headers.mockResolvedValue(new Headers({ host: 'localhost:3103' })); mocks.allowed.mockReturnValue(false); });
const fixture = {
 generatedAt: '2026-10-10T08:00:00Z', filter: { range: '30', variant: 'all', page: 1 },
 overview: { measuredSessions: 137, uniqueLeads: 19, captures: 23, marketingLeads: 4, measuredNewLeads: 7, convertedSessions: 6, unmeasuredCaptures: 16, conversionPct: 4.38 },
 traffic: [], formOutcomes: { sessions: 0, started: 0, submitted: 0, withoutSubmission: 0, activeWithoutSubmission: 0, startedWithoutSubmission: 0 },
 funnel: [], daily: [], campaigns: [], comparisons: [], submittedComparisons: [], leads: [], leadTotal: 0, events: []
};
async function render() {
 const { default: Page } = await import(root + '/app/dashboard/page.tsx');
 return renderToStaticMarkup(await Page({ searchParams: Promise.resolve({ range: '30', variant: 'all' }) }));
}
describe('dashboard SSR guard', () => {
 test('shows the primary new-lead ratio separately from sessions with repeat captures', async () => {
  mocks.allowed.mockReturnValue(true); mocks.parse.mockReturnValue(fixture.filter);
  mocks.data.mockResolvedValue({ ...fixture, overview: { ...fixture.overview, measuredSessions: 4, measuredNewLeads: 1, convertedSessions: 2, conversionPct: 50 } });
  const html = await render();
  expect(html).toContain('data-testid="new-lead-conversion-pct">25 %');
  expect(html).toContain('data-testid="conversion-pct">50 %');
 });
 test('does not invent a primary conversion ratio without measured landing sessions', async () => {
  mocks.allowed.mockReturnValue(true); mocks.parse.mockReturnValue(fixture.filter);
  mocks.data.mockResolvedValue({ ...fixture, overview: { ...fixture.overview, measuredSessions: 0, measuredNewLeads: 0, conversionPct: null } });
  expect(await render()).toContain('data-testid="new-lead-conversion-pct">—');
 });
 test('renders supplied measured totals with distinct conversion denominator and GET filters', async () => {
  mocks.allowed.mockReturnValue(true); mocks.parse.mockReturnValue(fixture.filter); mocks.data.mockResolvedValue(fixture);
  const html = await render();
  for (const value of ['137','19','23','4,38','Měřené relace','Unikátní kontakty','Úspěšná uložení','Konvertující relace','Marketingové kontakty','Neměřená uložení']) expect(html).toContain(value);
  expect(html).toContain('name="range"'); expect(html).toContain('name="variant"');
  expect(html).toContain('method="get"'); expect(html).toContain('/dashboard/export?range=30');
  expect(html).toContain('souhlas'); expect(html).toContain('nejsou unikátní lidé');
  expect(mocks.data).toHaveBeenCalledWith(fixture.filter);
 });
 test('renders real funnel, daily, capture campaign, distinct comparison sources, paginated contacts and limited events', async () => {
  mocks.allowed.mockReturnValue(true); mocks.parse.mockReturnValue({ ...fixture.filter, page: 2 });
  mocks.data.mockResolvedValue({ ...fixture, filter: { ...fixture.filter, page: 2 }, leadTotal: 101,
   funnel: [{ name: 'landing_view', label: 'Landing', sessions: 137 }, { name: 'results_viewed', label: 'Výsledek', sessions: 138 }],
   daily: [{ day: '2026-10-10', measuredSessions: 12, uniqueLeads: 3, captures: 5 }],
   campaigns: [{ source: 'qa-source', medium: 'browser', campaign: 'real-campaign', variant: 'b', captures: 5, newLeads: 3 }],
   comparisons: [{ first: 'spy', second: 'ivv', selections: 8, sessions: 4 }],
   submittedComparisons: [{ first: 'cspx', second: 'ivv', captures: 5 }],
   leads: [{ id: 'lead-1', email: 'real@example.invalid', createdAt: fixture.generatedAt, marketingConsent: false, captures: 2 }],
   events: [{ time: fixture.generatedAt, name: 'etf_selected', source: 'client', variant: 'b', first: 'spy', second: 'ivv' }]
  });
  const html = await render();
  for (const value of ['Dosažení kroků','nejsou nutně klesající','Denní vývoj','real-campaign','Pouze úspěšná uložení','Měřené výběry dvojic','Dvojice v uložených reportech','Historické','real@example.invalid','Ne','Posledních 100 událostí','etf_selected','client','Kontakty','stránku','page=1','page=3']) expect(html).toContain(value);
  expect(html).toContain('aria-label="Denní vývoj'); expect(html).toContain('tabindex="0"');
  expect(html).not.toContain('mailto:');
 });
 test('labels missing expired report snapshots without implying a measured ETF pair', async () => {
  mocks.allowed.mockReturnValue(true); mocks.parse.mockReturnValue(fixture.filter);
  mocks.data.mockResolvedValue({ ...fixture, submittedComparisons: [{ first: 'unavailable', second: 'unavailable', captures: 9 }] });
  const html = await render(); expect(html).toContain('Dvojice nedostupná'); expect(html).not.toContain('UNAVAILABLE / UNAVAILABLE');
 });
 test('uses backend normalized pagination rather than an out-of-range requested page', async () => {
  mocks.allowed.mockReturnValue(true); mocks.parse.mockReturnValue({ ...fixture.filter, page: 999 }); mocks.data.mockResolvedValue(fixture);
  const html = await render(); expect(html).toContain('Strana 1 z 1'); expect(html).not.toContain('page=999');
 });
 test('shows an honest unavailable state without fabricated zero totals on database failure', async () => {
  mocks.allowed.mockReturnValue(true); mocks.parse.mockReturnValue(fixture.filter); mocks.data.mockRejectedValue(new Error('database offline with internal details'));
  const html = await render();
  expect(html).toContain('Data jsou nyní nedostupná'); expect(html).toContain('role="alert"');
  expect(html).not.toContain('data-testid="measured-sessions"'); expect(html).not.toContain('internal details');
  expect(html).toContain('Načíst znovu');
 });
 test('denies before reading any data or query filters', async () => {
   expect(existsSync(root + '/app/dashboard/page.tsx'), 'Dashboard route must exist').toBe(true);
   const { default: Page, dynamic, runtime, metadata } = await import(root + '/app/dashboard/page.tsx');
   await expect(Page({ searchParams: Promise.resolve({}) })).rejects.toThrow('NOT_FOUND');
   expect(mocks.parse).not.toHaveBeenCalled(); expect(mocks.data).not.toHaveBeenCalled();
   expect(dynamic).toBe('force-dynamic'); expect(runtime).toBe('nodejs');
   expect(metadata.robots).toEqual({ index: false, follow: false }); expect(metadata.referrer).toBe('no-referrer');
 });
});
