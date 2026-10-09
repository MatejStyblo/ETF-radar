import { Pool } from 'pg';
const args = process.argv.slice(2);
const retention = args.includes('--retention');
const index = args.indexOf('--lead-id');
const leadId = index >= 0 ? args[index + 1] : null;
if (!process.env.DATABASE_URL || (!retention && !leadId)) throw new Error('DATABASE_URL and --retention or --lead-id UUID are required');
if (leadId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leadId)) throw new Error('Invalid lead UUID');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 3000, statement_timeout: 10000 });
const client = await pool.connect();
try {
 await client.query('BEGIN');
 const leads = await client.query(`SELECT id,email_key FROM leads WHERE ($1::uuid IS NULL OR id=$1) AND (NOT $2::boolean OR created_at<now()-interval '90 days') FOR UPDATE`, [leadId,retention]);
 const ids = leads.rows.map(row => row.id);
 const keys = leads.rows.map(row => `lead:${row.email_key}`);
 await client.query("DELETE FROM analytics_events WHERE source='server' AND event_id IN (SELECT attempt_id FROM submission_receipts WHERE lead_id=ANY($1::uuid[]))", [ids]);
 await client.query('DELETE FROM reports WHERE id IN (SELECT report_id FROM submission_receipts WHERE lead_id=ANY($1::uuid[]))', [ids]);
 await client.query('DELETE FROM rate_limit_buckets WHERE bucket_key=ANY($1::text[])', [keys]);
 const removed = await client.query('DELETE FROM leads WHERE id=ANY($1::uuid[])', [ids]);
 let reports = 0; let sessions = 0; let buckets = 0;
 if (retention) {
  const reportResult = await client.query("DELETE FROM reports WHERE created_at<now()-interval '7 days' AND ($1::uuid IS NULL OR id IN (SELECT report_id FROM submission_receipts WHERE lead_id=$1))", [leadId]); reports = reportResult.rowCount;
  if (!leadId) {
   sessions = (await client.query("DELETE FROM analytics_sessions WHERE created_at<now()-interval '30 days'")).rowCount;
   await client.query("DELETE FROM analytics_events WHERE created_at<now()-interval '30 days'");
   await client.query("DELETE FROM submission_receipts WHERE created_at<now()-interval '90 days'");
   buckets = (await client.query('DELETE FROM rate_limit_buckets WHERE expires_at<now()')).rowCount;
  }
 }
 await client.query('COMMIT');
 console.log(JSON.stringify({ leads: removed.rowCount, reports, sessions, buckets }));
} catch(error) { await client.query('ROLLBACK'); throw error; }
finally { client.release(); await pool.end(); }
