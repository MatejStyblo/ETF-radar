import { NextRequest, NextResponse } from 'next/server';
import { getReport } from '@/lib/db/leads';
import { renderReportPdf } from '@/lib/report/pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const privateHeaders = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' };

export async function GET(request: Request) {
  try {
    const token = new NextRequest(request).cookies.get('etf_report')?.value ?? '';
    const report = await getReport(token);
    if (!report) return new NextResponse('Přístup k reportu chybí nebo vypršel.', { status: 401, headers: privateHeaders });
    const bytes = await renderReportPdf(report);
    return new NextResponse(new Uint8Array(bytes), { headers: { ...privateHeaders, 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="moje-etf-srovnani.pdf"' } });
  } catch {
    return new NextResponse('PDF je nyní nedostupné. Zkuste stažení znovu.', { status: 503, headers: privateHeaders });
  }
}
