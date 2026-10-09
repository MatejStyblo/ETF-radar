import { NextResponse, NextRequest } from 'next/server';
import { getReport } from '@/lib/db/leads';
import { renderReportHtml } from '@/lib/report/html';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Content-Type': 'text/html; charset=utf-8' };
export async function GET(request: Request) {
 try {
  const token = new NextRequest(request).cookies.get('etf_report')?.value ?? '';
  const report = await getReport(token);
  if (!report) return new NextResponse('Report chybí nebo jeho přístup vypršel. Vytvořte nové srovnání.', { status: 401, headers });
  return new NextResponse(renderReportHtml(report), { headers: { ...headers, 'Content-Disposition': 'attachment; filename="etf-radar-report.html"' } });
 } catch { return new NextResponse('Report je nyní nedostupný. Zkuste to později.', { status: 503, headers }); }
}
