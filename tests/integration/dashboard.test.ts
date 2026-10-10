import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, expect, test, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const database = `dashboard_${randomUUID().replaceAll('-', '')}`;
const admin = new Pool({ host: '127.0.0.1', port: 55439, user: 'postgres', database: 'postgres' });
const { getPool, closePool } = await import('@/lib/db/pool');
const { getDashboardData, parseDashboardFilter } = await import('@/lib/dashboard/data');
const all = { range: 'all', variant: 'all', page: 1 } as const;
beforeAll(async () => {
 await admin.query(`CREATE DATABASE ${database}`);
 process.env.DATABASE_URL = `postgresql://postgres@127.0.0.1:55439/${database}`;
 for (const migration of ['001', '002', '003', '004']) await getPool().query(await readFile(`lib/db/migrations/${migration}.sql`, 'utf8'));
});
beforeEach(async () => {
 // This random database belongs solely to this suite, never the shared test DB.
 expect((await getPool().query('SELECT current_database() AS db')).rows[0].db).toBe(database);
 await getPool().query('TRUNCATE leads, reports, submission_receipts, analytics_sessions, analytics_events CASCADE');
});
async function session(variant = 'a', landing = true, age = 1, revoked = false) {
 const id = randomUUID();
 await getPool().query("INSERT INTO analytics_sessions(id,ad_variant,expires_at,revoked) VALUES($1,$2,now()-interval '1 hour',$3)", [id, variant, revoked]);
 if (landing) await event(id, 'landing_view', 'client', false, age, variant);
 return id;
}
async function event(id: string, name: string, source = 'client', isNew = false, age = 1, variant = 'a', eventId = randomUUID()) {
 await getPool().query("INSERT INTO analytics_events(event_id,source,session_id,name,ad_variant,is_new_lead,created_at) VALUES($1,$2,$3,$4,$5,$6,now()-$7::int*interval '1 day')", [eventId, source, id, name, variant, isNew, age]);
 return eventId;
}
async function lead(consent = false, email = `${randomUUID()}@example.invalid`) {
 const id = randomUUID();
 await getPool().query("INSERT INTO leads(id,email,email_key,marketing_consent,privacy_notice_version,created_at) VALUES($1::uuid,$2,$1::text,$3,'test',now()-interval '100 days')", [id, email, consent]);
 return id;
}
async function receipt(leadId: string, sessionId: string | null = null, isNew = true, age = 1, variant = 'a', reportId: string | null = null, utm = {}) {
 const id = randomUUID();
 await getPool().query("INSERT INTO submission_receipts(attempt_id,payload_hash,lead_id,report_id,is_new_lead,attribution,analytics_session_id,created_at) VALUES($1,'test',$2,$3,$4,$5,$6,now()-$7::int*interval '1 day')", [id, leadId, reportId, isNew, { ad_variant: variant, ...utm }, sessionId, age]);
 return id;
}
afterAll(async () => {
 await closePool();
 await admin.query(`DROP DATABASE IF EXISTS ${database} WITH (FORCE)`);
 await admin.end();
});
test('filter parsing uses safe defaults and rejects arrays and malformed page numbers', () => {
 expect(parseDashboardFilter({})).toEqual({ range: '30', variant: 'all', page: 1 });
 expect(parseDashboardFilter({ range: '7', variant: 'b', page: '2' })).toEqual({ range: '7', variant: 'b', page: 2 });
 for (const page of ['0', '-1', '2.5', 'Infinity', '1e2', '999999999999999999']) expect(parseDashboardFilter({ page }).page).toBe(1);
 expect(parseDashboardFilter({ range: ['7'], variant: 'invalid', page: ['2'] })).toEqual({ range: '30', variant: 'all', page: 1 });
});
test('empty PostgreSQL dashboard is truthful and clamps a nonexistent page', async () => {
 const data = await getDashboardData({ ...all, page: 999 });
 expect(data.filter).toEqual(all);
 expect(data.overview).toEqual({ measuredSessions: 0, uniqueLeads: 0, captures: 0, marketingLeads: 0, measuredNewLeads: 0, convertedSessions: 0, unmeasuredCaptures: 0, conversionPct: null });
 expect(data.leadTotal).toBe(0);
 for (const key of ['daily', 'campaigns', 'comparisons', 'submittedComparisons', 'leads', 'events'] as const) expect(data[key]).toEqual([]);
 expect(data.funnel.length).toBeGreaterThan(0);
 expect(data.funnel.every(step => step.sessions === 0)).toBe(true);
});
test('measured conversion and funnel use the same landing cohort; receipt totals remain independent', async () => {
 const a = await session(); const other = await session();
 const b = await session('b'); const reportOnly = await session('a', false);
 const old = await session('a', true, 40); const revoked = await session('a', true, 1, true);
 const contact = await lead(true); const plain = await lead();
 for (const id of [a, other, b, reportOnly, old, revoked]) await event(id, 'comparison_started', 'client', false, 1, id === b ? 'b' : 'a');
 const success = await receipt(contact, a); await event(a, 'lead_submit_success', 'server', true, 1, 'a', success);
 const duplicate = await receipt(contact, a, false); await event(a, 'lead_submit_success', 'server', false, 1, 'a', duplicate);
 await event(a, 'lead_submit_success', 'client'); // client claims never become success
 await receipt(plain); // no persisted analytics session
 await receipt(plain, other, false); // landing but lost best-effort success
 const outside = await receipt(plain, reportOnly, false); await event(reportOnly, 'lead_submit_success', 'server', false, 1, 'a', outside);
 await event(old, 'lead_submit_success', 'server', true);
 await event(revoked, 'lead_submit_success', 'server', true);
 await event(b, 'lead_submit_success', 'server', true, 1, 'b');
 await receipt(contact, a, false, 40); await receipt(contact, b, false, 1, 'b');
 const data = await getDashboardData({ range: '7', variant: 'a', page: 1 });
 expect(data.overview).toEqual({ measuredSessions: 2, uniqueLeads: 2, captures: 5, marketingLeads: 1, measuredNewLeads: 1, convertedSessions: 1, unmeasuredCaptures: 3, conversionPct: 50 });
 expect(data.funnel.find(s => s.name === 'comparison_started')?.sessions).toBe(2);
 expect(data.funnel.find(s => s.name === 'lead_submit_success')?.sessions).toBe(1);
});
test('daily counts group in UTC and campaign counts use stored receipt UTM without visitor denominator', async () => {
 const id = await session(); const l = await lead();
 const first = await receipt(l, id, true, 1, 'a', null, { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'real_stored' });
 const second = await receipt(l, null, false, 1, 'a', null, { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'real_stored' });
 await getPool().query("UPDATE analytics_events SET created_at='2020-01-01 23:59:00+00' WHERE session_id=$1", [id]);
 await getPool().query("UPDATE submission_receipts SET created_at='2020-01-01 23:59:00+00' WHERE attempt_id=$1", [first]);
 await getPool().query("UPDATE submission_receipts SET created_at='2020-01-02 01:00:00+01' WHERE attempt_id=$1", [second]);
 const data = await getDashboardData(all);
 expect(data.daily).toEqual([{ day: '2020-01-01', measuredSessions: 1, uniqueLeads: 1, captures: 1 }, { day: '2020-01-02', measuredSessions: 0, uniqueLeads: 1, captures: 1 }]);
 expect(data.campaigns).toEqual([{ source: 'google', medium: 'cpc', campaign: 'real_stored', variant: 'a', captures: 2, newLeads: 1 }]);
});
test('recent contacts are selected by scoped receipts, have scoped capture counts and stable pages of 50', async () => {
 for (let n = 0; n < 51; n++) await receipt(await lead(n === 0));
 const repeated = await lead(); await receipt(repeated); await receipt(repeated, null, false); await receipt(repeated, null, false, 50);
 await receipt(await lead(), null, true, 1, 'b');
 await lead(); // contact with no capture in scope
 const first = await getDashboardData({ range: '7', variant: 'a', page: 1 });
 const last = await getDashboardData({ range: '7', variant: 'a', page: 100 });
 expect(first.leadTotal).toBe(52); expect(first.leads).toHaveLength(50);
 expect(last.filter.page).toBe(2); expect(last.leads).toHaveLength(2);
 const combined = [...first.leads, ...last.leads];
 expect(new Set(combined.map(l => l.id)).size).toBe(52);
 expect(combined.find(l => l.id === repeated)?.captures).toBe(2);
 expect(combined.every(l => typeof l.email === 'string' && typeof l.createdAt === 'string')).toBe(true);
});
test('submitted ETF pairs come from actual available snapshots; missing and expired snapshots remain unavailable', async () => {
 const { buildReport } = await import('@/lib/report/model');
 const snapshot = buildReport({ initial: 10000, monthly: 1000, years: 10, grossReturnPct: 5 }, ['spy', 'ivv']);
 const contact = await lead();
 for (const expired of [false, true]) {
  const report = randomUUID();
  await getPool().query("INSERT INTO reports(id,token_hash,snapshot,expires_at) VALUES($1::uuid,$1::text,$2,now()+$3::int*interval '1 hour')", [report, snapshot, expired ? -1 : 1]);
  await receipt(contact, null, !expired, 1, 'a', report);
 }
 await receipt(contact, null, false);
 const data = await getDashboardData(all);
 expect(data.submittedComparisons).toEqual([{ first: 'unavailable', second: 'unavailable', captures: 2 }, { first: 'spy', second: 'ivv', captures: 1 }]);
});
test('comparison selections and private event feed use real nullable ETF event payloads in the cohort', async () => {
 const a = await session(); const other = await session(); const excluded = await session('a', false);
 const legacy = await event(a, 'comparison_started');
 for (let n = 0; n < 106; n++) {
  const eventId = await event(n === 105 ? other : a, 'etf_selected');
  await getPool().query('UPDATE analytics_events SET etf_ids=$2 WHERE event_id=$1', [eventId, ['spy', 'ivv']]);
 }
 const outside = await event(excluded, 'etf_selected');
 await getPool().query('UPDATE analytics_events SET etf_ids=$2 WHERE event_id=$1', [outside, ['qqq', 'voo']]);
 const data = await getDashboardData(all);
 expect(data.comparisons).toEqual([{ first: 'spy', second: 'ivv', selections: 106, sessions: 2 }]);
 expect(data.events).toHaveLength(100);
 expect(data.events.every(e => e.first === 'spy' && e.second === 'ivv' && e.source === 'client' && e.variant === 'a')).toBe(true);
 await getPool().query("DELETE FROM analytics_events WHERE name='etf_selected'");
 const historical = await getDashboardData(all);
 expect(historical.comparisons).toEqual([]);
 expect(historical.events.find(e => e.name === 'comparison_started')).toMatchObject({ first: null, second: null });
 expect((await getPool().query('SELECT etf_ids FROM analytics_events WHERE event_id=$1', [legacy])).rows[0].etf_ids).toBeNull();
});
test('guarded CSV export queries all filtered contacts separately from pagination', async () => {
 const { GET } = await import('@/app/dashboard/export/route');
 process.env.DASHBOARD_ENABLED = 'true'; process.env.APP_ORIGIN = 'http://localhost:3000';
 for (let n = 0; n < 55; n++) await receipt(await lead(false, `export-${n}@example.invalid`));
 await receipt(await lead(false, 'excluded@example.invalid'), null, true, 1, 'b');
 await receipt(await lead(false, 'too-old@example.invalid'), null, true, 90);
 const response = await GET(new Request('http://localhost:3000/dashboard/export?range=7&variant=a&page=999', { headers: { host: 'localhost:3000' } }));
 expect(response.status).toBe(200);
 expect(response.headers.get('cache-control')).toBe('private, no-store');
 expect(response.headers.get('x-robots-tag')).toContain('noindex');
 expect(response.headers.get('content-type')).toContain('text/csv');
 expect(response.headers.get('content-disposition')).toContain('attachment');
 const csv = await response.text(); expect(csv.trim().split('\r\n')).toHaveLength(56);
 for (let n = 0; n < 55; n++) expect(csv).toContain(`export-${n}@example.invalid`);
 expect(csv).not.toContain('excluded@example.invalid'); expect(csv).not.toContain('too-old@example.invalid');
 const deniedHeaders: Record<string, string>[] = [{}, { host: 'evil.invalid' }, { host: 'localhost:3000', 'x-forwarded-host': 'evil.invalid' }];
 for (const headers of deniedHeaders) {
  const denied = await GET(new Request('http://localhost:3000/dashboard/export', { headers }));
  expect(denied.status).toBe(404); expect(await denied.text()).not.toContain('example.invalid');
  expect(denied.headers.get('cache-control')).toBe('private, no-store');
 }
 process.env.DASHBOARD_ENABLED = 'false';
 expect((await GET(new Request('http://localhost:3000/dashboard/export', { headers: { host: 'localhost:3000' } }))).status).toBe(404);
});
test('dashboard transaction is read-only repeatable-read and excludes captures committed after its snapshot', async () => {
 const contact = await lead(); await receipt(contact);
 const pool = getPool(); const client = await pool.connect();
 const concurrent = new Pool({ host: '127.0.0.1', port: 55439, user: 'postgres', database });
 const modes: string[] = []; let inserted = false;
 const proxy = new Proxy(client, { get(target, property) {
  if (property === 'query') return async (text: string, values?: unknown[]) => {
   const result = await target.query(text, values);
   if (text === 'SELECT now() AS now') {
    modes.push((await target.query('SHOW transaction_read_only')).rows[0].transaction_read_only);
    modes.push((await target.query('SHOW transaction_isolation')).rows[0].transaction_isolation);
    await concurrent.query("INSERT INTO submission_receipts(attempt_id,payload_hash,lead_id,report_id,is_new_lead,attribution) VALUES($1,'test',$2,NULL,false,'{\"ad_variant\":\"a\"}')", [randomUUID(), contact]);
    inserted = true;
   }
   return result;
  };
  const value = Reflect.get(target, property); return typeof value === 'function' ? value.bind(target) : value;
 } });
 const connect = vi.spyOn(pool, 'connect').mockImplementation(() => Promise.resolve(proxy));
 try {
  const data = await getDashboardData(all);
  expect(modes).toEqual(['on', 'repeatable read']); expect(inserted).toBe(true);
  expect(data.overview.captures).toBe(1); expect(data.leads[0].captures).toBe(1);
 } finally { connect.mockRestore(); await concurrent.end(); }
 expect((await getDashboardData(all)).overview.captures).toBe(2);
});
test('multiple new contacts in one measured session do not inflate session conversion above 100 percent', async () => {
 const id = await session();
 for (let n = 0; n < 2; n++) {
  const attempt = await receipt(await lead(), id);
  await event(id, 'lead_submit_success', 'server', true, 1, 'a', attempt);
 }
 await event(id, 'lead_submit_success', 'server', true, 40);
 const data = await getDashboardData({ range: '7', variant: 'a', page: 1 });
 expect(data.overview.measuredSessions).toBe(1); expect(data.overview.measuredNewLeads).toBe(2);
 expect(data.overview.convertedSessions).toBe(1); expect(data.overview.conversionPct).toBe(100);
 expect(data.overview.unmeasuredCaptures).toBe(0);
});
test('database outage fails honestly and export error responses do not log contact data or credentials', async () => {
 const { GET } = await import('@/app/dashboard/export/route');
 const original = process.env.DATABASE_URL; await closePool();
 process.env.DATABASE_URL = 'postgresql://postgres@127.0.0.1:1/unavailable';
 process.env.DASHBOARD_ENABLED = 'true'; process.env.APP_ORIGIN = 'http://localhost:3000';
 const log = vi.spyOn(console, 'error').mockImplementation(() => {});
 try {
  await expect(getDashboardData(all)).rejects.toThrow();
  const response = await GET(new Request('http://localhost:3000/dashboard/export', { headers: { host: 'localhost:3000' } }));
  expect(response.status).toBe(503); expect(await response.text()).toBe('Dashboard unavailable');
  expect(response.headers.get('cache-control')).toBe('private, no-store'); expect(log).not.toHaveBeenCalled();
 } finally { log.mockRestore(); await closePool(); process.env.DATABASE_URL = original; }
});
