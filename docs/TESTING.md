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
