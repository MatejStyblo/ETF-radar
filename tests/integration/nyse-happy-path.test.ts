import { randomBytes, randomUUID } from 'node:crypto';
import { afterAll, expect, test, vi } from 'vitest';
vi.mock('server-only', () => ({}));
process.env.DATABASE_URL='postgresql://postgres@127.0.0.1:55439/etf_radar_test';
process.env.APP_ORIGIN='http://localhost:3000';
process.env.LEADS_ENABLED='true';
process.env.CONTROLLER_NAME='LOCAL TEST controller';
process.env.PRIVACY_CONTACT='test@example.invalid';
process.env.REPORT_TOKEN_SECRET=randomBytes(32).toString('hex');
process.env.LEAD_DEDUPE_SECRET=randomBytes(32).toString('hex');
const { POST: leadPost }=await import('@/app/api/leads/route');
const { POST: eventPost }=await import('@/app/api/events/route');
const { GET: download }=await import('@/app/report/download/route');
const { getPool, closePool }=await import('@/lib/db/pool');
const { getReport }=await import('@/lib/db/leads');
const attemptId=randomUUID(), email=`nyse-${randomUUID()}@example.invalid`;
let sessionId: string | undefined;
function request(body:unknown,cookie=''){return new Request('http://localhost:3000/api/leads',{method:'POST',headers:{origin:'http://localhost:3000','content-type':'application/json',cookie,'X-Analytics-Consent':'true'},body:JSON.stringify(body)});}
afterAll(async()=>{
 const db=getPool();
 await db.query("DELETE FROM rate_limit_buckets WHERE bucket_key IN (SELECT 'lead:'||email_key FROM leads WHERE email=$1)",[email]);
 await db.query('DELETE FROM reports WHERE id IN (SELECT report_id FROM submission_receipts WHERE attempt_id=$1)',[attemptId]);
 await db.query('DELETE FROM submission_receipts WHERE attempt_id=$1',[attemptId]);
 await db.query('DELETE FROM leads WHERE email=$1',[email]);
 if(sessionId){await db.query('DELETE FROM rate_limit_buckets WHERE bucket_key=$1',[`analytics:${sessionId}`]);await db.query('DELETE FROM analytics_sessions WHERE id=$1',[sessionId]);}
 await closePool();
});
test('NYSE selection and lead create a persisted private snapshot and downloadable differing-index report',async()=>{
 expect((await getPool().query('SELECT current_database() AS name')).rows).toEqual([{name:'etf_radar_test'}]);
 const event={eventId:randomUUID(),name:'landing_view',adVariant:'a',consent:true};
 const landing=await eventPost(request(event));expect(landing.status).toBe(200);
 const cookie=landing.headers.get('set-cookie')!.split(';')[0];sessionId=cookie.split('=')[1].split('.')[0];
 const selected={...event,eventId:randomUUID(),name:'etf_selected',etfIds:['stxf','stxg']};
 expect((await eventPost(request(selected,cookie))).status).toBe(200);
 expect((await getPool().query('SELECT etf_ids FROM analytics_events WHERE event_id=$1',[selected.eventId])).rows).toEqual([{etf_ids:['stxf','stxg']}]);
 const body={email,marketingConsent:false,website:'',attemptId,scenario:{initial:100000,monthly:3000,years:20,grossReturnPct:5},etfIds:['stxf','stxg'],attribution:{ad_variant:'a'}};
 const response=await leadPost(request(body,cookie));expect(response.status).toBe(200);
 expect(await response.json()).toEqual({ok:true,reportUrl:'/report'});
 const token=/etf_report=([^;]+)/.exec(response.headers.get('set-cookie')!)![1];
 const stored=(await getPool().query('SELECT r.snapshot FROM reports r JOIN submission_receipts s ON s.report_id=r.id JOIN leads l ON l.id=s.lead_id WHERE s.attempt_id=$1 AND l.email=$2',[attemptId,email])).rows[0].snapshot;
 expect(stored.etfs.map((f:{id:string;exchange:string})=>[f.id,f.exchange])).toEqual([['stxf','NYSE'],['stxg','NYSE']]);
 expect(await getReport(token)).toEqual(stored);expect(JSON.stringify(stored)).not.toContain(email);
 expect(stored.assumptions.join(' ')).toContain('Odlišné indexy');
 const downloaded=await download(new Request('http://localhost:3000/report/download',{headers:{cookie:`etf_report=${token}`}}));expect(downloaded.status).toBe(200);
 const html=await downloaded.text();expect(html).toContain('Odlišné indexy');expect(html).toContain('STXF');expect(html).toContain('STXG');expect(html).not.toContain(email);
 expect((await getPool().query('SELECT source,name FROM analytics_events WHERE event_id=$1',[attemptId])).rows).toEqual([{source:'server',name:'lead_submit_success'}]);
});
