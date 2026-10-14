# Finální odevzdání — 14. října 2026

Aktuální produktový přehled je v kořenovém README. Starší audit/README zachovávají historické stavy, které se nesmějí vydávat za současnou verzi.

## Rozsah a změny

- GitHub default branch ověřena přes API jako `devel`, repository public. Vercel production branch již sleduje `devel`.
- README sjednocen s nasazeným produktem: cílovka, funnel, NYSE rozhodnutí, zdroje, analytika, konverzní hypotéza, tři A/B testy, setup, deployment, AI a omezení.
- Náhled horizontů používá skutečný buildReport a mění se s fondy/vstupy. Invalidní scénář nezobrazuje stará čísla.
- Dvě hotové PNG/SVG reklamní grafiky 1080 × 1350, s reálným screenshotem a finančními qualifiers. Vizuálně zkontrolované; žádná kampaň neběžela.
- Stručné testovací upozornění v místě kontaktu a srozumitelné demo soukromí. Žádný fiktivní funkční email ani právní základ; uživatel potvrdil testovací účel.
- Autentické navazující exporty AI v ai-log, s popsaným rozsahem a vynecháním citlivých zpráv.

## Kontroly před deploymentem

Na lokálním produkčním buildu na http://127.0.0.1:3103, oddělená DB `etf_radar_nyse_test`, dashboard vypnutý:

| Kontrola | Výsledek |
| --- | --- |
| Lint | PASS |
| Typecheck | PASS |
| Unit | 102 passed |
| PostgreSQL integrace | 43 passed |
| Produkční build | PASS |
| Browser suite | 28 passed / 4 skipped |
| Browser audit 375, 390, 768, 1440 px | 43 kontrol PASS, 0 failures |

Browser suite obsahuje tři skutečné lokální browser → DB → report průchody se souhlasem i bez něj, bez mockovaného API, se scoped cleanup. Přeskočené scénáře: dvě opt-in kontroly aktivního dashboardu, jeden traffic/dashboard scénář a jeden samostatný cloud/deployment scénář. Veřejná aplikace má samostatný následný smoke. Audit ověřil axe bez violations, overflow, první mobilní vstup, numerické scénáře vůči nezávislému uzavřenému vzorci, chybné emaily, reklamu B a anonymní guards. [Artefakty](qa/handoff/local-browser/results.json).

## Produkce

Následné ověření Git deploymentu a skutečného formuláře/PDF se doplní po nasazení. Sensitive cloud env nelze stáhnout jako skutečné hodnoty; nezávislý produkční SQL/cleanup není součástí tohoto běhu. Smoke používá pouze syntetický email a označenou QA kampaň; případné testovací řádky zůstanou v testovací DB a budou výslovně evidovány.

## Hranice dokončení

Funkční výběrové demo může být odevzdané s veřejným repozitářem a URL. Pro skutečné leady/kampaň zbývá provozní privacy kontakt, účel/právní základ, pravidelný výmaz a zálohy, spam ochrana, test/bot exclusions a hosting umožňující komerční provoz. Žádný z těchto bodů neprohlašujeme za hotový pouhou změnou textu. Nové Lighthouse měření se zveřejní jen pokud skutečně proběhne; starší skóre je historické.
