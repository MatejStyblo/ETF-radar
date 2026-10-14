# ETF Radar

Česká mobilní landing page pro **zadání B — porovnání ETF a získání kontaktu**. Návštěvník nejprve získá vlastní výpočet, potom může uložit testovací email a okamžitě stáhnout osobní PDF. Jde o funkční výběrové demo s reálnou databází, nikoli spuštěnou reklamní kampaň.

- **Web:** [etf-radar-dun.vercel.app](https://etf-radar-dun.vercel.app)
- **Repozitář:** [MatejStyblo/ETF-radar](https://github.com/MatejStyblo/ETF-radar), výchozí i produkční větev `devel`.
- **Reklamy:** [texty, cílení a hotové grafiky](docs/ADS.md).
- **Ověření:** [aktuální závěrečný průchod](docs/HANDOFF.md), [historie testů](docs/TESTING.md).

## Vyzkoušení za dvě minuty

1. Otevřete web, vyberte dva fondy a upravte počáteční vklad, měsíční příspěvek, horizont nebo hypotetický výnos. Souhlas s měřením není nutný.
2. Prohlédněte výsledek, baseline bez průběžných nákladů a náhled horizontů reportu.
3. Zadejte **syntetický email**, například `radar@example.invalid`. Marketing je volitelný a předem nezaškrtnutý; demo nic nerozesílá.
4. Po skutečném databázovém zápisu se otevře report. Stáhněte PDF, HTML nebo použijte tisk. **Report nezasíláme emailem.**

Dashboard `/dashboard` vyžaduje soukromé heslo správce; přístupové údaje nejsou součástí veřejného repozitáře. Odevzdání ani testování nevyžaduje zadání osobních údajů skutečných návštěvníků.

## Produkt a cílová skupina

Čeští drobní investoři přibližně 25–45 let přicházející z mobilní reklamy potřebují rychle porozumět rozdílu mezi malou roční sazbou a dlouhodobým dopadem nákladů. Tento segment je pracovní hypotéza, ne výsledek uživatelského výzkumu.

ETF Radar porovnává průběžné náklady a vlastnosti fondů, nikoli jejich očekávanou výkonnost. Má umožnit vlastní výpočet během několika okamžiků, bez falešných referencí, garantovaných úspor a nákupních doporučení.

## Konverzní cesta a pořadí sekcí

**Reklama → veřejné srovnání → vlastní scénář → okamžitý výsledek → náhled reportu → email → databáze → report ke stažení.**

1. Kompaktní hero navazuje na reklamní slib; hlavní CTA vede ke kalkulačce.
2. Výběr fondů ukazuje přesný listing, náklady a rozdíly strategií před formulářem.
3. Vlastní vstupy dělají výsledek relevantní konkrétnímu návštěvníkovi.
4. Výsledek a graf okamžitě ukazují zůstatky, baseline a izolovaný dopad nákladů.
5. Náhled reportu ukáže čísla pro 5, 10, 20 a 30 let ještě před kontaktem. Teprve potom nabídneme plný PDF report: podrobnosti fondů, roční tabulku, zdroje, metodiku a checklist před nákupem.
6. Metodika a soukromí umožňují kontrolu důvěryhodnosti; hlavní finanční omezení jsou zároveň přímo u výsledků.

Na desktopu jsou vstupy a výstupy vedle sebe, na mobilu pod sebou. Spodní mobilní navigace usnadňuje návrat mezi sekcemi. Nastavení cookies zůstává v patičce. Profesionální tmavý design používá tyrkysovou jako akční barvu a tabulární čísla; žádná velká hero fotografie neoddaluje produkt.

## Dvě reklamy

[Varianta A](https://etf-radar-dun.vercel.app/?ad_variant=a&utm_source=meta&utm_medium=paid_social&utm_campaign=costs_v1&utm_content=tool_a): **„Malý roční poplatek. Jaký rozdíl udělá za 20 let?“** Motivace: porozumět nákladům v čase.

[Varianta B](https://etf-radar-dun.vercel.app/?ad_variant=b&utm_source=meta&utm_medium=paid_social&utm_campaign=compare_v1&utm_content=tool_b): **„ETF na NYSE nejsou všechna stejná.“** Motivace: snadná orientace ve fondech.

Parametr `ad_variant` mění headline i CTA; výpočet a report zůstávají stejné. Kompletní texty, cílení, grafiky a předpoklady jsou v [ADS](docs/ADS.md). Žádná reklama nebyla spuštěna.

## Skutečná data a rozhodnutí o NYSE

Katalog je datovaný snapshot `2026-10-13.1`, nikoli živý feed. [Evidence jednotlivých údajů](docs/DATA_SOURCES.md), [ověření hlavního NYSE](docs/NYSE_VERIFICATION.md).

| Fond | Roční sazba v katalogu | Listing | Role |
| --- | --- | --- | --- |
| STXF — Strive 500 ETF | Expense Ratio 0,0545 % | NYSE | Hlavní výběr |
| STXG — Strive 1000 Growth ETF | Expense Ratio 0,18 % | NYSE | Hlavní výběr |
| SPY — SPDR S&P 500 ETF Trust | Gross Expense Ratio 0,0945 % | NYSE Arca | Oddělená reference |
| IVV — iShares Core S&P 500 ETF | Expense Ratio 0,03 % | NYSE Arca | Oddělená reference |
| CSPX — iShares Core S&P 500 UCITS ETF USD (Acc) | TER 0,07 % | London Stock Exchange | Evropský UCITS doplněk |

Zadání výslovně požaduje NYSE, proto výchozí STXF/STXG mají listing na hlavním NYSE. NYSE Arca nezaměňujeme s NYSE; evropský doplněk neoznačujeme jako NYSE fond. Výchozí dvojice sleduje odlišné indexy: Bloomberg US Large Cap a Bloomberg US 1000 Growth Total Return. Srovnání izoluje pouze náklady.

Zdroje jsou primárně emitentské stránky, factsheety a prospekty; dostupnost u konkrétního českého brokera a příslušný PRIIPs KID nebyly ověřeny. Americké fondy nemusí být českému retailu dostupné. UCITS sám dostupnost nezaručuje. Neověřené AUM a další metadata zůstávají nedostupné místo vymyšlených hodnot. Obchodní měna není měnová expozice.

## Finanční model

Čisté testované funkce jsou v `lib/calculations/project.ts`. Pro roční hrubý výnos `r` a roční náklad `c`, obojí jako desetinné sazby:

```text
q = ((1 + r) × (1 − c))^(1/12)
V dalšího měsíce = V × q + měsíční příspěvek
```

Příspěvky přicházejí na konci měsíce; baseline má `c = 0`. Distribuce jsou hypoteticky reinvestované před zdaněním. Rozdíl proti baseline zahrnuje náklady i ušlé složené zhodnocení. Stejný pevný hrubý výnos neslibuje stejné skutečné výnosy či riziko. Model nezahrnuje daně, broker/FX poplatky, spread, tracking difference, inflaci a kolísání výnosů. Kč jsou modelová jednotka, bez FX předpovědi.

## Analytika a očekávaná konverze

First-party `/api/events` ukládá allowlisted události do PostgreSQL **až po opt-in**. Měří příchod, CTA, zahájení srovnání, změny ETF/vstupů, výsledky, nabídku, formulář, pokus/úspěch/chybu a zobrazení/stažení reportu. Atribuce zahrnuje validované UTM a variantu reklamy; neposíláme email ani částky investice do analytiky. Úspěch leadu navazuje na databázový commit, nikoli pouze kliknutí. Detail: [ANALYTICS](docs/ANALYTICS.md).

Primární metrika: **nové validní uložené leady / způsobilé měřené landing relace stejné kohorty**. Relace končí po 30 minutách neaktivity a není unikátní člověk. Deduplikace eventů používá UUID; kontaktu HMAC emailového klíče; opakovaného odeslání attempt UUID. Validní email znamená syntaktickou validaci, ne ověření identity.

**Očekávaných 2–5 % je plánovací hypotéza**, nikoli naměřený výsledek ani externí benchmark. Předpokládá relevantní mobilní publikum, shodu reklamy s hero a funkční report. Kampaň neběžela; CPL ani návratnost neuvádíme. Měřená kohorta nezahrnuje odmítnuté měření; všechny leady nelze dělit pouze consented návštěvami. Boty a testovací relace je před kampaní nutné identifikovat průhlednými pravidly.

### Tři prioritní A/B hypotézy

Pořadí je odhad dopadu, nikoli změřený uplift. První hypotéza míří přímo na motivaci ke kontaktu, druhá na začátek práce a třetí na dokončení formuláře.

| Priorita | Hypotéza | Primární metrika |
| --- | --- | --- |
| 1 | Konkrétní nabídka „scénáře + checklist“ získá více kontaktů než obecné „uložit výsledek“. | Nové leady / způsobilé relace |
| 2 | Viditelné selektory na první mobilní obrazovce zvýší zahájení oproti hero s CTA nad produktem. | Relace se zahájením / způsobilé relace; lead rate jako guardrail |
| 3 | Skutečný náhled horizontů zvýší dokončení formuláře proti pouhému seznamu obsahu reportu. | Relace s uložením / relace se zahájením formuláře |

Současná verze používá konkrétní nabídku a náhled, ale nedokládá tím vítězství experimentu. Před testem stanovit velikost vzorku, okno, MDE a pravidlo ukončení. Randomizace/exposure ID nejsou implementované; reklamní parametr není randomizovaný onsite A/B test. Hlídat chyby, následné použití reportu a přístupnost.

## Architektura a ochrany

Next.js 16.4.0 App Router, React 19.3.0, strict TypeScript, Tailwind 4, Lucide, React Hook Form + Zod. Serverový shell a klientská interaktivní workspace. PostgreSQL přes `pg`, migrace 001–005, bez ORM. Serverový PDF export používá `pdf-lib`, `fontkit` a lokální Noto Sans (OFL).

Server validuje vstupy, Origin, Content-Type a velikost těla. Parametrizované SQL, honeypot, DB throttling a transakční deduplikace chrání běžné chyby a zneužití. Report používá HttpOnly/SameSite cookie na 24 hodin, je no-store/noindex a neobsahuje email. Vzdálený dashboard má HTTPS, podepsanou cookie, scrypt hash hesla a sdílený limit přihlášení. Tajemství zůstávají na serveru mimo Git.

## Lokální spuštění

Použijte Node **24.x**, npm a vlastní PostgreSQL. Z kořene repozitáře:

```sh
npm ci
cp .env.example .env.local
```

V `.env.local` nastavte `DATABASE_URL`, přesný `APP_ORIGIN`, dvě nezávislá náhodná tajemství alespoň 32 znaků (`LEAD_DEDUPE_SECRET`, `REPORT_TOKEN_SECRET`), testovací `CONTROLLER_NAME`, `PRIVACY_CONTACT` a `LEADS_ENABLED=true`. Nevkládejte tajemství do `NEXT_PUBLIC_*` ani do Gitu. Dashboard je volitelný a má další proměnné popsané v [DEPLOYMENT](docs/DEPLOYMENT.md).

Nový lokální PostgreSQL lze vytvořit pomocí Dockeru; trust režim jen na vlastním loopbacku:

```sh
docker run --name etf-radar-postgres -e POSTGRES_HOST_AUTH_METHOD=trust -e POSTGRES_DB=etf_radar -p 127.0.0.1:55439:5432 -d postgres:17
docker exec etf-radar-postgres pg_isready -U postgres -d etf_radar
node --env-file=.env.local scripts/migrate.mjs
npm run dev
```

Nevytvářejte znovu existující kontejner ani databázi. Migrace spouštějte až po readiness. Data jsou v kontejneru; pro dlouhodobý vlastní provoz zajistěte volume a zálohy.

## Testování a nasazení

```sh
npm run lint
npm run typecheck
npm run test
npm run build
```

DB integrace používají **pevně oddělenou** `etf_radar_test` na portu 55439; nečtou `TEST_DATABASE_URL`. Vytvořte ji a aplikujte migrace před `npm run test:integration`. Playwright očekává běžící server (`PLAYWRIGHT_BASE_URL`), automaticky ho nespouští. Část UI testů interceptuje API; skutečnou persistenci dokládají samostatné DB/funnel testy. [Přesné výsledky a omezení](docs/HANDOFF.md).

Web je nasazen na Vercel Hobby s oddělenou Neon Free DB. Push do `devel` spouští produkční Git build. Migrace se aplikují řízeně samostatně. [Deployment runbook](docs/DEPLOYMENT.md). Bezplatné výběrové demo není spuštěná komerční kampaň; Hobby má [omezení nekomerčního použití](https://vercel.com/docs/plans/hobby).

## Známé limity

- Testovací účel potvrzen uživatelem: používat syntetické emaily, žádný skutečný marketing. Funkční privacy kontakt a provozní právní základ pro skutečné leady nejsou dodány.
- Retence 90 dnů kontakt / 7 dnů report / 30 dnů analytics je implementovaná ručním skriptem, bez automatického harmonogramu. Přístupová cookie expiruje za 24 hodin. Zálohy a hostingové logy nejsou tímto skriptem řešeny.
- Per-email/session throttling neřeší distribuovaný spam. Před kampaní doplnit přiměřenou provozní ochranu a vyloučení známých testů/botů z metrik.
- Data jsou snapshot, broker dostupnost/KID a některá metadata neověřeny. Žádná historická performance ani živé ceny.
- Email ownership, SMTP, onsite A/B randomizace a MFA dashboardu nejsou implementované. CSP má `unsafe-inline`; historie auditu eviduje dev dependency nálezy. Nejde o kompletní bezpečnostní certifikaci.

Tyto limity otevřeně oddělují funkční odevzdání od připravenosti ke skutečné placené kampani.

## Jak jsem pracoval s AI

Použil jsem Hermes/Codex jako podobný nástroj povolený zadáním, nikoli Claude Code. Instrukce v [AGENTS.md](AGENTS.md) požadují skutečné datové zdroje, hodnotu před kontaktem, čistý výpočetní model, skutečnou DB a pravdivé testy. AI pomohla s plánem, copy, zdroji, UI, backendem a testy; kontrola zahrnovala primární dokumenty, nezávislý numerický výpočet, PostgreSQL dotazy a browser průchody.

Konkrétní chyby: původní interpretace NYSE Arca vyžadovala doplnit hlavní NYSE fondy; browser test odhalil Origin chybu odhlášení; změna analytické obálky vyžadovala opravit zastaralé testy; vizuální QA odhalila kontrast a mobilní rozestupy. Poslední kontrola našla starý README na výchozí `main`, proto je výchozí `devel`. Chyby a opravy jsou v [AI_USAGE](docs/AI_USAGE.md) a [TESTING](docs/TESTING.md).

[ai-log](ai-log/README.md) obsahuje skutečné runtime exporty, ne rekonstruované rozhovory. Formát a rozsah vynechaných údajů jsou uvedeny u souborů. Není to Claude `/export`; tajemství a soukromé heslo nepublikujeme. Historické mezistavy jsou archivovány v [docs/history](docs/history/README-before-handoff.md); aktuální stav popisuje tento README a HANDOFF.
