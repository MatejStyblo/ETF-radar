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

Původní lookup během vývoje nevrátil uložené session records. Pozdější skutečný `hermes sessions list --workspace ETF-radar --limit 5` již našel aktuální session `20261009_171555_dc5d1e`. Pomocí `hermes sessions export ai-log/hermes-session.jsonl --format jsonl --session-id 20261009_171555_dc5d1e --redact --yes` byl vytvořen autentický lokální snapshot rodičovské konverzace. Export obsahuje jeden JSONL session record se skutečným polem `messages`; není to rekonstruovaný chat ani Claude Code log. JSON byl programově parsován a kontrola potenciálních hesel v PostgreSQL URL a literal serverových secrets nenašla shody. Export obsahuje dosavadní historii, nikoli budoucí zprávy; před veřejným sdílením je stále nutná kontrola osobních a lokálních údajů.

Ověřeno pomocí skutečného `hermes sessions export --help`:

1. Po uložení session zjistit správné ID v aplikaci nebo přes `hermes sessions list --workspace ETF-radar --limit 10`.
2. Exportovat pouze tuto konkrétní session: `hermes sessions export ai-log/hermes-session.jsonl --format jsonl --session-id <SKUTECNE_ID> --redact`.
3. Pro Markdown export: `hermes sessions export ai-log/ --format md --session-id <SKUTECNE_ID> --redact --lineage logical`.
4. Před sdílením ručně zkontrolovat osobní údaje, credentials a unrelated context. Nikdy nepoužít upload/public/delete-after-verified bez oprávnění.

ID v ukázkových příkazech je viditelně placeholder; skutečný export výše používá ověřené session ID. Genuinní runtime delegation transcript lze uchovat jako dílčí agentový záznam a výslovně odlišit od rodičovského exportu. Export nepublikujeme externě; jeho snapshot lze při finálním odevzdání obnovit stejným příkazem.


## Codex — vizuální úprava 12. října 2026

Uživatel schválil paletu modrá/tyrkysová/bílá a implementační plán. Codex upravil společné CSS tokeny, mobilní rozestupy, CTA, zvýraznění výsledků, formulář, report a jeho samostatné HTML. Finanční data a výpočetní model nebyly měněny. Ověření zahrnuje existující unit a browser testy a ruční kontrolu screenshotů. Po počátečních selháních byl opraven kontrast malých popisků a mobilní poloha vstupu; formulářové testy dostaly dočasnou procesovou konfiguraci, nikoli změnu produkčních pravidel. Podrobnosti skutečných běhů viz TESTING.

Skutečné zprávy a nástrojové záznamy této Codex session jsou uchovány jako dílčí runtime snapshot `ai-log/codex-2026-10-12-visual-redesign.jsonl`; formát, rozsah a vynechané záznamy vysvětluje `ai-log/README.md`. Nejde o přepis vytvořený ze vzpomínek.

Návazná úprava ve stejné Codex session: uživatel dodal obrazovou předlohu. Codex přizpůsobil typografii, samostatné panely, SVG hero a výsledkový přehled. Grafické poměry z předlohy nenahradily reálná data: mini sloupce mají společnou nulovou škálu a zůstatky z existujícího modelu. Typy, lint, 75 unit testů a 17 cílených browser testů prošly.

Codex doplnil na žádost uživatele interaktivní graf modelového scénáře (12. října 2026). Data používají skutečné roční hodnoty finančního jádra. Ověřena škála od nuly, nulové a záporně výnosové scénáře, klávesnice/touch a změna horizontu. První běh odhalil React SSR problém vícenásobných textových children SVG `<title>`; opraveno jediným řetězcem. Dočasně byl omylem zvolen obsazený port se starým náhledem; tento běh se nepovažuje za ověření změny. Následné běhy používají vlastní náhled na portu 3120.
