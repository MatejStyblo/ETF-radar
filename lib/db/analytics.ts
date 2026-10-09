import 'server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getPool } from './pool';
import { HttpError } from '@/lib/security/http';
import { readSession } from '@/lib/security/analytics';
export const eventSchema = z.object({ eventId: z.uuid(), name: z.enum(['landing_view','primary_cta_click','comparison_started','etf_selected','calculator_interaction','results_viewed','lead_offer_viewed','lead_form_started','lead_submit_attempt','lead_submit_error','report_viewed','report_downloaded']), adVariant: z.enum(['a','b']), consent: z.literal(true) }).strict();
export async function validSession(request: Request): Promise<string | null> {
 const id = readSession(request);
 if (!id) return null;
 const row = await getPool().query('SELECT id FROM analytics_sessions WHERE id=$1 AND expires_at>now() AND NOT revoked', [id]);
 return row.rows[0]?.id ?? null;
}
export async function recordEvent(event: z.infer<typeof eventSchema>, request: Request) {
 let id = await validSession(request);
 if (!id && event.name !== 'landing_view') throw new HttpError(401, 'Měřicí relace chybí nebo vypršela.');
 const client = await getPool().connect();
 try {
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`analytics-event:${event.eventId}`]);
  const existing = await client.query("SELECT e.session_id,e.name,s.revoked,s.expires_at,s.ad_variant FROM analytics_events e JOIN analytics_sessions s ON s.id=e.session_id WHERE event_id=$1 AND source='client'", [event.eventId]);
  if (existing.rowCount) {
   const row = existing.rows[0];
   if (row.name !== event.name || row.ad_variant !== event.adVariant) throw new HttpError(409, 'Událost již používá jiné údaje.');
   if (row.revoked || new Date(row.expires_at).getTime() <= Date.now()) throw new HttpError(401, 'Měřicí relace vypršela.');
   if (id && id !== row.session_id) throw new HttpError(409, 'Událost patří jiné relaci.');
   await client.query('COMMIT');
   return row.session_id as string;
  }
  if (!id) {
   id = randomUUID();
   await client.query("INSERT INTO analytics_sessions(id,ad_variant,expires_at) VALUES($1,$2,now()+interval '30 minutes')", [id,event.adVariant]);
  }
  const quota = await client.query(`INSERT INTO rate_limit_buckets(bucket_key,hits,expires_at) VALUES($1,1,now()+interval '1 minute') ON CONFLICT(bucket_key) DO UPDATE SET hits=CASE WHEN rate_limit_buckets.expires_at<now() THEN 1 ELSE rate_limit_buckets.hits+1 END,expires_at=CASE WHEN rate_limit_buckets.expires_at<now() THEN now()+interval '1 minute' ELSE rate_limit_buckets.expires_at END RETURNING hits`, [`analytics:${id}`]);
  if (quota.rows[0].hits > 120) throw new HttpError(429, 'Příliš mnoho událostí.');
  await client.query("INSERT INTO analytics_events(event_id,source,session_id,name,ad_variant) SELECT $1,'client',id,$3,ad_variant FROM analytics_sessions WHERE id=$2 AND NOT revoked ON CONFLICT DO NOTHING", [event.eventId,id,event.name]);
  await client.query("UPDATE analytics_sessions SET expires_at=now()+interval '30 minutes' WHERE id=$1 AND NOT revoked", [id]);
  await client.query('COMMIT');
  return id;
 } catch(error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
export async function recordLeadSuccess(attemptId: string, sessionId: string | null, isNewLead: boolean) {
 if (!sessionId) return;
 await getPool().query("INSERT INTO analytics_events(event_id,source,session_id,name,ad_variant,is_new_lead) SELECT $1,'server',id,'lead_submit_success',ad_variant,$3 FROM analytics_sessions WHERE id=$2 AND NOT revoked AND expires_at>now() ON CONFLICT DO NOTHING", [attemptId,sessionId,isNewLead]);
}
export async function revokeSession(request: Request) {
 const id = readSession(request);
 if (id) await getPool().query('UPDATE analytics_sessions SET revoked=true WHERE id=$1', [id]);
}
