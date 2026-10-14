import 'server-only';
import { dashboardLoginAvailable, dashboardSessionValid } from './auth';
export function dashboardAccessAllowed(headers: Headers): boolean {
 if (process.env.DASHBOARD_ENABLED !== 'true' || !process.env.APP_ORIGIN) return false;
 if (dashboardLoginAvailable(headers)) return dashboardSessionValid(headers);
 try {
  const origin = new URL(process.env.APP_ORIGIN);
  return origin.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)
   && !origin.username && !origin.password && origin.pathname === '/' && !origin.search && !origin.hash
   && headers.get('host') === origin.host
   && (!headers.has('x-forwarded-host') || headers.get('x-forwarded-host') === origin.host);
 } catch { return false; }
}
export function assertDashboardAccess(headers: Headers): void {
 if (!dashboardAccessAllowed(headers)) throw new Error('Dashboard unavailable');
}
