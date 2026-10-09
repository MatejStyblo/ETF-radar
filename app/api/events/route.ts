import { NextResponse } from 'next/server';
import { eventSchema, recordEvent, revokeSession } from '@/lib/db/analytics';
import { readJson, checkOrigin, HttpError } from '@/lib/security/http';
import { requireConfig } from '@/lib/security/config';
import { signSession } from '@/lib/security/analytics';
export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store' };
function failed(error: unknown) { return NextResponse.json({ ok: false, message: error instanceof HttpError ? error.message : 'Měření je nyní nedostupné.' }, { status: error instanceof HttpError ? error.status : 503, headers }); }
export async function POST(request: Request) {
 try {
  const parsed = eventSchema.safeParse(await readJson(request, 2048));
  if (!parsed.success) throw new HttpError(422, 'Neplatná událost nebo chybějící souhlas.');
  const id = await recordEvent(parsed.data, request);
  const response = NextResponse.json({ ok: true }, { headers });
  response.cookies.set('etf_analytics', signSession(id), { httpOnly: true, sameSite: 'lax', secure: requireConfig().origin.startsWith('https:'), path: '/', maxAge: 1800 });
  return response;
 } catch(error) { return failed(error); }
}
export async function DELETE(request: Request) {
 try {
  checkOrigin(request);
  await revokeSession(request);
  const response = NextResponse.json({ ok: true }, { headers });
  response.cookies.set('etf_analytics', '', { httpOnly: true, sameSite: 'lax', secure: requireConfig().origin.startsWith('https:'), path: '/', maxAge: 0 });
  return response;
 } catch(error) { return failed(error); }
}
