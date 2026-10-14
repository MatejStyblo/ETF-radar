import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { dashboardAccessAllowed } from '@/lib/dashboard/access';
import { getDashboardData, parseDashboardFilter } from '@/lib/dashboard/data';
import type { DashboardFilter } from '@/lib/dashboard/types';
import './dashboard.css';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata: Metadata = {
  title: 'Přehled ETF Radar',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

type QueryParams = Record<string, string | string[] | undefined>;
const number = (value: number) => new Intl.NumberFormat('cs-CZ').format(value);
function dashboardUrl(filter: DashboardFilter, page = filter.page) {
  return `/dashboard?${new URLSearchParams({ range: filter.range, variant: filter.variant, page: String(page) })}`;
}
function Metric({ label, value, note, id }: { label: string; value: string; note: string; id: string }) {
  return <div className="dash-metric"><dt>{label}</dt><dd><span data-testid={id}>{value}</span><small>{note}</small></dd></div>;
}
const timestamp = (value: string) => new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value));
const dayLabel = (value: string) => new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value));
const missing = (value: string) => value || 'Neuvedeno';
const pair = (first: string | null, second: string | null) => first === 'unavailable' || second === 'unavailable'
  ? 'Dvojice nedostupná (snapshot chybí či expiroval)'
  : first && second ? `${first.toUpperCase()} / ${second.toUpperCase()}` : 'Dvojice nezaznamenána';
function DataTable({ label, columns, children, empty }: { label: string; columns: string[]; children: ReactNode; empty: boolean }) {
  return <div className="dash-table-scroll" role="region" aria-label={`${label} — vodorovně posuvná tabulka`} tabIndex={0}>
    <table><caption>{label}</caption><thead><tr>{columns.map(column => <th scope="col" key={column}>{column}</th>)}</tr></thead>
    <tbody>{empty ? <tr><td colSpan={columns.length} className="dash-empty">Pro tento filtr nejsou k dispozici žádné záznamy.</td></tr> : children}</tbody>
    </table>
  </div>;
}
export default async function DashboardPage({ searchParams }: { searchParams: Promise<QueryParams> }) {
  if (!dashboardAccessAllowed(await headers())) notFound();
  const requestedFilter = parseDashboardFilter(await searchParams);
  let data: Awaited<ReturnType<typeof getDashboardData>>;
  try {
    data = await getDashboardData(requestedFilter);
  } catch {
    return <main id="main" className="dashboard"><header className="dash-header"><Link href="/" prefetch={false} className="brand">ETF Radar</Link><span className="dash-local">Pouze lokální přehled</span></header><section className="dash-cover"><h1>Přehled ETF Radar</h1><div className="dash-unavailable" role="alert"><h2>Data jsou nyní nedostupná</h2><p>Databázi se nepodařilo načíst. Čísla nezobrazujeme, protože by nebyla ověřená. Zkontrolujte lokální databázi a migrace a zkuste přehled znovu načíst.</p></div><div className="dash-actions"><a href={dashboardUrl(requestedFilter)}>Načíst znovu</a><Link href="/" prefetch={false}>Otevřít landing page</Link></div></section></main>;
  }
  const filter = data.filter;
  const overview = data.overview;
  const funnelMax = Math.max(1, ...data.funnel.map(step => step.sessions));
  const dailyMax = Math.max(1, ...data.daily.map(day => day.measuredSessions));
  const totalPages = Math.max(1, Math.ceil(data.leadTotal / 50));
  return <main id="main" className="dashboard">
    <header className="dash-header"><Link href="/" prefetch={false} className="brand">ETF <span className="brand-light">Radar</span></Link><span className="dash-local">Pouze lokální přehled</span></header>
    <section className="dash-cover" aria-labelledby="dashboard-title">
      <p className="eyebrow">Měření &amp; uložené kontakty</p><h1 id="dashboard-title">Přehled ETF Radar</h1>
      <p>Skutečně uložená data, ne odhad celé návštěvnosti.</p>
      <div className="dash-actions"><a href={dashboardUrl(filter)}>Načíst znovu</a><a href={`/dashboard/export?${new URLSearchParams({ range: filter.range, variant: filter.variant })}`}>Export kontaktů CSV</a><Link href="/" prefetch={false}>Otevřít landing page</Link></div>
    </section>
    <form className="dash-filters" action="/dashboard" method="get">
      <label htmlFor="dash-range">Období<select id="dash-range" name="range" defaultValue={filter.range}><option value="7">Posledních 7 dní</option><option value="30">Posledních 30 dní</option><option value="90">Posledních 90 dní</option><option value="all">Všechna dostupná data</option></select></label>
      <label htmlFor="dash-variant">Reklamní varianta<select id="dash-variant" name="variant" defaultValue={filter.variant}><option value="all">Všechny varianty</option><option value="a">Varianta A</option><option value="b">Varianta B</option></select></label>
      <button type="submit">Použít filtry</button>
    </form>
    <aside className="dash-notice" aria-label="Omezení měření"><strong>Co zde měříme</strong><p>Relace se měří jen se souhlasem. Relace nejsou unikátní lidé a přehled nezná všechny návštěvníky. Kontakty a úspěšná uložení zahrnují i neměřené záznamy; nesmí se dělit pouze měřenými relacemi.</p></aside>
    <section aria-labelledby="overview-title" className="dash-section"><h2 id="overview-title">Přehled období</h2><dl className="dash-metrics">
      <Metric label="Měřené relace" value={number(overview.measuredSessions)} note="Způsobilá landing kohorta se souhlasem." id="measured-sessions" />
      <Metric label="Unikátní kontakty" value={number(overview.uniqueLeads)} note="Odlišné kontakty s uložením v období; ne ověření lidé." id="unique-leads" />
      <Metric label="Úspěšná uložení" value={number(overview.captures)} note="Potvrzené captures včetně opakovaných." id="captures" />
      <Metric label="Nové kontakty / měřené relace" value={overview.measuredSessions ? `${number(100 * overview.measuredNewLeads / overview.measuredSessions)} %` : '—'} note="Primární metrika: nové měřené leady / stejná landing kohorta. Více emailů jedné relace může přesáhnout 100 %." id="new-lead-conversion-pct" />
      <Metric label="Konverze měřených relací" value={overview.conversionPct === null ? '—' : `${number(overview.conversionPct)} %`} note="Relace s měřeným úspěšným uložením / stejná landing kohorta. Bez jmenovatele nelze určit." id="conversion-pct" />
      <Metric label="Konvertující relace" value={number(overview.convertedSessions)} note="Alespoň jedno měřené úspěšné uložení ve stejné kohortě." id="converted-sessions" />
      <Metric label="Nové měřené kontakty" value={number(overview.measuredNewLeads)} note="Nové captures připsané způsobilým relacím." id="measured-new-leads" />
      <Metric label="Marketingové kontakty" value={number(overview.marketingLeads)} note="Z kontaktů v období: souhlas uložený při založení." id="marketing-leads" />
      <Metric label="Neměřená uložení" value={number(overview.unmeasuredCaptures)} note="Mimo způsobilou kohortu, nejen odmítnutí souhlasu." id="unmeasured-captures" />
    </dl></section>
    <section aria-labelledby="visits-title" className="dash-section">
      <h2 id="visits-title">Návštěvy a kontaktní formulář</h2>
      <p className="dash-description">Jedna návštěva znamená měřenou relaci se souhlasem, která končí po 30 minutách neaktivity. Obnovení stránky ve stejné relaci se nepočítá znovu. Nejde o počet unikátních lidí.</p>
      <dl className="dash-metrics">
        <Metric label="Měřené návštěvy" value={number(data.formOutcomes.sessions)} note="Stejná landing kohorta jako v tabulce zdrojů." id="traffic-visits" />
        <Metric label="Zahájili formulář" value={number(data.formOutcomes.started)} note="Návštěvy se zaznamenaným vstupem do formuláře." id="form-started" />
        <Metric label="Odeslali a uložili kontakt" value={number(data.formOutcomes.submitted)} note="Návštěvy s potvrzeným zápisem v databázi, každá nejvýše jednou." id="form-submitted" />
        <Metric label="Zatím bez odeslání" value={number(data.formOutcomes.withoutSubmission)} note={`Z toho ${number(data.formOutcomes.activeWithoutSubmission)} stále aktivních; mohou ještě odeslat.`} id="form-not-submitted" />
        <Metric label="Zahájili, zatím neodeslali" value={number(data.formOutcomes.startedWithoutSubmission)} note="Podmnožina návštěv bez uložení kontaktu; zahrnuje aktivní návštěvy." id="form-started-not-submitted" />
        <Metric label="Dokončení formuláře z návštěv" value={data.formOutcomes.sessions ? `${number(100 * data.formOutcomes.submitted / data.formOutcomes.sessions)} %` : '—'} note="Návštěvy s uložením / měřené návštěvy stejné kohorty." id="traffic-conversion" />
      </dl>
      <h3>Odkud návštěvy přicházejí</h3>
      <p className="dash-description">Zdroj z UTM, jinak doména odkazujícího webu, pokud ji prohlížeč předá. Ukládá se při prvním měřeném příchodu relace. Neuvedeno znamená neznámý zdroj, nikoliv prokázanou přímou návštěvu. Starší zdroje se zpětně nedoplňují.</p>
      <DataTable label="Návštěvy a formuláře podle zdroje" columns={['Zdroj', 'Médium', 'Kampaň', 'Varianta', 'Návštěvy', 'Zahájili formulář', 'Uložili kontakt', 'Zatím bez odeslání', 'Z toho aktivní', 'Dokončení']} empty={!data.traffic.length}>
        {data.traffic.map((row, index) => <tr key={index}><th scope="row">{missing(row.source)}</th><td>{missing(row.medium)}</td><td>{missing(row.campaign)}</td><td>{row.variant.toUpperCase()}</td><td>{number(row.sessions)}</td><td>{number(row.started)}</td><td>{number(row.submitted)}</td><td>{number(row.withoutSubmission)}</td><td>{number(row.activeWithoutSubmission)}</td><td>{row.sessions ? `${number(100 * row.submitted / row.sessions)} %` : '—'}</td></tr>)}
      </DataTable>
      <p className="dash-description">Bez odeslání neznamená prokázaný odchod. Čísla platí k načtení přehledu; mohou se změnit dalším odesláním, expirací či odvoláním souhlasu. Nezahrnují návštěvníky bez souhlasu ani ztracené události.</p>
    </section>
    <section aria-labelledby="funnel-title" className="dash-section">
      <div className="dash-section-head"><h2 id="funnel-title">Dosažení kroků</h2><span>Měřená landing kohorta</span></div>
      <p className="dash-description">Každý krok počítá odlišné relace v téže kohortě, nikoli počet eventů. Kroky nejsou nutně klesající ani v tomto pořadí: výsledek nebo nabídka se mohou zobrazit automaticky.</p>
      {data.funnel.length ? <ol className="dash-funnel">{data.funnel.map(step => <li key={step.name}><div><span>{step.label}</span><strong>{number(step.sessions)}</strong></div><meter min={0} max={funnelMax} value={step.sessions} aria-label={`${step.label}: ${number(step.sessions)} relací`}/></li>)}</ol> : <p className="dash-empty">Pro tento filtr nejsou dostupné měřené kroky.</p>}
    </section>
    <section aria-labelledby="daily-title" className="dash-section">
      <div className="dash-section-head"><h2 id="daily-title">Denní vývoj</h2><span>Kalendářní dny UTC</span></div>
      <p className="dash-description">Relace podle prvního landing eventu v období; kontakty a uložení podle času jejich uložení. Stejný den proto neznamená stejnou skupinu návštěv.</p>
      <DataTable label="Denní vývoj" columns={['Den (UTC)', 'Měřené relace', 'Unikátní kontakty', 'Úspěšná uložení']} empty={!data.daily.length}>
        {data.daily.map(day => <tr key={day.day}><th scope="row">{dayLabel(day.day)}</th><td><div className="dash-daily-bar"><span>{number(day.measuredSessions)}</span><meter min={0} max={dailyMax} value={day.measuredSessions} aria-hidden="true" /></div></td><td>{number(day.uniqueLeads)}</td><td>{number(day.captures)}</td></tr>)}
      </DataTable>
    </section>
    <section aria-labelledby="campaign-title" className="dash-section">
      <div className="dash-section-head"><h2 id="campaign-title">Kampaně a atribuce</h2><span>Pouze úspěšná uložení</span></div>
      <p className="dash-description">Atribuce z uložených captures, včetně neměřených. Jde o počty uložení; konverzi měřených návštěv podle prvního zdroje ukazuje sekce výše. Neuvedeno znamená chybějící atribuci, ne přímou návštěvu.</p>
      <DataTable label="Uložení podle kampaní" columns={['Zdroj', 'Médium', 'Kampaň', 'Varianta', 'Uložení', 'Nové kontakty']} empty={!data.campaigns.length}>
        {data.campaigns.map((campaign, index) => <tr key={index}><td>{missing(campaign.source)}</td><td>{missing(campaign.medium)}</td><td>{missing(campaign.campaign)}</td><td>{missing(campaign.variant).toUpperCase()}</td><td>{number(campaign.captures)}</td><td>{number(campaign.newLeads)}</td></tr>)}
      </DataTable>
    </section>
    <div className="dash-pair-grid">
      <section aria-labelledby="comparison-title" className="dash-section">
        <h2 id="comparison-title">Měřené výběry dvojic</h2>
        <p className="dash-description">Dvojice skutečně zaznamenané v událostech výběru ETF, jen v měřené kohortě. Opakovaný výběr jedné relace může zvýšit počet výběrů.</p>
        <DataTable label="Dvojice z událostí" columns={['Dvojice ETF', 'Výběry', 'Relace']} empty={!data.comparisons.length}>
          {data.comparisons.map((comparison, index) => <tr key={index}><th scope="row">{pair(comparison.first, comparison.second)}</th><td>{number(comparison.selections)}</td><td>{number(comparison.sessions)}</td></tr>)}
        </DataTable>
      </section>
      <section aria-labelledby="submitted-title" className="dash-section">
        <h2 id="submitted-title">Dvojice v uložených reportech</h2>
        <p className="dash-description">Snapshot při úspěšném uložení reportu, nikoli všechny veřejné výběry. Zahrnuje i captures bez měření.</p>
        <DataTable label="Dvojice z reportů" columns={['Dvojice ETF', 'Uložení']} empty={!data.submittedComparisons.length}>
          {data.submittedComparisons.map((comparison, index) => <tr key={index}><th scope="row">{pair(comparison.first, comparison.second)}</th><td>{number(comparison.captures)}</td></tr>)}
        </DataTable>
      </section>
    </div>
    <aside className="dash-notice" aria-label="Historická dostupnost dat"><strong>Historické mezery nejsou nuly</strong><p>Starší události nemají uloženou dvojici ETF a nelze ji zpětně odvodit. Po expiraci nebo výmazu reportu není jeho dvojice dostupná; taková uložení jsou označená zvlášť. Retence, odvolaný souhlas a ztracené eventy ovlivňují dostupnou historii. „Všechna data“ znamená pouze dosud uchované záznamy, nikoli celoživotní provoz.</p></aside>
    <section aria-labelledby="contacts-title" className="dash-section">
      <div className="dash-section-head"><h2 id="contacts-title">Kontakty</h2><span>{number(data.leadTotal)} kontaktů · nejvýše 50 na stránku</span></div>
      <p className="dash-description">Odlišné kontakty s uložením ve zvoleném období a variantě, včetně opakovaného uložení existujícího kontaktu. Čas založení kontaktu je v UTC. Marketing je uložená volba, nikoli ověření emailu či povolení skutečné rozesílky.</p>
      <DataTable label="Uložené kontakty" columns={['Email', 'Založeno (UTC)', 'Marketing', 'Uložení v období']} empty={!data.leads.length}>
        {data.leads.map(lead => <tr key={lead.id}><th scope="row" className="dash-email">{lead.email}</th><td><time dateTime={lead.createdAt}>{timestamp(lead.createdAt)}</time></td><td>{lead.marketingConsent ? 'Ano' : 'Ne'}</td><td>{number(lead.captures)}</td></tr>)}
      </DataTable>
      <nav className="dash-pagination" aria-label="Stránkování kontaktů"><span>Strana {number(filter.page)} z {number(totalPages)}</span><div>{filter.page > 1 && <a href={dashboardUrl(filter, filter.page - 1)}>Předchozí stránka</a>}{filter.page < totalPages && <a href={dashboardUrl(filter, filter.page + 1)}>Další stránka</a>}</div></nav>
    </section>
    <section aria-labelledby="events-title" className="dash-section">
      <div className="dash-section-head"><h2 id="events-title">Posledních 100 událostí</h2><span>Zobrazeno {number(data.events.length)} · nejnovější první</span></div>
      <p className="dash-description">Omezený diagnostický výpis měřené kohorty, nikoli celkový počet eventů. client / server označuje původ události. Nezaznamenaná dvojice neznamená, že návštěvník ETF nevybral.</p>
      <DataTable label="Nejnovější měřené události" columns={['Čas (UTC)', 'Událost', 'Původ', 'Varianta', 'Dvojice ETF']} empty={!data.events.length}>
        {data.events.map((event, index) => <tr key={index}><td><time dateTime={event.time}>{timestamp(event.time)}</time></td><td><code>{event.name}</code></td><td>{event.source}</td><td>{missing(event.variant).toUpperCase()}</td><td>{pair(event.first, event.second)}</td></tr>)}
      </DataTable>
    </section>
    <footer className="dash-footer"><p>Načteno <time dateTime={data.generatedAt}>{timestamp(data.generatedAt)} UTC</time>. Bez automatického obnovování.</p><p>Lokální testovací projekt · kontakty a CSV obsahují emaily. Nesdílejte je veřejně.</p></footer>
  </main>;
}
