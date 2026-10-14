import Link from 'next/link.js';
import type { Metadata } from 'next';
import { Brand } from '@/components/ui/brand';

export const metadata: Metadata = { title: 'Soukromí a údaje — ETF Radar', robots: { index: false, follow: true } };

export default function PrivacyPage() {
  return <>
    <header className="site-header"><Brand/><Link className="quiet-link" href="/">Zpět ke srovnání ↗</Link></header>
    <main id="main" className="privacy-page">
      <p className="eyebrow">Soukromí a údaje</p>
      <h1>Vaše údaje mají svůj účel.</h1>
      <section><h2>Testovací projekt</h2><p>ETF Radar je ukázkové řešení výběrového zadání, které připravil Matěj Stýblo. Není spuštěnou komerční službou. Pro vyzkoušení formuláře použijte syntetický email, například radar@example.invalid, a nezadávejte osobní údaje skutečných lidí.</p><p>Adresa test@example.invalid v testovací konfiguraci není funkčním kontaktem. Demo neposkytuje veřejný kontakt pro žádosti o osobní údaje. Před skutečným sběrem musí provozovatel doplnit funkční kontakt, potvrdit správce, právní základ, účel a postup vyřizování žádostí. Tato stránka popisuje technické chování dema.</p></section>
      <section><h2>Kalkulačka funguje bez emailu</h2><p>Základní srovnání a náhled reportu jsou veřejné. Nepotřebujete kontakt ani souhlas s měřením. Email a částky investice se neukládají do localStorage.</p></section>
      <section><h2>Co uloží formulář</h2><p>Server uloží email, vybrané fondy, modelové vstupy, čas odeslání, identifikátor pokusu, omezené označení reklamní kampaně a volbu marketingu. Účelem v demu je ověření skutečného ukládání kontaktů a automatického vytvoření reportu. Údaje jsou v PostgreSQL u Neonu; aplikace běží na Vercelu. Přístup do dashboardu je chráněný přihlášením.</p><p>Report se otevře ihned po uložení a můžete stáhnout PDF nebo HTML. Neposílá se emailem. Email není součástí reportu ani URL a jeho vlastnictví se neověřuje. Technická HttpOnly cookie umožňuje přístup ve stejném prohlížeči po dobu 24 hodin.</p></section>
      <section><h2>Volitelný marketing</h2><p>Checkbox je oddělený, výchozí nezaškrtnutý a není podmínkou reportu. V tomto demu pouze ukládá zvolenou hodnotu. Žádné novinky ani marketingové emaily se nerozesílají. Skutečné rozesílání vyžaduje vlastní provozní nastavení a funkční odhlášení.</p></section>
      <section><h2>Cookies a měření</h2><p>Měření se spustí až po výslovném „Povolit“. Ukládá omezené události používání, náhodné ID relace, variantu reklamy, UTM označení a případně pouze doménu odkazujícího webu. Neukládá email, částky investice, celou odkazující URL, IP adresy ani otisky zařízení do aplikační analytiky. Hosting může vést vlastní technické logy.</p><p>Měřicí relace používá HttpOnly cookie a končí po 30 minutách neaktivity. Volba měření se ukládá v prohlížeči. „Odmítnout“ nebo „Odvolat“ zastaví nové události a požádá server o odstranění relace; při výpadku sítě může být nutné opakování. Nastavení je dostupné v patičce. Kalkulačka i report fungují bez měření.</p></section>
      <section><h2>Uchování a výmaz</h2><p>Retenční skript odstraní kontakty starší 90 dnů, reporty starší 7 dnů a analytická data starší 30 dnů. V demu se spouští ručně; automatický harmonogram není nasazen. Syntetické kontakty vytvořené ověřovacími testy se po dokončení odstraňují. Skript neřeší zálohy ani hostingové logy.</p><p>Pro skutečný provoz zbývá potvrdit retenční lhůty, nastavit pravidelný výmaz a postup žádostí včetně záloh. Ukázkové nasazení není potvrzením připravenosti ke sběru skutečných kontaktů nebo placené kampani.</p></section>
      <Link className="secondary-button" href="/">Zpět ke srovnání</Link>
    </main>
  </>;
}
