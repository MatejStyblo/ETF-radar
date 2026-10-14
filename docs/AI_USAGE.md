# Poctivé použití AI

## Codex — přímé PDF ke stažení (14. října 2026)

Na požadavek uživatele Codex přidal serverový export uloženého reportu pomocí pdf-lib a fontkit s licencovanými lokálními fonty Noto Sans. Nezměnil finanční data ani kalkulační model. Použil PDF skill pro render a vizuální kontrolu všech stran; skutečné výsledky testů jsou v TESTING. Jeden kombinovaný dokumentační patch selhal na neexistující kotvě beze změn a byl následně aplikován s přesnými kotvami. Export zdrojové runtime konverzace pro tento navazující turn dosud není uložen; starší auditový log jej neobsahuje. Žádný push/deployment.

## Codex — odstranění velké cookie sekce (14. října 2026)

Na přímý požadavek uživatele odstraněn velký panel; zůstal nenápadný patičkový spouštěč stávajících voleb. Zachované chování souhlasu/revokace bylo skutečně znovu ověřeno, odpovídající UI testy i auditový skript nyní otevřou volby přes patičku. Jeden shellový pokus o změnu testovacích souborů selhal v parseru beze změn; úpravy dokončeny apply_patch. Výsledky a limity běhů jsou v TESTING. Žádný push/deployment; starý dílčí auditový runtime export tento pozdější turn neobsahuje.

## Codex — mobilní navigace (14. října 2026)

Navazující uživatelská reference vedla k přidání světlé mobilní spodní lišty s odkazy do existujících sekcí, bez nových finančních funkcí nebo backendových zápisů. Aktivní stav reaguje na scroll; cookie banner zůstává nad lištou. Skutečné browser a build výsledky jsou v TESTING. Dřívější zákaz push zůstává platný; nic se nenasazovalo. Tento turn není součástí dřívějšího dílčího auditového JSONL snapshotu.

## Codex — lokální tmavý design podle obrázku (14. října 2026)

Uživatel chtěl vizuální zkoušku podle dark/cyan finančního dashboardu a výslovně zakázal push před lokální kontrolou. Codex upravil obrazovkovou CSS vrstvu a přidal přepínání skutečných katalogových ETF, bez generovaných finančních dat nebo radarových skóre. Tiskový/stažený HTML report zůstává světlý. Ověření a reálné chyby při prvních bězích jsou v TESTING. Žádný push/deployment ani změna produkční konfigurace. Tento navazující turn není součástí dřívějšího finálního auditového exportu, který je výslovně dílčí snapshot.

## Codex — nezávislý finální audit (14. října 2026)

Uživatel dodal execution zadání auditu. Codex sám, bez subagentů, nově ověřil repo/deployment/primární zdroje, testy a skutečný production DB/report funnel. Produkční testovací zápis byl proveden až po aktuálním výslovném povolení, vlastní data odstraněna a readback ověřen. Opravil doloženou import-order CSP regresi, zastaralou event assertion, změřený demo mobile spacing a reportový popisek značky. Neprovedl push/deploy ani změnu secrets. Důkazy, otevřené provozní/legal blokery a skutečné počáteční neúspěchy jsou v FINAL_AUDIT/TESTING. Jeden patch s chybnou kotvou do dokumentu byl odmítnut beze změny a znovu aplikován s přesnými kotvami. Automatická kontrola jednou odmítla shellový restart lokální repliky s pouhým „blocked by policy“; běžné spuštění z explicitního privátního env souboru následně prošlo, bez změny produkce.

`ai-log/codex-2026-10-14-final-audit.jsonl` zachovává skutečné nezměněné user/assistant message response_item z runtime této session. Jde o dílčí snapshot, bez reasoning, tool calls/outputs a pozdějších dosud neuložených zpráv. Nejde o rekonstruované výsledky ani Claude export.

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

## Codex — zdroje návštěv a neodeslané formuláře (14. října 2026)

Na přímý požadavek uživatele Codex rozšířil existující lokální dashboard a opt-in analytics, bez externí služby či deploymentu. Přidal acquisition migraci, sanitizaci UTM/referrer hostname, přehled měřené landing kohorty a potvrzených DB uložení. Zdůrazněn rozdíl relace/člověk a aktivní návštěvy/neodeslané formuláře. Při práci původní Python příkaz selhal, protože Python není na PATH; žádné soubory jím nebyly změněny, úpravy provedeny přes apply_patch a Node. Pro browser QA bylo nutné nainstalovat odpovídající Playwright Chromium; původní dostupný build neodpovídal runneru a nešel spustit. Skutečné výsledky viz TESTING. Export této session je dílčí runtime záznam, nikoli rekonstruovaný rozhovor.

## Codex — cookie lišta (14. října 2026)

Na výslovný požadavek uživatele vznikla viditelná spodní nemodální lišta nad stávajícím consent API; bez změny právního režimu nebo automatického povolení měření. Při vizuální kontrole mobilního screenshotu byl odhalen překryv vývojového Next indikátoru s tlačítkem, proto přesunut do pravého horního rohu. Existující browser test obálky událostí byl aktualizován na acquisition pole z předchozí změny; schéma aplikace se v tomto kroku neměnilo. Podrobné výsledky v TESTING.

## Codex — příprava Vercel Hobby (14. října 2026)

Uživatel výslovně povolil bezplatné nasazení. Codex ověřil oficiální podporu Node 24 a podmínky Hobby, připravil upload exclusions a build konfiguraci, spustil skutečný build. Na Vercel chybí přihlášení ve webu i CLI; vyžádán uživatelský login, žádné credentials nebyly vypsány ani commitnuty. Deployment ani cloud DB zatím nevytvořeny.

Dokončení Vercel: uživatel dokončil CLI login a přijal podmínky Neonu v prohlížeči. CLI vytvořilo projekt, připojilo existující GitHub repo a nainstalovalo Neon Free. Integrace automaticky přidala dva agent skills; ty nejsou aplikační závislost ani součást deploymentu. Doplněn oddělený režim autentizovaného cloud dashboardu, namísto zveřejnění původního lokálního guardu. Cloud migrations a skutečný browser → cloud DB → report → dashboard/export smoke prošly. První test odhalil logout 403; opraven způsob POST se zachováním Origin kontroly a celý cloud test zopakován úspěšně. Podrobnosti, skutečné deployment ID a limity v TESTING a DEPLOYMENT.

## Codex — Git deploymenty z devel (14. října 2026)

Na výslovný požadavek uživatele nastaven produkční branch tracking na devel. Původní main zůstala beze změny. Nová větev obsahuje aktuální ověřený stav a byla pushnuta bez force. První push zahájil preview, protože změna produkční větve ještě nebyla dokončená; po potvrzení UI a nezávislého API další push zahájil skutečný production Git build a přepnul veřejný alias. Žádné GitHub Actions nebo nové credentials v repozitáři. Skutečná evidence v TESTING, screenshot nastavení v docs/qa a dílčí autentický runtime export v ai-log.

## Vlastní heslo dashboardu — 14. října 2026

Uživatel výslovně požádal nahradit generovaný klíč jím zvoleným krátkým heslem. Přidán salted scrypt pro běžná hesla, zachována kompatibilita generovaných klíčů, origin guard, rate limit a HttpOnly/Secure cookie. Heslo bylo nastavené mimo Git; zprávy tohoto turnu obsahují credential, proto je neexportujeme do verzovaného ai-log. Existující skutečné exporty předchozích nesenzitivních interakcí zůstávají.

## Finální odevzdání — 14. října 2026

Uživatel povolil navržené dokončení a změnu výchozí GitHub větve na devel, následně potvrdil výhradně testovací účel s realistickým vzhledem. Codex nastavil default branch přes autentizované GitHub API, zkrátil README pro hodnotitele, doplnil náhled přes stejný buildReport jako fulfillment a vytvořil reklamy jako SVG/PNG ze skutečného screenshotu bez nové závislosti. Soukromí vysvětluje demo, skutečné technické ukládání a chybějící provozní kontakt; žádná fiktivní identita, rozesílání, placený hosting ani komerční kampaň nebyly přidány. Dva dokumentační patche nejprve selhaly kvůli duplicitní operaci na jednom souboru a chybné kotvě; nebyly aplikovány a byly opraveny přesnými operacemi. Vercel env pull vrací pro sensitive proměnné pouze placeholders, proto produkční smoke nedokládáme jako nezávislý SQL audit. Přímé SQL a cleanup byly ověřeny v oddělené lokální DB; veřejná verze se ověřuje skutečným formulářem, reloadem serverového reportu a staženým PDF. Aktuální runtime snapshoty jsou v ai-log; přesný rozsah/filtr je uveden v jeho README.

## Odstranění reklamních obrázků — 14. října 2026

Na výslovný požadavek uživatele odstraněny oba PNG/SVG reklamní obrázky, jejich generátor a odkazy v aktuálním README/ADS/HANDOFF. Textové návrhy dvou reklam podle zadání zůstávají. Předchozí popis tvorby je historický záznam skutečné AI práce, nikoli tvrzení o aktuálně přiložených souborech. Webová aplikace a její funkce se nemění.
