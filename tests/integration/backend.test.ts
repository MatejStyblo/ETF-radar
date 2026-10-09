import { randomBytes, randomUUID } from 'node:crypto';
import { afterAll, expect, test, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const run = randomUUID();
const ownSessions: string[] = [];
process.env.DATABASE_URL = 'postgresql://postgres@127.0.0.1:55439/etf_radar_test';
process.env.APP_ORIGIN = 'http://localhost:3000';
process.env.LEAD_DEDUPE_SECRET = randomBytes(32).toString('hex');
process.env.REPORT_TOKEN_SECRET = randomBytes(32).toString('hex');
process.env.LEADS_ENABLED = 'true';
process.env.CONTROLLER_NAME = 'LOCAL TEST controller';
process.env.PRIVACY_CONTACT = 'test@example.invalid';
const { POST } = await import('@/app/api/leads/route');
const { getPool, closePool } = await import('@/lib/db/pool');
const { getReport } = await import('@/lib/db/leads');
const payload = (overrides = {}) => ({ email: `${run}@example.invalid`, marketingConsent: false, website: '', attemptId: randomUUID(), scenario: { initial: 100000, monthly: 3000, years: 20, grossReturnPct: 5 }, etfIds: ['spy', 'ivv'], attribution: { ad_variant: 'a', utm_campaign: 'backend_test' }, ...overrides });
function request(body: unknown, headers = {}) { return new Request('http://localhost:3000/api/leads', { method: 'POST', headers: { origin: 'http://localhost:3000', 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) }); }
function token(res: Response) { return /etf_report=([^;]+)/.exec(res.headers.get('set-cookie') ?? '')?.[1] ?? ''; }
afterAll(async () => {
 const db = getPool();
 await db.query('DELETE FROM rate_limit_buckets WHERE bucket_key=ANY($1::text[])', [ownSessions.map(id => `analytics:${id}`)]);
 await db.query('DELETE FROM analytics_sessions WHERE id=ANY($1::uuid[])', [ownSessions]);
 await db.query("DELETE FROM rate_limit_buckets WHERE bucket_key IN (SELECT 'lead:'||email_key FROM leads WHERE email LIKE $1)", [`%${run}%`]);
 await db.query("DELETE FROM reports WHERE id IN (SELECT report_id FROM submission_receipts WHERE lead_id IN (SELECT id FROM leads WHERE email LIKE $1))", [`%${run}%`]);
 await db.query("DELETE FROM submission_receipts WHERE lead_id IN (SELECT id FROM leads WHERE email LIKE $1)", [`%${run}%`]);
 await db.query("DELETE FROM leads WHERE email LIKE $1", [`%${run}%`]);
 await closePool();
});
test('invalid origins, media types, malformed and oversized bodies are rejected before writes', async () => {
 expect((await POST(request(payload(), { origin: 'https://evil.invalid' }))).status).toBe(403);
 expect((await POST(request(payload(), { 'content-type': 'text/plain' }))).status).toBe(415);
 expect((await POST(new Request('http://localhost:3000/api/leads', { method: 'POST', headers: { origin: 'http://localhost:3000', 'content-type': 'application/json' }, body: '{' }))).status).toBe(400);
 expect((await POST(request({ ...payload(), extra: 'x'.repeat(17000) }))).status).toBe(413);
 expect((await POST(request(payload({ website: 'spam', email: 'invalid' })))).status).toBe(422);
});
test('configuration gate prevents capture and expired or wrong tokens cannot retrieve reports', async () => {
 process.env.LEADS_ENABLED = 'false';
 try { expect((await POST(request(payload()))).status).toBe(503); } finally { process.env.LEADS_ENABLED = 'true'; }
 expect(await getReport('0'.repeat(64))).toBeNull();
 const body = payload({ email: `expired-${run}@example.invalid` }); const response = await POST(request(body));
 await getPool().query("UPDATE reports SET expires_at=now()-interval '1 second' WHERE id=(SELECT report_id FROM submission_receipts WHERE attempt_id=$1)", [body.attemptId]);
 expect(await getReport(token(response))).toBeNull();
});
test('shared per-email throttle limits distinct attempts without blocking a committed retry', async () => {
 const body = payload({ email: `limited-${run}@example.invalid` });
 const first = await POST(request(body)); expect(first.status).toBe(200);
 for (let i=0;i<4;i++) expect((await POST(request({ ...body, attemptId: randomUUID() }))).status).toBe(200);
 expect((await POST(request({ ...body, attemptId: randomUUID() }))).status).toBe(429);
 expect((await POST(request(body))).status).toBe(200);
});
test('download serves only the authorized snapshot as private HTML without email', async () => {
 const { GET } = await import('@/app/report/download/route');
 const body = payload({ email: `download-${run}@example.invalid` }); const res = await POST(request(body));
 const downloaded = await GET(new Request('http://localhost:3000/report/download', { headers: { cookie: `etf_report=${token(res)}` } }));
 expect(downloaded.status).toBe(200);
 expect(downloaded.headers.get('cache-control')).toBe('private, no-store');
 expect(downloaded.headers.get('content-disposition')).toContain('etf-radar-report.html');
 const html = await downloaded.text(); expect(html).toContain('<html'); expect(html).not.toContain(body.email);
 expect((await GET(new Request('http://localhost:3000/report/download'))).status).toBe(401);
});
test('analytics requires explicit consent, signed landing session, dedupes events and stores server lead success only', async () => {
 const { POST: eventPost, DELETE: revoke } = await import('@/app/api/events/route');
 const event = { eventId: randomUUID(), name: 'landing_view', adVariant: 'a', consent: true };
 expect((await eventPost(request({ ...event, consent: false }))).status).toBe(422);
 expect((await eventPost(request({ ...event, name: 'lead_submit_success' }))).status).toBe(422);
 expect((await eventPost(request({ ...event, name: 'calculator_interaction' }))).status).toBe(401);
 const landing = await eventPost(request(event)); expect(landing.status).toBe(200);
 const cookie = landing.headers.get('set-cookie')!.split(';')[0];
 ownSessions.push(cookie.split('=')[1].split('.')[0]);
 const replay = await eventPost(request(event)); expect(replay.status).toBe(200);
 ownSessions.push(replay.headers.get('set-cookie')!.split(';')[0].split('=')[1].split('.')[0]);
 expect(replay.headers.get('set-cookie')!.split(';')[0].split('=')[1].split('.')[0]).toBe(cookie.split('=')[1].split('.')[0]);
 const clicked = { ...event, eventId: randomUUID(), name: 'primary_cta_click' };
 expect((await eventPost(request(clicked, { cookie }))).status).toBe(200);
 expect((await eventPost(request(clicked, { cookie }))).status).toBe(200);
 const sameLanding = await eventPost(request(event, { cookie })); expect(sameLanding.status).toBe(200);
 const tampered = cookie.slice(0, -1) + (cookie.endsWith('0') ? '1' : '0');
 expect((await eventPost(request(clicked, { cookie: tampered }))).status).toBe(401);
 expect((await eventPost(request({ ...clicked, email: 'x@example.invalid' }, { cookie }))).status).toBe(422);
 const body = payload({ email: `measured-${run}@example.invalid` });
 expect((await POST(request(body, { cookie, 'X-Analytics-Consent': 'true' }))).status).toBe(200);
 expect((await POST(request(body, { cookie, 'X-Analytics-Consent': 'true' }))).status).toBe(200);
 const readback = await getPool().query('SELECT * FROM analytics_events WHERE event_id IN ($1,$2,$3)', [event.eventId, clicked.eventId, body.attemptId]);
 expect(readback.rowCount).toBe(3);
 expect(readback.rows.find(r => r.name === 'lead_submit_success')?.is_new_lead).toBe(true);
 expect(JSON.stringify(readback.rows)).not.toContain(body.email);
 const revoked = await revoke(new Request('http://localhost:3000/api/events', { method: 'DELETE', headers: { origin: 'http://localhost:3000', cookie } }));
 expect(revoked.status).toBe(200); expect(revoked.headers.get('set-cookie')).toContain('Max-Age=0');
 expect((await eventPost(request({ ...clicked, eventId: randomUUID() }, { cookie }))).status).toBe(401);
 await getPool().query('DELETE FROM analytics_events WHERE session_id=$1', [readback.rows[0].session_id]);
 await getPool().query('DELETE FROM analytics_sessions WHERE id=$1', [readback.rows[0].session_id]);
});
test('lead capture with an unrevoked cookie requires current consent, including receipt replay', async () => {
 const { POST: eventPost } = await import('@/app/api/events/route');
 const landing = await eventPost(request({ eventId: randomUUID(), name: 'landing_view', adVariant: 'a', consent: true }));
 const cookie = landing.headers.get('set-cookie')!.split(';')[0];
 ownSessions.push(cookie.split('=')[1].split('.')[0]);
 for (const consent of [undefined, 'false']) {
  const body = payload({ email: `no-consent-${consent}-${run}@example.invalid` });
  const headers = consent === undefined ? { cookie } : { cookie, 'X-Analytics-Consent': consent };
  const response = await POST(request(body, headers));
  expect(response.status).toBe(200); expect(await getReport(token(response))).not.toBeNull();
  expect((await getPool().query('SELECT * FROM analytics_events WHERE event_id=$1', [body.attemptId])).rowCount).toBe(0);
 }
 const body = payload({ email: `replay-consent-${run}@example.invalid` });
 expect((await POST(request(body, { cookie, 'X-Analytics-Consent': 'true' }))).status).toBe(200);
 await getPool().query('DELETE FROM analytics_events WHERE event_id=$1', [body.attemptId]);
 expect((await POST(request(body, { cookie, 'X-Analytics-Consent': 'false' }))).status).toBe(200);
 expect((await getPool().query('SELECT * FROM analytics_events WHERE event_id=$1', [body.attemptId])).rowCount).toBe(0);
});
test('database outage returns honest 503 without minting a report cookie', async () => {
 const url = process.env.DATABASE_URL;
 await closePool(); process.env.DATABASE_URL = 'postgresql://postgres@127.0.0.1:1/etf_radar_test';
 try {
  const res = await POST(request(payload())); expect(res.status).toBe(503); expect(res.headers.get('set-cookie')).toBeNull();
  const { GET } = await import('@/app/report/download/route');
  expect((await GET(new Request('http://localhost:3000/report/download', { headers: { cookie: `etf_report=${'0'.repeat(64)}` } }))).status).toBe(503);
 } finally { await closePool(); process.env.DATABASE_URL = url; }
});
test('analytics write failure never changes a committed lead response', async () => {
 const analytics = await import('@/lib/db/analytics');
 const spy = vi.spyOn(analytics, 'recordLeadSuccess').mockRejectedValue(new Error('Analytics unavailable'));
 const { POST: eventPost } = await import('@/app/api/events/route');
 const landing = await eventPost(request({ eventId: randomUUID(), name: 'landing_view', adVariant: 'a', consent: true }));
 const cookie = landing.headers.get('set-cookie')!.split(';')[0];
 ownSessions.push(cookie.split('=')[1].split('.')[0]);
 const body = payload({ email: `analytics-failure-${run}@example.invalid` });
 try {
  const response = await POST(request(body, { cookie, 'X-Analytics-Consent': 'true' })); expect(response.status).toBe(200);
  expect(spy).toHaveBeenCalledOnce();
  expect((await getPool().query('SELECT id FROM leads WHERE email=$1', [body.email])).rowCount).toBe(1);
  expect(await getReport(token(response))).not.toBeNull();
 } finally { spy.mockRestore(); }
});
test('unique email remains atomic across different simultaneous attempts', async () => {
 const body = payload({ email: `concurrent-${run}@example.invalid` });
 const bodies = [body, { ...body, attemptId: randomUUID() }, { ...body, attemptId: randomUUID() }];
 const responses = await Promise.all(bodies.map(b => POST(request(b))));
 expect(responses.map(r => r.status)).toEqual([200,200,200]);
 expect(new Set(responses.map(token)).size).toBe(3);
 const counts = await getPool().query('SELECT count(*)::int AS captures, count(*) FILTER(WHERE is_new_lead)::int AS new FROM submission_receipts WHERE attempt_id=ANY($1::uuid[])', [bodies.map(b => b.attemptId)]);
 expect(counts.rows).toEqual([{ captures: 3, new: 1 }]);
});
test('retention cleanup preserves fresh scoped records and removes aged scoped records', async () => {
 const { execFileSync } = await import('node:child_process');
 const body = payload({ email: `retention-${run}@example.invalid` }); await POST(request(body));
 const lead = await getPool().query('SELECT id FROM leads WHERE email=$1', [body.email]); const id = lead.rows[0].id;
 execFileSync(process.execPath, ['scripts/cleanup.mjs', '--retention', '--lead-id', id], { env: process.env });
 expect((await getPool().query('SELECT id FROM leads WHERE id=$1', [id])).rowCount).toBe(1);
 await getPool().query("UPDATE leads SET created_at=now()-interval '91 days' WHERE id=$1", [id]);
 execFileSync(process.execPath, ['scripts/cleanup.mjs', '--retention', '--lead-id', id], { env: process.env });
 expect((await getPool().query('SELECT id FROM leads WHERE id=$1', [id])).rowCount).toBe(0);
});
test('seven-day snapshot retention does not erase the capture receipt', async () => {
 const { execFileSync } = await import('node:child_process');
 const body = payload({ email: `snapshot-retention-${run}@example.invalid` }); const response = await POST(request(body));
 const lead = await getPool().query('SELECT id FROM leads WHERE email=$1', [body.email]);
 await getPool().query("UPDATE reports SET created_at=now()-interval '8 days' WHERE id=(SELECT report_id FROM submission_receipts WHERE attempt_id=$1)", [body.attemptId]);
 execFileSync(process.execPath, ['scripts/cleanup.mjs', '--retention', '--lead-id', lead.rows[0].id], { env: process.env });
 expect(await getReport(token(response))).toBeNull();
 const receipt = await getPool().query('SELECT report_id FROM submission_receipts WHERE attempt_id=$1', [body.attemptId]);
 expect(receipt.rows).toEqual([{ report_id: null }]);
});
test('explicit data-subject deletion removes only the targeted lead and its reports', async () => {
 const { execFileSync } = await import('node:child_process');
 const body = payload({ email: `deletion-${run}@example.invalid` }); const response = await POST(request(body));
 const lead = await getPool().query('SELECT id FROM leads WHERE email=$1', [body.email]);
 execFileSync(process.execPath, ['scripts/cleanup.mjs', '--lead-id', lead.rows[0].id], { env: process.env });
 expect((await getPool().query('SELECT id FROM leads WHERE email=$1', [body.email])).rowCount).toBe(0);
 expect(await getReport(token(response))).toBeNull();
});
test('report session is Secure on HTTPS origins and unavailable without controller details', async () => {
 const origin = process.env.APP_ORIGIN; const contact = process.env.PRIVACY_CONTACT;
 process.env.APP_ORIGIN = 'https://example.invalid';
 try {
  const body = payload({ email: `secure-${run}@example.invalid` });
  const response = await POST(new Request('https://example.invalid/api/leads', { method: 'POST', headers: { origin: 'https://example.invalid', 'content-type': 'application/json' }, body: JSON.stringify(body) }));
  expect(response.status).toBe(200); expect(response.headers.get('set-cookie')).toContain('Secure');
  expect(response.headers.get('set-cookie')).toContain('Path=/report');
  expect(response.headers.get('set-cookie')).toContain('SameSite=lax');
  process.env.PRIVACY_CONTACT = '';
  expect((await POST(request(payload()))).status).toBe(503);
 } finally { process.env.APP_ORIGIN = origin; process.env.PRIVACY_CONTACT = contact; }
});
test.each(['expired', 'deleted', 'null'] as const)('receipt replay rejects an inaccessible %s report without extending expiry', async state => {
 const body = payload({ email: `replay-${state}-${run}@example.invalid` });
 const first = await POST(request(body)); expect(first.status).toBe(200);
 const db = getPool();
 const reportId = (await db.query('SELECT report_id FROM submission_receipts WHERE attempt_id=$1', [body.attemptId])).rows[0].report_id;
 if (state === 'expired') await db.query("UPDATE reports SET expires_at=now()-interval '1 second' WHERE id=$1", [reportId]);
 else if (state === 'deleted') await db.query('DELETE FROM reports WHERE id=$1', [reportId]);
 else await db.query('UPDATE submission_receipts SET report_id=null WHERE attempt_id=$1', [body.attemptId]);
 const before = (await db.query('SELECT expires_at FROM reports WHERE id=$1', [reportId])).rows;
 try {
  const replay = await POST(request(body));
  expect(replay.status).toBe(410); expect((await replay.json()).code).toBe('REPORT_EXPIRED');
  expect(replay.headers.get('set-cookie')).toBeNull();
  expect((await db.query('SELECT expires_at FROM reports WHERE id=$1', [reportId])).rows).toEqual(before);
  const renewed = await POST(request({ ...body, attemptId: randomUUID() }));
  expect(renewed.status).toBe(200); expect(await getReport(token(renewed))).not.toBeNull();
 } finally { if (state === 'null') await db.query('DELETE FROM reports WHERE id=$1', [reportId]); }
});

test('same attempt retries concurrently return the same report without extra capture', async () => {
 const body = payload({ email: `retry-${run}@example.invalid` });
 const responses = await Promise.all([POST(request(body)), POST(request(body)), POST(request(body))]);
 expect(responses.map(r => r.status)).toEqual([200, 200, 200]);
 expect(new Set(responses.map(token)).size).toBe(1);
 const rows = await getPool().query('SELECT * FROM submission_receipts WHERE attempt_id=$1', [body.attemptId]);
 expect(rows.rowCount).toBe(1);
 expect((await POST(request({ ...body, marketingConsent: true }))).status).toBe(409);
});
test('different attempts for the same email have isolated reports and preserve original consent', async () => {
 const body = payload({ email: `duplicate-${run}@example.invalid` });
 const first = await POST(request(body));
 const second = await POST(request({ ...body, attemptId: randomUUID(), marketingConsent: true, scenario: { ...body.scenario, years: 10 } }));
 expect(second.status).toBe(200); expect(token(second)).not.toBe(token(first));
 expect((await getReport(token(first)))?.scenario.years).toBe(20);
 expect((await getReport(token(second)))?.scenario.years).toBe(10);
 const rows = await getPool().query('SELECT marketing_consent FROM leads WHERE email=$1', [body.email]);
 expect(rows.rows).toEqual([{ marketing_consent: false }]);
});
test('committed capture persists email, receipt and private retrievable report', async () => {
 const body = payload(); const res = await POST(request(body));
 expect(res.status).toBe(200); expect(await res.json()).toEqual({ ok: true, reportUrl: '/report' });
 expect(res.headers.get('set-cookie')).toContain('HttpOnly');
 const rows = await getPool().query('SELECT * FROM leads WHERE email=$1', [body.email]);
 expect(rows.rowCount).toBe(1); expect(rows.rows[0].marketing_consent).toBe(false);
 expect(rows.rows[0].privacy_notice_version).toBeTruthy();
 const report = await getReport(token(res)); expect(report?.scenario).toEqual(body.scenario);
 expect(JSON.stringify(report)).not.toContain(body.email);
});
