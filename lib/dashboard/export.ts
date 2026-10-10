import 'server-only';
import { getPool } from '@/lib/db/pool';
import { dashboardScopeSql } from './data';
import type { DashboardData, DashboardFilter } from './types';

export async function getDashboardExportLeads(filter: DashboardFilter): Promise<DashboardData['leads']> {
 const client = await getPool().connect();
 try {
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const rows = (await client.query(`${dashboardScopeSql}
   SELECT l.id,l.email,l.created_at AS "createdAt",l.marketing_consent AS "marketingConsent",count(*)::int AS captures
   FROM receipts r JOIN leads l ON l.id=r.lead_id GROUP BY l.id ORDER BY max(r.created_at) DESC,l.id`, [filter.range, filter.variant])).rows;
  await client.query('COMMIT');
  return rows.map(row => ({ ...row, createdAt: row.createdAt.toISOString() }));
 } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
function cell(value: string | number | boolean): string {
 const text = String(value);
 const safe = /^\s*[=+\-@]/u.test(text) ? `'${text}` : text;
 return `"${safe.replaceAll('"', '""')}"`;
}
export function dashboardCsv(leads: DashboardData['leads']): string {
 return [
  ['id', 'email', 'created_at', 'marketing_consent', 'captures'],
  ...leads.map(lead => [lead.id, lead.email, lead.createdAt, lead.marketingConsent, lead.captures]),
 ].map(row => row.map(cell).join(',')).join('\r\n') + '\r\n';
}
