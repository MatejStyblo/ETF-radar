// Requires explicit human authorization; only exact records from this run are removed.
import { chromium } from 'playwright';
import { Client } from 'pg';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

assert.equal(process.env.AUDIT_PRODUCTION_WRITE_AUTHORIZED, '1', 'Production writes require explicit authorization');
const origin = 'https://etf-radar-dun.vercel.app';
process.loadEnvFile('.vercel/final-audit.production.env');
assert.ok(new URL(process.env.DATABASE_URL).hostname.endsWith('.neon.tech'));
const db = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
await db.connect();
const output = 'docs/qa/final-audit/production-funnel';
await mkdir(output, { recursive: true });
const campaign = `audit_${randomUUID().replaceAll('-', '')}`;
const email = `${campaign}@example.invalid`;
const evidence = { origin, checkedAt: new Date().toISOString(), flows: [], cleanup: null };
const attempts = [], eventIds = [];
const browser = await chromium.launch();
try {
  for (const consent of [true, false]) {
    const context = await browser.newContext({ viewport: { width: consent ? 375 : 1440, height: 812 } });
    const page = await context.newPage();
    const events = [], errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      if (request.method() !== 'POST') return;
      const path = new URL(request.url()).pathname;
      if (path === '/api/events') { const event = request.postDataJSON(); events.push(event); eventIds.push(event.eventId); }
      if (path === '/api/leads') attempts.push(request.postDataJSON().attemptId);
    });
    await page.goto(`${origin}/?ad_variant=b&utm_source=qa&utm_medium=audit&utm_campaign=${campaign}&utm_content=funnel`);
    assert.equal(events.length, 0);
    await page.getByRole('button', { name: consent ? 'Povolit' : 'Odmítnout', exact: true }).click();
    if (consent) {
      for (let i = 0; i < 40 && !(await context.cookies()).some(c => c.name === 'etf_analytics'); i++) await page.waitForTimeout(100);
      assert.ok((await context.cookies()).some(c => c.name === 'etf_analytics'));
    }
    await page.getByRole('link', { name: 'Porovnat ETF', exact: true }).click();
    await page.getByLabel('Druhé ETF', { exact: true }).selectOption('cspx');
    await page.getByLabel('Počáteční vklad', { exact: true }).fill('123456,78');
    await page.getByLabel('Počáteční vklad', { exact: true }).press('Tab');
    await page.getByTestId('model-difference').scrollIntoViewIfNeeded();
    const balances = await page.locator('.result-pair .balance').allTextContents();
    await page.locator('#lead-email').fill(email);
    assert.equal(await page.getByRole('checkbox').isChecked(), false);
    const saved = page.waitForResponse(r => new URL(r.url()).pathname === '/api/leads' && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Získat moje srovnání', exact: true }).click();
    const response = await saved;
    assert.equal(response.status(), 200);
    await page.waitForURL(`${origin}/report`);
    await page.locator('#report-title').waitFor();
    assert.equal(page.url(), `${origin}/report`);
    const cookie = (await context.cookies()).find(c => c.name === 'etf_report');
    assert.ok(cookie?.httpOnly && cookie.secure && cookie.path === '/report' && cookie.sameSite === 'Lax');
    const reportText = await page.locator('main').textContent();
    for (const value of balances) assert.ok(reportText.includes(value));
    assert.equal(await page.locator('#report-title').evaluate(el => el === document.activeElement), true);
    await page.reload();
    await page.locator('#report-title').waitFor();
    const downloading = page.waitForEvent('download');
    await page.getByRole('link', { name: 'Stáhnout HTML', exact: true }).click();
    const download = await downloading;
    const reportPath = `${output}/${consent ? 'consented' : 'denied'}-report.html`;
    await download.saveAs(reportPath);
    const html = await readFile(reportPath, 'utf8');
    assert.ok(html.includes('STXF') && html.includes('CSPX') && html.includes('Checklist'));
    assert.ok(!html.includes(email));
    for (const value of balances) assert.ok(html.includes(value));
    await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
    assert.equal(await page.locator('.personal-report details:not([open])').count(), 0);
    await page.pdf({ path: `${output}/${consent ? 'consented' : 'denied'}-print.pdf`, format: 'A4', printBackground: true });
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    await page.screenshot({ path: `${output}/${consent ? 'consented' : 'denied'}-report.png`, fullPage: true });
    const attempt = attempts.at(-1);
    const receipt = (await db.query('SELECT r.attempt_id,r.lead_id,r.report_id,r.is_new_lead,r.attribution,r.analytics_session_id,l.marketing_consent,l.marketing_consent_at,p.snapshot FROM submission_receipts r JOIN leads l ON l.id=r.lead_id JOIN reports p ON p.id=r.report_id WHERE r.attempt_id=$1 AND l.email=$2', [attempt, email])).rows[0];
    assert.ok(receipt);
    assert.equal(receipt.snapshot.scenario.initial, 123456.78);
    assert.deepEqual(receipt.snapshot.etfs.map(f => f.id), ['stxf', 'cspx']);
    assert.equal(receipt.marketing_consent, false);
    assert.equal(receipt.is_new_lead, consent);
    assert.equal(receipt.attribution.utm_campaign, campaign);
    let stored = [];
    const required = ['landing_view', 'primary_cta_click', 'comparison_started', 'etf_selected', 'calculator_interaction', 'results_viewed', 'lead_offer_viewed', 'lead_form_started', 'lead_submit_attempt', 'lead_submit_success', 'report_viewed', 'report_downloaded'];
    for (let i = 0; i < 50; i++) {
      stored = (await db.query('SELECT name,source,ad_variant,is_new_lead,etf_ids FROM analytics_events WHERE session_id=$1 OR event_id=$2 ORDER BY created_at', [receipt.analytics_session_id, attempt])).rows;
      if (!consent || required.every(name => stored.some(e => e.name === name))) break;
      await page.waitForTimeout(100);
    }
    if (consent) {
      for (const name of required) assert.ok(stored.some(e => e.name === name), `missing ${name}`);
      assert.equal(stored.filter(e => e.name === 'landing_view').length, 1);
      assert.equal(stored.filter(e => e.name === 'lead_submit_success').length, 1);
      assert.ok(!JSON.stringify(events).includes(email) && !JSON.stringify(events).includes('123456'));
      await page.getByRole('button', { name: 'Odvolat', exact: true }).click();
      for (let i = 0; i < 50 && !(await db.query('SELECT revoked FROM analytics_sessions WHERE id=$1', [receipt.analytics_session_id])).rows[0].revoked; i++) await page.waitForTimeout(100);
      assert.equal((await db.query('SELECT revoked FROM analytics_sessions WHERE id=$1', [receipt.analytics_session_id])).rows[0].revoked, true);
      assert.equal((await context.cookies()).some(c => c.name === 'etf_analytics'), false);
    } else {
      assert.equal(events.length, 0);
      assert.equal(stored.length, 0);
      assert.equal(receipt.analytics_session_id, null);
    }
    // Expiry is applied only to this test's own snapshot, never another visitor's data.
    await db.query("UPDATE reports SET expires_at=now()-interval '1 second' WHERE id=$1", [receipt.report_id]);
    assert.equal((await context.request.get(`${origin}/report/download`)).status(), 401);
    await page.reload();
    assert.equal(await page.locator('h1').textContent(), 'Přístup k reportu chybí nebo vypršel');
    assert.deepEqual(errors, []);
    evidence.flows.push({ consent, status: 'PASS', persisted: true, isNewLead: receipt.is_new_lead, snapshotInitial: receipt.snapshot.scenario.initial, pair: receipt.snapshot.etfs.map(f => f.id), balances, events: stored, cookie: { httpOnly: true, secure: true, sameSite: 'Lax', path: '/report' }, refresh: 'PASS', download: 'PASS', printMediaPdf: 'PASS', expiry: 'PASS', revocation: consent ? 'PASS' : 'NOT APPLICABLE' });
    await context.close();
  }
  assert.equal((await db.query('SELECT count(*)::int n FROM leads WHERE email=$1', [email])).rows[0].n, 1);
} finally {
  // Discover exact own IDs even when the browser fails before recording its receipt.
  const own = (await db.query('SELECT l.id,l.email_key,r.report_id FROM leads l LEFT JOIN submission_receipts r ON r.lead_id=l.id WHERE l.email=$1', [email])).rows;
  const sessions = (await db.query("SELECT id FROM analytics_sessions WHERE acquisition->>'utm_campaign'=$1 UNION SELECT session_id FROM analytics_events WHERE event_id=ANY($2::uuid[]) UNION SELECT analytics_session_id FROM submission_receipts WHERE attempt_id=ANY($3::uuid[]) AND analytics_session_id IS NOT NULL", [campaign, eventIds, attempts])).rows.map(r => r.id);
  const reports = own.map(r => r.report_id).filter(Boolean);
  const buckets = [...sessions.map(id => `analytics:${id}`), ...own.map(r => `lead:${r.email_key}`)];
  await db.query('BEGIN');
  try {
    await db.query('DELETE FROM submission_receipts WHERE lead_id=ANY($1::uuid[])', [own.map(r => r.id)]);
    await db.query('DELETE FROM reports WHERE id=ANY($1::uuid[])', [reports]);
    await db.query('DELETE FROM leads WHERE email=$1', [email]);
    await db.query('DELETE FROM analytics_sessions WHERE id=ANY($1::uuid[])', [sessions]);
    await db.query('DELETE FROM rate_limit_buckets WHERE bucket_key=ANY($1::text[])', [buckets]);
    await db.query('COMMIT');
  } catch (error) { await db.query('ROLLBACK'); throw error; }
  const cleanup = {};
  for (const [name, sql, values] of [
    ['leads', 'SELECT count(*)::int n FROM leads WHERE email=$1', [email]],
    ['receipts', 'SELECT count(*)::int n FROM submission_receipts WHERE attempt_id=ANY($1::uuid[])', [attempts]],
    ['reports', 'SELECT count(*)::int n FROM reports WHERE id=ANY($1::uuid[])', [reports]],
    ['sessions', 'SELECT count(*)::int n FROM analytics_sessions WHERE id=ANY($1::uuid[])', [sessions]],
    ['events', 'SELECT count(*)::int n FROM analytics_events WHERE session_id=ANY($1::uuid[]) OR event_id=ANY($2::uuid[])', [sessions, eventIds]],
    ['buckets', 'SELECT count(*)::int n FROM rate_limit_buckets WHERE bucket_key=ANY($1::text[])', [buckets]],
  ]) { cleanup[name] = (await db.query(sql, values)).rows[0].n; assert.equal(cleanup[name], 0); }
  evidence.cleanup = { status: 'PASS', remainingOwnRecords: cleanup };
  await writeFile(`${output}/results.json`, JSON.stringify(evidence, null, 2));
  await db.end();
  await browser.close();
}
console.log(JSON.stringify(evidence, null, 2));
