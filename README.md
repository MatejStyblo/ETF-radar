# ETF Radar

**Výhradně testovací projekt pro hiring zadání; nikdy skutečný komerční provoz ani placená kampaň.** Používejte syntetické emaily (například na `example.invalid`), nikoli osobní údaje skutečných návštěvníků.

Český mobilní nástroj pro srovnání průběžných nákladů ETF na S&P 500. Návštěvník si vybere dva fondy, zadá vlastní modelovou investici a uvidí výsledek **bez registrace a bez souhlasu s měřením**. Až potom může zadat email a získat podrobnější osobní srovnání.

**Stav k 9. říjnu 2026:** lokální aplikace, PostgreSQL persistence a společný browser → DB → report/download tok jsou ověřené; důkazy a rozsah testů jsou v [TESTING](docs/TESTING.md). Neproběhl externí deployment ani reklamní kampaň a nejsou cílem tohoto projektu. Uživatelem dodané testovací jméno je přesně **Matěj STýblo**; `test@example.invalid` je úmyslně nefunkční placeholder, nikoli jeho skutečný email. Nejde o produkční právní identitu. Její schválení není úkol nutný k dokončení lokálního dema; nevydáváme demo za veřejný sběr leadů.

## Vizuální identita

Od 12. října 2026 stránka používá tmavě modrou, tyrkysovou a bílou. Výraznější úvod a hlavní tlačítko vedou přímo ke kalkulačce, modelový rozdíl zvýrazňuje světlý tyrkysový panel. Fondy rozlišují modré a tyrkysové ukazatele s textovými popisky. Stejné barvy má formulář, webový i stažený report a soukromí. [Tokeny a rozhodnutí](docs/DECISIONS.md#d13--vizuální-identita-má-podporovat-práci-s-čísly), [ověření](docs/TESTING.md).

## Pro koho a proč

Pracovní cílová skupina ze zadání: čeští retailoví investoři přibližně 25–45 let, přicházející převážně na mobilu z reklamy. Chtějí se orientovat v dlouhodobém investování, ale nemusí znát rozdíl mezi nákladem fondu, nákladem brokera, listingem a měnovou expozicí. Nejde o ověřený výsledek uživatelského výzkumu.

Motivace produktu: malé roční procento převést do srozumitelného **hypotetického dopadu v čase**, současně ukázat, že nižší náklad není celé investiční rozhodnutí. Bez doporučení „nejlepšího ETF“, garantovaného výnosu, nákupního tlačítka nebo falešných referencí.

Simulovaným obchodním cílem zadání je dobrovolně získaný a skutečně uložený testovací kontakt. Veřejným užitkem je srovnání vlastností fondů, vlastní kalkulace, baseline bez průběžných nákladů, zdroje a vysvětlené limity — ne pouze formulář maskovaný jako kalkulačka.

## Cesta návštěvníka a lead magnet

Reklama → veřejné srovnání → vlastní scénář → modelový výsledek → nabídka podrobného reportu → email → databázový commit → `/report` → HTML ke stažení / tisk.

Report obsahuje vlastní vstupy, detail obou fondů, horizonty 5/10/20/30 let a vlastní horizont, roční tabulku, checklist před nákupem, zdroje a metodiku. Je snapshotem nastavení a katalogu, nikoli živým dokumentem. Email není součástí reportu ani jeho URL.

**Report se nezasílá emailem.** Otevře se ihned po úspěšném uložení a lze stáhnout skutečné samostatné HTML. PDF nabízí tiskový dialog prohlížeče; serverové PDF ani SMTP nejsou implementované. Přístup přes HttpOnly cookie platí 24 hodin ve stejném prohlížeči; stažený soubor zůstává návštěvníkovi. Email je jediný povinný kontaktní údaj. Marketingový checkbox je volitelný, nezaškrtnutý a není podmínkou reportu. Vlastnictví emailu se neověřuje. Marketingový checkbox v demu pouze uloží volbu; neprobíhá žádné skutečné rozesílání.

### Proč jsou sekce v tomto pořadí

Pořadí odpovídá `app/page.tsx` a propojenému `Workspace`, nikoli všem původně navrženým sekcím v plánu:

1. **Kompaktní hlavička a konkrétní hero:** vysvětlit otázku a zachovat shodu s reklamou; CTA vede ke vstupům, ne rovnou na email.
2. **Výběr dvou fondů, náklady, listing a dostupnost:** dát první hodnotu a důležité výhrady před sběrem kontaktu.
3. **Parametry modelu:** návštěvník pracuje s vlastním vkladem, měsíčním příspěvkem, horizontem a hypotetickým výnosem.
4. **Okamžitý výsledek:** oba zůstatky, baseline a modelový dopad; neplatné vstupy neschováváme za stará čísla.
5. **Nabídka reportu a formulář:** email až po veřejném užitku, s konkrétním obsahem a pravdivým způsobem plnění. Na desktopu jsou vstupy a výstupy vedle sebe, na mobilu navazují svisle.
6. **Metodika:** podrobnosti pro kontrolu, přičemž hlavní limity zůstávají i u produktu a reportu.
7. **Volitelné měření a patička se soukromím:** consent panel není vstupní popup ani podmínka kalkulace. Samostatná FAQ a sticky CTA nejsou v aktuální implementaci.

## Reklamy a shoda s landing page

Kompletní české texty, vizuální koncepty a cílení: [ADS](docs/ADS.md).

- [Varianta A — náklady](./?ad_variant=a&utm_source=meta&utm_medium=paid_social&utm_campaign=costs_v1&utm_content=tool_a): „Malý roční poplatek. Jaký rozdíl udělá za 20 let?“
- [Varianta B — orientace](./?ad_variant=b&utm_source=meta&utm_medium=paid_social&utm_campaign=compare_v1&utm_content=tool_b): „ETF na S&P 500 nejsou všechna stejná.“

Jde o relativní URL pro běžící aplikaci, nikoli veřejné deployment adresy. Parametr `ad_variant=b` mění viditelný hero a CTA; jiné hodnoty používají A. Finanční model a nabídka zůstávají stejné. Reklamní CTA A v ADS je „Porovnat náklady“, onsite CTA A je „Spočítat modelový dopad“: význam navazuje, není to doslovně stejný label. Parametrická reklama není randomizovaný onsite experiment.

## Data, zdroje a přesný rozsah NYSE

Katalog v [data/etfs.ts](data/etfs.ts), verze `2026-10-09.1`, zachycuje následující údaje z issuer stránek načtených 9. října 2026. Jde o dokumentovaný snapshot, nikoli tvrzení o živých dnešních datech. Primární odkazy a evidence jednotlivých polí jsou v [DATA_SOURCES](docs/DATA_SOURCES.md#primární-evidence).

| Fond | Publikovaná roční sazba v katalogu | Přesný listing | Role a zdroj evidence |
| --- | --- | --- | --- |
| SPY — State Street SPDR S&P 500 ETF Trust | Gross Expense Ratio 0,0945 % | NYSE Arca, USD | Americká reference; DATA_SOURCES, zdroj [1] |
| IVV — iShares Core S&P 500 ETF | Expense Ratio 0,03 % | NYSE Arca, USD | Americká reference; DATA_SOURCES, zdroj [2] |
| CSPX — iShares Core S&P 500 UCITS ETF USD (Acc) | TER 0,07 % | London Stock Exchange, USD | Evropský akumulační UCITS doplněk; DATA_SOURCES, zdroj [3] |

**NYSE Arca není hlavní trh NYSE.** Pro SPY/IVV používáme transparentně označenou pracovní interpretaci rodiny trhů NYSE, zdůvodněnou v [DECISIONS D03](docs/DECISIONS.md#d03--přiznaná-odchylka-nyse--nyse-arca) a oficiálními NYSE odkazy v DATA_SOURCES. Pokud zadání vyžaduje striktně hlavní NYSE, tato podmínka není splněná. CSPX na LSE není NYSE-listed a do této dvojice amerických referencí jej nezapočítáváme.

Dostupnost u konkrétního českého brokera a příslušný KID nejsou ověřeny; ani UCITS není záruka dostupnosti. Kontext PRIIPs má v DATA_SOURCES primární zdroj Evropské komise, nikoli broker-specific potvrzení. Chybějící metadata zůstávají `null`: IVV ISIN, SPY/IVV domicil a měna share class, AUM všech fondů. Obchodní měna není měnová expozice. Rozdílné názvy zveřejněných sazeb nepovažujeme za identické regulatorní definice.

Před zveřejněním revalidovat emitentské dokumenty a konkrétní pole; následná měsíční kontrola je provozní návrh, nikoli automatický job. Při změně upravit katalog, datum a `DATA_VERSION`, spustit testy. Staré snapshoty nepřepisovat.

### Model a hranice výsledku

Čistý engine: [lib/calculations/project.ts](lib/calculations/project.ts). Pro desetinný roční hrubý výnos `r` a náklad `c` používá měsíční faktor `q = ((1+r)*(1-c))**(1/12)`; každý měsíc `V = V*q + měsíční příspěvek`. Příspěvek přichází na konci měsíce. Baseline používá `c=0`; její rozdíl proti nákladové variantě zahrnuje také ušlé složené zhodnocení, nikoli jen skutečně stržené poplatky.

Stejný fixní hrubý výnos pro oba fondy, distribuce hypoteticky plně reinvestované před zdaněním. Bez daní, broker/FX poplatků, spreadu, inflace, tracking difference a proměnlivého výnosu. Kč jsou modelová jednotka, bez FX konverze. Výchozí scénář není doporučení ani forecast. Nasdaq-100, živé ceny a historická performance nejsou součástí aplikace.

## Měření a konverzní hypotéza

First-party `POST /api/events` ukládá allowlisted události do PostgreSQL až po opt-in. Neposílá raw emaily, hash emailu, částky ani volné properties. Serverový `lead_submit_success` vzniká až po commitu, ale měření je samostatný best-effort zápis: jeho výpadek nesmí zrušit lead. Přesná taxonomie, relace, atribuce, deduplikace, SQL a mezery jsou v [ANALYTICS](docs/ANALYTICS.md).

Primární definice: **nové validní uložené leady připsané způsobilým měřeným landing relacím / tyto stejné relace**. Validní zde znamená syntakticky validovaný email a databázový zápis, ne ověřenou identitu či obchodní kvalifikaci. Relace není unikátní člověk. Bez souhlasu lead funguje, ale všechny leady nelze dělit pouze consented návštěvami. SQL má vyloučit revokované a explicitně známé testovací relace; automatická detekce botů ani úplný návštěvnický denominator nejsou implementované.

**2–5 % je pouze plánovací hypotéza**, nikoli benchmark, změřená konverze nebo slib. Předpokládá relevantní cold mobile traffic, shodu reklamy s hero, rychlý funkční produkt a srozumitelný report. Kampaň zatím neběžela; z tohoto rozsahu neodvozujeme CPL ani návratnost. Souhlasový výběr a ztráty eventů mohou výsledek zkreslit.

### Tři prioritní A/B hypotézy

Následují návrhy, ne spuštěné experimenty ani změřené uplifty. Každý test mění jeden prvek, se stejnými disclosures a pravdivým „ihned HTML / tisk, ne emailem“.

| Priorita | Hypotéza a varianty | Primární metrika | Guardrails |
| --- | --- | --- | --- |
| 1 | Konkrétní „scénáře 5–30 let + checklist“ proti „uložit výsledek“ zvýší motivaci dát email. | Nové unikátní leady / způsobilé měřené landing relace stejné kohorty. | Podíl konvertujících relací s následným report view neklesne; submit errors a přístup k veřejnému výsledku se nezhorší. |
| 2 | Viditelné selektory na první mobilní obrazovce proti hero s CTA nad produktem zvýší vědomé zahájení srovnání. | Relace s `comparison_started` / způsobilé landing relace. | Primární lead rate neklesne; bez overflow a zhoršení dostupnosti na 375 px. |
| 3 | Skutečný preview horizontů a checklistu u formuláře proti textovému seznamu zvýší dokončení formuláře. | Relace s committed capture / relace s `lead_form_started`, v téže kohortě. | Submit error sessions nezvýší podíl; report/download použití a mobilní layout se nezhorší. |

Nejdříve baseline a předem stanovené okno, MDE, vzorek a pravidlo ukončení; bez dodatečného hledání „vítěze“. Aktuální schema nemá experiment ID/exposure ani randomizaci. Tyto testy **nelze nyní spolehlivě vyhodnotit jako onsite randomizované A/B**. `ad_variant` je kampaňový/hero parametr. Report use je pouze session proxy, nikoli přesné přiřazení ke konkrétnímu reportu.

## Technická architektura

- Next.js 16.4.0 App Router, React 19.3.0, strict TypeScript, Tailwind CSS 4; konkrétní verze uzamyká `package-lock.json`, netvrdíme „latest“.
- Serverový landing shell; client workspace se sdíleným stavem, React Hook Form + Zod a Lucide. Bez ORM, Recharts, shadcn balíčku a email SDK.
- Node.js API routes: origin/content-type/body-size checks, Zod, honeypot, parametrizované SQL a sdílený DB throttle. Limity nenahrazují ochranu proti distribuovanému spamu.
- Server-only `pg`, pool maximálně 5 připojení na instanci. Transakce ukládá lead, report a receipt; unikátní HMAC emailový klíč a advisory lock pro attempt chrání duplicity.
- Normalizace emailu: trim ve schématu, lowercase pouze domény; bez slučování plus/dot aliasů. Duplicate capture nevynucuje nový marketing consent.
- Report token odvozený HMAC z attempt UUID a serverového secretu, v DB přístupový hash, v prohlížeči HttpOnly/SameSite cookie (Secure pro HTTPS). Token ani email nejsou v URL; report je no-store/noindex.
- SQL migrace `001.sql` až `003.sql`; tabulky `leads`, `reports`, `submission_receipts`, `rate_limit_buckets`, `analytics_sessions`, `analytics_events`.
- Vitest unit/integration; Playwright + axe. CSP aktuálně připouští inline scripts/styles; nonce hardening není hotový.

## Lokální spuštění

Ověřené prostředí v TESTING: Node 22.23.1, npm 10.9.8, PostgreSQL 17 přes Docker. Následující postup je pro **nové vlastní lokální prostředí**, ne pokyn přepsat existující kontejner nebo databázi. Příkazy spouštějte z kořene repozitáře. Docker musí běžet a port 55439 být volný.

```sh
npm ci
cp .env.example .env.local
# Pouze lokální vývoj: loopback a trust, nikdy veřejný DB server.
docker run --name etf-radar-postgres \
  -e POSTGRES_HOST_AUTH_METHOD=trust \
  -e POSTGRES_DB=etf_radar \
  -p 127.0.0.1:55439:5432 -d postgres:17
docker exec etf-radar-postgres pg_isready -U postgres -d etf_radar
docker exec etf-radar-postgres createdb -U postgres etf_radar_test
```

Je-li `pg_isready` ještě neúspěšný, počkejte na readiness a zopakujte jej před `createdb`. Existující kontejner spustíte `docker start etf-radar-postgres`; existující DB znovu nevytvářejte. Trust autentizace patří výhradně na vlastní loopback. Data zůstávají v tomto kontejneru; nemažte jej jako způsob restartu, produkce vyžaduje samostatně zajištěnou trvalou DB a zálohy.

### Prostředí

Upravte ignorovaný `.env.local`, tajemství necommitujte ani nevypisujte do sdílených logů:

| Proměnná | Hodnota / účel |
| --- | --- |
| `DATABASE_URL` | Lokálně `postgresql://postgres@127.0.0.1:55439/etf_radar`; pro cizí hosting by byla nutná vlastní TLS DB. |
| `APP_ORIGIN` | Přesný origin browseru, lokálně `http://localhost:3000`. `localhost` a `127.0.0.1` nezaměňovat. |
| `LEAD_DEDUPE_SECRET` | Nezávislé náhodné serverové tajemství, alespoň 32 znaků. |
| `REPORT_TOKEN_SECRET` | Druhé nezávislé náhodné tajemství, alespoň 32 znaků; také podpis analytics cookie. |
| `CONTROLLER_NAME` | V `.env.example` přesně `Matěj STýblo`, jméno dodané uživatelem pro testovací projekt; není to produkční právní identita. |
| `PRIVACY_CONTACT` | V `.env.example` `test@example.invalid`, výslovně nefunkční testovací placeholder, ne skutečný kontakt. |
| `LEADS_ENABLED` | Výchozí `false`. `true` až se všemi předpoklady pro konkrétní prostředí. |
| `DASHBOARD_ENABLED` | Výchozí vypnuto. Pouze lokálně explicitní `true`; `/dashboard` i CSV navíc vyžadují HTTP loopback `APP_ORIGIN` a přesně odpovídající `Host`. Není to veřejné přihlášení. |
| `TEST_DATABASE_URL` | Uvedená v příkladu, ale **aktuální integration suite ji nečte**; přepisuje `DATABASE_URL` pevnou adresou `etf_radar_test` na portu 55439. |

Pro nově zkopírovaný `.env.local` můžete obě tajemství vyplnit bez jejich výpisu následujícím příkazem. **Nespouštějte jej jako běžný restart**: přegenerování mění deduplikaci i přístup k existujícím reportům. Přepíše pouze tyto dvě položky, DB URL a flag capture si nastavte v editoru zvlášť.

```sh
node --input-type=module -e 'import {readFileSync,writeFileSync} from "node:fs"; import {randomBytes} from "node:crypto"; const p=".env.local"; let s=readFileSync(p,"utf8"); for(const key of ["LEAD_DEDUPE_SECRET","REPORT_TOKEN_SECRET"]) s=s.replace(new RegExp("^"+key+"=.*$","m"),key+"="+randomBytes(32).toString("hex")); writeFileSync(p,s,{mode:0o600});'
```

Žádné `NEXT_PUBLIC_*` pro DB nebo secrets. Technický backend gate v `requireConfig()` vyžaduje všechny serverové proměnné včetně zapnutého capture a identity; přítomnost řetězců sama nedokazuje právní správnost. UI gate kontroluje jen flag a identitu, takže formulář může být aktivní při chybějící DB/secrets a API pak poctivě vrátí 503.

### Migrace a server

Next načítá `.env.local`, ale samostatné Node skripty **ne**. Node 22 umí env file načíst explicitně:

```sh
node --env-file=.env.local scripts/migrate.mjs
# Tentýž skript přes npm, pokud DATABASE_URL už máte bezpečně exportovanou:
# npm run db:migrate
npm run dev -- --hostname localhost --port 3000
```

Otevřete `http://localhost:3000`. Migrační skript spustí všechny `.sql` soubory v lexikálním pořadí v transakci s advisory lockem. Nemá migration ledger; současné migrace jsou opakovatelně aplikovatelné, budoucí migrace musí toto chování respektovat. Neexistuje automatická migrace při startu serveru.

Pro kontrolu produkčního buildu lokálně:

```sh
npm run build
npm run start -- --hostname localhost --port 3000
```

Před změnou portu změňte i `APP_ORIGIN` a restartujte server; UI identity/env ověřte na skutečně běžícím buildu, ne pouze v souboru.

## Lokální přehled skutečných dat

`/dashboard` je server-renderovaný český přehled skutečně uložených PostgreSQL dat, bez simulovaných statistik. Výchozí období je 30 dní; lze zvolit 7/30/90 dní nebo všechna dosud uchovaná data, variantu A/B/všechny a stránku kontaktů. Kontakty mají stránkování po 50, diagnostický výpis nejvýše 100 nejnovějších událostí. Obnovení je obyčejné načtení ze serveru, nikoli optimistická změna čísel. Výpadek DB zobrazí nedostupnost, ne smyšlené nuly.

Povolení je **jen pro vlastní lokální demo**: nastavte `DASHBOARD_ENABLED=true` v lokálním prostředí, `APP_ORIGIN` na přesný HTTP loopback origin a server přivažte na loopback. Například při `APP_ORIGIN=http://127.0.0.1:3103` použijte `npm run start -- --hostname 127.0.0.1 --port 3103` a otevřete `http://127.0.0.1:3103/dashboard`. Změna konfigurace vyžaduje restart; nový kód nejprve produkční rebuild. `localhost` a `127.0.0.1` nejsou zaměnitelné Host hodnoty. Guard vrací 404 ještě před načtením dat; forwardované hlavičky nelze použít jako náhradu lokálního Hostu.

**Na jakémkoli hypotetickém deploymentu ponechte dashboard vypnutý.** Gate není autentizace uživatelů, firewall ani ochrana veřejně naslouchajícího serveru. Nevystavujte jej přes tunel/proxy a nespouštějte povolený dashboard na `0.0.0.0`. Stránka i export obsahují kontaktní emaily; noindex/nofollow a no-referrer nejsou náhradou omezení přístupu.

Měřené relace nejsou všichni návštěvníci ani unikátní lidé. Primární karta **Nové kontakty / měřené relace** odpovídá výše uvedené definici nových měřených leadů ve stejné landing kohortě. Při více nových emailech v jedné relaci může tento poměr přesáhnout 100 %. Oddělená **Konverze měřených relací** počítá relace s alespoň jedním úspěšným uložením, včetně opakovaného capture existujícího kontaktu; tato metrika je nejvýše 100 %. Bez měřených landing relací se zobrazí „—“, nikoli vymyšlená konverze. Všechny captures a unikátní kontakty se zobrazují odděleně. Kampaně ukazují pouze uložené captures, ne neexistující campaign conversion rate. Výběry ETF z měřených eventů se nemíchají s dvojicemi ze snapshotů uložených reportů. Nezměněná výchozí dvojice není event výběru. Starší chybějící dvojice, expirované reporty a retence jsou výslovně přiznané; neodvozujeme historii z dnešního katalogu.

Odkaz na `/dashboard/export?range=30&variant=all` exportuje filtrované kontakty do CSV se stejným lokálním guardem; export není veřejné API ani způsob obcházení stránkování v UI. CSV obsahuje emaily a nesmí se publikovat. Přesné definice a hranice jsou v [ANALYTICS](docs/ANALYTICS.md#lokální-dashboard), skutečné kontroly a opt-in příkaz v [TESTING](docs/TESTING.md#lokální-dashboard--10-října-2026).

## Testování a údržba

```sh
npm run typecheck
npm run lint
npm run test
# Integrace používá pevně oddělenou DB níže, ne .env.local ani TEST_DATABASE_URL.
DATABASE_URL=postgresql://postgres@127.0.0.1:55439/etf_radar_test npm run db:migrate
npm run test:integration
npx playwright install chromium
# Běžící server musí mít lokální testovací identitu a LEADS_ENABLED=true.
# Backend pro skutečný happy path navíc vyžaduje všechny env výše.
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e
npm run build
```

Playwright config **nespouští server**; bez `PLAYWRIGHT_BASE_URL` očekává `http://127.0.0.1:3100`. Integration suite generuje vlastní secrets/test identity a používá vlastní testovací emaily; nesmí mířit na produkci. Browser lead-form scénáře používají intercepted API responses: nepovažujte je samy za důkaz persistence.

Závěrečné kontroly: typecheck/lint/build prošly, 26 unit a 25 DB integration testů prošlo. Standardní browser suite: 19 prošlo, 2 explicitně opt-in live testy byly přeskočené; při samostatném zapnutí oba skutečné DB/browser testy prošly. Consented funnel uložil přesně 13 událostí včetně reportového `session_start`; bez souhlasu se report doručil s nulou analytických událostí. Testovací řádky byly uklizeny. Mobilní Lighthouse po opravě favicon/CSP: **Performance 99, Accessibility 100, Best Practices 100, SEO 100**, LCP 2,2 s, TBT 60 ms, CLS 0. Jde o konkrétní lokální měření, ne výkon veřejného hostingu; předchozí výsledky 75/97/97 nejsou skryté. Důkazy v [TESTING](docs/TESTING.md) a [QA_FINAL](docs/QA_FINAL.md). Externí deployment nebyl proveden. Starší audit zachytil 0 production findings, ale 5 high dev findings; nejde o aktuální záruku bezchybného dependency auditu.

**Aktualizace po dashboardu (10. října 2026):** nejnovější typecheck/lint/build prošly, **74 unit a 39 PostgreSQL integration testů prošlo**. Kompletní browser běh se zapnutým dashboardem a live funnelem: **23 passed / 1 skipped**; vypnutý dashboard/export a odmítnutí cizího Hostu navíc samostatně ověřeny na dočasném lokálním serveru. Skutečné nově uložené testovací kontakty a dvojice byly před vlastním scoped cleanup viditelné v přehledu/CSV; dashboard totals ověřeny nezávislým SQL, bez mockovaného úspěchu. Podrobnosti a předešlá selhání v TESTING. Dashboard má vlastní nové ověření přístupnosti/responsivity, nikoli nové Lighthouse skóre.

Po opravě lifecycle regrese nalezené nezávislým review jsou aktuální výsledky **75 unit / 39 integration / 24 browser passed**, jedna disabled kontrola úmyslně přeskočena na zapnutém serveru a samostatně ověřena proti vypnutému. SPA návrat do dashboardu a souhlas změněný v jiné záložce již nevytváří falešnou landing návštěvu; předchozí mezivýsledky zůstávají v TESTING.

Retenční skript je ruční, bez npm aliasu a bez scheduleru:

```sh
# Destruktivní: jen po ověření cílové DB a schválení retenčního postupu.
node --env-file=.env.local scripts/cleanup.mjs --retention
# Výmaz konkrétního leadu: nahraďte skutečným ověřeným UUID, nikdy emailem.
# node --env-file=.env.local scripts/cleanup.mjs --lead-id <UUID>
```

Skript odstraní leady starší 90 dnů, snapshoty starší 7 dnů a analytics starší 30 dnů; přístup k reportu přitom expiruje už po 24 hodinách. Další vztahy a omezení výmazu viz ANALYTICS. Zálohy ani hostingové logy tento skript neřeší.

## Deployment runbook — pouze hypotetický návod, nespouštět

Uživatel výslovně určil, že projekt zůstane testovací a nikdy nebude skutečným provozem. Tento seznam plní dokumentační požadavek zadání; **není plánem další práce ani autorizací deploymentu**. Produkční podmínky níže nejsou blokery dokončení lokálního dema.

1. Získat zvláštní oprávnění k deploymentu a přístup k projektu; zvolit spravovaný PostgreSQL a cílový Vercel projekt/doménu. Žádné veřejné URL ani vytvořený projekt nyní netvrdíme.
2. Potvrdit skutečnou identitu správce, privacy kontakt, účel uchovávání emailu, právní základ, zpracovatele, marketingový/odvolávací proces a schválenou notice. Předstartovní `/privacy` není hotové právní posouzení. Dokud chybí, ponechat veřejný capture vypnutý.
3. Revalidovat ETF dokumenty/KID a viditelné údaje. Potvrdit NYSE-family scope s hodnotitelem, pokud vyžaduje přísný main-market výklad.
4. Nakonfigurovat vlastní DB s TLS a zálohami; ověřit connection string a kompatibilitu poolu `pg` s limitem poskytovatele a serverless instancemi. Server používá Node runtime, nikoli Edge. Preview musí používat izolovanou DB a nesmí sbírat skutečné leady bez schválení.
5. V chráněném prostředí proti **cílové** DB spustit `npm run db:migrate` s bezpečně vloženou `DATABASE_URL`. Nepoužívat lokální trust autentizaci. Migrace nejsou součástí build scriptu.
6. Nastavit server env z tabulky; `APP_ORIGIN` musí odpovídat skutečnému HTTPS hostu. Secrets odděleně v hostingu, žádná tajemství v repozitáři. Ověřit i build/runtime rendering identity. Rotace dedupe secretu mění emailové klíče; rotace token secretu invaliduje přístupy — potřebuje samostatný plán.
7. Před publikací zopakovat quality gates, řešit audit findings, provést ruční mobile/keyboard/axe a Lighthouse na produkčním buildu. Žádné skóre neodvozovat z cíle.
8. Až s oprávněním publikovat; na přesné cílové URL provést smoke test bez měření, s opt-in i odvoláním, valid/invalid lead, DB readback, report/download, cookies/no-store/expiry a outage. Testovací řádky uklidit. Teprve readback potvrzuje výsledek.
9. Zajistit skutečný schedule cleanup, výmazové žádosti a backups deletion SLA, monitoring 503/429 a ochranu hostingu proti spamu. Schedule/config soubory v repozitáři zatím nejsou. Při potížích vypnout `LEADS_ENABLED`, ověřit API gate a rollback buildu; DB rollback není implementovaný a nesmí ztratit leady.

Žádný krok deploymentu, push ani placený traffic nebyl při doplnění této dokumentace proveden.

## Známé limity a AI

- Jen tři ETF stejného indexu; žádná garance dostupnosti ani striktní splnění hlavního NYSE. Chybějící metadata a manuální aktualizace jsou přiznané.
- Pouze testovací identita **Matěj STýblo** a nefunkční `test@example.invalid`; bez skutečné produkční identity a bez komerčního zpracování. Není to lokální blocker, ale jasná hranice použití.
- Analytics je souhlasový vzorek, bez celkových návštěv, úplného consent rate, experiment assignments a přesného report-to-capture linkage; UTM jsou na receipts, nikoli session/event tabulkách. Report bootstrap nově nezvětšuje landing denominator a replay nepřenese success do jiné session; původní receipt zůstává autoritou atribuce. Podrobnosti v ANALYTICS.
- Žádné ověření mailboxu, email delivery, marketingové rozesílání či self-service výmaz. Rate limits nejsou úplná anti-spam ochrana; CSP nonce hardening, cron a backup deletion proces chybí.
- Původní [PLAN](docs/PLAN.md) a [DECISIONS](docs/DECISIONS.md) zachycují i návrhy před implementací. Skutečný stav určují soubory, tento README, ANALYTICS a časově řazené důkazy v TESTING.

AI použití a skutečné chyby/opravy popisuje [AI_USAGE](docs/AI_USAGE.md). Použit byl Hermes Agent, nikoli předstíraná Claude Code session. **[ai-log/hermes-session.jsonl](ai-log/hermes-session.jsonl) obsahuje skutečný redigovaný snapshot rodičovské session**, exportovaný Hermes CLI. Je to jeden JSONL session record s polem `messages`, nikoli jedna zpráva na řádek. Parent ověřil parsování a kontrolu literal secrets/password-bearing PostgreSQL URL. Snapshot nezahrnuje pozdější zprávy a nedokládá automaticky úplnou lineage všech delegací; není rekonstruovaným chatem. Před případným sdílením stále zkontrolovat osobní údaje a lokální cesty. Finanční evidence, testované výpočty a skutečné tool výsledky mají přednost před tvrzeními AI.
