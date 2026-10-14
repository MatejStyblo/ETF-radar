import { test, expect } from '@playwright/test';
import { Client } from 'pg';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

// Deliberately separate from the intercepted suite: never creates data by default.
const enabled = process.env.LIVE_FUNNEL === '1';
const origin = process.env.PLAYWRIGHT_BASE_URL;
const connectionString = process.env.LIVE_FUNNEL_DATABASE_URL;
test.describe('opt-in real local production funnel (no interception)', () => {
  test.skip(!enabled, 'Requires LIVE_FUNNEL=1 and an explicitly named local test database.');
  for (const {consent,primary} of [{consent:true,primary:false},{consent:false,primary:false},{consent:true,primary:true}]) {
    const pair = primary ? ['stxf','stxg'] : ['cspx','ivv'];
    const pairLabel = primary ? 'STXF / STXG' : 'CSPX / IVV';
    test(`${primary?'primary NYSE ':''}${consent ? 'consented mobile' : 'denied desktop'} acquisition → saved lead → report download`, async ({ page, context }, info) => {
      test.setTimeout(60000);
      expect(origin).toBe('http://127.0.0.1:3103');
      const url = new URL(connectionString ?? '');
      expect(['127.0.0.1', 'localhost']).toContain(url.hostname);
      expect(['/etf_radar_test', '/etf_radar_nyse_test']).toContain(url.pathname);
      const db = new Client({ connectionString });
      await db.connect();
      const run = randomUUID();
      const email = `live-funnel-${run}@example.invalid`;
      const events: { eventId: string; name: string; adVariant: string; consent: boolean; etfIds?: string[] }[] = [];
      const errors: string[] = [];
      const responses: { path: string; status: number }[] = [];
      let attemptId: string | undefined;
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (new URL(response.url()).pathname.startsWith('/api/')) responses.push({ path: new URL(response.url()).pathname, status: response.status() }); });
      page.on('request', request => {
        if (request.method() !== 'POST') return;
        const path = new URL(request.url()).pathname;
        if (path === '/api/events') events.push(request.postDataJSON());
        if (path === '/api/leads') attemptId = request.postDataJSON().attemptId;
      });
      try {
        await page.setViewportSize(consent ? { width: 375, height: 812 } : { width: 1440, height: 900 });
        await page.goto(`/?utm_source=qa&utm_medium=browser&utm_campaign=${run}&utm_content=live_funnel&ad_variant=b`);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        expect(events).toHaveLength(0);
        await page.getByRole('button', { name: consent ? 'Povolit' : 'Odmítnout', exact: true }).click();
        if (consent) await expect.poll(() => responses.filter(r => r.path === '/api/events' && r.status === 200).length).toBeGreaterThan(0);
        await page.getByRole('link', { name: 'Porovnat ETF' }).click();
        if(primary) {
          await expect(page.getByRole('combobox',{name:'První ETF',exact:true})).toHaveValue('stxf');
          await expect(page.getByRole('combobox',{name:'Druhé ETF',exact:true})).toHaveValue('stxg');
          await expect(page.locator('.workspace-inputs .availability').first()).toContainText('Odlišné indexy a strategie');
        } else {
          await page.getByRole('combobox',{name:'Druhé ETF',exact:true}).selectOption('ivv');
          await page.getByRole('combobox',{name:'První ETF',exact:true}).selectOption('cspx');
        }
        const before = await page.getByTestId('model-difference').textContent();
        await page.getByLabel('Počáteční vklad', { exact: true }).fill('123456');
        await page.getByLabel('Počáteční vklad', { exact: true }).press('Tab');
        await expect(page.getByTestId('model-difference')).not.toHaveText(before ?? '');
        await page.getByRole('heading', { name: 'Stejná investice. Různé náklady.' }).scrollIntoViewIfNeeded();
        await expect(page.getByTestId('model-difference')).toBeVisible();
        if (consent) await expect.poll(() => events.some(e => e.name === 'results_viewed')).toBe(true);
        await page.locator('#lead-email').scrollIntoViewIfNeeded();
        await page.locator('#lead-email').fill(email);
        await expect(page.getByRole('checkbox')).not.toBeChecked();
        if (consent) await expect.poll(() => events.some(e => e.name === 'lead_form_started') && events.some(e => e.name === 'lead_offer_viewed')).toBe(true);
        await page.screenshot({ path: info.outputPath('before-submit.png'), fullPage: true });
        const saved = page.waitForResponse(r => new URL(r.url()).pathname === '/api/leads' && r.request().method() === 'POST');
        await page.getByRole('button', { name: 'Získat moje srovnání' }).click();
        expect((await saved).status()).toBe(200);
        await expect(page).toHaveURL(`${origin}/report`);
        await expect(page.getByRole('heading', { name: 'Vaše ETF srovnání' })).toBeVisible();
        await expect(page.locator('#report-title')).toBeFocused();
        await page.screenshot({ path: info.outputPath('report.png'), fullPage: true });
        const downloadPromise = page.waitForEvent('download');
        await page.getByRole('link', { name: 'Stáhnout HTML' }).click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe('moje-etf-srovnani.html');
        const downloadedPath = info.outputPath('report.html');
        await download.saveAs(downloadedPath);
        const html = await readFile(downloadedPath, 'utf8');
        expect(html).toContain('123');
        for(const id of pair) expect(html).toContain(id.toUpperCase());
        if(primary) expect(html).toContain('Odlišné indexy');
        expect(html).not.toContain(email);
        const required = ['landing_view', 'session_start', 'primary_cta_click', 'comparison_started', 'etf_selected', 'calculator_interaction', 'results_viewed', 'lead_offer_viewed', 'lead_form_started', 'lead_submit_attempt', 'lead_submit_success', 'report_viewed', 'report_downloaded'].filter(name=>!primary||name!=='etf_selected');
        let receipt: Record<string, unknown>;
        await expect.poll(async () => {
          const result = await db.query('SELECT r.attempt_id,r.lead_id,r.report_id,r.is_new_lead,r.attribution,r.analytics_session_id,l.marketing_consent,l.marketing_consent_at,l.privacy_notice_version,l.created_at,p.snapshot FROM submission_receipts r JOIN leads l ON l.id=r.lead_id JOIN reports p ON p.id=r.report_id WHERE r.attempt_id=$1 AND l.email=$2', [attemptId, email]);
          receipt = result.rows[0];
          if (!receipt) return false;
          const stored = await db.query('SELECT * FROM analytics_events WHERE session_id=$1', [receipt.analytics_session_id]);
          return consent ? required.every(name => stored.rows.some(row => row.name === name)) : true;
        }).toBe(true);
        const rows = (await db.query('SELECT r.*,l.marketing_consent,l.marketing_consent_at,p.snapshot FROM submission_receipts r JOIN leads l ON l.id=r.lead_id JOIN reports p ON p.id=r.report_id WHERE r.attempt_id=$1', [attemptId])).rows[0];
        expect(rows.is_new_lead).toBe(true);
        expect(rows.marketing_consent).toBe(false);
        expect(rows.marketing_consent_at).toBeNull();
        expect(rows.attribution).toEqual({ ad_variant: 'b', utm_source: 'qa', utm_medium: 'browser', utm_campaign: run, utm_content: 'live_funnel' });
        expect(rows.snapshot.scenario.initial).toBe(123456);
        expect(rows.snapshot.etfs.map((e: { id: string }) => e.id)).toEqual(pair);
        const stored = (await db.query('SELECT * FROM analytics_events WHERE session_id=$1 OR event_id=$2', [rows.analytics_session_id, attemptId])).rows;
        if (consent) {
          expect(stored.filter(event=>event.name==='etf_selected')).toHaveLength(primary?0:2);
          expect(events.filter(event=>event.name==='etf_selected').map(event=>event.etfIds)).toEqual(primary?[]:[['stxf','ivv'],pair]);
          expect(stored.filter(event=>event.name!=='etf_selected')).toHaveLength(required.filter(name=>name!=='etf_selected').length);
          expect([...new Set(stored.map(row => row.name))].sort()).toEqual([...required].sort());
          expect(stored.filter(row => row.source === 'server')).toEqual([expect.objectContaining({ name: 'lead_submit_success', event_id: attemptId, is_new_lead: true })]);
          for (const event of stored) expect(Object.keys(event).sort()).toEqual(['event_id','source','session_id','name','ad_variant','is_new_lead','schema_version','created_at','etf_ids'].sort());
          for (const event of events) {
            const keys = ['eventId','name','adVariant','consent'];
            if (event.name === 'etf_selected') keys.push('etfIds');
            if (event.name === 'landing_view') {
              keys.push('acquisition');
              expect(event).toHaveProperty('acquisition', { utm_source: 'qa', utm_medium: 'browser', utm_campaign: run, utm_content: 'live_funnel' });
            }
            expect(Object.keys(event).sort()).toEqual(keys.sort());
          }
          if(!primary) expect(stored.filter(event => event.name === 'etf_selected').at(-1)?.etf_ids).toEqual(pair);
          if(!primary) expect(events.filter(event => event.name === 'etf_selected').at(-1)?.etfIds).toEqual(pair);
          expect(JSON.stringify(stored)).not.toContain(email);
          expect(JSON.stringify(stored)).not.toContain('123456');
          expect(stored.every(row => row.ad_variant === 'b')).toBe(true);
          const session = (await db.query('SELECT * FROM analytics_sessions WHERE id=$1', [rows.analytics_session_id])).rows[0];
          expect(session.revoked).toBe(false);
          expect(session.ad_variant).toBe('b');
        } else {
          expect(rows.analytics_session_id).toBeNull();
          expect(stored).toHaveLength(0);
          expect(events).toHaveLength(0);
          expect((await context.cookies()).some(c => c.name === 'etf_analytics')).toBe(false);
        }
        expect(errors).toEqual([]);
        expect(responses.every(r => r.status < 400)).toBe(true);
        if (process.env.LIVE_DASHBOARD === '1') {
          const admin = await context.newPage();
          try {
            const beforeAdmin = await db.query('SELECT count(*)::int AS count FROM analytics_events WHERE session_id=$1', [rows.analytics_session_id]);
            const response = await admin.goto('/dashboard?range=all&variant=all');
            expect(response?.status()).toBe(200);
            await expect(admin.getByRole('rowheader', { name: email, exact: true })).toBeVisible();
            const totals = (await db.query('SELECT count(DISTINCT lead_id)::int AS leads,count(*)::int AS captures FROM submission_receipts')).rows[0];
            await expect(admin.getByTestId('unique-leads')).toHaveText(new Intl.NumberFormat('cs-CZ').format(totals.leads));
            await expect(admin.getByTestId('captures')).toHaveText(new Intl.NumberFormat('cs-CZ').format(totals.captures));
            if (consent&&!primary) await expect(admin.getByRole('region', { name: 'Dvojice z událostí — vodorovně posuvná tabulka' }).getByRole('rowheader', { name: pairLabel, exact: true })).toBeVisible();
            await expect(admin.getByRole('region', { name: 'Dvojice z reportů — vodorovně posuvná tabulka' }).getByRole('rowheader', { name: pairLabel, exact: true })).toBeVisible();
            const csv = await admin.request.get('/dashboard/export?range=all&variant=all');
            expect(csv.status()).toBe(200);
            expect(await csv.text()).toContain(email);
            expect((await db.query('SELECT count(*)::int AS count FROM analytics_events WHERE session_id=$1', [rows.analytics_session_id])).rows).toEqual(beforeAdmin.rows);
          } finally { await admin.close(); }
        }
        const evidencePath = info.outputPath('database-evidence.json');
        await writeFile(evidencePath, JSON.stringify({ run, consent, attemptId, receipt: { lead_id: rows.lead_id, report_id: rows.report_id, analytics_session_id: rows.analytics_session_id, attribution: rows.attribution, marketing_consent: rows.marketing_consent, marketing_consent_at: rows.marketing_consent_at, is_new_lead: rows.is_new_lead }, events: stored, clientEvents: events, responses, errors }, null, 2));
        await info.attach('database-evidence.json', { path: evidencePath, contentType: 'application/json' });
      } finally {
        // Only exact UUIDs captured from this browser and the unique test email.
        const sessions = (await db.query("SELECT DISTINCT session_id FROM analytics_events WHERE event_id=ANY($1::uuid[]) UNION SELECT analytics_session_id FROM submission_receipts WHERE attempt_id=$2 AND analytics_session_id IS NOT NULL", [events.map(e => e.eventId), attemptId ?? null])).rows.map(r => r.session_id);
        const own = (await db.query('SELECT l.id,l.email_key,r.report_id FROM leads l LEFT JOIN submission_receipts r ON r.lead_id=l.id WHERE l.email=$1', [email])).rows;
        await db.query('BEGIN');
        try {
          await db.query('DELETE FROM submission_receipts WHERE lead_id=ANY($1::uuid[])', [own.map(r => r.id)]);
          await db.query('DELETE FROM reports WHERE id=ANY($1::uuid[])', [own.map(r => r.report_id).filter(Boolean)]);
          await db.query('DELETE FROM leads WHERE email=$1', [email]);
          await db.query('DELETE FROM analytics_sessions WHERE id=ANY($1::uuid[])', [sessions]);
          await db.query('DELETE FROM rate_limit_buckets WHERE bucket_key=ANY($1::text[])', [[...sessions.map(id => `analytics:${id}`), ...own.map(r => `lead:${r.email_key}`)]]);
          await db.query('COMMIT');
        } catch (error) { await db.query('ROLLBACK'); throw error; }
        expect((await db.query('SELECT id FROM leads WHERE email=$1', [email])).rowCount).toBe(0);
        expect((await db.query('SELECT id FROM analytics_sessions WHERE id=ANY($1::uuid[])', [sessions])).rowCount).toBe(0);
        expect((await db.query('SELECT attempt_id FROM submission_receipts WHERE attempt_id=$1', [attemptId ?? null])).rowCount).toBe(0);
        expect((await db.query('SELECT id FROM reports WHERE id=ANY($1::uuid[])', [own.map(r => r.report_id).filter(Boolean)])).rowCount).toBe(0);
        expect((await db.query('SELECT event_id FROM analytics_events WHERE session_id=ANY($1::uuid[]) OR event_id=ANY($2::uuid[])', [sessions, events.map(e => e.eventId)])).rowCount).toBe(0);
        expect((await db.query('SELECT bucket_key FROM rate_limit_buckets WHERE bucket_key=ANY($1::text[])', [[...sessions.map(id => `analytics:${id}`), ...own.map(r => `lead:${r.email_key}`)]])).rowCount).toBe(0);
        await writeFile(info.outputPath('cleanup.json'), JSON.stringify({ leads: 0, receipts: 0, reports: 0, events: 0, sessions: 0, rateBuckets: 0, scope: 'exact own email, captured UUIDs and derived bucket keys' }, null, 2));
        await db.end();
      }
    });
  }
});
