# ETF Radar — Independent Final Production Audit

Datum: **14. října 2026**, Europe/Prague. Auditor: Codex v tomto pracovním prostředí, nezávislé nové běhy; historická QA tvrzení nejsou důkazem tohoto auditu. Zadání: uživatelem přiložený audit a aktuální AGENTS.md. Samostatný původní dokument zaměstnavatele „Assignment B“ nebyl dodán; shoda je posuzována proti dostupným požadavkům, nikoli proti neviděnému originálu.

## Executive Summary

**Funkční veřejné testovací demo; NO-GO pro komerční sběr kontaktů a placenou kampaň.** Skutečný HTTPS browser → PostgreSQL → osobní report → HTML download prošel se souhlasem i bez něj. Test vytvořil jeden unikátní syntetický kontakt a dvě jeho uložení; po výslovném povolení uživatele provedl přesný úklid a ověřil nulové vlastní záznamy. Nejde o test s podvrženými HTTP odpověďmi.

Výpočty odpovídají nezávislé uzavřené formuli. Výchozí fondy STXF/STXG mají podle nově otevřených emitentských zdrojů primární listing NYSE. Rozdílné indexy i omezení českého retailu jsou viditelně vysvětlené. Nový Lighthouse na skutečném deploymentu: **98 / 100 / 96 / 100**, LCP 1,97 s, CLS 0.

Před kampaní chybí skutečné a schválené provozní údaje a pravidla: privacy contact je nefunkční testovací placeholder, stránka sama přiznává předstartovní právní stav, retenční job a postup žádostí nejsou ověřené v produkci. Vercel Hobby je nekomerční plán. Automatizace ochrany proti spamu a vyloučení známých testovacích/bot relací z měření nejsou kompletní. Tyto podmínky nelze poctivě opravit vymyšlenou identitou, změnou secrets nebo nákupem tarifu bez vlastníka.

Lokálně opraveny CSP regresní chyba, zastaralá testovací obálka atribuce, mobilní poloha vstupů v demo režimu a nepřesný reportový popisek značky jako právního emitenta. Opravy **nejsou nasazené**. Zůstává 5 high nálezů v dev dependency řetězci; production dependency audit je bez nálezů. Nenalezen žádný ověřený Critical technický defekt. Otevřené High problémy jsou připravenost ke komerčnímu provozu, nikoli nefunkční databázový formulář.

### Význam stavů

- **PASS**: nově provedená kontrola v uvedeném prostředí; rozsah nesmí být rozšířen na jiné prostředí.
- **FAIL**: doložený nedostatek; lokální oprava není produkční retest.
- **BLOCKED**: chybí konkrétní přístup, rozhodnutí nebo konfigurace.
- **NOT VERIFIED**: tato kontrola nebyla provedena; není automaticky závada.
- **NOT APPLICABLE**: požadavek se na současnou implementaci nevztahuje.

## Deployment Verification

| Položka | Nově ověřený údaj |
| --- | --- |
| Veřejný origin | https://etf-radar-dun.vercel.app |
| Vercel deployment | `dpl_EB618uVzbtYGZrvSYRG9U5ep4ZBu` |
| Deployment commit | `b0aa48a2bfe5ffa6e6524ce23985ac26c066cc5f` |
| Source / target / branch / state | `git` / `production` / `devel` / `READY` |
| Zjištění identity | Vercel API: alias → deployment; pouze allowlisted metadata v [deployment-verified.json](qa/final-audit/deployment-verified.json) |
| Lokální vstupní HEAD | stejný `b0aa48a…`; pracovní strom byl při zahájení čistý |
| Nové opravy | lokální commit `01e62ca` (finální testovaný aplikační zdroj); žádný push, deployment nebo změna produkčních secrets |
| Runtime | deployment Next.js 16.4.0 / Node 24; lokálně Windows, Node 24.15.0, npm 11.12.1, PostgreSQL 17.9, Chromium 156.0.8078.4 |
| Build / function region | CLI metadata build sfo1; serverové funkce fra1. Build region není runtime region. |

API identity deploymentu byla ověřena při auditu; nezaručuje budoucí stav pohyblivého aliasu. Public GitHub je nezávisle přístupný bez přihlášení. Výchozí GitHub větev je main, produkce sleduje devel; main proto neukazuje nejnovější cloudové změny. Historie má skutečné postupné funkční commity, nebyla zpětně vytvářena.

Vercel env list potvrzuje názvy povinných proměnných. `DATABASE_URL` bylo možné bezpečně načíst do ignorovaného souboru; cloudové SELECT potvrdily dostupnost tabulek i constraints ([database-schema.json](qa/final-audit/database-schema.json)). Vercel odmítá vrátit hodnoty 11 Secret proměnných: přítomnost není důkaz konkrétní hodnoty. Funkčnost APP_ORIGIN, LEADS_ENABLED, dedupe/report secrets je potvrzena úspěšným skutečným tokem a rejection testy. Přímo exportovat jejich hodnoty nebylo možné a nebylo potřeba. Produkční UI potvrzuje technicky zapnutý sběr, současně testovací režim a nefunkční kontakt. Nastavení bylo pouze čteno.

## Requirement Compliance Matrix

Metody: **P** skutečný produkční Chromium/HTTP/DB, **L** finální lokální produkční build/Chromium, **I** real PostgreSQL integration, **U** unit, **S** zdroj/dokument, **E** nově otevřený externí primární zdroj. Odkazy na soubory jsou relativní ke kořeni repo, není-li uvedeno jinak. Konkrétní artefakty a limity metod jsou v dalších sekcích.

| Požadavek | Status | Evidence / soubor / metoda | Zbývající akce |
| --- | --- | --- | --- |
| Česká cílová skupina, přirozený jazyk, jasný účel | PASS | `app/page.tsx`, `README.md`; P/L/S | Skutečný výzkum návštěvníků nebyl proveden. |
| Hodnota před emailem, propojená návštěvnická cesta | PASS | P kalkulačka bez kontaktu; P oba skutečné reportové toky | Žádná funkční mezera v provedené cestě. |
| Produkční komerční připravenost | FAIL | P `/privacy`, demo upozornění; `docs/DEPLOYMENT.md` | F01–F03, F07, F08 níže. |
| Next App Router, React, strict TypeScript, npm | PASS | `package.json`, `tsconfig.json`, build/typecheck exit 0 | Lockfile zachovat; netvrdit latest. |
| Server/client hranice, minimalizace knihoven | PASS | S `app/*`, client Workspace/Form/Chart; `pg` server-only | Lighthouse unused JS je optimalizační příležitost. |
| Reusable design a tokeny | PASS | `app/globals.css`, `docs/DECISIONS.md` D13; L | Žádný redesign. |
| Mobil, tablet, desktop, no overflow | PASS | P/L 375/390/768/1440, documentWidth = viewportWidth | Skutečné iOS/Android zařízení NOT VERIFIED. |
| Rychlý první užitek na mobilu | FAIL v deploymentu; PASS po lokální opravě | P vstup bottom 864,53 / 814,34 px; L 778,98 px | F06: nasadit až po autorizaci; lišta stále zabírá spodní část. |
| Labely, focus, klávesnice, chyby, touch graf | PASS v testovaném rozsahu | L frontend/chart/form testy; P Home na slideru, focus reportu | Plný asistivní screen-reader test NOT VERIFIED. |
| Kontrast a automatická přístupnost | PASS | P/L axe bez violations na čtyřech šířkách, P Lighthouse 100 | Axe nenahrazuje uživatelský test. |
| Reduced motion, loading, invalid/empty/error stavy | PASS | L chart/consent/form; I výpadek DB; `app/error.tsx` | Skutečný výpadek produkční DB nebyl vyvolán. |
| Žádné okamžité modální popupy | PASS | P nemodální consent lišta, S D20 explicitní uživatelská změna | Lišta částečně překrývá nástroj do volby; CRO kompromis. |
| Výchozí fondy primárně NYSE | PASS | E STXF/STXG issuer a factsheet; P selektory | Bez změny sazeb. |
| SPY/IVV NYSE Arca a CSPX LSE odlišeny | PASS | E issuer listing tabulky; `data/etfs.ts`; P | Nepřejmenovávat Arca na NYSE. |
| Název, ticker, index, roční sazba, distribuce | PASS | E všech pět emitentských stránek; finanční tabulka níže | Pravidelná revalidace má mít vlastníka. |
| ISIN / domicil / currency / AUM úplnost | NOT VERIFIED u explicitních null polí | S katalog přiznává chybějící metadata; E SPY/CSPX ISIN, CSPX domicile/currency | Doplnit pouze doložené údaje; žádný odhad ISIN. |
| Právní emitent vs značka | FAIL ve starém popisku; PASS lokální oprava | E Strive je sub-adviser, EA Series Trust je struktura; report pole bylo „Emitent“ | F09; úplné právní entity všech fondů ještě nejsou katalogovým polem. |
| PRIIPs/KID a dostupnost českému retailu | PASS pro vysvětlení; NOT VERIFIED broker dostupnost | E EU KID zdroj; P disclaimer před formulářem | Ověřit konkrétní broker/KID, pokud má vzniknout nákupní doporučení. |
| Odlišné strategie a žádné garance | PASS | P před formulářem/u výsledku/report; S report assumptions | Neměnit model na předpověď. |
| Pure TypeScript engine a dokumentovaná matematika | PASS | `lib/calculations/project.ts`; U; nezávislá P formule níže | Poplatky brokera/taxe/FX záměrně mimo model. |
| Initial/monthly/horizon/return/fee/baseline | PASS | P osm scénářů; U numerické hranice | Maximum je 50 celých let. |
| Invalid numeric, desetinná čárka, stejné ETF | PASS | P/L Infinity, čárka; L stejné fondy; U schemas | Chyba nezobrazuje předchozí aktuální číslo. |
| Shoda frontend → persisted snapshot → report | PASS | P vklad 123456,78; STXF/CSPX; DB readback a HTML | Není to kontrola každého možného scénáře. |
| Pouze email jako povinný kontakt | PASS | P/L form; S RHF+Zod | Marketing nepředzaškrtávat. |
| Server validace a strict payload | PASS | I + P rejection; `lib/validation/schemas.ts` | U unsupported ID/injected fee není pouze client trust. |
| Durabilní persistence před success | PASS | P skutečné PostgreSQL receipts/lead/report; I DB outage 503 | Success až po COMMIT. |
| Idempotence a concurrent duplicates | PASS lokálně | I současné stejné/různé attempts, DB readback | Produkční zátěžový concurrency test NOT VERIFIED. |
| Původní marketing volba při duplicitě | PASS | I false→true nelze přepsat; P duplicate s false | Produkční marketing rozesílání NOT APPLICABLE. |
| Origin, media type, body cap, honeypot | PASS | I 403/415/400/413/422; P cizí Origin; P hidden input tabindex -1 | Origin nebrání klientovi mimo browser. |
| Rate limiting napříč instancemi | PASS pro per-email/session limit | I SQL limit 5/15min, 120/min; `lib/db/leads.ts`, analytics | F07: různými emaily nebo novými relacemi lze limit obejít. |
| SQL parametrizace a secrets server-only | PASS ve zkontrolovaném kódu | S SQL v `lib/db/*`, `lib/security/*` | Žádný client DB driver. |
| Výpadek DB nezpůsobí falešný success | PASS lokálně | I skutečný connection failure 503, žádná report cookie | Produkci nebylo třeba odpojovat. |
| Report automaticky po uložení | PASS | P report title/focus a durable snapshot | Manuální zásah není nutný. |
| Report přidává hodnotu, obsahuje zdroje | PASS | P HTML: horizonty, tabulka, checklist, limity; U/I | Samostatný export není živá cena. |
| Download a print | PASS | P skutečný download a print-media PDF; L beforeprint/afterprint | Nativní tiskový dialog/physical print NOT VERIFIED. |
| HttpOnly/Secure report cookie, žádný token/email v URL | PASS | P cookie atributy bez exportu hodnot; `/report` URL | Capability cookie není individuální účet. |
| Unauthorized a expiry odmítnutí, refresh | PASS | P anonym download 401; P přesná vlastní expiry 401; refresh funguje | Expiry update se dotkl jen vlastního test reportu. |
| Žádný falešný příslib odeslání emailu | PASS | P/S UI „Neposíláme jej emailem“ | SMTP/ověření emailu NOT APPLICABLE. |
| Typed funnel a production analytics persistence | PASS | P všechny požadované události v DB; I taxonomy | Best-effort success event může chybět při výpadku měření. |
| Consent default off, denied product works | PASS | P zero POST před consent a při denied; P report funguje | Consent bias zůstává. |
| Revocation zastaví tracking a server relaci | PASS | P cookie odstraněná, DB revoked=true; L cross-tab a retry | Revokace nezaručuje automatický výmaz historických dat. |
| Analytics bez emailu/scénáře | PASS v provedené obálce | P event bodies/readback; I strict extra property rejection | UTM allowlist není sémantický detektor PII; vlastní kampaně nesmějí obsahovat PII. |
| Event/session dedupe a first source UTM | PASS | I replay/dedupe, L traffic; P landing 1x i refresh | Není identifikace unikátního člověka. |
| Primární metrika a správná kohorta | PASS pro implementované výpočty | I dashboard SQL; L browser DB totals; S primary new-lead ratio oddělený od session conversion | F08: aktivní dashboard bez explicitní exkluze bot/test IDs. |
| Measured vs unmeasured a skutečné/hypotetické CR | PASS | I/L dashboard; README označuje 2–5 % jako hypotézu | Nevyvozovat CPL bez kampaně. |
| Dashboard / CSV anonymně bezpečné | PASS | P `/dashboard` 307→login, export 404; L foreign-host/disabled 404 | Pozitivní autentizovaný produkční export BLOCKED bez hesla. |
| Pouze lokální dashboard | NOT APPLICABLE současnému požadavku | S D21 a autentizovaný remote režim; P login přístupný | Auditové zadání popisuje starší architekturu. |
| Remote scrypt/session auth | PASS lokální auth testy; BLOCKED pozitivní P login | U session signature/expiry/hash invalidation; anonym P guard | Heslo správce nebylo dodáno auditu; nebyl hádán klíč ani mintována cookie. |
| Retence a žádosti o výmaz | PASS lokální scoped skript; FAIL produkční provozní připravenost | I `scripts/cleanup.mjs`; privacy výslovně návrh | F02: schválit policy, naplánovat a ověřit job i žádost. |
| HTTP headers, escaping, soukromé cache | PASS pro existující ochrany | P/I report cache; S HTML escaping, CSP, deny frames, no-referrer | CSP unsafe-inline zůstává Medium hardening limit. |
| CSP bez eval diagnostických chyb | FAIL na vstupním buildu; PASS lokální oprava | L před opravou security.spec fail, po opravě pass | F04 nasadit až po autorizaci. |
| Secrets ve verzovaných souborech / historii | PASS omezeného skenu | 282 jedinečných reachable blobů bez shod; current artifact secret-value scan bez shod | Heuristika není důkaz absence každého možného credential. |
| Metadata/OG/sémantika/headings | PASS | S `app/layout.tsx`, P Lighthouse SEO100/axe | OG image/canonical jsou možné doplňky, nejsou funkční blocker. |
| Mobile performance cíle | PASS nového P měření | 98/100/96/100; raw Lighthouse JSON/HTML | INP NOT VERIFIED; nejsou field CWV. |
| Dvě české reklamní koncepce a message match | PASS | S `docs/ADS.md` všechna požadovaná pole; P A/B headline/CTA | Hotový mediální banner/kampaň nejsou požadované koncepty. |
| README všechny požadované části a A/B hypotézy | PASS pro dostupnou specifikaci | S audience, lead magnet, pořadí, zdroje, metriky, 2–5 % hypotéza, 3 priority, setup/deploy/limity/AI | Historické sekce nejsou aktuální test evidence. |
| Povinné dokumenty | PASS | S README/AGENTS/PLAN/DECISIONS/DATA/ANALYTICS/TESTING/AI/ADS + tento audit | Žádný tvrzený employer approval. |
| Public GitHub, incremental historie | PASS | E veřejný repo; S git log a branch; Vercel exact commit | Nový audit lokálně commitnut, bez push. |
| Autentické AI exporty | PASS pro strukturu a vysvětlenou provenienci; úplnost omezená | Parsováno 7 původních JSONL, Hermes 135 messages; Codex runtime response_item | Nezávisle zpětně autentizovat původní Hermes runtime nelze; snapshoty nejsou kompletní konverzace. |
| Build/lint/typecheck/unit/integration/e2e | PASS finální lokální běhy | tabulka níže, exit 0 | Dva e2e skips výslovně vysvětlené. |
| Dependency security audit | FAIL celý dev řetězec; PASS prod subset | npm audit 5 high / omit=dev 0 | F10: upstream fix nebo vědomé omezení lint vstupů; žádný nekompatibilní downgrade. |
| Real Vercel deployment | PASS | P HTTPS/DB/report + deployment identity | Nové lokální opravy dosud v tomto deploymentu nejsou. |

## Functional Test Results

### Local tests a integration tests

Všechny níže uvedené finální lokální kontroly používají nové výsledky. PostgreSQL integration testy používají lokální `etf_radar_test` a vlastněnou náhodnou dashboard DB, nikoli cloud. Dashboard TRUNCATE/DROP jsou omezené na náhodnou DB vytvořenou touto suite. Live browser server běžel z **next build + next start**, ne next dev; DB `etf_radar_nyse_test` byla nově vytvořená a před testy prázdná. Existující lokální kontakty nebyly přeneseny ani odstraněny.

| Command / environment | Exit | Passed | Failed | Skipped | Evidence |
| --- | ---: | ---: | ---: | ---: | --- |
| `npm run typecheck` Windows Node24 | 0 | n/a | n/a | n/a | `qa/final-audit/typecheck-final.txt` |
| `npm run lint` stejné prostředí | 0 | n/a | n/a | n/a | `lint-final.txt` |
| `npm run test` | 0 | 97 | 0 | 0 | `unit-final.txt`, 21 souborů |
| `npm run test:integration` | 0 | 42 | 0 | 0 | `integration-final.txt`, 4 soubory, skutečný PG |
| `npm run test:e2e -- --workers=1`, enabled local server 3103 | 0 | 30 | 0 | 2 | `e2e-final.txt` |
| `npx playwright test tests/e2e/dashboard.spec.ts tests/e2e/security.spec.ts --workers=1`, disabled dashboard 3130 | 0 | 4 | 0 | 2 | `disabled-browser.txt` |
| `npm run build` | 0 | n/a | n/a | n/a | `build-final.txt`; všechny aplikační route compiled |
| `npm audit --json` | 1 | n/a | 5 high dependency entries | n/a | `dependencies.json` |
| `npm audit --omit=dev --json` | 0 | n/a | 0 vulnerabilities | n/a | `dependencies-production.json` |
| `node scripts/audit-browser.mjs` proti finální lokální demo replice 3130 | 0 | 43 checků | 0 | 0 | `local-demo-browser-final/results.json` |

V enabled suite je přeskočen test vypnutého dashboardu a starý production-write spec vyžadující samostatné přístupové soubory. Vypnutý dashboard je skutečně ověřen druhým během; produkční funnel je ověřen samostatným novým skriptem. Disabled suite naopak přeskočí 2 enabled dashboard kontroly. Nejde o skryté neověřené persistence testy. Některé consent/form UX testy používají HTTP interception a report-layout testy render fixture; ty dokazují UI chování, **nikoli persistence**. Jejich důkaz doplňují tři lokální live-funnel toky a skutečný traffic/dashboard test.

První kompletní e2e běh: **27 passed / 3 failed / 2 skipped**. Dvě selhání byla zastaralá assertion pro `landing_view.acquisition`; třetí skutečný CSP eval probe. První exploratory finanční assertions měly chybnou obyčejnou mezeru před Kč; po opravě harnessu odpovídají všechny částky. Jedna lokální demo replika měla chybný APP_ORIGIN pro svůj port a správně vracela 403; konfigurace pouze dočasné repliky opravena, následně 43/43. Selhání nejsou zatajena ani zaměněna za produktové chyby.

Po poslední úpravě dvou reportových popisků byly typecheck/lint/unit/integration/build a příslušné browser/report testy zopakovány; stejné počty v přepsaných finálních log souborech jsou posledním ověřeným stavem.

Návazný souběžný enabled/disabled Playwright běh měl **29 passed / 1 failed / 2 skipped** kvůli ENOENT při zavírání trace: oba runnery používaly stejnou výstupní složku `test-results`, kterou druhý runner uklidil. Šlo o chybu orchestrace auditu, nikoli chart assertion. Log je `e2e-trace-collision.txt`. Finální enabled suite byla spuštěna se samostatným `--output=.vercel/final-audit-enabled-artifacts`; žádná assertion nebyla odstraněna a celá sada je znovu ověřená.

### Production tests

Reprodukce read-only: `node scripts/audit-browser.mjs`. Finální produkční skript: **41 PASS / 2 FAIL**, oba FAIL jsou mobilní poloha vstupu při demo upozornění. Žádné overflow ani axe violations na 375/390/768/1440; žádné zaznamenané uncaught nebo console errors v jeho interakcích. Tento skript neposílá validní lead ani nezapíná analytics. CSP violation event není totéž jako console error; CSP je samostatná lokální kontrola. [Výsledky](qa/final-audit/production-browser-retest/results.json).

Produkční write test byl nejprve omezen explicitním souhlasem uživatele; ten následně povolil test i úklid. `AUDIT_PRODUCTION_WRITE_AUTHORIZED=1 node scripts/audit-production-funnel.mjs` **exit 0**:

1. Consented mobilní flow: skutečný UTM B příchod, volba consentu, CTA, změna druhého ETF na CSPX, počáteční vklad 123456,78 Kč, validní syntetický email, HTTP 200, DB receipt/lead/report.
2. Report obsahuje stejný scénář a modelové zůstatky, focus přejde na title, URL `/report` neobsahuje email/token, cookie je HttpOnly/Secure/Lax s path `/report`. Refresh zachová report.
3. Skutečný browser download HTML obsahuje oba fondy, čísla, checklist a zdroje; neobsahuje email. beforeprint rozbalí tabulky; Chromium vytvoří print-media PDF. Fyzický tisk a nativní dialog nebyly ověřeny.
4. DB má požadované funnel události včetně serverového `lead_submit_success` a `report_downloaded`. Landing je jednou i po refreshi. Event obálky neobsahují email ani částku. Odvolání odebere analytics cookie a nastaví přesnou DB session revoked=true.
5. Denied desktop flow se stejným syntetickým emailem vytvoří nový report/receipt, **nikoli další lead**. marketing=false zůstává, analytics_session_id=null, žádný analytics POST ani event pro tento attempt.
6. Expirace pouze vlastního reportu vede na download 401 a pochopitelnou report state stránku.
7. Přesná vlastní lead/report/receipt/session/event/bucket ID odstraněna transakčně; samostatný SELECT vrací **0 ve všech šesti kategoriích**. Žádný cizí záznam nebyl cleanup cílem.

Důkaz: [production-funnel/results.json](qa/final-audit/production-funnel/results.json), skutečně stažené HTML a print PDF ve stejné složce. Žádné capability cookie, connection string nebo email hash nejsou v důkazech. Pozitivní produkční dashboard login/CSV je **BLOCKED**: administrator password není tomuto auditu dostupné; anonymní ochrana PASS. Cloud DB nebyla přerušena, nebyly změněny secrets ani schéma.

Produkční skript vyžaduje čerstvé oprávnění a privátní DB konfiguraci: `npx vercel env pull .vercel/final-audit.production.env --environment=production --yes`. Tento soubor se nesmí verzovat ani vypisovat. Auditové dočasné env soubory jsou po skončení odstraněné; pro další běh je nutné je znovu bezpečně připravit. Lokální konečný readback všech šesti tabulek vlastní nové test DB je také nula ([local-cleanup.json](qa/final-audit/local-cleanup.json)).

### Performance

Nový Lighthouse 13.5.0 na skutečném HTTPS aliasu, Chromium 156.0.8078.4, Windows, navigation mobile/simulated throttling. Fetch time **2026-10-14 11:57:20 UTC = 13:57:20 Europe/Prague**. Jedno nové měření, ne průměr ani opakovaný historický audit.

| Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT | INP |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 98 | 100 | 96 | 100 | 1972,469 ms | 0 | 120 ms | NOT VERIFIED |

Raw [JSON](qa/final-audit/lighthouse-production.json), [HTML](qa/final-audit/lighthouse-production.html), [summary](qa/final-audit/lighthouse-summary.json). Žádný runtime error ani run warning. První CLI launcher selhal `spawn UNKNOWN` na Windows; druhý běh připojil Lighthouse ke skutečnému Playwright Chromiu na debugging portu 9225 a dokončil audit. Reprodukce: `node scripts/audit-lighthouse.mjs <installed lighthouse/core/index.js>`. Neinstaluje app dependency. Lab TBT není INP. Probíhající mobilní kampaň/field Core Web Vitals neexistují jako důkaz tohoto auditu.

## Financial Accuracy Findings

Všechny následující zdroje byly v tomto auditu znovu otevřeny 14. října 2026. Datum katalogového snapshotu 9./13. října nebylo zpětně změněno na nové datum. Factsheet je datovaný 30. června; retrieval date a publication date nejsou stejné.

| Fond | Listing, index, sazba, příjem | Primární důkaz |
| --- | --- | --- |
| STXF / Strive 500 ETF | NYSE; Bloomberg US Large Cap Index; 0,0545 %; očekávané čtvrtletní distribuce | [issuer](https://www.strivefunds.com/stxf), [2Q26 factsheet](https://www.strivefunds.com/documents/FG/strive_funds/fund_docs/650255_STXF_2Q26_Fact_Sheet.pdf) |
| STXG / Strive 1000 Growth ETF | NYSE; Bloomberg US 1000 Growth Total Return Index; 0,18 %; očekávané čtvrtletní distribuce | [issuer](https://www.strivefunds.com/stxg), [2Q26 factsheet](https://www.strivefunds.com/documents/FG/strive_funds/fund_docs/638062_STXG_2Q26_Fact_Sheet.pdf) |
| SPY / State Street SPDR S&P 500 ETF Trust | NYSE Arca/USD; S&P 500; gross expense ratio 0,0945 %; čtvrtletní distribuce; ISIN US78462F1030 | [State Street issuer](https://www.ssga.com/us/en/individual/etfs/state-street-spdr-sp-500-etf-trust-spy) |
| IVV / iShares Core S&P 500 ETF | NYSE Arca; S&P 500; 0,03 %; čtvrtletní distribuce | [iShares issuer](https://www.ishares.com/us/products/239726/ishares-core-sp-500-etf-ivv) |
| CSPX / iShares Core S&P 500 UCITS ETF USD (Acc) | LSE/USD; S&P 500; 0,07 %; akumulace; Irsko; USD share class; ISIN IE00B5BMR087 | [iShares issuer a listing tabulka](https://www.ishares.com/uk/individual/en/products/253743/ishares-sp-500-b-ucits-etf-acc-fund) |

STXF změna STRV→STXF od 8. června je doložená; není další ETF. [Prospekt publikovaný v katalogu](https://www.strivefunds.com/documents/FG/strive_funds/fund_docs/638064_Strive_Prospectus.pdf) byl také znovu otevřen a je dostupný; nynější issuer navigace odkazuje na [jinou dostupnou cestu](https://www.strivefunds.com/documents/FG/strive_funds/fund_docs/638027_Strive_Prospectus.pdf). Dokument obsahuje historický základní prospekt a dodatky, nikoli pouze nové vydání. Ve factsheetu je Strive sub-adviser a Empowered Funds adviser; série patří EA Series Trust. Starý reportový popisek „Emitent“ pro značku byl proto lokálně opraven na „Značka / poskytovatel“. Úplná evidence právních subjektů všech referenčních fondů není prohlašována.

IVV ISIN, domicil/měna některých fondů a AUM zůstávají explicitně neověřené katalogové hodnoty; není to podklad pro nákup. V této části nebyla nezávisle ověřena každá SEC URL, každý broker ani každá jurisdikční KID verze. [EU informace o KID](https://finance.ec.europa.eu/consumer-finance-and-payments/retail-financial-services/key-information-documents-packaged-retail-and-insurance-based-investment-products-priips_en?prefLang=lt) podporují nutnost informačních dokumentů pro retail; nejsou důkazem broker dostupnosti jednotlivého US ETF.

Nezávislý výpočet používá uzavřenou annuitní formuli, nikoli volání aplikace: `n=12*years`, `q=((1+r/100)*(1-c/100))^(1/12)`, `FV=initial*q^n + monthly*(q^n-1)/(q-1)`. Pro `q=1` je `FV=initial+n*monthly`. Příspěvek je na konci měsíce. Baseline `c=0`.

Default 100000/3000/20/5: vloženo **820000 Kč**, baseline **1482743,226468 Kč**, STXF **1472224,252544 Kč**, STXG **1448323,270670 Kč**, rozdíl **23900,981874 Kč**. Skutečný frontend ukazuje **1 472 224 / 1 448 323 / rozdíl 23 901 Kč**. Dopad nákladů je přibližně 10518,973924 / 34419,955798 Kč; zahrnuje ušlé zhodnocení. Nejde o pouhý součet stržených poplatků.

P osm scénářů přesně odpovídá nezávisle zaokrouhleným částkám: nulový počáteční vklad, nulový měsíční, oba nulové, 0% gross return, −30%, 50 let, desetinná čárka a default. SPY/IVV combo také odpovídá. Sazby procent se dělí 100, nikoli interpretuje jako desetinné sazby bez konverze. U validace pokrývají jednotkové/integrace neplatné hranice, nekonečna a fee injection. Model neslibuje skutečný budoucí výnos ani stejné riziko odlišných fondů; nepočítá brokerage/taxe/FX/tracking difference.

## Security and Privacy Findings

Technicky funguje parametrizované SQL, transakce, HMAC dedupe a capability hash, input caps, origin checking, report cookie a no-store/noindex, HTML escaping, CSRF omezení a anonymní dashboard/export guard. Příslušné důkazy v matrix a test artefaktech. Skutečný controller process ani právní základ to nenahrazuje.

Sken všech lokálních git refs zkontroloval **282 unikátních blobů** pro credentialed DB URL, API token patterns a privátní klíče: žádná shoda ([secret-scan.json](qa/final-audit/secret-scan.json)). Samostatný exact-value scan dostupných lokálních/cloud secret hodnot proti auditovým textovým artefaktům a novému AI exportu nenašel shodu. Export Vercel secrets je uložen pouze pod ignorovanou `.vercel`, nikoli verzován. Nejde o úplnou DLP certifikaci. Původní AI JSONL jsou syntakticky validní; jejich obsah není vydáván za ověřené testy.

CSP nadále povoluje unsafe-inline scripts/styles kvůli bootstrapu a stávajícímu UI. Nonce hardening není implementovaný. Žádný exploit tímto auditem prokázán nebyl; jde o Medium defense-in-depth omezení. Per-email throttle je sdílený v PostgreSQL, ale neomezuje všechny nové emaily dohromady. Admin login má společný DB limit 20/15min a neukládá IP; může zablokovat i legitimního správce. Heslo vybrané vlastníkem nelze z hash presence označit za silné.

## Conversion and UX Findings

První mobilní zkušenost má konkrétní nákladovou otázku, jednu hlavní akci, viditelné selektory a žádnou velkou stock ilustraci. Čísla nejsou uzamčená emailem; report nabízí skutečný checklist/horizonty. Vizuální hodnocení: soudržný finanční pracovní nástroj s modrotyrkysovou paletou, tabulárními čísly a jasným rozlišením modelu. Neexistuje důkaz uživatelské preference „premium“ ani naměřené konverze; nepředstíráme jej.

P readiness pro modelový výsledek přibližně 0,29–0,32 s v tomto warm browser běhu; není to spolehlivý cold-start SLA. Na 375 px má consent lišta asi 209 px a do volby překrývá dolní detaily. CTA a selektory zůstávají použitelné. Testovací upozornění původně posunulo první peněžní vstup pod 812px obrazovku. Lokální oprava upravuje pouze kompaktní demo spacing, zachovává texty/touch targets a nyní vstup končí na 778,98 px na 375 i 390 px. P screenshoty před opravou a L screenshoty po ní jsou uchované.

Email výměnou za report, který není emailem doručován, má vysvětlenou technickou cestu, ale skutečný účel dalšího uchování kontaktu není zatím schválen. Produkční privacy state a testovací varování snižují vhodnost pro placený traffic; nelze je prostě odstranit a předstírat legal readiness. Dvě reklamy jsou reálné koncepty, nikoli spuštěná kampaň. Onsite A/B randomization není součástí appky; parametr reklamy není experiment exposure.

## Defect Register

| ID / závažnost | Route/files a kroky | Expected / actual / příčina | Oprava a retest |
| --- | --- | --- | --- |
| F01 **High**, otevřeno | P `/privacy`, poté lead nabídka | Skutečný kontaktní/provozní základ pro kampaň; actual test placeholder a text o neschválené privacy. Příčina záměrný hiring setup. | Vlastník dodat skutečný kontakt, potvrdit správce, účel/právní základ, příjemce a žádosti. Nepřepsáno fiktivně. Stav FAIL pro komerční launch. |
| F02 **High**, otevřeno | `scripts/cleanup.mjs`, `vercel.json`, privacy retention | Ověřený plánovaný cleanup a proces žádosti; actual pouze funkční ručně spustitelný skript a navržené lhůty. | Schválit lhůty, nastavit bezpečný scheduled provoz, audit výmazu a záloh. Lokální scoped deletion/retention I PASS; produkční schedule NOT VERIFIED, žádný externí cron v dostupném přístupu nebyl nalezen/ověřen. |
| F03 **High**, otevřeno | Hosting `docs/DEPLOYMENT.md` a Vercel plan | Tarif dovolující komerční použití; actual Hobby test projekt. | Před kampaní vlastníkem schválit vhodný hosting/tarif; [Hobby pravidla](https://vercel.com/docs/plans/hobby) omezují nekomerční osobní použití. Žádný upgrade/provoz kampaně proveden. |
| F04 **Low**, opraveno lokálně | načíst production build, `security.spec.ts`, `lib/analytics/acquisition.ts` | Žádný eval probe pod CSP; actual script-src violation. Příčina acquisition schema vznikla před `schemas.ts` konfigurací. | Společný runtime import `lib/validation/zod.ts` nastaví jitless před každým runtime schema. Lokální browser security test PASS; production neopravená verze nebyla znovu nasazena. |
| F05 **Medium QA**, opraveno | `tests/e2e/live-funnel.spec.ts`, consented flow | Strict allowlisted obálka včetně jediného landing acquisition; actual assertion očekává starou obálku. | Test přesně kontroluje UTM i acquisition pouze u landing, bez povolení arbitrary properties. Finální oba consented toky PASS, cleanup PASS. |
| F06 **Medium UX**, opraveno lokálně | 375/390×812 s DEMO_MODE, `app/globals.css` | První peněžní vstup v prvním viewportu po volbě cookies; actual bottom 864,53 / 814,34 px. | Kompaktní demo spacing, menší stále čitelný hero. L bottom 778,98 oba viewporty, axe/overflow PASS. Deployment před opravou dál FAIL tohoto kritéria. |
| F07 **Medium**, otevřeno | nové validní emaily / nové analytics sessions | Přiměřená ochrana při paid traffic; actual limit je jen per-email/session. Změna emailu/nová relace obchází tuto kvótu. | Doplnit a otestovat deployment-layer spam/bot ochranu nebo rozumný globální limit/CAPTCHA podle trafficu, bez sběru fingerprintů. Neproveden flood produkce; rozsah limita doložen SQL a I. |
| F08 **Medium**, otevřeno | `lib/dashboard/data.ts` cohort, dashboard | Známá test/bot kohorta vyloučená z paid metrics; actual nerevokované landing sessions nemají explicitní exclusion filtr. Docs SQL má návrh, aktivní UI ne. | Přidat explicitní exclusion/test classification s průhlednými pravidly před analýzou kampaně. Tento audit své sessions odstranil, takže nezůstal v kohortě. |
| F09 **Low financial labeling**, opraveno lokálně | report fund details + HTML export | Rozlišit značku a právního emitenta; actual Strive sub-adviser zobrazen jako „Emitent“. | Obě verze reportu používají „Značka / poskytovatel“; legacy `issuer` field dokumentované jako brand. Právní struktura EA Series Trust již uvedená. Unit/report browser retest PASS. |
| F10 **High dev advisory / Low runtime exposure**, otevřeno | `npm audit`, eslint-config-next → fast-glob → micromatch → braces | Žádný high audit nález; actual 5 entries z jednoho braces advisory GHSA-vfj7-8cjw-p6xm. | Npm nabízelo nekompatibilní downgrade eslint-config-next 14.2.35; nevykonán. `npm view braces version` v době auditu vrací 3.0.3, která je v affected range. Omezit nedůvěryhodné lint glob vstupy, sledovat kompatibilní upstream opravu. Prod omit-dev 0. |

Nejsou automaticky opravovány subjektivní preference ani funkční model. F01–F03 vyžadují rozhodnutí vlastníka; skrýt předstartovní texty není oprava jejich příčiny. Podpora dashboardu přes vzdálený login je doložená evoluce architektury, není automaticky bezpečnostní defekt.

## Final Verdict

1. **Splňuje projekt Assignment B?** Převážně funkční/technické požadavky dostupného zadání ano. **Úplnou launch-ready shodu nelze potvrdit** kvůli F01–F03 a provozním omezením; původní employer dokument není dostupný.
2. **Fungují všechny kritické funkce?** Kalkulačka, skutečné ukládání, automatické report fulfillment a opt-in funnel fungují v provedeném production toku. **Ne každá funkce byla plně produkčně ověřena**: pozitivní admin login/CSV, concurrency load, reálný DB outage a scheduled retention mají výslovný omezený stav.
3. **Lze bezpečně sbírat skutečné leady?** Technický tok je ověřen, **komerční sběr zatím ne**, dokud není schválen skutečný provozní/legal základ a výmazový kontakt/postup.
4. **Lze zítra spustit placenou reklamu?** **Ne.** Nezaměňovat fungující hiring demo s hotovým komerčním provozem.
5. **Co dokončit do 16. října 2026?** Vlastník uzavřít F01–F03, potvrdit retention/request proces a přiměřenou spam ochranu. Po samostatné autorizaci nasadit lokální opravy a retestovat konkrétní nový SHA. Před reálným vyhodnocením kampaně řešit F08, potvrdit oprávněný admin přístup a kompatibilní nápravu F10 nebo dokumentované dev-risk omezení. Pokud má zůstat pouze hiring demo, transparentně deklarovat tento limit hodnotiteli.

AI záznam této práce: skutečný dílčí runtime export `ai-log/codex-2026-10-14-final-audit.jsonl`, bez tool outputs, reasoning, secrets a pozdějších dosud neuložených zpráv. Není rekonstruovaný chat ani Claude export.
