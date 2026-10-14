# ETF Radar — rozhodnutí a předpoklady

## D29 — Přímý PDF soubor ke stažení (14. října 2026)

Na výslovný požadavek uživatele je PDF hlavním exportem na `/report`. Serverová Node route `/report/download/pdf` načte stejný uložený snapshot přes stávající HttpOnly cookie a vytvoří samostatné A4 PDF pomocí pdf-lib. Žádný email ani token nevstupují do obsahu. Bez oprávnění nebo po expiraci vrací 401; skutečné selhání vrací chybu, nikoli náhradní dokument. Odpověď je private/no-store a attachment. Vložené lokální Noto Sans Regular/Bold podporuje češtinu, má přiloženou OFL licenci a je zahrnuté do Next file tracing. Export nevyžaduje vzdálené fonty nebo headless browser. HTML a tisk zůstávají alternativami; historické D07 popisuje původní stav, který toto rozhodnutí rozšiřuje. Změna je lokální bez push/deploymentu.

## D28 — Funkční reportový tok v uživatelově lokálním náhledu (14. října 2026)

Uživatel upozornil na deaktivované tlačítko získání reportu. Příčina byla procesová LEADS_ENABLED=false ponechaná při vizuálním preview, nikoli emailová validace nebo chyba tlačítka. Náhled3140 nyní používá oddělenou lokální DB `etf_radar_preview`, migrace001–005, přesný loopback origin a vlastní stabilní secrets v ignorovaném `.vercel/local-preview.env`. Restart přes `node .vercel/run-preview.mjs` načte tuto konfiguraci. Společný backend gate nebyl obcházen ani změněn. Existující DB kontakty nebyly kopírovány, produkce se nemění.

## D27 — Odstranění horního testovacího upozornění (14. října 2026)

Na výslovný požadavek uživatele bylo ze společného layoutu odstraněno horní testovací upozornění na všech stránkách. Odstraněny také jeho nepoužívané CSS větve a DEMO_MODE z příkladu env. Historické auditové důkazy zůstávají záznamem tehdejšího stavu. Produkční secrets/config ani právní a provozní informace stránky soukromí nebyly změněny. Změna je lokální, bez push/deploymentu.

## D26 — Pouze nenápadné cookie nastavení v patičce (14. října 2026)

Uživatel požádal odstranit velký blok nastavení cookies. MeasurementPanel nyní vykresluje pouze textový spouštěč „Nastavení cookies“ v patičce landing page i reportu; samostatná sekce a viditelný stav měření byly odstraněny. Pro čtečky zůstává skrytý status. Spouštěč otevírá existující consent lištu; při již povoleném měření její první volba „Odvolat“ provede stejnou revokaci jako dřívější samostatné tlačítko. Odmítnutí/souhlas, serverový mechanismus, synchronizace mezi záložkami, retry a focus návrat zůstávají funkční. Žádný push/deployment.

## D25 — Plovoucí tmavá mobilní lišta (14. října 2026)

Uživatel upravil referenci: navigace má ladit s tmavým nástrojem a lehce levitovat. Lišta nově používá stejné surface/line/muted/accent tokeny, zaoblení všech rohů, jemný stín, 8px boční mezery a 5px mezeru od spodku. Na zařízeních s větší safe-area zůstává nad bezpečnou oblastí. Mezi položkami je 4px mezera. Rezervovaný prostor a poloha cookie banneru zohledňují celý plovoucí blok. Funkce navigace se nemění; žádný push/deployment.

## D24 — Mobilní spodní navigace podle reference (14. října 2026)

Na mobilu přidána světlá spodní lišta se čtyřmi odkazy Domů / Kalkulačka / Výsledky / Report a Lucide ikonami. Odkazy vedou do existujících sekcí; Report vede k nabídce vytvoření reportu, nepředstírá přístup k soukromému dokumentu. Scroll a změna layoutu aktualizují aria-current a zvýraznění aktivní sekce. Při neplatném scénáři je odkaz na chybějící výsledky označen aria-disabled. Lišta respektuje safe-area, rezervuje místo pod obsahem, na desktopu i při tisku je skrytá. Cookie lišta se na mobilu posune nad navigaci. Nová navigace neposílá analytics bez stávajícího souhlasu. Změna zůstává lokální, bez push a deploymentu.

## D23 — Lokální tmavý náhled podle reference (14. října 2026)

Uživatel výslovně požádal vyzkoušet vzhled dodaného finančního dashboardu a nejdřív jej vidět lokálně, bez push. Nová obrazovková vrstva `app/terminal-preview.css` používá canvas #080d15, panely #0e1524, cyan #00d1ee, čitelné tlumené texty a monospace čísla. Úvod je kompaktní, desktop má přehled sazeb a rychlý výběr skutečných fondů, graf je výše. Na mobilu se redundantní horní přehled skrývá; oba selektory a parametry zůstávají dostupné. Print CSS a stažený HTML report si ponechávají světlý tiskový vzhled.

Reference slouží vzhledu, nikoli finančním datům. Žádné smyšlené AUM, Sharpe, P/E, tržní kotace nebo radarové skóre nepřidány. Horní metriky vycházejí z katalogových sazeb, jejich rozdílu v procentních bodech a aktuálního scénáře. Rychlý výběr skutečně mění porovnání a při volbě druhého fondu prohodí dvojici, aby ji nezdvojil. Analytické události používají stávající taxonomii/souhlas. Náhled běží na `http://127.0.0.1:3140`; capture je pro tuto dočasnou preview instanci vypnutý. Žádný push ani deployment.

## D22 — Nezávislý audit a omezené opravy (14. října 2026)

Nový audit nebere staré výsledky jako důkaz. Produkční syntetický zápis byl proveden až po výslovném souhlasu v aktuálním chatu; cleanup používá pouze přesná vlastní ID a ověřuje nulu. Lokální/produkční důkazy zůstávají oddělené. Runtime Zod konfigurace patří před všechny object schemas, protože acquisition může být vyhodnocena před hlavním schema modulem. Report zobrazuje značku jako „Značka / poskytovatel“, nikoli právní emitent. Kompaktní demo spacing opravuje změřenou mobilní polohu vstupu, bez odstranění pravdivého varování. Nic se automaticky nenasazuje. Detailní metodika, závady a retesty: [FINAL_AUDIT](FINAL_AUDIT.md).

**Aktuální revize 13. října 2026:** D18 níže nahrazuje původní výběr v D02 a pracovní interpretaci NYSE-family v D03. Původní rozhodnutí ponechána jako historický kontext, nikoliv aktuální scope.

Datum: 9. října 2026. Stav rozhodnutí: navržené pro implementaci, není-li uvedeno jinak. Výchozí specifikace: přečtený nadřazený `AGENTS.md`, přiložené zadání a příkaz `/plan`. Akceptační důkazy a pořadí práce jsou v `PLAN.md`.

## D01 — Rozsah tohoto kroku a repository pravidla

**Původní rozhodnutí:** pouze discovery v `/plan`. **Revize:** nový pokyn výslovně žádá implementaci po produktové revizi; nyní začíná M1–M3. Před M1 převzít skutečný nadřazený `AGENTS.md` do odevzdávaného projektu. Test/build výsledky vzniknou skutečným během, nikoliv odhadem.

**Trade-off:** původní `/plan` určoval pouze discovery, navazující pokyn toto omezení ruší. Uživatel 9. října 2026 výslovně autorizoval průběžné commity podle funkcionality. Dosavadní změny rozdělíme do věcných commitů bez zpětného datování; další funkční celky commitujeme po ověření. Push, externí deployment a utrácení nadále vyžadují samostatné oprávnění.

## D02 — Úzká nabídka místo seznamu všech ETF

**Upřesnění rozsahu od uživatele, 9. října 2026:** projekt je výhradně testovací hiring assignment a nebude skutečně komerčně provozován. Jméno pro testovací konfiguraci je přesně `Matěj STýblo`. Kontakt `test@example.invalid` je výslovně nefunkční testovací hodnota, nikoli skutečný email uživatele. Používat syntetická testovací data; žádné skutečné kampaně, marketingové rozesílky ani nasazení. Produkční právní schválení a skutečná identita obchodního provozovatele nejsou součástí aktuálního dokončení; níže uvedené launch gates jsou podmínky pouze pro případnou budoucí změnu rozsahu, ne tvrzení připravenosti ke komerčnímu spuštění. Funkční persistence, výpočty, report a ochrana dat musí přesto zůstat skutečné a otestované.

**Rozhodnutí:** P0 porovná dvojici ze tří fondů S&P 500, zaměřenou na průběžné náklady. Publikum a motivace jsou hypotézy ze zadání, ne provedený kvalitativní výzkum. Nasdaq-100 až P1 po ověření dat.

**Proč:** jedna srozumitelná otázka přináší návštěvníkovi hodnotu a udržuje výpočet ve srovnatelném rámci. Nezavádíme vlastní ranking ani doporučení „kupte fond X“. Stejný index neznamená totožné právní, daňové, likviditní nebo distribuční vlastnosti; UI je musí vysvětlit.

## D03 — Přiznaná odchylka NYSE / NYSE Arca

**Ověření:** issuer stránky uvádějí SPY a IVV na NYSE Arca.[1][2] Konkrétní CSPX USD listing je na LSE, nikoliv NYSE.[3]

**Revize na základě NYSE zdrojů:** NYSE sama zveřejňuje ETP regulaci pro své trhy včetně Arca a ETF nabídku s Arca listing rules.[6][7] Výklad NYSE-family je proto obhajitelný pracovní rozsah ETF assignmentu, nikoliv potvrzení úmyslu hodnotitele. Použít SPY/IVV jako primary candidates s přesným venue NYSE Arca; CSPX oddělit jako evropský UCITS doplněk. Přísný main-market výklad nesplněn; evaluation risk zveřejnit, ale neblokovat lokální vývoj čekáním na potvrzení. Původní automatické označení tohoto bodu jako release blocker je nahrazeno transparentním scope note.

**Alternativa:** ověřit jiné instrumenty na hlavním NYSE pouze pokud je tato interpretace potvrzena. Nevymýšlet listing nebo měnit kategorii produktu jen proto, aby tabulka vypadala splněná.

## D04 — Data jsou versionovaný malý katalog

**Rozhodnutí:** data mají fund-level identitu, listing-level ticker/měnu a field-level provenance. Každý snapshot reportu odkazuje na verzi katalogu. Chybějící hodnoty jsou označené neověřeno, bez placeholderových čísel. AUM není nutná metrika první obrazovky.

**Ověření:** CSPX issuer stránka rozlišuje konkrétní USD a GBP listingy na LSE a uvádí akumulační politiku.[3] Informace o jednom listingu se nesmějí automaticky přenést na všechny ticker/měnové kombinace.

**Trade-off:** katalog neaktualizujeme scraperem v každém requestu. Pravidelná revalidace je manuální provozní úkol, který musí být uveden v README. Datum načtení 9. října 2026 neoznačujeme jako datum vydání všech zdrojových dokumentů.

## D05 — Dostupnost je caveat, ne tlačítko k nákupu

**Ověření:** evropská dokumentace PRIIPs popisuje KID pro příslušné investiční produkty.[4]

**Rozhodnutí:** žádný fond neoznačit univerzálně „dostupný českým investorům“. UCITS varianta není automatická garance broker-specific dostupnosti. Chybí ověření brokerů a konkrétních KID; upozornění má být u fondů a reportu, ne pouze footer disclaimer. Finanční a právní disclosures neposkytují samy o sobě oprávnění k personalizovanému poradenství.

## D06 — Model nákladového dopadu, ne skutečný účet poplatků

**Rozhodnutí:** faktor `q = ((1+r)*(1-c))**(1/12)`, monthly recurrence s příspěvkem na konci měsíce, baseline bez nákladů. Přesný model a limity v `PLAN.md`; čisté funkce mimo UI.

**Proč:** transparentní a testovatelný model včetně nulového výnosu a pravidelných vkladů. Není tvrzením o přesném způsobu denní akruální evidence konkrétního ETF. Payouts hypoteticky reinvestované před daněmi; CZK pouze modelová jednotka bez FX předpovědi.

**Trade-off:** ignoruje proměnlivý výnos, tax, broker/FX fees, spread, inflation a tracking difference. Rozdíl baseline a zůstatku zahrnuje i foregone compounding; není totožný s poplatky skutečně zaplacenými emitentovi. Historické údaje nepoužíváme jako default prognózu. Náklad sazby na serveru načítáme z katalogu, nikoli z klientského payloadu.

## D07 — Okamžitý HTML report místo neověřeného email delivery

**Rozhodnutí:** po durable zápisu leadu ihned otevřít osobní report a nabídnout HTML ke stažení + tisk. Copy výslovně sdělí, že report nezasíláme emailem. Report bez emailu v obsahu; vstupy a výsledky zachované ve snapshotu.

**Produktová revize:** prostý export nestačí. Report musí přinést osobní scénář, detailní comparison, 5/10/20/30 let i vlastní horizont, strukturální rozdíly, dostupnostní caveats pro ČR/EU, checklist před nákupem, zdroje a předpoklady. Veřejné základní číslo a srovnání nezamykáme. Nabídka „Jedno číslo není celý příběh“ zdůrazní další praktickou hodnotu místo registrace. Obsah každé položky ověřit ve staženém souboru.

**Proč:** zadání tento způsob plnění připouští; funguje bez SMTP credentials a lze testovat od kliknutí až po stažený obsah. Nezavádět email provider do P0.

**Trade-off:** email není ověřené vlastnictví a nestačí pro prokázané marketingové oprávnění. Export do PDF zajišťuje prohlížeč, nikoli server. Session přístup navržený na 24 hodin v původním prohlížeči; kopie zůstává návštěvníkovi po stažení. Nedostupnost reportu po expiraci musí mít reálnou chybovou stránku, ne prázdný UI stav.

## D08 — Reálný PostgreSQL, nikoliv local state persistence

**Rozhodnutí:** PostgreSQL + server-only `pg` + explicitní SQL migrace. Local test používá skutečnou databázi, production spravovanou TLS DB; provider zatím není vybrán. DB klient nikdy nepatří do client bundle. Žádná produkční SQLite na dočasném filesystemu.

**Proč:** transakce pro lead/report/idempotence a durable storage. Kompaktní schema nepotřebuje ORM ani více vrstev repository abstrakce.

**Acceptance:** API success až po commitu a následný DB readback v testu. Timeout po commitu se řeší replayem stejného attemptu. Při chybě konfigurace vrátit skutečné 503, nikoliv mock success. DB migrations a pooling musí být prověřeny na cílovém hostingu před deploymentem.

## D09 — Duplicity, oprávnění a report tokeny jsou odlišné problémy

**Rozhodnutí:** unikátní dedupe klíč emailu, zvlášť idempotency key+payload hash; report session používá náhodný vysoké entropie token v Secure/HttpOnly/SameSite cookie, v DB pouze hash. Žádný lookup reportu podle emailu a žádné tokeny v URL nebo analytics.

**Proč:** zabránit duplicate submit bez odhalení cizího reportu. Stejný email neopravňuje k otevření předchozího scénáře. Duplicitní submit neupdatuje svévolně předchozí marketingový consent. Unique email a attempt mají rozdílné účely a testy.

**Normalizace:** trim, validace, case-insensitive doména, lokální část beze svévolné změny, žádné Gmail dot/plus alias transformace. Validace syntaktického emailu není důkaz identity. Odpověď neprozradí, zda adresa již existovala v databázi.

## D10 — Ochrana soukromí a launch gates

**Rozhodnutí:** email jediný povinný kontaktní údaj. Samostatný volitelný marketingový checkbox, nikdy předzaškrtnutý a nikdy podmínka reportu. Nevyžadovat checkbox „souhlas s GDPR“ jako záměnu privacy informace a marketingového souhlasu. Skutečná identita provozovatele a právní základ musí být před spuštěním vyplněny a schváleny.

**Provozní návrh:** lead 90 dnů, report snapshot 7 dnů, analytics 30 dnů; release vyžaduje cleanup, deletion proces včetně backups a skutečný kontakt pro žádosti. Hodnoty nejsou právní závěr. Nepotřebná IP/UA ani fingerprint neukládat do app DB; hostingové logy zhodnotit samostatně.

**Blokery:** neznámý provozovatel, účel kontaktu, právní posouzení, DB účet a Vercel přístup. Lokální testování může pokračovat; tvrzení „zítra spustíme reklamy“ nikoliv.

## D11 — Produkční analytics s omezeným souhlasovým vzorkem

**Ověření:** ÚOOÚ odlišuje technické a netechnické cookies a požadavek na souhlas.[5]

**Rozhodnutí:** first-party typed event endpoint do DB; analytics opt-in, žádné měřicí cookies/events před ním, žádné raw emaily nebo hodnoty portfolia. Anonymně vypadající session ID nepovažovat automaticky za právně anonymní data. Zamítnutí ani odvolání souhlasu nesmí znefunkčnit produkt.

**Metrika:** nové saved leads ze způsobilé měřené kohorty / landing sessions téže kohorty. Unmeasured leady uvést jen jako samostatný count. Jedna session není jedna fyzická osoba; return návštěvy mohou existovat. Vyloučení test/bot traffic popsat přes explicitní pravidla. Consent bias nepřekrýt marketingovým tvrzením.

**Event authority:** lead success generuje server, client pouze intention/interaction; dedupe event ID a jednorázové session události. Session končí po 30 minutách neaktivity. Nepřijímat libovolné properties nebo klientské tvrzení o úspěšné DB transakci. Přesné eventy a funnel v `PLAN.md` rozpracovat do `ANALYTICS.md` při implementaci.

## D12 — Přiměřená bezpečnost bez falešné garance anti-spamu

**Rozhodnutí:** serverová Zod validace, payload cap, origin/content-type checks, parameterized SQL, escaped HTML, no-store report, server secrets, honeypot a sdílený DB throttle. Analytics endpoint s allowlistem a oddělenými limity.

**Trade-off:** honeypot a emailové limity samy nestačí na distribuovaný spam. Před kampaní otestovat deployment-layer protection; další CAPTCHA jen pokud potřeba, s reálnou server verifikací a behavior testy. Nepoužít process-memory limiter jako jedinou ochranu na serverless hostingu. Lokální test režim nesmí být skrytá produkční success zkratka.

## D13 — Vizuální identita má podporovat práci s čísly

**Rozhodnutí (aktualizace 12. října 2026):** uživatelem schválené tři hlavní barvy: tmavě modrá `#102A43`, tyrkysová `#007F78` a bílá `#FFFFFF`. Modrá tvoří strukturu a první fond; tyrkysová akce, výsledek a druhý fond. Textové popisky zůstávají, barva není jediným rozlišením. Lokální fonty, tabulární číslice, výraznější sans-serif hero, mobilní vertikální porovnání a jediný CTA pro aktuální fázi. Žádné dekorativní obrázky ani výrazné stíny. Stejná paleta platí pro formulář, report v aplikaci i stažené HTML, soukromí a interní dashboard.

**Tokeny:** `--canvas` / `--surface #FFFFFF`, `--ink #102A43`, `--accent #007F78`, `--accent-hover #00665F`, `--muted #52677B`, `--line #D8E4EB`, `--control-line #7D919F`, `--soft-blue #F1F6FA`, `--soft-accent #E6F4F2`, `--track #C8DCDF`, `--radius 10px`. Panely mají 12–16 px. `--danger #A12D22` pouze pro chyby. Malý tyrkysový text na tónovaném pozadí používá tmavší `--accent-hover`, aby splnil kontrast. Focus ring je tmavě modrý. Přechody respektují reduced motion, tisk reportu zůstává úsporný.

**Upřesnění podle reference, 12. října 2026:** uživatel dodal obrazovou předlohu. Desktop má 60px dvouřádkový hero, jemnou SVG krajinu bez datových os, světle tónované pozadí a dva samostatné bílé panely se zaoblením 20 px, mezerou 22 px a mírným stínem. Tmavě modrý inkoust je nyní `#0B1735`; paleta stále obsahuje pouze modrou, tyrkysovou a bílou s odstíny. Jemný tyrkysový přechod CTA, šipka doprava, větší fondové sazby a tónovaný přehled vkladů odpovídají předloze. Horní lišta prohlížeče z obrázku se do webu nekopíruje. Tablet skládá panely pod sebe; mobil zachovává kompaktní první obrazovku a 48px dotykové vstupy.

**Poctivé grafy:** mini sloupce ve výsledku používají stejnou nulovou základnu a společné maximum baseline, nikoli záměrně přehnaný rozdíl z ilustrační předlohy. Při nulových vkladech jsou prázdné. Absolutní rozdíl se stále uvádí slovně a číselně; barvy a dekorace nemění výpočet.

**Proč:** návštěvník musí vidět produkt, ne prezentaci. Metodika blízko výsledku, availability blízko fondu. Každá sekce musí podporovat porozumění, trust, value nebo reliability.

**Acceptance:** 375/768/1440 px bez overflow, keyboard, zoom, error focus, reduced motion. Lighthouse cíle nejsou hotové skóre. UI primitives jen kde skutečně pomohou; malé vlastní SVG pro první vizualizaci.

## D14 — Úzký stack a test-first engine

**Rozhodnutí:** Next App Router, React, strict TS, Tailwind, Lucide, RHF/Zod; stabilní kompatibilní verze zjistit při M1 a zamknout npm lockfilem. Vitest, DB integration a Playwright/axe. Nepřidávat Recharts/ORM/SMTP bez konkrétního přínosu. Jeden sdílený workspace state místo několika nespojených kalkulaček.

**Acceptance:** první numerical tests selžou před implementací a projdou po ní; neuvádět fabricated red/green výsledky. Backend testy prokázat real database readback, nikoli jen mocks. Každý claimed build/flow má skutečný command output nebo browser artifact.

## D15 — Marketingové odhady jsou hypotézy, nikoli data

**Rozhodnutí:** 2–5 % consented eligible sessions → nové syntakticky validní leady je pouze plánovací hypotéza bez měření a bez citovaného benchmarku. Neodvozovat od ní revenue/CPL ani garantované výsledky.

**Testy:** pořadí lead offer, konkrétní headline a fulfillment copy. Experimenty nesmí měnit accuracy/disclosures. Statistické sample-size rozhodnutí až po baseline. Dvě ad varianty testují motivaci náklady vs. orientace, nikoliv garantované zhodnocení; každá musí odpovídat viditelnému hero.

## D16 — Autentické odevzdání a report nedostatků

**Rozhodnutí:** README vysvětlí produkční tok a limity; TESTING rozliší skutečné runs od targets; AI_USAGE popíše skutečné použití AI a ověřování. `ai-log/` bude obsahovat jen reálné exporty, nikoliv syntetický záznam. Neuvádět zástupné customer counts, reviews, conversion numbers, deployment URL ani Git history.

**Známé discovery omezení:** standardní `web_extract` zde selhal kvůli search-only backendu. Stránky byly následně načteny přímo přes HTTPS a ověřeny z jejich skutečných textů. Chybějící extra metadata/factsheet/KID nejsou doplněna odhadem. Součástí QA bude revalidace před public release.

**Handoff po revizi:** nyní implementovat M1–M3 a prokazatelný vertical slice; responsive design a základní loading/error/privacy už v P0, ne až po backend infrastruktuře. P1 analytics/ads/deployment a rozšířené QA, P2 advanced abuse/expanded analytics/motion. Podrobné definice captures, new unique leads, marketing opt-in a měřené kohorty nově v PLAN; hypotézy se nezaměňují za měření. Deployment, commity a utrácení vyžadují výslovné oprávnění. Evidence register v PLAN odděluje facts/hypotheses/assumptions/infrastructure/blockers.

## Sources

[1] https://www.ssga.com/us/en/individual/etfs/state-street-spdr-sp-500-etf-trust-spy
[2] https://www.ishares.com/us/products/239726/ishares-core-sp-500-etf-ivv
[3] https://www.ishares.com/uk/individual/en/products/253743/ishares-sp-500-b-ucits-etf-acc-fund
[4] https://finance.ec.europa.eu/consumer-finance-and-payments/retail-financial-services/key-information-documents-packaged-retail-and-insurance-based-investment-products-priips_en
[5] https://uoou.gov.cz/verejnost/qa-otazky-a-odpovedi/cookies
[6] https://www.nyse.com/regulation/exchange-traded-products
[7] https://www.nyse.com/products/exchange-traded-products/exchange-traded-funds


## D17 — Přehledný graf vlastního scénáře, 12. října 2026

Na výslovnou žádost uživatele doplněn graf ročního vývoje do výsledku kalkulačky i webového reportu. Dva pohledy: modelová hodnota investice (oba fondy + baseline bez nákladů) a dopad průběžných nákladů (oba fondy). Druhý pohled objasňuje rozdíly, když jsou hodnotové křivky téměř shodné. Data pocházejí přímo z `Projection.annual`, žádný nový finanční model. Všechny roky včetně roku 0 sdílí osu od nuly; pokles může klesat, nulové i podkorunové scénáře mají nenulový rozsah osy. Hodnoty jsou modelové Kč a graf není předpověď.

Malé vlastní SVG s přímými ročními úsečkami a lehkým React ovládáním, bez další knihovny. Odlišné barvy a styly čar, legenda, čitelné HTML osy, přesné částky pod grafem. Myš/klepnutí vybírá rok; přístupný range umožňuje klávesnici (Home/End/šipky) a má `aria-valuetext` s částkami. Vybraný rok se při zkrácení horizontu ořízne. Neplatný scénář graf skryje spolu s výsledkem. Ve staženém script-free HTML zůstává kompletní roční tabulka; interaktivní graf je webová funkce. Nezavádíme analytické události pro každý pohyb kurzoru.

## D18 — Dva fondy přímo na hlavním NYSE, 13. října 2026

**Nahrazuje D02/D03:** na výslovný pokyn uživatele je výchozí dvojice STXF (Strive 500 ETF) / STXG (Strive 1000 Growth ETF), oba s primárním listingem NYSE. SPY/IVV zůstávají volitelné reference na NYSE Arca, CSPX oddělený evropský UCITS doplněk na LSE. Žádná výměna nebo přepočet starších uložených snapshotů. Jde stále výhradně o lokální testovací projekt, bez publikace nebo reklamní kampaně.

**Indexy a trade-off:** aktuální factsheet STXF uvádí Bloomberg US Large Cap Index, STXG Bloomberg US 1000 Growth Total Return Index. Starší prospekt STXF uvádí Bloomberg 500 Index; rozdíl názvů je přiznán v `indexNote`, nezávislou totožnost názvů netvrdíme. Volba striktního NYSE znamená odlišné indexy a strategie, nikoliv stejné S&P 500. Stejný hypotetický hrubý výnos izoluje pouze nákladový dopad: není srovnáním skutečné výkonnosti, stejného očekávaného výnosu či rizika, ani doporučením. UI toto vysvětluje přímo u výběru i výsledku; nadpis o stejném indexu používá jen pro skutečně shodné indexy vybraných fondů.

**Data:** roční sazby 0,0545 % / 0,18 % jsou z ověřených emitentských zdrojů. Primární evidence listingu, aktuálních tickerů, indexů a sazeb je v [NYSE_VERIFICATION](NYSE_VERIFICATION.md) a [DATA_SOURCES](DATA_SOURCES.md). ISIN, AUM nebo dostupnost českému retailu nedoplňujeme odhadem; PRIIPs KID a brokera je nutné ověřit. Doklady testů vznikají jen skutečným spuštěním, toto rozhodnutí nepředstírá browser/DB ověření nové dvojice.

## D19 — Návštěvy podle zdroje a stav formuláře (14. října 2026)

Zůstává opt-in relace s 30 minutami neaktivity, nikoli unikátní člověk. Aditivní migrace 005 přidává nullable acquisition do analytics_sessions. První měřený landing určuje zdroj; obnovení a další UTM v téže relaci jej nemění. UTM mají přednost před externí referrer doménou; bez obojího je zdroj neuvedený. Nikdy neukládat celý referrer, cestu či query. Staré NULL zdroje nedoplňovat. Dashboard počítá každou způsobilou relaci jednou, úspěšné odeslání podle submission_receipts.analytics_session_id, i při ztrátě success eventu. Bez odeslání zahrnuje probíhající relace; samostatně ukázat aktivní a zahájené bez odeslání. Neoznačovat tyto stavy za prokázané odchody.

## D20 — Viditelná cookie lišta (14. října 2026)

Uživatel výslovně požádal o viditelnější cookie lištu; toto je povolená výjimka z původního směru bez úvodních popupů. Zvolena nemodální lišta u spodního okraje bez scrimu, bez blokování kalkulačky a bez přesunu focusu při prvním zobrazení. Povolit/Odmítnout mají totožnou velikost, barvu a kontrast. Lišta se po volbě skryje; původní spodní sekce obsahuje stav, změnu nastavení a odvolání. Při ručním otevření jde focus na první volbu a při zavření zpět na spouštěč, Escape zavírá pouze již uložené nastavení. ResizeObserver rezervuje prostor podle skutečné výšky lišty, mobil má safe-area padding, tisk lištu skrývá. Next vývojový indikátor přesunut nahoru vpravo, aby nepřekrýval tlačítka na mobilu. Backend a pravidla opt-in měření nezměněny.

## D21 — Uživatel povolil Vercel Hobby a vzdálený dashboard (14. října 2026)

Nový výslovný požadavek nasadit celou aplikaci ruší dřívější omezení na čistě lokální provoz; zachován testovací/nekomerční účel. Vercel Hobby a Neon free_v3, DB fra1, žádný placený plán. Cloud oddělený od lokálních kontaktů. Uživatel dokončil login a přijal podmínky Neonu sám.

Celá aplikace zahrnuje chráněný dashboard: explicitní vzdálený režim, HTTPS a přesný Host, 256bit náhodný přístupový klíč uložený jen jako SHA-256 hash v server env, nezávislý session HMAC secret, HttpOnly/Secure/Strict cookie 8 hodin a DB login throttle. Bez session je dashboard i export 404. Lokální guard zůstává. Veřejné demo zřetelně žádá pouze syntetické emaily. Nezprovozňuje se kampaň ani emailová rozesílka. Retenční cleanup zatím zůstává ruční podle původního návrhu.

## D22 — Produkční větev devel

Uživatel výslovně požaduje automatickou aktualizaci veřejného webu při pushi do devel. Proto devel slouží jako Vercel Production branch pro tento testovací projekt, bez ohledu na konvenční název větve. Vytvořena z aktuálního ověřeného HEAD, nikoli ze staršího remote main. Main se nepřepisuje, nevynucuje se force push. Stávající Git integrace obstará build/deploy a atomické přepnutí aliasu; další CI služba není nutná.

## D23 — Nepřihlášený dashboard vede na login

Přímý /dashboard na správném HTTPS hostu nyní vrací redirect na /dashboard/login, pokud je remote přihlášení dostupné a chybí session. Původní 404 byla pro správce matoucí. Změna neodkrývá kontakty: redirect předchází filtru/DB čtení a export bez session zůstává 404. Vypnutý režim/cizí host se neoznamují přesměrováním.

## D19 — finální výběrové demo

14. října 2026 uživatel potvrdil testovací účel s realistickým profesionálním vzhledem. Výchozí GitHub větev je devel, stejně jako Vercel production branch. Úvodní velké testovací bannery nejsou potřeba; stručné upozornění se zobrazí v místě zadání emailu a technické chování je vysvětleno v soukromí. Nenahrazujeme test@example.invalid fiktivním kontaktem a nespouštíme skutečné rozesílání. Náhled reportu používá buildReport, aby odpovídal skutečnému doručenému PDF. Reklamy jsou hotové PNG/SVG návrhy se skutečným screenshotem srovnání; žádný koncept není spuštěná kampaň.
