# Datové zdroje a metodika ETF katalogu

Načtení veřejných issuer stránek: 9. října 2026. Datum načtení není datum vydání dokumentu. Versionovaný katalog: `data/etfs.ts`, aktuální identifikátor `2026-10-09.1`.

## Primární evidence

| Zdroj | Co z něj používáme |
| --- | --- |
| SPY issuer stránka | Název, SPY, S&P 500, Gross Expense Ratio 0,0945 %, NYSE Arca / USD, ISIN US78462F1030, čtvrtletní distribuce, unit investment trust.[1] |
| IVV issuer stránka | Název, IVV, S&P 500, Expense Ratio 0,03 %, NYSE Arca a čtvrtletní distribuce.[2] |
| CSPX issuer stránka | Název, ISIN IE00B5BMR087, TER 0,07 %, akumulace, Irsko, UCITS, fyzická replikace, USD share class a konkrétní USD listing CSPX na LSE.[3] |
| Evropská komise PRIIPs | Kontext KID, nikoliv potvrzení dostupnosti konkrétního ETF u konkrétního brokera.[4] |
| NYSE regulatorní a ETF stránky | Důvod pro explicitní pracovní interpretaci NYSE-family v ETF zadání.[6][7] |

SPY/IVV nikdy neoznačovat jako main-market NYSE listing. NYSE-family interpretace je obhajitelná; úmysl hodnotitele nelze dovodit s jistotou. CSPX je oddělený evropský UCITS doplněk, nikoliv NYSE-listed ETF.

## Neověřená pole a omezení

- IVV ISIN není v načteném hlavním issuer detailu doložen; katalog obsahuje `null`. Nepočítat jej z CUSIP a nepřepisovat známým číslem z paměti.
- SPY/IVV domicil a share-class currency nebyly doloženy dostatečně explicitně v použitém výřezu zdroje; `null`. Obchodní měna konkrétního listingu a měna share class jsou odlišná pole.
- AUM je záměrně `null`, protože vyžaduje samostatné datované ověření a první užitek na ní nezávisí. UI/report píše neověřeno.
- Broker-specific availability, česká KID verze a individuální daňová situace nejsou ověřené. Neexistuje tlačítko k nákupu ani doporučení dostupnosti.
- Použité issuer poplatky mají odlišné názvy (gross expense ratio / expense ratio / TER). Model používá zveřejněnou roční sazbu jako jednotnou zjednodušenou nákladovou veličinu, neslibuje stejné regulatorní definice či úplné investiční náklady.
- Před public release doplnit/revalidovat prospekty/factsheets/KID a pole, která chce stránka prezentovat jako fakt. Údaje bez evidence zůstanou null, nikoliv fiktivní.

## Výpočet není externí finanční dataset

Žádná živá cena, historical return, volatility nebo recommendation score. Roční výnos nastavuje uživatel jako hypotetický předpoklad. Stejný return pro fondy stejného indexu; end-of-month contributions; annual net factor `(1+r)*(1-c)` převedený na měsíc. Nákladový dopad zahrnuje i rozdíl složeného zhodnocení. Čistý modul a modelové limity v `lib/calculations/project.ts`, schémata v `lib/validation/schemas.ts`; unit testy ověřují numerické případy.

## Proces aktualizací

Před release a následně navrženě měsíčně otevřít issuer dokumenty, zkontrolovat každé zveřejněné pole, zaznamenat retrieval/publication datum, změnit DATA_VERSION a spustit testy. Staré reporty zůstávají svými snapshots; nemění se potichu podle nového katalogu. Vlastník aktualizací musí být při production handoff určen.

## Sources

[1] https://www.ssga.com/us/en/individual/etfs/state-street-spdr-sp-500-etf-trust-spy
[2] https://www.ishares.com/us/products/239726/ishares-core-sp-500-etf-ivv
[3] https://www.ishares.com/uk/individual/en/products/253743/ishares-sp-500-b-ucits-etf-acc-fund
[4] https://finance.ec.europa.eu/consumer-finance-and-payments/retail-financial-services/key-information-documents-packaged-retail-and-insurance-based-investment-products-priips_en
[6] https://www.nyse.com/regulation/exchange-traded-products
[7] https://www.nyse.com/products/exchange-traded-products/exchange-traded-funds
