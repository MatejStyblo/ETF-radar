# Poctivé použití AI

## Nástroj a rozsah

Použit Hermes Agent (Nous Research), v této konverzaci s modelem uvedeným runtime jako gpt-6.1-sol / openai-codex. AI pomohla s discovery, českým product copy, interpretací zdrojů, architekturou a implementací/testy. Dvě skutečné delegované workstreams řeší backend a frontend; parent ověřuje jejich self-reports vlastním čtením a spuštěním. Nejde o Claude Code session a nevydáváme výstupy za jeho logy.

Rozhodnutí jako konverzní hypotéza 2–5 %, audience motivation, expected A/B uplift a design rationale jsou návrhy, ne pozorovaná data. Finanční facts pocházejí z primárních issuer/NYSE/EC zdrojů; neověřené metadata zůstávají null. Výpočty jsou vlastní zjednodušený testovaný model, nikoliv forecasting model nebo investiční poradenství.

## Skutečné chyby a opravy

- `AGENTS.md` v prázdném worktree chyběl; přečten skutečný nadřazený soubor a při bootstrapu převzat do projektu.
- První `/plan` znamenal pouze plán; navazující explicitní zadání přidalo implementaci a hodnotnější report.
- Web extract backend neuměl URL extraction; issuer stránky načteny přímo přes HTTPS. Nevyrobeny syntetické odpovědi.
- Výchozí npm registry vracel 403; pro tuto instalaci použit veřejný npm registry bez úpravy globální konfigurace. Konkrétní verze uzamčené lockfilem.
- Numerical/schema/report testy nejprve selhaly kvůli neimplementovaným features; invalid-bound assertion nejprve prokázala přijímání špatného vstupu, potom byl doplněn guard a kontrola prošla.
- Sources checker upozornil na nepotřebné research candidates a příliš mnoho citací v jedné řádce; task ledger obsahuje jen použité zdroje a zdrojové věty byly odděleny. Verifikace je zaznamenaná, ne fabricated.
- Dependency audit má známé high dev findings; neskrýváme je tvrzením, že celý audit je clean. Production subset při zaznamenaném běhu clean.

## Autentické konverzační exporty

Aktuální `session_search` během vývoje nevrátil žádné uložené session records. To neprokazuje, že desktop log neexistuje; nelze z toho vytvořit autentický export rodičovské konverzace. Nepíšeme proto rekonstrukci chat historie do `ai-log/`.

Ověřeno pomocí skutečného `hermes sessions export --help`:

1. Po uložení session zjistit správné ID v aplikaci nebo přes `hermes sessions list --workspace ETF-radar --limit 10`.
2. Exportovat pouze tuto konkrétní session: `hermes sessions export ai-log/hermes-session.jsonl --format jsonl --session-id <SKUTECNE_ID> --redact`.
3. Pro Markdown export: `hermes sessions export ai-log/ --format md --session-id <SKUTECNE_ID> --redact --lineage logical`.
4. Před sdílením ručně zkontrolovat osobní údaje, credentials a unrelated context. Nikdy nepoužít upload/public/delete-after-verified bez oprávnění.

ID je viditelně placeholder pro skutečné ID; není vyrobená identita session. Genuinní runtime delegation transcript lze uchovat jako dílčí agentový záznam a výslovně odlišit od plného parent exportu. Finální odevzdání má obsahovat skutečný dostupný export; jeho absence je dokumentační limitation, nikoliv vyplněná falešným přepisem.
