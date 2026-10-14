# ETF Radar — produktový a implementační plán

Datum: 9. října 2026. Deadline podle nadřazeného `AGENTS.md`: 16. října 2026.
Stav: produktová revize 9. října 2026; následuje implementace a skutečné ověření vertical slice. Stav jednotlivých kontrol bude uveden v TESTING.md.

## 1. Kontext a rozsah

Aktivní worktree `foundation-ETF-RADAR` nemá žádné trackované soubory ani existující stack. Kompletní pravidla byla přečtena z `../../AGENTS.md` v kořeni nadřazeného projektu. Zadání poskytuje uživatelův přiložený text a tato pravidla; samostatný původní dokument zaměstnavatele není k dispozici.

První výstup odpovídal `/plan`; navazující pokyn nyní výslovně žádá implementaci. Před bootstrapem převzít skutečný nadřazený `AGENTS.md` beze změn do worktree. Uživatel 9. října 2026 autorizoval průběžné commity podle funkcionality: ověřené celky commitovat lokálně bez zpětného datování. Push, externí deployment a placené reklamy zůstávají bez autorizace.

### P0: jeden úplný konverzní tok

Reklama → srovnání konkrétních ETF → vlastní parametry → modelový dopad průběžných nákladů → email → potvrzený zápis do databáze → ihned dostupný osobní report.

Není v rozsahu: broker integrace, nákup ETF, investiční doporučení, živé ceny, historické výkonnostní grafy, automatický výběr „nejlepšího ETF“, účty, platby ani odesílání emailů. Nasdaq-100 přidat až po dokončení P0 a ověření dalších fondů; nepoužít jej v reklamním slibu, dokud v aplikaci není.

## 2. Komu pomáháme a proč

Primární segment podle zadání: česky mluvící retailový investor přibližně 25–45 let, mobilní návštěva z reklamy, zvažuje pravidelné dlouhodobé investování do širokého akciového indexu. Potřebuje rozumět nákladům a rozdílům, ne dostat další doporučení konkrétního brokera. Nejde o výsledek uživatelského výzkumu, ale o pracovní hypotézu.

**Job to be done:** „Chci porovnat náklady několika ETF při stejné modelové investici a pochopit rozdíly dřív, než někomu dám email.“

**Hero:** „Malý roční poplatek. Jaký rozdíl udělá za 20 let?“

**Podtitulek:** „Porovnejte průběžné náklady ETF na S&P 500 a jejich modelový dopad na vlastní investici. Bez registrace, se zdroji a jasnými předpoklady.“

**První CTA:** „Porovnat náklady“. Začne pracovat se srovnáním, neotevře emailový formulář.

Brandový slib „Zjistěte, kolik vás skutečně stojí investování do ETF“ ze zadání zpřesnit: nástroj nemodeluje všechny skutečné investiční náklady. Nikdy jej nepoužít bez bezprostředního vysvětlení rozsahu.

## 3. Výzkum dat a první katalog

Údaje byly načteny přímo z veřejných stránek emitentů 9. října 2026. Datum načtení není datum vydání factsheetu. Před zveřejněním ověřit pole proti aktuálnímu factsheetu/prospektu/KID a uložit jejich data.

| Fond pro první verzi | Ověřený průběžný náklad | Ověřené obchodní místo | Role |
| --- | --- | --- | --- |
| State Street SPDR S&P 500 ETF Trust, SPY | Gross Expense Ratio 0,0945 % | NYSE Arca | Americký referenční fond.[1] |
| iShares Core S&P 500 ETF, IVV | Expense Ratio 0,03 % | NYSE Arca | Druhý americký fond stejného indexu.[2] |
| iShares Core S&P 500 UCITS ETF USD (Acc), CSPX | TER 0,07 % | Konkrétní USD listing CSPX na London Stock Exchange | UCITS varianta; akumulační, domicil Irsko.[3] |

**Interpretace požadavku NYSE:** SPY a IVV mají přesný listing NYSE Arca, nikoliv hlavní NYSE.[1][2]

NYSE sama nabízí ETF sekci s pravidly Arca a regulatorní stránkou pro ETP na několika svých trzích.[6][7]

Interpretace „NYSE“ jako rodiny NYSE trhů v ETF zadání je proto obhajitelná pracovní interpretace, nikoli důkaz úmyslu hodnotitele. Pokračujeme s SPY/IVV a viditelným venue NYSE Arca; tato nuance neblokuje lokální implementaci. Pokud hodnotitel myslí striktně hlavní NYSE, zůstává podmínka nesplněná a je potřeba upravit katalog.

CSPX je výslovně samostatná evropská UCITS varianta na LSE, mimo NYSE výběr.[3]

Evropská komise popisuje povinnost poskytovatelů příslušných investičních produktů připravit KID pro investory.[4] Samotný americký listing proto není důkaz dostupnosti pro českého retailového klienta. Broker-specific dostupnost všech fondů je **neověřena**; před UI tvrzením o dostupnosti prověřit příslušný KID a přístup brokera. Ani UCITS označení není garancí přístupu u konkrétního brokera.

### Kontrakt dat

`data/etfs.ts`: stabilní `id`, celý název, ISIN, emitent, domicil, index, UCITS status, distribuce/akumulace, měna share class a seznam listingů `{ ticker, exchange, tradingCurrency }`. Náklady ukládat jako explicitně typované procento a druh nákladů; do engine převádět jednou na desetinnou sazbu. Fond a listing jsou odlišné entity; ticker není globální identifikátor.

Každé podstatné pole má zdroj a datum. AUM pouze s datem a měnou, jinak `null` a „údaj není ověřen“. Neplnit chybějící ISIN, domicil nebo velikost odhadem. Kontrola při release a plánovaně jednou měsíčně je provozní návrh; stale data označit, neprezentovat jako živá. V první verzi žádný automatický scraper za běhu návštěvníka.

## 4. Konverzní cesta a skladba stránky

| Pořadí | Obsah a chování | Přínos pro návštěvníka / konverzi |
| --- | --- | --- |
| 1 | Kompaktní značka, konkrétní hero, jeden CTA, „Model, ne předpověď“ | Do pěti sekund vysvětlit účel bez nafouknutého hero. |
| 2 | Dvě zvolená ETF, náklad %, index, listing a dostupnostní upozornění; odkazy na zdroje | První skutečná hodnota ještě před emailem; žádný žebříček vítězů. |
| 3 | Vklad, měsíční příspěvek, horizont; pokročile nastavitelný hrubý výnos | Z pasivního čtenáře udělat uživatele se svým scénářem. |
| 4 | Výsledek: vložená částka, oba modelové zůstatky, baseline bez průběžných nákladů, rozdíl | Peněžní dopad přeložit do srozumitelného výsledku bez slibu výdělku. |
| 5 | „Uložit moje srovnání“; obsah reportu viditelně popsaný | Email nabídnout až vedle hodnoty, ne jako vstupní bariéru. |
| 6 | Formulář → potvrzení → report a stažení | Splnit slib automaticky a bez SMTP. |
| 7 | Metodika, zdroje, co není zahrnuto, FAQ, identita provozovatele a soukromí | Zodpovědět pochybnosti; klíčové limity zůstanou i u výsledku, ne pouze v patičce. |

Jedna sdílená konfigurace propojí srovnání, kalkulaci i report. Desktop použije dvě pracovní oblasti: vstupy a výsledky, ne několik nesouvisejících widgetů. Mobil začne na 375 px; používat vertikální porovnání vlastností místo široké tabulky.

### Minimální interaktivita

- Dva selektory fondů ze stejného indexu, ochrana před shodným výběrem a viditelné upozornění na rozdílný právní režim.
- Číselné vstupy s klávesnicí pro mobil a rozumnými limity; slider pouze jako doplněk, ne jediný způsob ovládání.
- Okamžitý výpočet a jeden jednoduchý SVG graf/tabulka se stejně dostupnými číselnými daty; Recharts nepřidávat bez potřeby.
- Výchozí pracovní scénář: 100 000 Kč jednorázově, 3 000 Kč měsíčně, 20 let a 5 % hypotetického hrubého výnosu. Tyto hodnoty nejsou investiční doporučení ani odhad budoucího výnosu.
- Výběr a změny nejsou důvodem k ukládání majetkového profilu mimo reportovou funkci.

## 5. Design systém a stavy

Směr (schválená úprava 12. října 2026): přesný finanční pracovní nástroj se třemi hlavními barvami — tmavě modrá `#0B1735`, tyrkysová `#007F78`, bílá `#FFFFFF`. Světlé odstíny modré a tyrkysové oddělují výsledky a pomocné části. Silnější úvodní nadpis, plné tyrkysové CTA, zvýrazněný modelový rozdíl, modré/tyrkysové ukazatele s popisky, vstupy a tlačítka se zaoblením 10 px. Kalkulačka zůstává blízko začátku stránky. Formulář, webový i stažený report a soukromí sdílí identitu. Tokeny a kontrastní varianty viz D13 v DECISIONS; skutečné kontroly viz TESTING.

System font / lokálně hostované písmo, tabulární číslice, vyrovnané sloupce, 8px spacing základ, střídmé radius 8–12px, minimální stíny. Hierarchie: výsledek > potřebné vstupy > metodika. Žádné fotografie, dekorativní gradienty, falešné počty uživatelů, testimonials ani blikající „úspora“.

Požadavky: textové labely, touch target alespoň 44px, focus ring, chyby s `aria-describedby`, střídmé `aria-live` pro výsledky, legenda a tabulka k vizualizaci, plná klávesnice, reduced motion. Sticky CTA jen po zobrazení výsledku a mimo viditelný formulář; nesmí překrývat vstupy ani consent panel.

Stavy: neplatné parametry nesmějí zobrazit starý výsledek jako aktuální; odesílání deaktivuje duplicitní submit; 422 označí pole; 429 ukáže čas dalšího pokusu; 503 vysvětlí nedostupnost a zachová vstupy; report po úspěchu dostane focus. Výpadek analytics nikdy neblokuje kalkulaci nebo lead.

## 6. Matematický model a verifikace

Čistý TypeScript modul v `lib/calculations/`. `P` = počáteční částka, `M` = měsíční příspěvek na konci měsíce, `n` = celé měsíce, `r` = hypotetický efektivní roční hrubý výnos, `c` = roční průběžný náklad, oba jako desetinné sazby.

Měsíční faktor `q = ((1 + r) * (1 - c)) ** (1 / 12)`.
Rekurence `V(0) = P`, `V(k + 1) = V(k) * q + M`.
Baseline vypočítat stejnou funkcí s `c = 0`. Výstup „modelový dopad nákladů“ = baseline minus varianta s náklady. Nejde o součet skutečně stržených poplatků; zahrnuje i rozdíl následného složeného zhodnocení. Rozdíl scénářů nesmí být označen „garantovaná úspora“.

Model je zjednodušený: stejné hrubé výnosy a expozice, plné reinvestování distribucí před zdaněním, fixní náklad a výnos, měsíční kroky. Neprovádí FX konverzi: Kč jsou zvolená jednotka modelových vkladů a výsledků, ne skutečná korunová předpověď amerického trhu. Obchodní měna není měnová expozice.

Nezahrnout brokerage, spread, FX poplatky, daně, inflaci, tracking difference ani proměnlivou výkonnost. U výnosu −100 % nebo méně model odmítne vstup. UI návrh limitů: P 0–100 mil. Kč, M 0–1 mil. Kč, horizont 1–50 celých let, r −50 až +30 %. API pro report musí používat stejná schémata. Náklady klient nesmí svévolně posílat; server je načte z katalogu podle ETF ID.

Referenční vektory byly spočítány nezávisle pomocí Pythonu, **nejde o testy aplikace**: P=1 000, M=100, n=12, r=0, c=0 → 2 200; P=M=0 → 0; P=1 000, M=0, n=12, r=0, c=0,01 → 990 v toleranci floating point.

Testy mají ověřit vektory, end-of-month timing, nulovou sazbu, nulové vklady, záporný výnos, vysoký horizont, desetinnou čárku ve vstupu, finiteness, jednotky procent a monotonicitu vůči nákladům. Výpočty nezaokrouhlovat v mezikrocích; až výstup lokalizovat `Intl.NumberFormat('cs-CZ')`. Otestovat klient/server/report konzistenci.

## 7. Lead capture, úložiště a plnění

**Lead magnet:** „Váš ETF plán nákladů — srovnání, scénáře a checklist před nákupem“. Nejde jen o export veřejného čísla. Obsah: osobní vstupy; detailní vlastnosti obou fondů; modelové zůstatky a dopad nákladů při 5, 10, 20, 30 letech a zvoleném horizontu; roční tabulka pro vlastní horizont; rozdíly UCITS/distribuce/listingu; české/EU availability caveats; checklist (KID, broker, index/expozice, distribuce, celkové náklady, měna, daňové otázky); ověřené zdroje a přesný model. Základní srovnání i vlastní kalkulace zůstávají veřejné. Tisknutelné HTML + HTML download, prohlížeč může tisknout do PDF; serverové PDF ani email delivery neslibujeme.

**Copy:** „Jedno číslo není celý příběh. Získejte své ETF srovnání pro 5 až 30 let — včetně rozdílů fondů a checklistu před nákupem.“ CTA „Získat moje srovnání“. Mikrocopy: „Report otevřete a stáhnete ihned po zadání emailu. Neposíláme jej emailem. Marketing je volitelný.“ Nabídka vedle výsledku, ne vstupní paywall. Email jediný povinný kontakt; před zveřejněním vyplnit skutečného správce a účel kontaktu.

`POST /api/leads`:
1. Vyžaduje JSON, limit velikosti payloadu, kontrolu stejného originu a Zod schéma. Validuje email, ETF ID, scénář, allowlisted atribuci a idempotency key.
2. P0 safeguards: honeypot, maximální velikost těla, jednoduchý sdílený emailový throttle a serverové limity. Kvóty podle emailu nestačí proti distribuovanému útoku; pokročilá platform/CAPTCHA ochrana je P2 dle skutečné zátěže, není důvodem odkládat funkční tok.
3. Server přepočítá výsledky nad konkrétní verzí katalogu.
4. PostgreSQL transakce uloží lead, verzi privacy notice, výslovný marketingový souhlas pokud udělen, report snapshot, idempotency receipt a případný oprávněný konverzní event.
5. Úspěch až po commitu. Response neoznamuje existenci emailu; opakovaný attempt nevytvoří další lead. Reportová session přes HttpOnly cookie, žádný email v URL.
6. Redirect na `/report`; download route předá HTML attachment. Po DB chybě žádný falešný success ani report unlock.

Hosting databáze: spravovaný PostgreSQL s TLS pro produkci, PostgreSQL lokálně pro reálné integrační testy. Praktický návrh je server-only `pg` a SQL migrace, bez ORM pro několik tabulek. Nepoužít SQLite na ephemeral Vercel filesystem ani JSON soubor jako produkční lead storage. Konkrétní poskytovatel/účet zatím není zvolen ani nakonfigurován.

Tabulky: `leads`, `reports`, `submission_receipts`, `analytics_events`, `rate_limit_buckets`. Reporty mají versionovaný snapshot, hash náhodného přístupového tokenu, expiraci; raw token pouze v Secure/HttpOnly/SameSite cookie, ne v logu. Lead email není součástí veřejného reportu. Token platí navržených 24 hodin v daném prohlížeči; stažený soubor zůstane uživateli. Úprava scénáře po submitu vyžaduje nový report, ne tichou změnu starého.

Retry po síťovém timeoutu vrátí stejný report pro stejný attempt; payload hash zabrání využití klíče pro jiný scénář. Email uniqueness a attempt uniqueness jsou rozdílné věci. Deduplikace neodstraňuje provider aliasy a nepřepisuje lokální část adresy; doménu porovnávat case-insensitive. Duplicate submit nikdy nesmí přihlásit kontakt k marketingu nebo odhalit předchozí reporty bez přístupového tokenu.

Retence — návrh k právnímu schválení: nekontaktovaný lead 90 dnů, reportové snapshoty 7 dnů (přístup 24 hodin), analytics 30 dnů; idempotency a throttle data kratší operativní TTL. Zálohy musí respektovat dokumentované deletion SLA. Žádné sbírání IP/UA do vlastní aplikační DB; hostingové logy zvlášť prověřit. Názvy polí, běh cleanup a žádost o výmaz otestovat. Veškeré hodnoty jsou produktový návrh, ne právní stanovisko.

## 8. Analytics a experimenty

Produkční varianta: malé first-party `POST /api/events` s typovaným allowlistem a zápisem do PostgreSQL. Není to `console.log`. Nezavádět reklamní pixely do P0. ÚOOÚ rozlišuje technické a netechnické cookies; pro netechnické cookies je potřeba souhlas.[5] Pro měření navrhnout explicitní volitelný opt-in; kalkulace a report fungují i bez něj. Nezačínat měřit před souhlasem a neposílat zpětně frontu předchozího chování.

Taxonomie: `landing_view`, `primary_cta_click`, `comparison_started`, `etf_selected`, `calculator_interaction`, `results_viewed`, `lead_offer_viewed`, `lead_form_started`, `lead_submit_attempt`, `lead_submit_success`, `lead_submit_error`, `report_viewed`, `report_downloaded`.

Události mají `event_id`, `session_id`, čas serveru, schema version, allowlisted `ad_variant` a omezené UTM řetězce. Session je náhodná, nikoli fingerprint, definovaná jako měřicí relace daného tabu s expirací po 30 minutách neaktivity. Není unikátní člověk. Analytics payload nesmí obsahovat email/hash emailu, vstupy portfolia, token reportu, plnou URL/referrer ani volný text. UTM považovat za nedůvěryhodné; reject URL/email-like hodnoty, truncate délky a používat sanitizovaný allowlist kampaní. Zrušení souhlasu zastaví měření a odstraní měřicí token.

`landing_view` jednou na session až po opt-in; `comparison_started` po první vědomé akci, ne při renderu; interakce debounce a commit hodnoty místo každého keystroke; `results_viewed` po skutečné viditelnosti; `lead_submit_success` serverově až po durable commitu, ne dvojitě klientem; `report_viewed` až z otevřené stránky, download až při obsloužené odpovědi. Deduplikace přes unikátní `event_id` a business pravidla pro jednorázové eventy. Event server endpoint nesmí přijímat klientské tvrzení o úspěšném zápisu leadu.

**Primární metrika:** nové validní uložené leady připsané způsobilým měřeným relacím / tyto způsobilé landing relace. Stejná consented kohorta v čitateli i jmenovateli; návraty existujících leadů nezvyšují nové leady. Session zahrnout jednou; bots/test interní kampaně vyloučit explicitním pravidlem. „Validní“ znamená validovaný email a durable zápis, nikoliv ověřené vlastnictví emailu nebo obchodní kvalifikaci.

**Zvlášť:** počet všech validně uložených nových leadů bez ohledu na consent. Nesmí se dělit pouze souhlasícími návštěvníky. Bez jiného legitimního měření nelze tvrdit přesný visitor-to-lead rate pro veškerý traffic; consent bias zveřejnit. Vedlejší metriky: start comparison, result → form, submission error, saved → report view, duplicate ratio, consent share. Náklady reklamy a CPL až s reálnými daty z kampaně.

**Datové definice:** (a) všechny úspěšné captures = committed unikátní submission attempts, retry stejného attemptu jen jednou; (b) nové unikátní leady = nově vzniklé emailové identity, bez provider alias transformací; (c) marketing leady = identity s konkrétním dobrovolným souhlasem, bez automatického přepisování consent při duplicitě; (d) měření návštěvníci = opt-in relace, nikoliv všichni lidé; (e) skutečná konverze = pozorovaný podíl stejné kohorty, hypotéza 2–5 % níže není pozorování. Capture/report count může přesáhnout unique leads. Žádné dělení všech captures pouze opt-in návštěvami.

Pracovní očekávání pro cold mobile campaign: **2–5 %** měřených způsobilých relací se stanou novým syntakticky validním leadem. Jde o plánovací hypotézu bez benchmarkového zdroje a bez pozorovaných dat. Předpoklady: relevantní cílení, shoda reklamy s hero, funkční rychlá stránka, okamžitá hodnota, transparentní report. Nelze z toho odvozovat rozpočet nebo slib výsledku.

A/B hypotézy v pořadí:
1. Nabídka „scénáře 5–30 let + checklist“ vs. „uložit výsledek“: očekáváme +20 % relativně v new unique leads / eligible sessions; guardrail report_viewed / saved ≥ baseline. Nejvyšší očekávaný dopad: důvod k poskytnutí emailu. Číslo je hypotéza, ne výsledek.
2. Produkt s viditelnými selektory v první obrazovce vs. CTA k produktu pod hero: očekáváme +15 % relativně v comparison_started / eligible sessions; primary business guardrail new unique leads / eligible sessions nesmí klesnout.
3. Preview skutečných horizontů a checklistu u formuláře vs. textový seznam reportu: očekáváme +10 % relativně v committed capture / form_started; guardrails chyby, mobilní layout a report_downloaded / saved. V obou variantách pravdivé „ihned ke stažení, ne emailem“.

Testovat vždy jeden prvek, randomizaci a přetrvání varianty až po potřebném souhlasu, stejné kohorty, předem stanovený primary metric a guardrails. V první fázi bez vymyšlené statistické významnosti; velikost vzorku stanovit z reálné baseline a požadovaného MDE.

## 9. Technická struktura a závislosti

```text
AGENTS.md                    skutečná pravidla převzatá z nadřazeného projektu
README.md, .env.example       setup, deployment, limity; žádné secrets
app/page.tsx, layout.tsx      serverový landing shell a metadata
app/api/leads/route.ts        validace + transakce + report session
app/api/events/route.ts       consented analytics intake
app/report/page.tsx          autorizovaný report
app/report/download/route.ts  HTML attachment bez emailu
app/privacy/page.tsx          skutečná identita a privacy notice
components/landing/          hero, metodika, FAQ
components/comparison/       propojené výběry a vlastnosti
components/calculator/       vstupy a modelové výsledky
components/lead-form/        formulář a stavy
components/ui/               malé sdílené přístupné prvky
lib/etf/                     typy, katalog, provenance
lib/calculations/            čistý model
lib/analytics/               event taxonomy a consent
lib/validation/              společná Zod schémata
lib/db/                      server-only DB + SQL migrations
lib/report/                  snapshot a bezpečné HTML renderování
lib/security/                limity, origin, tokeny a idempotence
data/etfs.ts                  ověřený malý katalog
tests/                       unit, DB integration, browser flows
docs/                        PLAN, DECISIONS, DATA_SOURCES,
                             ANALYTICS, TESTING, AI_USAGE, ADS
ai-log/                      pouze skutečné conversation exports
package.json, package-lock.json
```

Next.js App Router, React, strict TypeScript, Tailwind, Lucide, React Hook Form + Zod dle zadání. Stabilní kompatibilní verze ověřit v M1 a uzamknout lockfilem; zde nejsou tvrzeny konkrétní „latest“ verze. Server Components pro statické části, jedna propojená client workspace pro interaktivitu. shadcn/ui jen podle potřeby; bez nepotřebného Recharts, ORM nebo email SDK. Vitest pro unit, skutečný PostgreSQL pro integration, Playwright + axe pro flow a a11y. Přiměřené dependency a security audit výsledky zdokumentovat.

Navržené env, ověřit v implementaci: `DATABASE_URL`, `APP_ORIGIN`, `REPORT_TOKEN_SECRET`, `LEAD_DEDUPE_SECRET`. Secrets pouze server. Zvlášť test DB URL a explicitní označení test režimu; testy nikdy nesmí mazat produkční DB. Žádná SMTP proměnná, dokud neexistuje email delivery.

## 10. Milníky a acceptance criteria

### Zjednodušené produktové priority po revizi

- **P0:** ověřený katalog, kvalitní responsive landing s product-first first screen, veřejné srovnání/kalkulace, persistentní lead, hodnotný report a required privacy/financial disclosures. Validace, escaping, secret separation, idempotence a základní error/loading stavy jsou součástí P0, nikoliv pozdější hardening.
- **P1:** end-to-end analytics, reklamy A/B, měřitelné konverze, rozšíření automatizovaných testů, stavů a production deployment při přístupu. Numerické a kritické backend testy vznikají již v P0.
- **P2:** advanced abuse prevention, rozšířená analytics, animace a sekundární features. Žádný vývoj infra před skutečným konverzním tokem bez konkrétního přínosu.
- First-screen acceptance na 375 × 812: značka a účel, konkrétní užitek, oba fondy/náklady a dostupná první interakce. Hero nepřesune nástroj pod dlouhou marketingovou plochu. Varianta A zdůrazňuje náklady, B orientaci; oba texty přímo nad stejným funkčním nástrojem.

Časový rozpis je pracovní pořadí před deadlinem, ne potvrzený odhad dodání. Paralelizovat jen nezávislé úkoly po ustálení kontraktů.

| Milník | Výstup | Acceptance / důkaz |
| --- | --- | --- |
| M0 — 9. 10., discovery | PLAN a DECISIONS, primární zdroje, seznam otevřených bodů | Dokumenty existují; rozdíl NYSE/Arca a report bez emailu výslovně popsány. |
| M1 — foundation | AGENTS, npm bootstrap, strict TS, katalog a DB migrations | Typecheck a minimální build; všechny zobrazené ETF údaje se zdrojem; schema round-trip v lokální DB. |
| M2 — math first | Pure calculation engine, společná validation | Nejdřív red tests, potom pass; reference vectors, invalid inputs, monotonicita a konzistence reportu. |
| M3 — conversion vertical slice | Výběr → výpočet → DB lead → report/download | Browser flow + readback leadu ze skutečné DB + kontrola obsahu staženého HTML. Replay attempt a souběžné submit nevytvoří duplicitní lead. |
| M4 — premium UX | Mobile/desktop design, error states, consent, source explanations | Screenshot review 375/768/1440 px, keyboard flow, no horizontal overflow, report bez falešného email success. |
| M5 — instrumentation/security | Produkční event storage, attribution, rate limits, retention | Ověřený event readback, žádný event před consent; same-cohort metrics; invalid origin, payload a DB outage tests. |
| M6 — QA a odevzdání, nejpozději 16. 10. | README, ADS, DATA_SOURCES, ANALYTICS, TESTING, AI_USAGE, genuine logs, deploy runbook | Všechny quality gates níže skutečně spuštěny a výsledky uloženy; deployment pouze při oprávnění a ověřený URL smoke test. |

### Quality gates

- `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:integration`, `npm run test:e2e`, `npm run build`: názvy scriptů jsou návrh pro M1, zatím neexistují. Build a testy nepovažovat za provedené.
- Happy path bez marketing a analytics consent, s consent i s odmítnutím; reload reportu, download, expiry, změna scénáře, return návštěva.
- Neplatný email/payload, katalogové ID, numerical bounds, non-JSON, oversized body, duplicate a concurrent submit, report bez tokenu, expired token, DB timeout, retry po committed-but-response-lost, analytics failure.
- SQL parameterization, escaped report HTML, no PII in logs/events/URL, no-store report responses, CSP a bezpečnostní hlavičky, origin/CSRF check, server-only secrets, DB cleanup test.
- Reálný readback exact lead/report/event; in-memory mock není důkaz persistence. Testy používat jasně testovací adresy a data po sobě uklidit.
- axe + ruční keyboard check; screenshot review 375/768/1440 px, dlouhé názvy ETF a lokalizovaná čísla, zoom 200 %, reduced motion.
- Lighthouse na produkčním buildu: cíle Performance 90+, Accessibility 95+, Best Practices 95+; reportovat skutečná čísla a prostředí, nikoliv cíle jako výsledky.
- Porovnání s každým bodem Definition of Done; unresolved přísný NYSE požadavek zůstává viditelný.

## 11. Reklamy a odevzdání

Varianta A — motivace náklady: „Malý roční poplatek. Jaký rozdíl udělá za 20 let?“ CTA „Spočítat modelový dopad“. Vizuál dvou nákladových sazeb a horizontu bez nesourced výsledkové částky. Hero stejné sdělení, žádný slib plných skutečných nákladů.

Varianta B — motivace orientace: „ETF na S&P 500 nejsou všechna stejná.“ CTA „Porovnat ETF“. Vizuál názvů fondů, nákladů a listing/UCITS statusu; zjištění rozdílů místo honby za „nejlepším fondem“. Parametr `ad_variant=b` pouze z explicitního allowlistu změní hero copy, nikoliv finanční model. Obě verze v `docs/ADS.md` rozpracovat o primary text, headline, description, vizuál, audience rationale a message match.

README bude obsahovat produkt, audience, lead magnet, pořadí sekcí, zdroje, metriky/hypotézy, architekturu, local setup, migrations, env, deployment a limity. `docs/TESTING.md` musí uvést commands, prostředí, exit codes, coverage a neprovedené kontroly. `docs/AI_USAGE.md` rozlišuje návrhy AI od ručně/tool ověřených dat. `ai-log/` pouze autentický export skutečné konverzace; exportní postup zjistit podle použitého agenta, nevyrábět přepis ze vzpomínek.

Deploy runbook: zvolit Postgres, nakonfigurovat TLS a pool, aplikovat migrace, vyplnit server env a skutečnou privacy identitu, ověřit cleanup, build, přístupové cookies a same-origin API na cílovém hostu. Bez Vercel účtu/opravení lze předat deployovatelný build a runbook, ne tvrdit hotový deployment. Bez identity provozovatele, účelu leadu a funkční DB se produkt nesmí prezentovat jako připravený k placenému trafficu.

## 12. Otevřené body a release blockers

1. Přísná interpretace hlavní NYSE vs. rodina trhů: obhajitelný NYSE-family scope s přesným venue, ne potvrzení úmyslu hodnotitele; dokumentované evaluation risk, nikoliv důvod odložit lokální vertical slice.[6][7]
2. Provozovatel/správce, kontaktní email, účel použití kontaktu, právní základ, skutečná retence a marketingový proces nejsou dodány. Žádné vyplněné fikce.
3. Hosting/PostgreSQL/Vercel credentials nejsou prověřeny. Základní tok lze vyvinout a prokázat lokálně; production readiness až po konfiguraci.
4. Dokončit factsheet/KID a chybějící metadata každého ETF; broker dostupnost je zatím neověřena.
5. Ověřit skutečný obsah hodnotnějšího multi-horizon reportu; schválený produktový směr je okamžitý HTML report, email ani serverové PDF neslibujeme.
6. Skutečný export AI konverzace a statistická data kampaní zatím neexistují v deliverables. Nepředstírat jejich existenci.

### Evidence register

- **Confirmed facts:** issuer ověřené poplatky/listingy ve výše uvedeném katalogu.[1][2][3]
- NYSE sama zahrnuje Arca do své ETF nabídky; vztah dokumentují oficiální NYSE zdroje.[6][7]
- **Product hypotheses:** audience motivation, perceived value scénářů/checklistu, hero A/B, hypotetická konverze 2–5 %, očekávané experimentální uplifty. Zatím žádná reálná campaign data.
- **Unverified assumptions:** záměr hodnotitele u NYSE; konkrétní broker/KID dostupnost; legal approval a případná deliverability marketingové adresy.
- **Missing infrastructure:** production DB účet, Vercel projekt a doména; skutečná identita správce a marketingový proces. Docker lokálně je k dispozici; vytvořit samostatný lokální PostgreSQL a reálně testovat, ne mockovat persistence.
- **Release blockers:** chybějící production secrets/DB, právní identita a notice approval, neprovedená finální QA, neověřený deployment. Pokročilá analytics ani volitelné animace nejsou podmínkou dokončení prvního lokálního toku.

## Sources

[1] https://www.ssga.com/us/en/individual/etfs/state-street-spdr-sp-500-etf-trust-spy
[2] https://www.ishares.com/us/products/239726/ishares-core-sp-500-etf-ivv
[3] https://www.ishares.com/uk/individual/en/products/253743/ishares-sp-500-b-ucits-etf-acc-fund
[4] https://finance.ec.europa.eu/consumer-finance-and-payments/retail-financial-services/key-information-documents-packaged-retail-and-insurance-based-investment-products-priips_en
[5] https://uoou.gov.cz/verejnost/qa-otazky-a-odpovedi/cookies
[6] https://www.nyse.com/regulation/exchange-traded-products
[7] https://www.nyse.com/products/exchange-traded-products/exchange-traded-funds

## Vizuální reference — dokončená návazná úprava, 12. října 2026

Podle uživatelem přiloženého obrázku: desktopový dvouřádkový nadpis, jemná SVG dekorace hero, dvě samostatné zaoblené plochy a přehledné větší sazby/výsledky. Tablet a mobil používají panely pod sebou. Mini graf modelových zůstatků má společnou škálu od nuly; ilustrační poměry z předlohy nebyly převzaty jako data. Zachován celý formulářový/reportový tok.

## Graf modelového scénáře — 12. října 2026

Přidán propojený graf hodnoty investice / dopadu nákladů s ročními daty stávajícího modelu, baseline, legendou, společnou nulovou škálou a přesnými hodnotami zvoleného roku. Funguje v kalkulačce i webovém reportu, myší, dotykem a klávesnicí. Vstupy a změna ETF ho okamžitě přepočítají; při neplatném scénáři zmizí. Bez nové závislosti, bez tvrzení o historických výnosech.

## Návštěvnost a neodeslané formuláře — 14. října 2026

Na žádost uživatele rozšířit stávající opt-in měření: uložit při prvním landing eventu relace validované UTM a pouze externí referrer hostname; přidat aditivní migraci, agregaci stejné landing kohorty a dashboard zdrojů / zahájení / úspěšných uložení / dosud neodeslaných formulářů. Probíhající návštěvy odlišit; úspěch odvodit od durable receipt, nikoli pouze best-effort success eventu. Ověřit unit, PostgreSQL integrace, browser cestu, build a stávající funnel. Bez měření před souhlasem, bez IP/fingerprintu či zpětného domýšlení historie.

## Viditelná cookie lišta — 14. října 2026

Na výslovný požadavek uživatele nahradit první volbu ve spodní sekci pevnou spodní lištou na landing page/reportu. Zachovat opt-in API, stejné možnosti povolit/odmítnout, zapamatování, odvolání a souhlas mezi záložkami. Po volbě schovat lištu, ponechat trvalé nastavení v původní sekci. Bez zablokování stránky; zkontrolovat mobil, klávesnici, souhlas a stávající acquisition cestu.

## Vercel Hobby — požadavek na nasazení 14. října 2026

Uživatel výslovně požádal nasadit celou aplikaci na bezplatný Vercel účet matejstyblos-projects. Nové povolení nahrazuje dřívější zákaz externího deploymentu, zachovává testovací účel projektu a nulový rozpočet. Plán: ověřit login/Hobby, připravit Node 24 a konfiguraci uploadu bez secrets či AI logů, připojit oddělený bezplatný PostgreSQL, aplikovat migrace, nastavit serverová tajemství a přesný APP_ORIGIN, nasadit a reálně ověřit uložení/report/consent. Online dashboard vyžaduje autentizaci; současný lokální guard nesmí být prostě vypnut. Stav: Vercel CLI připravené, webové přihlášení zatím chybí. Žádný deployment ani cloud DB dosud vytvořeny.

Vercel milník dokončen: Hobby projekt, Neon Free, migrace, server secrets a přesný APP_ORIGIN, testovací notice a chráněný HTTPS dashboard. Finální cloud build READY a skutečný smoke test prošel; výsledky v TESTING.md. Původní plán ponechat dashboard pouze lokálně byl rozšířen o samostatně zabezpečený vzdálený režim, aby splnil požadavek na celou appku.
