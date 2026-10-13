# Ověření ETF s primárním listingem přímo na NYSE

Ověření zdrojů: **13. října 2026**. Jde o dokumentované načtení údajů, nikoli živé ceny nebo doporučení k nákupu. Datum načtení není datum vydání factsheetu.

## Doložené kandidáty

| Pole | STXF — Strive 500 ETF | STXG — Strive 1000 Growth ETF |
| --- | --- | --- |
| Primární burza | NYSE, nikoli NYSE Arca.[1][3] | NYSE, nikoli NYSE Arca.[2][4] |
| Publikovaná roční sazba | Expense Ratio **0,0545 %**.[1][3] | Expense Ratio **0,18 %**.[2][4] |
| Index podle současného emitentského webu / factsheetu | Bloomberg US Large Cap Index (B500T).[1][3] | Bloomberg US 1000 Growth Total Return Index (B1000GT).[2][4] |
| Zaměření | Americké velké společnosti; široká expozice k 500 největším společnostem.[1][3] | Americké velké a střední společnosti s růstovými charakteristikami.[2][4] |
| Nakládání s výnosy | Emitent očekává čtvrtletní dividendové výplaty; výplata ani výše nejsou zaručené.[1] | Emitent očekává čtvrtletní dividendové výplaty; výplata ani výše nejsou zaručené.[2] |
| Datum použitého factsheetu | Data k 30. červnu 2026.[3] | Data k 30. červnu 2026.[4] |

Prospekt pojmenovává New York Stock Exchange jako burzu uvedených fondů. Základní dokument je datovaný 31. října 2025 a stažený soubor obsahuje i dodatky z roku 2026; netvrdíme, že starý základní prospekt byl nově vydán.[5]

## Dvě podstatné korekce

**Ticker je STXF, nikoli STRV.** Změna nastala 8. června 2026. Je doložena aktuální emitentskou stránkou i dodatkem k prospektu z 28. května 2026. STRV nepřidáváme jako jiný fond nebo druhou možnost v selektoru.[1][5]

**STXF není fond S&P 500.** Současný factsheet a emitentský web používají název Bloomberg US Large Cap Index; základní prospekt používá název Bloomberg 500 Index. Katalog má převzít současný název z factsheetu a výslovně přiznat rozdílné pojmenování ve starším prospektu. Bez samostatné evidence netvrdíme právní či metodologickou totožnost těchto názvů.[1][3][5]

STXG používá růstový index a není zaměnitelný s širokým large-cap indexem STXF. Také factsheet výslovně uvádí riziko růstového investování a možnost odlišných výsledků vůči celému trhu.[2][4]

## Produktové rozhodnutí a hranice modelu

Plánovaný hlavní výběr je STXF/STXG, protože jejich primární NYSE listing je doložený. SPY/IVV zůstávají oddělené reference na NYSE Arca; CSPX zůstává oddělený evropský UCITS doplněk na LSE. Nejde o tvrzení, že NYSE Arca nebo LSE jsou hlavní NYSE.

Výpočet má i nadále porovnávat **pouze modelový dopad ročních nákladů při stejném zadaném hrubém výnosu**. Rozdílné indexy musí být viditelné před formulářem, u výsledku i v reportu. Nelze tvrdit stejnou skutečnou výkonnost či riziko, očekávané překonání druhého fondu ani doporučovat levnější fond jako lepší investici.

Broker-specific dostupnost, PRIIPs/KID, ISIN, domicil a obchodní měna nových fondů nejsou tímto ověřením doložené. Chybějící údaje zůstanou explicitně neověřené; CUSIP nepřevádíme na odhadnutý ISIN. AUM ani historické výnosy do modelu nepřebíráme. Samotný listing není potvrzení dostupnosti českému retailu.

## Evidence a reprodukovatelnost

Primární HTML a PDF byly skutečně staženy. Factsheety jsou propojené přímo z emitentských stránek. Lokální citation ledger ověřil doslovné evidence pro burzu, sazby, indexy a změnu tickeru; nebyly použity nedohledané identifikátory ani odhadnuté odkazy. Všechny citované zdroje jsou níže. Důkazy implementace a runtime ověření patří do `docs/TESTING.md`, nikoli do tvrzení o emitentských datech.

## Sources

[1] https://www.strivefunds.com/stxf — Strive 500 ETF issuer page
[2] https://www.strivefunds.com/stxg — Strive 1000 Growth ETF issuer page
[3] https://www.strivefunds.com/documents/FG/strive_funds/fund_docs/650255_STXF_2Q26_Fact_Sheet.pdf — STXF factsheet data June 30 2026
[4] https://www.strivefunds.com/documents/FG/strive_funds/fund_docs/638062_STXG_2Q26_Fact_Sheet.pdf — STXG factsheet data June 30 2026
[5] https://www.strivefunds.com/documents/FG/strive_funds/fund_docs/638064_Strive_Prospectus.pdf — October 31 2025 prospectus with 2026 supplements
