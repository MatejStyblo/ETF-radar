import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { createHash, randomBytes } from 'node:crypto';
vi.mock('server-only',()=>({}));
import { createDashboardSession, dashboardCookie, dashboardLoginAvailable, dashboardSessionValid, verifyDashboardKey } from '@/lib/dashboard/auth';
import { dashboardAccessAllowed } from '@/lib/dashboard/access';
const key = randomBytes(32).toString('base64url');
const host = new Headers({host:'demo.example.invalid'});
beforeEach(()=>{
 vi.stubEnv('APP_ORIGIN','https://demo.example.invalid');vi.stubEnv('DASHBOARD_ENABLED','true');vi.stubEnv('DASHBOARD_REMOTE_ENABLED','true');
 vi.stubEnv('DASHBOARD_ACCESS_KEY_HASH',createHash('sha256').update(key).digest('hex'));
 vi.stubEnv('DASHBOARD_SESSION_SECRET',randomBytes(32).toString('hex'));
});
afterEach(()=>{vi.unstubAllEnvs();vi.useRealTimers();});
test('remote opt-in alone never reveals dashboard and a correct key creates a bounded signed session',()=>{
 expect(dashboardLoginAvailable(host)).toBe(true);expect(dashboardAccessAllowed(host)).toBe(false);
 expect(verifyDashboardKey(key)).toBe(true);expect(verifyDashboardKey(randomBytes(32).toString('base64url'))).toBe(false);
 const headers=new Headers(host);headers.set('cookie',`${dashboardCookie}=${createDashboardSession()}`);
 expect(dashboardSessionValid(headers)).toBe(true);expect(dashboardAccessAllowed(headers)).toBe(true);
 vi.useFakeTimers();vi.setSystemTime(Date.now()+8*3600000+1000);expect(dashboardAccessAllowed(headers)).toBe(false);
});
test('tampering, missing secrets, wrong origin, forwarded hosts and key rotation fail closed',()=>{
 const token=createDashboardSession();const headers=new Headers(host);
 for(const value of ['',token.replace(/.$/,token.endsWith('0')?'1':'0'),'9999999999999.'+'0'.repeat(64)]){
  headers.set('cookie',`${dashboardCookie}=${value}`);expect(dashboardSessionValid(headers)).toBe(false);
 }
 headers.set('cookie',`${dashboardCookie}=${token}`);
 headers.set('x-forwarded-host','evil.invalid');expect(dashboardAccessAllowed(headers)).toBe(false);headers.delete('x-forwarded-host');
 vi.stubEnv('DASHBOARD_ACCESS_KEY_HASH','0'.repeat(64));expect(dashboardAccessAllowed(headers)).toBe(false);
 vi.stubEnv('DASHBOARD_SESSION_SECRET','');expect(dashboardLoginAvailable(host)).toBe(false);
});
test('public HTTP and missing explicit remote enablement cannot use login',()=>{
 vi.stubEnv('APP_ORIGIN','http://demo.example.invalid');expect(dashboardLoginAvailable(host)).toBe(false);
 vi.stubEnv('APP_ORIGIN','https://demo.example.invalid');vi.stubEnv('DASHBOARD_REMOTE_ENABLED','false');expect(dashboardLoginAvailable(host)).toBe(false);
});
