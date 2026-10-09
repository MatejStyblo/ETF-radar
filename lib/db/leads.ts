import 'server-only';
import { randomUUID } from 'node:crypto';
import { getPool } from './pool';
import { buildReport, type PersonalReport } from '@/lib/report/model';
import type { LeadInput } from '@/lib/validation/schemas';
import { hmac, normalizeEmail, reportHash, reportToken } from '@/lib/security/tokens';
import { requireConfig } from '@/lib/security/config';
export class CaptureError extends Error { constructor(public status: number, message: string, public code?: string) { super(message); } }
export async function captureLead(input: LeadInput, sessionId: string | null = null) {
 const config = requireConfig();
 const email = normalizeEmail(input.email);
 const key = hmac(email, config.dedupeSecret);
 const token = reportToken(input.attemptId);
 const client = await getPool().connect();
 try {
  await client.query('BEGIN');
  const payloadHash = hmac(JSON.stringify({ ...input, email }), config.dedupeSecret);
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`attempt:${input.attemptId}`]);
  const prior = await client.query('SELECT payload_hash,report_id,is_new_lead,analytics_session_id FROM submission_receipts WHERE attempt_id=$1', [input.attemptId]);
  if (prior.rowCount) {
   if (prior.rows[0].payload_hash !== payloadHash) throw new CaptureError(409, 'Tento pokus již používá jiné údaje.');
   const accessible = await client.query('SELECT id FROM reports WHERE id=$1 AND token_hash=$2 AND expires_at>now() FOR SHARE', [prior.rows[0].report_id,reportHash(token)]);
   if (!accessible.rowCount) throw new CaptureError(410, 'Platnost původního reportu vypršela. Odešlete formulář znovu pro nový report; vaše vstupy zůstaly zachované.', 'REPORT_EXPIRED');
   await client.query('COMMIT');
   return { token, isNewLead: prior.rows[0].is_new_lead as boolean, sessionId: prior.rows[0].analytics_session_id as string | null };
  }
  const bucket = await client.query(`INSERT INTO rate_limit_buckets(bucket_key,hits,expires_at) VALUES($1,1,now()+interval '15 minutes')
   ON CONFLICT(bucket_key) DO UPDATE SET hits=CASE WHEN rate_limit_buckets.expires_at<now() THEN 1 ELSE rate_limit_buckets.hits+1 END,
   expires_at=CASE WHEN rate_limit_buckets.expires_at<now() THEN now()+interval '15 minutes' ELSE rate_limit_buckets.expires_at END RETURNING hits`, [`lead:${key}`]);
  if (bucket.rows[0].hits > 5) throw new CaptureError(429, 'Příliš mnoho pokusů. Zkuste to za 15 minut.');
  const inserted = await client.query('INSERT INTO leads(id,email,email_key,marketing_consent,privacy_notice_version,marketing_consent_at) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(email_key) DO NOTHING RETURNING id', [randomUUID(),email,key,input.marketingConsent,'2026-10-09',input.marketingConsent ? new Date() : null]);
  const isNewLead = inserted.rowCount === 1;
  const id: string = isNewLead ? inserted.rows[0].id : (await client.query('SELECT id FROM leads WHERE email_key=$1', [key])).rows[0].id;
  const reportId = randomUUID();
  await client.query("INSERT INTO reports(id,token_hash,snapshot,expires_at) VALUES($1,$2,$3,now()+interval '24 hours')", [reportId,reportHash(token),JSON.stringify(buildReport(input.scenario,input.etfIds))]);
  await client.query('INSERT INTO submission_receipts(attempt_id,payload_hash,lead_id,report_id,is_new_lead,attribution,analytics_session_id) VALUES($1,$2,$3,$4,$5,$6,$7)', [input.attemptId,payloadHash,id,reportId,isNewLead,input.attribution,sessionId]);
  await client.query('COMMIT');
  return { token, isNewLead, sessionId };
 } catch(error) { await client.query('ROLLBACK'); throw error; }
 finally { client.release(); }
}
export async function getReport(token: string): Promise<PersonalReport | null> {
 if (!/^[a-f0-9]{64}$/.test(token)) return null;
 const result = await getPool().query('SELECT snapshot FROM reports WHERE token_hash=$1 AND expires_at>now()', [reportHash(token)]);
 return result.rows[0]?.snapshot ?? null;
}
