import { randomBytes, randomUUID } from 'node:crypto';
import { afterAll, expect, test, vi } from 'vitest';
vi.mock('server-only', () => ({}));
process.env.DATABASE_URL = 'postgresql://postgres@127.0.0.1:55439/etf_radar_test';
process.env.APP_ORIGIN = 'http://localhost:3000';
process.env.LEADS_ENABLED = 'true';
process.env.CONTROLLER_NAME = 'LOCAL TEST controller';
process.env.PRIVACY_CONTACT = 'test@example.invalid';
process.env.REPORT_TOKEN_SECRET = randomBytes(32).toString('hex');
process.env.LEAD_DEDUPE_SECRET = randomBytes(32).toString('hex');
const { POST, DELETE } = await import('@/app/api/events/route');
const { getPool, closePool } = await import('@/lib/db/pool');
const sessions: string[] = [];
function request(body: unknown, cookie = '') { return new Request('http://localhost:3000/api/events', { method: 'POST', headers: { origin: 'http://localhost:3000', 'content-type': 'application/json', cookie }, body: JSON.stringify(body) }); }
async function bootstrap() {
 const event = { eventId: randomUUID(), name: 'landing_view', adVariant: 'a', consent: true };
 const response = await POST(request(event)); expect(response.status).toBe(200);
 const cookie = response.headers.get('set-cookie')!.split(';')[0]; sessions.push(cookie.split('=')[1].split('.')[0]);
 return { cookie, event };
}
afterAll(async () => {
 await getPool().query('DELETE FROM rate_limit_buckets WHERE bucket_key=ANY($1::text[])', [sessions.map(id => `analytics:${id}`)]);
 await getPool().query('DELETE FROM analytics_sessions WHERE id=ANY($1::uuid[])', [sessions]); await closePool();
});
test('invalid, unconsented, revoked and expired pair events never write rows', async () => {
 const { cookie, event: landing } = await bootstrap();
 const selected = { ...landing, eventId: randomUUID(), name: 'etf_selected', etfIds: ['spy', 'ivv'] };
 for (const overrides of [{ consent: false }, { etfIds: ['spy', 'spy'] }, { etfIds: ['spy', 'private@example.invalid'] }, { name: 'results_viewed' }, { email: 'private@example.invalid' }, { url: 'https://private.invalid' }, { initial: 100000 }]) {
  expect((await POST(request({ ...selected, ...overrides }, cookie))).status).toBe(422);
 }
 expect((await POST(request(selected))).status).toBe(401);
 expect((await getPool().query('SELECT event_id FROM analytics_events WHERE event_id=$1', [selected.eventId])).rowCount).toBe(0);
 expect((await POST(request(selected, cookie))).status).toBe(200);
 const revoked = await DELETE(new Request('http://localhost:3000/api/events', { method: 'DELETE', headers: { origin: 'http://localhost:3000', cookie } })); expect(revoked.status).toBe(200);
 expect((await POST(request(selected, cookie))).status).toBe(401);
 const blockedId = randomUUID();
 expect((await POST(request({ ...selected, eventId: blockedId }, cookie))).status).toBe(401);
 expect((await getPool().query('SELECT event_id FROM analytics_events WHERE event_id=$1', [blockedId])).rowCount).toBe(0);
 const fresh = await bootstrap(); const expiredId = randomUUID();
 await getPool().query("UPDATE analytics_sessions SET expires_at=now()-interval '1 second' WHERE id=$1", [sessions.at(-1)]);
 expect((await POST(request({ ...selected, eventId: expiredId }, fresh.cookie))).status).toBe(401);
 expect((await getPool().query('SELECT event_id FROM analytics_events WHERE event_id=$1', [expiredId])).rowCount).toBe(0);
});
test('pair replay is idempotent but altered, removed or reordered context conflicts', async () => {
 const { cookie, event: landing } = await bootstrap();
 const selected = { ...landing, eventId: randomUUID(), name: 'etf_selected', etfIds: ['spy', 'ivv'] };
 expect((await POST(request(selected, cookie))).status).toBe(200);
 const replays = await Promise.all([POST(request(selected, cookie)), POST(request(selected, cookie))]);
 expect(replays.map(r => r.status)).toEqual([200, 200]);
 for (const etfIds of [['spy', 'cspx'], ['ivv', 'spy'], undefined]) expect((await POST(request({ ...selected, etfIds }, cookie))).status).toBe(409);
 const legacy = { ...landing, eventId: randomUUID(), name: 'etf_selected' };
 expect((await POST(request(legacy, cookie))).status).toBe(200);
 expect((await POST(request({ ...legacy, etfIds: ['spy', 'ivv'] }, cookie))).status).toBe(409);
 expect((await getPool().query('SELECT etf_ids FROM analytics_events WHERE event_id=$1', [selected.eventId])).rows).toEqual([{ etf_ids: ['spy', 'ivv'] }]);
});
test('stores the ordered pair and leaves legacy events NULL', async () => {
 const { cookie, event: landing } = await bootstrap();
 const selected = { ...landing, eventId: randomUUID(), name: 'etf_selected', etfIds: ['cspx', 'spy'] };
 expect((await POST(request(selected, cookie))).status).toBe(200);
 const legacy = { ...landing, eventId: randomUUID(), name: 'etf_selected' };
 expect((await POST(request(legacy, cookie))).status).toBe(200);
 const rows = (await getPool().query('SELECT * FROM analytics_events WHERE event_id=ANY($1::uuid[])', [[landing.eventId, selected.eventId, legacy.eventId]])).rows;
 expect(rows.find(row => row.event_id === selected.eventId)?.etf_ids).toEqual(['cspx', 'spy']);
 expect(rows.filter(row => row.event_id !== selected.eventId).map(row => row.etf_ids)).toEqual([null, null]);
});
