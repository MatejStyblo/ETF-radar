import { afterEach, expect, test, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { assertDashboardAccess, dashboardAccessAllowed } from '@/lib/dashboard/access';
afterEach(() => vi.unstubAllEnvs());
test('local dashboard fails closed unless explicitly enabled with exact loopback host', () => {
 vi.stubEnv('APP_ORIGIN', 'http://localhost:3000');
 vi.stubEnv('DASHBOARD_ENABLED', 'false');
 expect(dashboardAccessAllowed(new Headers({ host: 'localhost:3000' }))).toBe(false);
 vi.stubEnv('DASHBOARD_ENABLED', 'true');
 expect(dashboardAccessAllowed(new Headers({ host: 'localhost:3000' }))).toBe(true);
 for (const host of ['', 'evil.invalid', 'localhost', 'localhost:3001', 'localhost:3000,evil.invalid']) {
  expect(dashboardAccessAllowed(new Headers({ host }))).toBe(false);
  expect(() => assertDashboardAccess(new Headers({ host }))).toThrow('Dashboard unavailable');
 }
 expect(() => assertDashboardAccess(new Headers({ host: 'localhost:3000' }))).not.toThrow();
});
test('forwarded hosts cannot bypass exact origin host', () => {
 vi.stubEnv('APP_ORIGIN', 'http://localhost:3000'); vi.stubEnv('DASHBOARD_ENABLED', 'true');
 for (const forwarded of ['evil.invalid', 'localhost', 'localhost:3000, evil.invalid', '']) {
  expect(dashboardAccessAllowed(new Headers({ host: 'localhost:3000', 'x-forwarded-host': forwarded }))).toBe(false);
 }
 expect(dashboardAccessAllowed(new Headers({ host: 'localhost:3000', 'x-forwarded-host': 'localhost:3000' }))).toBe(true);
});
test('only literal HTTP loopback origins are accepted', () => {
 vi.stubEnv('DASHBOARD_ENABLED', 'true');
 for (const origin of ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://[::1]:3000']) {
  vi.stubEnv('APP_ORIGIN', origin);
  expect(dashboardAccessAllowed(new Headers({ host: new URL(origin).host }))).toBe(true);
 }
 for (const origin of ['', 'invalid', 'https://localhost:3000', 'http://example.invalid', 'http://localhost.evil.invalid:3000', 'http://127.0.0.2:3000', 'http://user:pass@localhost:3000', 'http://localhost:3000/path', 'http://localhost:3000/?x=1', 'http://localhost:3000/#hash']) {
  vi.stubEnv('APP_ORIGIN', origin);
  expect(dashboardAccessAllowed(new Headers({ host: 'localhost:3000' }))).toBe(false);
 }
});
