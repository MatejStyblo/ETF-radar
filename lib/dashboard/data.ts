import 'server-only';
import { getPool } from '@/lib/db/pool';
import type { DashboardData, DashboardFilter } from './types';

export function parseDashboardFilter(params: Record<string, string | string[] | undefined>): DashboardFilter {
 const range = params.range === '7' || params.range === '90' || params.range === 'all' ? params.range : '30';
 const variant = params.variant === 'a' || params.variant === 'b' ? params.variant : 'all';
 const rawPage = typeof params.page === 'string' && /^[1-9]\d*$/.test(params.page) ? Number(params.page) : 1;
 return { range, variant, page: Number.isSafeInteger(rawPage) ? rawPage : 1 };
}
const steps = [
 ['landing_view', 'Měřený landing'], ['primary_cta_click', 'Kliknutí na CTA'], ['comparison_started', 'Zahájené srovnání'],
 ['results_viewed', 'Zobrazené výsledky'], ['lead_offer_viewed', 'Zobrazená nabídka'], ['lead_form_started', 'Zahájený formulář'],
 ['lead_submit_attempt', 'Pokus o odeslání'], ['lead_submit_success', 'Uložený kontakt'], ['report_viewed', 'Zobrazený report'], ['report_downloaded', 'Stažení reportu'],
];
export const dashboardScopeSql = `WITH params AS (
 SELECT CASE WHEN $1::text='all' THEN '-infinity'::timestamptz ELSE now()-($1::int * interval '1 day') END AS from_at, now() AS to_at
), cohort AS (
 SELECT s.id, min(e.created_at) AS landing_at FROM analytics_sessions s
 JOIN analytics_events e ON e.session_id=s.id AND e.source='client' AND e.name='landing_view' AND e.ad_variant=s.ad_variant
 CROSS JOIN params p WHERE NOT s.revoked AND e.created_at>=p.from_at AND e.created_at<=p.to_at
 AND ($2::text='all' OR s.ad_variant=$2) GROUP BY s.id
), measured_events AS (
 SELECT e.* FROM analytics_events e JOIN cohort c ON c.id=e.session_id CROSS JOIN params p
 WHERE e.created_at>=p.from_at AND e.created_at<=p.to_at AND ($2::text='all' OR e.ad_variant=$2)
 AND ((e.source='client' AND e.name<>'lead_submit_success') OR (e.source='server' AND e.name='lead_submit_success'))
), receipts AS (
 SELECT r.* FROM submission_receipts r CROSS JOIN params p
 WHERE r.created_at>=p.from_at AND r.created_at<=p.to_at AND ($2::text='all' OR r.attribution->>'ad_variant'=$2)
)`;
export async function getDashboardData(filter: DashboardFilter): Promise<DashboardData> {
 const client = await getPool().connect();
 try {
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const clock = await client.query('SELECT now() AS now');
  const values = [filter.range, filter.variant];
  const stats = (await client.query(`${dashboardScopeSql}
   SELECT (SELECT count(*)::int FROM cohort) AS "measuredSessions",
    count(DISTINCT r.lead_id)::int AS "uniqueLeads", count(*)::int AS captures,
    count(DISTINCT r.lead_id) FILTER (WHERE l.marketing_consent)::int AS "marketingLeads",
    (SELECT count(*)::int FROM measured_events WHERE source='server' AND name='lead_submit_success' AND is_new_lead) AS "measuredNewLeads",
    (SELECT count(DISTINCT session_id)::int FROM measured_events WHERE source='server' AND name='lead_submit_success') AS "convertedSessions",
    count(*) FILTER (WHERE r.analytics_session_id IS NULL OR NOT EXISTS (
     SELECT 1 FROM measured_events e WHERE e.event_id=r.attempt_id AND e.session_id=r.analytics_session_id AND e.source='server' AND e.name='lead_submit_success'
    ))::int AS "unmeasuredCaptures"
   FROM receipts r JOIN leads l ON l.id=r.lead_id`, values)).rows[0];
  const funnel = (await client.query(`${dashboardScopeSql} SELECT name, count(DISTINCT session_id)::int AS sessions FROM measured_events GROUP BY name`, values)).rows;
  const daily = (await client.query(`${dashboardScopeSql}, session_days AS (
   SELECT to_char(landing_at AT TIME ZONE 'UTC','YYYY-MM-DD') AS day, count(*)::int AS sessions FROM cohort GROUP BY 1
  ), receipt_days AS (
   SELECT to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD') AS day, count(*)::int AS captures, count(DISTINCT lead_id)::int AS leads FROM receipts GROUP BY 1
  ) SELECT coalesce(s.day,r.day) AS day, coalesce(s.sessions,0) AS "measuredSessions", coalesce(r.leads,0) AS "uniqueLeads", coalesce(r.captures,0) AS captures
   FROM session_days s FULL JOIN receipt_days r ON s.day=r.day ORDER BY day`, values)).rows;
  const campaigns = (await client.query(`${dashboardScopeSql}
   SELECT coalesce(attribution->>'utm_source','') AS source, coalesce(attribution->>'utm_medium','') AS medium,
    coalesce(attribution->>'utm_campaign','') AS campaign, coalesce(attribution->>'ad_variant','') AS variant,
    count(*)::int AS captures, count(*) FILTER (WHERE is_new_lead)::int AS "newLeads"
   FROM receipts GROUP BY 1,2,3,4 ORDER BY captures DESC, source, medium, campaign, variant`, values)).rows;
  const comparisons = (await client.query(`${dashboardScopeSql}
   SELECT etf_ids[1] AS first,etf_ids[2] AS second,count(*)::int AS selections,count(DISTINCT session_id)::int AS sessions
   FROM measured_events WHERE source='client' AND name='etf_selected' AND cardinality(etf_ids)=2
    AND etf_ids[1] IS NOT NULL AND etf_ids[2] IS NOT NULL
   GROUP BY 1,2 ORDER BY selections DESC,first,second`, values)).rows;
  const events = (await client.query(`${dashboardScopeSql}
   SELECT created_at AS time,name,source,ad_variant AS variant,etf_ids[1] AS first,etf_ids[2] AS second
   FROM measured_events ORDER BY created_at DESC,event_id,source LIMIT 100`, values)).rows.map(row => ({ ...row, time: row.time.toISOString() }));
  const submittedComparisons = (await client.query(`${dashboardScopeSql}
   SELECT coalesce(p.snapshot#>>'{etfs,0,id}','unavailable') AS first, coalesce(p.snapshot#>>'{etfs,1,id}','unavailable') AS second,
    count(*)::int AS captures FROM receipts r LEFT JOIN reports p ON p.id=r.report_id AND p.expires_at>now()
   GROUP BY 1,2 ORDER BY captures DESC, first, second`, values)).rows;
  const leadTotal: number = stats.uniqueLeads;
  const page = Math.min(Math.max(1, filter.page), Math.max(1, Math.ceil(leadTotal / 50)));
  const leads = (await client.query(`${dashboardScopeSql}
   SELECT l.id,l.email,l.created_at AS "createdAt",l.marketing_consent AS "marketingConsent", count(*)::int AS captures
   FROM receipts r JOIN leads l ON l.id=r.lead_id GROUP BY l.id
   ORDER BY max(r.created_at) DESC,l.id LIMIT 50 OFFSET $3`, [...values, (page - 1) * 50])).rows.map(row => ({ ...row, createdAt: row.createdAt.toISOString() }));
  const data: DashboardData = {
   generatedAt: clock.rows[0].now.toISOString(), filter: { ...filter, page },
   overview: { ...stats, conversionPct: stats.measuredSessions ? 100 * stats.convertedSessions / stats.measuredSessions : null },
   funnel: steps.map(([name, label]) => ({ name, label, sessions: funnel.find(row => row.name === name)?.sessions ?? 0 })), daily, campaigns, comparisons, submittedComparisons, leads, leadTotal, events,
  };
  await client.query('COMMIT'); return data;
 } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
