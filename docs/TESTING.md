# Ověřování — průběžný záznam

## Milník numerického jádra a reportu, 9. října 2026

Skutečné lokální prostředí: macOS, Node 22.23.1, npm 10.9.8. PostgreSQL 17 v samostatném Docker containeru `etf-radar-postgres` na localhost portu 55439; `pg_isready` potvrdil dostupnost. Aplikační DB `etf_radar`, oddělená integrační DB `etf_radar_test`. Dosavadní numerické kontroly DB nepotřebují.

| Skutečně spuštěná kontrola | Výsledek |
| --- | --- |
| První `npm run test` před engine | RED: chybějící calculation modul. Nejde o úspěšný test. |
| Jeden recurrence test po implementaci | GREEN: 1 test prošel. |
| Přidané limity před validací | RED: invalid negative initial byl přijat, assertion očekávající throw selhal. |
| Jádro + schema + report model | GREEN: 8 testů prošlo, `npm run typecheck` exit 0 v tehdejším rozsahu. |
| Report HTML před rendererem | RED: chybějící renderer. |
| `npx vitest run tests/unit/calculations.test.ts tests/unit/validation.test.ts tests/unit/report.test.ts tests/unit/report-html.test.ts` | GREEN: 4 test files, 10 tests passed, exit 0. |
| `npm audit --omit=dev --registry=https://registry.npmjs.org` | 0 production dependency vulnerabilities při tomto běhu. |
| `npm audit --registry=https://registry.npmjs.org` | 5 high dev findings v řetězci braces → micromatch → fast-glob → Next ESLint plugin/config. `audit fix --force` nenastartován, protože navrhuje downgrade Next lint config. Je to otevřený dependency risk, ne čistý celkový audit. |

Ověřeno: nulový výnos/fee, month-end contributions, proporcional annual fee, independent annual compounding, negative return a monotonicita vůči fee, invalid bounds/finiteness, lead schema, stejné/neznámé ETF, multi-horizon report model, skutečný standalone HTML obsah a escapování vloženého markup. RHF instalovaný 7.89.0, nikoliv verze 7.73.0 uvedená v install threat warning. Instalace proběhla se skutečným schválením tool approval, ne bypassem.

## Dosud neprohlášené výsledky

V tomto průběžném záznamu nejsou tvrzeny finální lint/build, DB integration, browser end-to-end, screenshots, axe ani Lighthouse. Frontend a backend jsou paralelní workstreams; parent musí po jejich návratu přečíst soubory, spustit kontroly a ověřit konkrétní DB záznam a report. Finální skutečné výsledky budou doplněny níže. Žádný production deployment ani reálná reklamní conversion rate.

## Závěrečná kontrolní sada

Typecheck, lint, unit, skutečné DB integration, production build, browser scénář v 375/768/1440 px. Browser musí ověřit ad variant B, výběr evropského UCITS doplňku, přepočet, invalid input, email submit bez marketing consent, report z cookie, HTML download a obsah, persistence exact row a no-consent analytics. Invalid origin/payload, DB outage, rate limit, duplicate/concurrency, idempotence retry, report authorization/expiry. Ruční screenshot review a no overflow, axe, keyboard. Testovací řádky uklidit; nevstupovat do unrelated DB.

## Ověření po nezávislém review, 9. října 2026

Review odhalilo dvě blokující chyby: odvolaný analytický souhlas při neúspěšném DELETE nezastavil serverové měření leadu a receipt replay vracel úspěch pro expirovaný či odstraněný report. Obě opraveny s pozorovanými RED → GREEN regresními testy. Druhé nezávislé review nenašlo blokující chyby.

| Kontrola zopakovaná hlavním agentem | Skutečný výsledek |
| --- | --- |
| `npm run typecheck` | Prošlo. |
| `npm run lint` | Prošlo bez warningů. |
| `npm run test` | 21 testů, 7 souborů, prošlo. |
| `npm run test:integration` | 19 testů proti skutečné lokální PostgreSQL, prošlo. |
| `npm run build` | Optimalizovaný produkční build prošel. |
| `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3103 npm run test:e2e` | 17 browser testů na produkčním buildu prošlo. Lokální testovací identita správce a `LEADS_ENABLED=true`; lead API scénáře používají intercepted responses. |
| `git diff --check` a `git diff --cached --check` | Prošlo. |

První pokus browser suite na portu 3102 bez konfigurace správce měl 13 pass / 4 timeouty, protože správně vypnutý capture deaktivoval formulář. Po spuštění stejného buildu s výslovnou lokální testovací konfigurací na portu 3103 prošlo všech 17 testů. Tato konfigurace není skutečná identita produkčního provozovatele.

Regrese pokrývají consent header nezávislý na cookie, cross-tab withdrawal, retry neúspěšné revokace včetně reloadu, obnovení idle analytics session a `410 REPORT_EXPIRED` pro neplatný replay se zachováním vstupů. Integrační testy ověřují skutečné databázové zápisy; browser testy s intercepted lead API nejsou důkazem společného browser → DB → report happy path. Tento společný tok, Lighthouse a externí deployment zůstávají k ověření.

## Skutečný browser → DB → report tok, 9. října 2026

Uživatel hlásil „Uložení je nyní nedostupné“. Reprodukováno na portu 3103: HTTP 503, protože testovací UI server měl povolený formulář a testovací identitu, ale chyběla mu backendová konfigurace. PostgreSQL byla dostupná. Server na portu 3103 byl restartován se skutečným lokálním připojením do oddělené `etf_radar_test`, odpovídajícím APP_ORIGIN a runtime generovanými secrets. Žádná tajemství nebyla vypsána nebo uložena do Gitu.

Playwright Chromium poté provedl bez interceptů skutečné vyplnění emailu a odeslání formuláře, redirect a download přes autorizovanou browser session:

- Landing HTTP 200; skutečný browser submit HTTP 200.
- Redirect na `/report`, viditelný „Checklist před nákupem“.
- `/report/download` HTTP 200, HTML obsahuje checklist.
- Readback přes parametrizované SQL: přesně jeden uložený lead pro unikátní testovací email.
- Testovací lead, report, receipt a jeho rate-limit bucket následně odstraněny.

Tím je lokální společný happy path ověřen; předchozí označení tohoto toku jako neověřeného výše zachycuje dřívější stav. Lighthouse a externí deployment nadále nejsou ověřeny. Lokální identita správce je pouze testovací, nikoli produkční.

## Závěrečné dokončení testovacího zadání, 10. října 2026

Uživatel upřesnil pouze testovací provoz a jméno `Matěj STýblo`; deployment je mimo rozsah. README, ANALYTICS, autentický redigovaný session export a podrobný QA report jsou součástí repozitáře.

- Typecheck, lint a produkční build prošly. Unit: **26 passed**; skutečné PostgreSQL integration: **25 passed**.
- Standardní browser suite: **19 passed / 2 skipped** (live flow se bez explicitního opt-in nezapisuje do DB).
- `LIVE_FUNNEL=1 LIVE_FUNNEL_DATABASE_URL=postgres://postgres@127.0.0.1:55439/etf_radar_test PLAYWRIGHT_BASE_URL=http://127.0.0.1:3103 npx playwright test tests/e2e/live-funnel.spec.ts --workers=1`: **2 passed**, bez interceptů. Souhlasící mobilní cesta má **13 skutečně uložených událostí**, odmítnutá desktopová cesta doručí report s **0 events**. Exact-row readback a vlastní cleanup jsou součástí testu.
- Nové CSP/favicon browser testy nejprve selhaly; po `jitless` konfiguraci Zod bez uvolnění produkční CSP a přidání ikony prošly.
- Přidané analytics regrese ověřují report bootstrap bez false landing eventu a zachování původní session při replayi. Live assertion původních 12 events selhal po rozšíření taxonomie; po explicitním zahrnutí technického `session_start` prošel s 13 events.
- Mobilní Lighthouse po opravách: **99 Performance / 100 Accessibility / 100 Best Practices / 100 SEO**, LCP **2,2 s**, TBT **60 ms**, CLS **0**, bez console errors a inspector issues. Dřívější výsledky jsou zachovány v QA reportu, nejde o průměr ani garanci hostovaného výkonu.

Prostředí, limity (zejména pouze lokální audit, nikoli Safari/real-device/screen-reader certifikace), skutečné příkazy a raw artifact paths viz `docs/QA_FINAL.md`. Nasazení ani reálná reklamní kampaň neproběhly.

## Lokální dashboard — 10. října 2026

Před implementací UI byly samostatně pozorované RED → GREEN kontroly server-renderovaného komponentu: guard před filtrem a DB, zobrazení předaných skutečných hodnot/filtrů, poctivá DB nedostupnost bez nul, tabulky/funnel/dvojice, backendem normalizované stránkování a nedostupný snapshot. Izolované Vitest kontroly komponentu používají mock pouze na hranici Next headers/notFound a dashboard backendu; jejich syntetický fixture **není DB důkaz ani statistika produktu**. Původně vznikly ve scratch workspace delegace; rodič je následně zachoval v `tests/unit/dashboard-ui.test.tsx` bez absolutních lokálních cest a bez vedlejšího exportu fixture.

Ověřeno v této UI delegaci:

- Izolované SSR kontroly: **6 passed**; před jednotlivými implementačními kroky byla zachycená očekávaná selhání.
- Layoutový test nejprve selhal na chybějící responsive grid; po CSS prošel při 375/768/1440 px: žádný document overflow a všechny tabulky scrollují ve vlastním keyboard-focusable boxu. Screenshoty jsou UI-only fixture, nikoli načtená databáze.
- Axe na UI-only fixture nejprve zachytil dva nepojmenované complementary landmarks; po odlišném pojmenování obou upozornění prošel při všech třech šířkách bez violations.
- Nezávislý SQL oracle z live testu byl zvlášť skutečně proveden v read-only transakci nad lokální `etf_radar_test` pro 7/30/90/all a různé varianty. Dotazy prošly; to ověřuje DB část testu, ne dosud nedostupný autorizovaný browser přehled.
- Cílený ESLint stránky a `tests/e2e/dashboard.spec.ts` prošel.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3103 npx playwright test tests/e2e/dashboard.spec.ts --workers=1`: **2 passed / 1 skipped** proti dosavadnímu lokálnímu serveru. Standardní test očekává vypnutý dashboard i CSV (404); druhý test odmítá cizí Host.
- Explicitně zapnutý live test zatím **selhal na očekávaném HTTP 200 proti skutečnému HTTP 404 starého/vypnutého serveru**. Připojení k lokální testovací DB bylo dostupné; žádný zápis nebyl proveden. Nejde o ověření autorizovaného dashboardu. Produkční rebuild, migraci a restart s lokálním dashboard opt-in provádí hlavní agent.

`dashboard.spec.ts` nespouští server, neinterceptuje úspěšné odpovědi a nezapisuje testovací kontakty. Live kontrola vyžaduje výslovný opt-in a přesnou lokální DB `etf_radar_test`; samostatným read-only SQL (bez použití `getDashboardData`) porovnává zobrazené totals k DB času načtení, přesné emaily/marketingovou volbu, filtry, SSR bez JavaScriptu, normalizaci stránky, limit eventů, CSV, 375/768/1440 px, axe a odkazy. Bez opt-in se tento live scénář přeskočí.

Po migraci a rebuild/restartu serveru s `DASHBOARD_ENABLED=true`, odpovídajícím lokálním `APP_ORIGIN` a loopback bindem:

```sh
LIVE_DASHBOARD=1 \
LIVE_DASHBOARD_DATABASE_URL=postgres://postgres@127.0.0.1:55439/etf_radar_test \
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3103 \
npx playwright test tests/e2e/dashboard.spec.ts --workers=1
```

Standardní E2E suite spouštějte proti serveru s vypnutým dashboardem; proti povolenému lokálnímu dashboardu nastavte `LIVE_DASHBOARD=1`. Databázový výpadek je ověřen izolovaným SSR testem; live sada sama databázi ani běžící server nevypíná. Žádný deployment ani vystavení kontaktních dat veřejně.

### Finální rodičovské ověření lokálního dashboardu

- Migrace 004 provedena proti skutečné lokální DB před restartem. Produkční server na `http://127.0.0.1:3103` přestavěn a povolený dashboard/CSV oba skutečně vrací HTTP 200, `no-store` a `noindex`. Server naslouchá pouze na `127.0.0.1`.
- Při restartu byly zachovány původní dedupe/report runtime klíče bez vypsání či commitnutí. Dočasný loopback inspector použitý pro přenos konfigurace byl uzavřen; port 9229 nezůstal otevřený.
- Poslední typecheck, lint a produkční build prošly; **74 unit / 39 PostgreSQL integration passed**. Součástí jsou 8 trvale uložených SSR regresí, oddělení primární metriky nových leadů od konverze relací a absence smyšleného procenta při nulovém denominatoru.
- Kompletní browser suite proti skutečnému povolenému serveru: **23 passed / 1 skipped**. Přeskočen je pouze test vypnutého dashboardu, protože tento server jej úmyslně povoluje. Tentýž disabled test a Host odmítnutí ověřeny proti dočasnému loopback serveru s `DASHBOARD_ENABLED=false`: **2 passed / 1 skipped** (autorizovaný live scénář zde úmyslně vypnutý). Dočasný server byl zastaven.
- Read-only browser dashboard ověřil čísla nezávislými SQL dotazy, filtry, emaily bez logování jejich hodnot, CSV, 375/768/1440 px, SSR bez JavaScriptu a axe bez violations. Původní live 404 výše je zachované historické selhání, nikoli finální stav.
- Oba skutečné lead flow scénáře nyní navíc před cleanup ověřují nově uložený email v dashboardu i CSV, totals proti PostgreSQL a dvojici CSPX/IVV v reportech; consented scénář i skutečné `etf_ids` v DB/event payloadu a měřených dvojicích. Otevření dashboardu nezvýšilo analytické události. Testy nemockují úspěšné API a uklidily pouze své vlastní záznamy.
- Filtry používají klouzavé DB časové okno a UTC zobrazení. Na samostatné kartě je primární nový-lead poměr; více nových emailů jedné relace může přesáhnout 100 %, zatímco podíl konvertujících relací je nejvýše 100 %.

Kompletní enabled browser běh:

```sh
LIVE_DASHBOARD=1 \
LIVE_DASHBOARD_DATABASE_URL=postgresql://postgres@127.0.0.1:55439/etf_radar_test \
LIVE_FUNNEL=1 \
LIVE_FUNNEL_DATABASE_URL=postgresql://postgres@127.0.0.1:55439/etf_radar_test \
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3103 \
npx playwright test --workers=1
```

### Oprava nalezená nezávislým review: návrat do dashboardu

Review našlo, že po SPA návratu z landing do dashboardu zůstal globální storage listener aktivní jako landing stránka. Změna souhlasu v jiné záložce tak mohla vytvořit falešný `landing_view`. Rodič reprodukoval chybu v module unit testu i na starém skutečném produkčním buildu přes dashboard → landing odkaz → browser back → souhlas v druhé záložce: nový browser test zachytil přesně jeden landing POST. Pouze jeho vlastní event/session/rate bucket byly odstraněny podle zachyceného UUID a readback ověřil nulu zbývajících vlastních událostí.

`initializeMeasurement` nyní vrací generačně chráněný cleanup, panel jej vrací z efektu; při odchodu se měření deaktivuje a queued práce invaliduje. POST/once/bootstrap vyžadují aktivní měřenou stránku. Withdrawal DELETE a retry zůstávají dostupné i při neaktivním měření; opožděný bootstrap jiné generace nesmí obnovit readiness. Po návratu na landing/report se měření aktivuje s odpovídajícím typem stránky.

Nejnovější finální výsledky po této opravě: **75 unit / 39 PostgreSQL integration passed**, typecheck/lint/build prošly. Proti znovu přestavěnému a restartovanému serveru: **24 browser passed / 1 skipped**, včetně skutečného cross-tab/navigation regresního testu (GREEN) a obou browser → DB → dashboard/CSV → report flow. Samostatná disabled sada: **2 passed / 2 skipped**; oba opt-in scénáře jsou zde úmyslně vypnuté. Předchozí počty výše jsou zachované mezikroky, nikoli aktuální konečný stav.
