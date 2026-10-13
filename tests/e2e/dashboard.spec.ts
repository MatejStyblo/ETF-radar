import { test, expect, type Page } from '@playwright/test';
import { Client } from 'pg';
import AxeBuilder from '@axe-core/playwright';

const live = process.env.LIVE_DASHBOARD === '1';
const databaseUrl = process.env.LIVE_DASHBOARD_DATABASE_URL;
const formatted = (value: number) => new Intl.NumberFormat('cs-CZ').format(value);

// Standard suite must not opt in or read contacts. No server is launched here.
test('dashboard and contact export are unavailable without local opt-in', async ({ request }) => {
  test.skip(live, 'Run against a DASHBOARD_ENABLED=false server in the standard suite.');
  for (const path of ['/dashboard', '/dashboard/export?range=all&variant=all']) {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toContain('data-testid="measured-sessions"');
  }
});

test('a nonlocal Host cannot expose the dashboard or CSV even when enabled', async ({ request }) => {
  for (const path of ['/dashboard', '/dashboard/export?range=all&variant=all']) {
    const response = await request.get(path, { headers: { Host: 'dashboard.example.invalid' } });
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toContain('data-testid="measured-sessions"');
  }
});

async function verifyDatabaseTotals(page: Page, db: Client, range: string, variant: string) {
  // Independent read-only SQL, not the production dashboard data function.
  // Freeze the end of the reporting window to the DB timestamp shown by the page.
  const asOf = await page.locator('.dash-footer time').getAttribute('datetime');
  expect(asOf).toBeTruthy();
  const params = [asOf, range === 'all' ? null : Number(range), variant];
  const result = await db.query(`
    WITH reporting_window AS (
      SELECT $1::timestamptz AS until,
        CASE WHEN $2::int IS NULL THEN '-infinity'::timestamptz
          ELSE $1::timestamptz - make_interval(days => $2::int) END AS since
    ), landing_sessions AS (
      SELECT DISTINCT s.id FROM analytics_sessions s
      JOIN analytics_events e ON e.session_id=s.id
      CROSS JOIN reporting_window w
      WHERE NOT s.revoked AND e.source='client' AND e.name='landing_view'
        AND e.ad_variant=s.ad_variant AND e.created_at BETWEEN w.since AND w.until
        AND ($3='all' OR s.ad_variant=$3)
    ), successes AS (
      SELECT e.* FROM analytics_events e
      JOIN landing_sessions s ON s.id=e.session_id CROSS JOIN reporting_window w
      WHERE e.source='server' AND e.name='lead_submit_success'
        AND e.created_at BETWEEN w.since AND w.until AND ($3='all' OR e.ad_variant=$3)
    ), saved AS (
      SELECT r.*, l.marketing_consent FROM submission_receipts r
      JOIN leads l ON l.id=r.lead_id CROSS JOIN reporting_window w
      WHERE r.created_at BETWEEN w.since AND w.until
        AND ($3='all' OR r.attribution->>'ad_variant'=$3)
    )
    SELECT (SELECT count(*)::int FROM landing_sessions) AS sessions,
      (SELECT count(DISTINCT session_id)::int FROM successes) AS converted,
      (SELECT count(*)::int FROM successes WHERE is_new_lead) AS measured_new,
      (SELECT count(*)::int FROM analytics_events e
        JOIN landing_sessions s ON s.id=e.session_id CROSS JOIN reporting_window w
        WHERE e.created_at BETWEEN w.since AND w.until AND ($3='all' OR e.ad_variant=$3)
          AND ((e.source='client' AND e.name<>'lead_submit_success')
            OR (e.source='server' AND e.name='lead_submit_success'))) AS event_total,
      count(*)::int AS captures, count(DISTINCT lead_id)::int AS contacts,
      count(DISTINCT lead_id) FILTER (WHERE marketing_consent)::int AS marketing,
      count(*) FILTER (WHERE analytics_session_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM successes e WHERE e.event_id=saved.attempt_id
          AND e.session_id=saved.analytics_session_id
      ))::int AS unmeasured FROM saved`, params);
  const row = result.rows[0];
  for (const [id, value] of Object.entries({
    'measured-sessions': row.sessions, 'unique-leads': row.contacts,
    captures: row.captures, 'converted-sessions': row.converted,
    'measured-new-leads': row.measured_new, 'marketing-leads': row.marketing,
    'unmeasured-captures': row.unmeasured,
  })) await expect(page.getByTestId(id)).toHaveText(formatted(value as number));
  await expect(page.getByTestId('conversion-pct')).toHaveText(row.sessions ? `${formatted(100 * row.converted / row.sessions)} %` : '—');
  await expect(page.getByTestId('new-lead-conversion-pct')).toHaveText(row.sessions ? `${formatted(100 * row.measured_new / row.sessions)} %` : '—');
  const rows = page.getByRole('region', { name: 'Uložené kontakty — vodorovně posuvná tabulka' }).locator('tbody tr');
  if (row.contacts) {
    expect(await rows.count()).toBe(Math.min(row.contacts, 50));
    // Verify exact displayed identities through a separate DB read, not invented fixtures.
    for (const email of await rows.locator('th[scope="row"]').allTextContents()) {
      const stored = await db.query('SELECT email, marketing_consent FROM leads WHERE email=$1', [email]);
      expect(stored.rowCount).toBe(1);
      await expect(rows.filter({ has: page.getByRole('rowheader', { name: email, exact: true }) }).locator('td').nth(1)).toHaveText(stored.rows[0].marketing_consent ? 'Ano' : 'Ne');
    }
  } else await expect(rows).toContainText('nejsou k dispozici');
  expect(await page.getByRole('region', { name: 'Nejnovější měřené události — vodorovně posuvná tabulka' }).locator('tbody tr:has(time)').count()).toBe(Math.min(row.event_total, 100));
}

test.describe('opt-in read-only dashboard on a real local server', () => {
  test.skip(!live, 'Requires LIVE_DASHBOARD=1, a locally enabled server and an explicit local test DB.');
  test('returning from landing to dashboard never tracks cross-tab opt-in', async ({ page, context }) => {
    const database = new URL(databaseUrl ?? '');
    expect(['localhost', '127.0.0.1', '[::1]']).toContain(database.hostname);
    expect(['/etf_radar_test', '/etf_radar_nyse_test']).toContain(database.pathname);
    await context.addInitScript(() => localStorage.setItem('etf-radar-measurement', 'denied'));
    const posts: string[] = [];
    page.on('request', request => {
      if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/events') posts.push(request.postData() ?? '');
    });
    await page.goto('/dashboard');
    await page.getByRole('link', { name: 'Otevřít landing page', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('Měření je odmítnuté.', { exact: true })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Přehled ETF Radar', exact: true })).toBeVisible();
    const other = await context.newPage();
    try {
      await other.goto('/dashboard');
      await page.evaluate(() => { document.documentElement.dataset.consentEvent = 'waiting'; window.addEventListener('storage', () => { document.documentElement.dataset.consentEvent = 'received'; }, { once: true }); });
      await other.evaluate(() => localStorage.setItem('etf-radar-measurement', 'allowed'));
      await page.waitForFunction(() => document.documentElement.dataset.consentEvent === 'received');
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      expect(posts).toEqual([]);
      await page.getByRole('link', { name: 'Načíst znovu', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Přehled ETF Radar', exact: true })).toBeVisible();
      expect(posts).toEqual([]);
    } finally {
      await other.close();
      // If this regression returns, remove only sessions created by exact captured event IDs.
      if (posts.length) {
        const db = new Client({ connectionString: databaseUrl });
        await db.connect();
        const ownIds = posts.map(body => JSON.parse(body).eventId);
        try {
          await db.query('BEGIN');
          const sessions = (await db.query('SELECT DISTINCT session_id FROM analytics_events WHERE event_id=ANY($1::uuid[])', [ownIds])).rows;
          for (const { session_id: id } of sessions) {
            const scope = (await db.query('SELECT (SELECT count(*) FROM analytics_events WHERE session_id=$1 AND NOT(event_id=ANY($2::uuid[])))::int AS foreign_events,(SELECT count(*) FROM submission_receipts WHERE analytics_session_id=$1)::int AS captures', [id, ownIds])).rows[0];
            expect(scope).toEqual({ foreign_events: 0, captures: 0 });
            await db.query('DELETE FROM analytics_sessions WHERE id=$1', [id]);
            await db.query('DELETE FROM rate_limit_buckets WHERE bucket_key=$1', [`analytics:${id}`]);
          }
          await db.query('COMMIT');
          expect((await db.query('SELECT count(*)::int AS count FROM analytics_events WHERE event_id=ANY($1::uuid[])', [ownIds])).rows[0].count).toBe(0);
        } catch (error) { await db.query('ROLLBACK'); throw error; }
        finally { await db.end(); }
      }
    }
  });
  test('SSR totals match PostgreSQL; filters, CSV, responsive tables and accessibility work', async ({ page, baseURL }, info) => {
    test.setTimeout(60000);
    const origin = new URL(baseURL ?? '');
    expect(origin.protocol).toBe('http:');
    expect(['localhost', '127.0.0.1', '[::1]']).toContain(origin.hostname);
    const database = new URL(databaseUrl ?? '');
    expect(['localhost', '127.0.0.1', '[::1]']).toContain(database.hostname);
    expect(['/etf_radar_test', '/etf_radar_nyse_test']).toContain(database.pathname);
    const db = new Client({ connectionString: databaseUrl });
    await db.connect();
    try {
      await db.query('BEGIN READ ONLY');
      const response = await page.goto('/dashboard');
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { name: 'Přehled ETF Radar', exact: true })).toBeVisible();
      await expect(page.getByRole('combobox', { name: 'Období', exact: true })).toHaveValue('30');
      await expect(page.getByRole('combobox', { name: 'Reklamní varianta', exact: true })).toHaveValue('all');
      await verifyDatabaseTotals(page, db, '30', 'all');
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex.*nofollow/);
      await expect(page.locator('meta[name="referrer"]')).toHaveAttribute('content', 'no-referrer');
      // Fresh browser navigation with JavaScript disabled proves server rendering.
      const ssr = await page.context().browser()!.newContext({ javaScriptEnabled: false, baseURL });
      try {
        const noJs = await ssr.newPage();
        await noJs.goto('/dashboard?range=all&variant=all');
        await expect(noJs.getByTestId('captures')).toBeVisible();
        await expect(noJs.getByRole('heading', { name: 'Kontakty', exact: true })).toBeVisible();
      } finally { await ssr.close(); }
      for (const [range, variant] of [['7', 'b'], ['90', 'a'], ['all', 'all']]) {
        await page.getByRole('combobox', { name: 'Období', exact: true }).selectOption(range);
        await page.getByRole('combobox', { name: 'Reklamní varianta', exact: true }).selectOption(variant);
        await page.getByRole('button', { name: 'Použít filtry' }).click();
        await expect(page).toHaveURL(new RegExp(`range=${range}.*variant=${variant}`));
        await verifyDatabaseTotals(page, db, range, variant);
      }
      await page.goto('/dashboard?range=all&variant=all&page=999999');
      await expect(page.getByRole('navigation', { name: 'Stránkování kontaktů' })).not.toContainText('999');
      await page.goto('/dashboard?range=all&variant=all');
      await verifyDatabaseTotals(page, db, 'all', 'all');
      await expect(page.getByText('Kroky nejsou nutně klesající', { exact: false })).toBeVisible();
      await expect(page.getByText('Historické mezery nejsou nuly', { exact: true })).toBeVisible();
      for (const width of [375, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        for (const box of await page.locator('.dash-table-scroll').all()) {
          expect(await box.evaluate(el => getComputedStyle(el).overflowX)).toBe('auto');
          await expect(box).toHaveAttribute('tabindex', '0');
        }
        await page.screenshot({ path: info.outputPath(`dashboard-${width}.png`), fullPage: true });
      }
      const accessibility = await new AxeBuilder({ page }).analyze();
      expect(accessibility.violations).toEqual([]);
      const exportLink = page.getByRole('link', { name: 'Export kontaktů CSV' });
      await expect(exportLink).toHaveAttribute('href', '/dashboard/export?range=all&variant=all');
      const csv = await page.request.get((await exportLink.getAttribute('href'))!);
      expect(csv.status()).toBe(200);
      expect(csv.headers()['content-type']).toContain('text/csv');
      expect(csv.headers()['cache-control']).toContain('no-store');
      const body = await csv.text();
      // The backend may escape spreadsheet cells; every ordinary displayed email must remain present.
      for (const email of await page.locator('.dash-email').allTextContents()) expect(body).toContain(email.replaceAll('"', '""'));
      await page.getByRole('link', { name: 'Načíst znovu', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Přehled ETF Radar' })).toBeVisible();
      await page.getByRole('link', { name: 'Otevřít landing page', exact: true }).click();
      await expect(page).toHaveURL(new URL('/', baseURL).href);
    } finally { await db.query('ROLLBACK'); await db.end(); }
  });
});
