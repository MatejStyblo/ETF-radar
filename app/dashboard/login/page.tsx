import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { dashboardLoginAvailable } from '@/lib/dashboard/auth';
import { dashboardAccessAllowed } from '@/lib/dashboard/access';
import { DashboardLoginForm } from '@/components/dashboard/login-form';
import { Brand } from '@/components/ui/brand';
export const dynamic = 'force-dynamic';
export const metadata = {title:'Přihlášení do dashboardu — ETF Radar',robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default async function LoginPage() {
 const requestHeaders=await headers();
 if (!dashboardLoginAvailable(requestHeaders)) notFound();
 if (dashboardAccessAllowed(requestHeaders)) redirect('/dashboard');
 return <main id="main" className="dashboard-login"><Brand/><h1>Váš přehled ETF Radar</h1><p>Chráněný přístup ke kontaktům a návštěvnosti. Přihlášení platí 8 hodin.</p><DashboardLoginForm/><Link href="/">Zpět ke srovnání</Link></main>;
}
