import { cookies } from 'next/headers';
import Link from 'next/link';
import { getReport } from '@/lib/db/leads';
import { ReportView } from '@/components/report/report-view';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Vaše ETF srovnání | ETF Radar', robots: { index: false, follow: false } };
export default async function ReportPage() {
 const token = (await cookies()).get('etf_report')?.value ?? '';
 let report;
 try {
  report = await getReport(token);
 } catch {
  return <main id="main" className="report-state"><h1>Report je nyní nedostupný</h1><p>Úložiště neodpovídá. Obnovte stránku později; tato chyba neznamená, že se váš předchozí pokus neuložil.</p><Link href="/">Zpět ke srovnání</Link></main>;
 }
 if (report) return <main id="main"><ReportView report={report} /></main>;
 return <main id="main" className="report-state"><h1>Přístup k reportu chybí nebo vypršel</h1><p>Přístup platí 24 hodin ve stejném prohlížeči. Vytvořte nové srovnání nebo otevřete dříve staženou kopii.</p><Link href="/">Vytvořit nové srovnání</Link></main>;
}
