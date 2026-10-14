import { NextResponse } from 'next/server';
import { z } from 'zod';
import { dashboardLoginAvailable, verifyDashboardKey, createDashboardSession, dashboardCookie } from '@/lib/dashboard/auth';
import { getPool } from '@/lib/db/pool';
import { readJson, HttpError } from '@/lib/security/http';
export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store' };
export async function POST(request: Request) {
 if (!dashboardLoginAvailable(request.headers)) return new Response('Not found', { status: 404, headers });
 try {
  const body = await readJson(request, 1024);
  const quota = await getPool().query(`INSERT INTO rate_limit_buckets(bucket_key,hits,expires_at) VALUES('dashboard-login',1,now()+interval '15 minutes')
   ON CONFLICT(bucket_key) DO UPDATE SET hits=CASE WHEN rate_limit_buckets.expires_at<now() THEN 1 ELSE rate_limit_buckets.hits+1 END,
   expires_at=CASE WHEN rate_limit_buckets.expires_at<now() THEN now()+interval '15 minutes' ELSE rate_limit_buckets.expires_at END RETURNING hits`);
  if (quota.rows[0].hits > 20) return NextResponse.json({ok:false,message:'Příliš mnoho pokusů. Zkuste to za 15 minut.'},{status:429,headers});
  const parsed = z.object({key:z.string().trim().max(128)}).strict().safeParse(body);
  if (!parsed.success || !verifyDashboardKey(parsed.data.key)) return NextResponse.json({ok:false,message:'Heslo není správné.'},{status:401,headers});
  const response = NextResponse.json({ok:true},{headers});
  response.cookies.set(dashboardCookie, createDashboardSession(), {httpOnly:true,secure:true,sameSite:'strict',path:'/dashboard',maxAge:28800});
  return response;
 } catch(error) {
  return NextResponse.json({ok:false,message:'Přihlášení je nyní nedostupné.'},{status:error instanceof HttpError?error.status:503,headers});
 }
}
