# Datové zdroje a metodika ETF katalogu

## Nezávislá revalidace 14. října 2026

Aktuální stránky všech pěti fondů, oba 2Q26 factsheety a Strive prospekt byly znovu otevřeny. Sazby, listingy, indexy, výplaty i doložené SPY/CSPX ISIN odpovídají katalogu; podrobnosti a zdrojové odkazy jsou v [FINAL_AUDIT](FINAL_AUDIT.md#financial-accuracy-findings). Původní katalogová retrieval data zůstávají historickým snapshotem. Strive je dle issuer/factsheet sub-adviser, nikoli automaticky právní emitent; `issuer` je legacy provider/brand field a v obou reportech se nyní označuje „Značka / poskytovatel“. Právní struktura EA Series Trust zůstává uvedená. Neověřená pole nebyla doplněna z paměti.

Základní reference SPY/IVV/CSPX byly načteny 9. října 2026; nové hlavní NYSE fondy STXF/STXG 13. října 2026. Datum načtení není datum vydání dokumentu. Versionovaný katalog: `data/etfs.ts`, aktuální identifikátor `2026-10-13.1`. Podrobné nové ověření, emitentské odkazy, factsheety a prospekt jsou v [NYSE_VERIFICATION](NYSE_VERIFICATION.md).

## Hlavní výběr přímo na NYSE — 13. října 2026

| Fond | Doložený primární listing a sazba | Index / hranice evidence |
| --- | --- | --- |
| STXF — Strive 500 ETF | NYSE, Expense Ratio 0,0545 % | Aktuální web a factsheet: Bloomberg US Large Cap Index (B500T). Starší prospekt uvádí Bloomberg 500 Index; poznámka je i v katalogu/reportu. Není to S&P 500. |
| STXG — Strive 1000 Growth ETF | NYSE, Expense Ratio 0,18 % | Bloomberg US 1000 Growth Total Return Index (B1000GT), odlišná růstová strategie. |

Obě burzy a sazby jsou doložené skutečně staženými emitentskými stránkami a factsheety s daty k 30. červnu 2026; [doklady a zdroje](NYSE_VERIFICATION.md#sources). Změna STRV → STXF od 8. června 2026 je ověřená, starý ticker není samostatný fond. Konkrétní ISIN, domicil a obchodní měna nových fondů nejsou doložené a zůstávají neověřené; AUM záměrně nepřebíráme. Distribuce jsou emitentem očekávané čtvrtletně, nikoli garantované.

STXF/STXG jsou výchozí hlavní dvojice. Různé indexy nedovolují tvrdit stejné skutečné riziko/výnos; společný zadaný hrubý výnos izoluje pouze modelový dopad nákladů. Staré reference zůstávají oddělené a historické reportové snapshoty se nepřepisují.

## Primární evidence

| Zdroj | Co z něj používáme |
| --- | --- |
| SPY issuer stránka | Název, SPY, S&P 500, Gross Expense Ratio 0,0945 %, NYSE Arca / USD, ISIN US78462F1030, čtvrtletní distribuce, unit investment trust.[1] |
| IVV issuer stránka | Název, IVV, S&P 500, Expense Ratio 0,03 %, NYSE Arca a čtvrtletní distribuce.[2] |
| CSPX issuer stránka | Název, ISIN IE00B5BMR087, TER 0,07 %, akumulace, Irsko, UCITS, fyzická replikace, USD share class a konkrétní USD listing CSPX na LSE.[3] |
| Evropská komise PRIIPs | Kontext KID, nikoliv potvrzení dostupnosti konkrétního ETF u konkrétního brokera.[4] |
| NYSE regulatorní a ETF stránky | Důvod pro explicitní pracovní interpretaci NYSE-family v ETF zadání.[6][7] |

SPY/IVV nikdy neoznačovat jako main-market NYSE listing. Původní pracovní NYSE-family interpretace byla nahrazena hlavním výběrem STXF/STXG přímo na NYSE; SPY/IVV jsou nadále výslovné NYSE Arca reference. CSPX je oddělený evropský UCITS doplněk, nikoliv NYSE-listed ETF.

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

## Kontrola zdrojů před odevzdáním — 14. října 2026

Znovu otevřeny oficiální emitentské stránky STXF, STXG, SPY, IVV a CSPX. U hlavní dvojice stránka emitenta nadále uvádí Primary Exchange NYSE a Expense Ratio 0,0545 % / 0,18 %. Základní sazby referencí zkontrolovány proti příslušným stránkám. Tato kontrola nenahrazuje broker-specific KID/dostupnost a nevydává celý katalog za znovu ověřený live dataset; původní datované snapshoty a DATA_VERSION zůstávají zachované.
