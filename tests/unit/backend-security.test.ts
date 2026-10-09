import { randomBytes } from 'node:crypto';
import { expect, test, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { normalizeEmail, reportHash, reportToken } from '@/lib/security/tokens';
import { signSession, readSession } from '@/lib/security/analytics';
import { requireConfig } from '@/lib/security/config';
process.env.DATABASE_URL = 'postgresql://postgres@127.0.0.1:55439/etf_radar_test';
process.env.APP_ORIGIN = 'https://example.invalid';
process.env.LEAD_DEDUPE_SECRET = randomBytes(32).toString('hex');
process.env.REPORT_TOKEN_SECRET = randomBytes(32).toString('hex');
process.env.LEADS_ENABLED = 'true';
process.env.CONTROLLER_NAME = 'LOCAL TEST controller';
process.env.PRIVACY_CONTACT = 'local-test@example.invalid';
test('email normalization preserves the local part and all provider aliases', () => {
 expect(normalizeEmail('First.Last+ETF@EXAMPLE.COM')).toBe('First.Last+ETF@example.com');
 expect(normalizeEmail('First.Last@example.com')).not.toBe(normalizeEmail('firstlast@example.com'));
});
test('retry tokens are deterministic, opaque and only their keyed hash is stored', () => {
 const id = 'b92365df-e032-4c12-ae9d-519572a8dca9';
 const token = reportToken(id);
 expect(token).toMatch(/^[a-f0-9]{64}$/); expect(token).not.toContain(id);
 expect(reportToken(id)).toBe(token); expect(reportHash(token)).not.toBe(token);
});
test('signed analytics cookies cannot be forged and expire after thirty minutes', () => {
 const token = signSession('b92365df-e032-4c12-ae9d-519572a8dca9');
 const req = (cookie: string) => new Request('https://example.invalid/api/events', { headers: { cookie: `etf_analytics=${cookie}` } });
 expect(readSession(req(token))).toBe('b92365df-e032-4c12-ae9d-519572a8dca9');
 expect(readSession(req(token + '0'))).toBeNull();
 const spy = vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 1800001);
 try { expect(readSession(req(token))).toBeNull(); } finally { spy.mockRestore(); }
});
test('enabled capture requires a real configured controller contact and strong secrets', () => {
 for (const name of ['CONTROLLER_NAME','PRIVACY_CONTACT','REPORT_TOKEN_SECRET','LEAD_DEDUPE_SECRET','DATABASE_URL','APP_ORIGIN']) {
  const prior = process.env[name]; process.env[name] = '';
  try { expect(() => requireConfig()).toThrow(); } finally { process.env[name] = prior; }
 }
});
