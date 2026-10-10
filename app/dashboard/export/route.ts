import { dashboardAccessAllowed } from '@/lib/dashboard/access';
import { parseDashboardFilter } from '@/lib/dashboard/data';
import { dashboardCsv, getDashboardExportLeads } from '@/lib/dashboard/export';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const privateHeaders = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff' };
export async function GET(request: Request): Promise<Response> {
 if (!dashboardAccessAllowed(request.headers)) return new Response('Dashboard unavailable', { status: 404, headers: privateHeaders });
 try {
  const search = new URL(request.url).searchParams;
  const params: Record<string, string | string[]> = {};
  for (const key of search.keys()) {
   const values = search.getAll(key); params[key] = values.length === 1 ? values[0] : values;
  }
  const leads = await getDashboardExportLeads(parseDashboardFilter(params));
  return new Response(dashboardCsv(leads), { headers: { ...privateHeaders, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="etf-radar-contacts.csv"' } });
 } catch {
  // Never expose database error details, connection credentials or contact data.
  return new Response('Dashboard unavailable', { status: 503, headers: privateHeaders });
 }
}
