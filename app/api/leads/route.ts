import { validSession, recordLeadSuccess } from '@/lib/db/analytics';
import { NextResponse } from 'next/server';
import { readJson, HttpError } from '@/lib/security/http';
import { leadSchema } from '@/lib/validation/schemas';
import { requireConfig } from '@/lib/security/config';
import { captureLead, CaptureError } from '@/lib/db/leads';
export const runtime = 'nodejs';
export async function POST(request: Request) {
 try {
  const config = requireConfig();
  const parsed = leadSchema.safeParse(await readJson(request));
  if (!parsed.success) return NextResponse.json({ ok: false, message: 'Zkontrolujte zadané údaje.' }, { status: 422 });
  let sessionId: string | null = null;
  const analyticsConsent = request.headers.get('X-Analytics-Consent') === 'true';
  if (analyticsConsent) try { sessionId = await validSession(request); } catch { /* Analytics must not block capture. */ }
  const result = await captureLead(parsed.data, sessionId);
  if (analyticsConsent && sessionId) try { await recordLeadSuccess(parsed.data.attemptId, sessionId, result.isNewLead); } catch { /* Durable lead success is independent of measurement. */ }
  const response = NextResponse.json({ ok: true, reportUrl: '/report' }, { headers: { 'Cache-Control': 'private, no-store' } });
  response.cookies.set('etf_report', result.token, { httpOnly: true, sameSite: 'lax', secure: config.origin.startsWith('https:'), path: '/report', maxAge: 86400 });
  return response;
 } catch (error) { if (error instanceof CaptureError || error instanceof HttpError) return NextResponse.json({ ok: false, message: error.message, ...(error instanceof CaptureError && error.code ? { code: error.code } : {}) }, { status: error.status }); return NextResponse.json({ ok: false, message: 'Uložení je nyní nedostupné. Zkuste to později.' }, { status: 503 }); }
}
