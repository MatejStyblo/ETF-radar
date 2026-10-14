import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const duration = 8 * 60 * 60 * 1000;
export const dashboardCookie = 'etf_dashboard';
function credentials() {
 const hash = process.env.DASHBOARD_ACCESS_KEY_HASH ?? '';
 const secret = process.env.DASHBOARD_SESSION_SECRET ?? '';
 return /^[a-f0-9]{64}$/.test(hash) && secret.length >= 64 ? { hash, secret } : null;
}
export function dashboardLoginAvailable(headers: Headers): boolean {
 if (process.env.DASHBOARD_ENABLED !== 'true' || process.env.DASHBOARD_REMOTE_ENABLED !== 'true' || !credentials()) return false;
 try {
  const origin = new URL(process.env.APP_ORIGIN ?? '');
  return origin.protocol === 'https:' && !origin.username && !origin.password && origin.pathname === '/' && !origin.search && !origin.hash
   && headers.get('host') === origin.host && (!headers.has('x-forwarded-host') || headers.get('x-forwarded-host') === origin.host);
 } catch { return false; }
}
export function verifyDashboardKey(key: string): boolean {
 const config = credentials();
 if (!config || !/^[A-Za-z0-9_-]{43}$/.test(key)) return false;
 return timingSafeEqual(createHash('sha256').update(key).digest(), Buffer.from(config.hash, 'hex'));
}
function signature(expires: string) {
 const config = credentials();
 if (!config) throw new Error('Dashboard authentication unavailable');
 return createHmac('sha256', config.secret).update(`dashboard:${config.hash}:${expires}`).digest('hex');
}
export function createDashboardSession(): string {
 const expires = String(Date.now() + duration);
 return `${expires}.${signature(expires)}`;
}
export function dashboardSessionValid(headers: Headers): boolean {
 if (!credentials()) return false;
 const value = headers.get('cookie')?.split(';').map(part => part.trim()).find(part => part.startsWith(`${dashboardCookie}=`))?.slice(dashboardCookie.length + 1) ?? '';
 const match = /^(\d{13})\.([a-f0-9]{64})$/.exec(value);
 if (!match || Number(match[1]) <= Date.now() || Number(match[1]) > Date.now() + duration + 5000) return false;
 return timingSafeEqual(Buffer.from(signature(match[1]), 'hex'), Buffer.from(match[2], 'hex'));
}
