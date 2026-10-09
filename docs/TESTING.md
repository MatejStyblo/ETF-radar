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
