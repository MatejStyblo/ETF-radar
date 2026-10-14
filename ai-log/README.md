# Autentické AI logy

Tento README je návod, nikoliv conversation export. Soubor `hermes-session.jsonl` je skutečný snapshot session `20261009_171555_dc5d1e` exportovaný přes Hermes CLI s `--redact`. Obsahuje jeden session record s polem `messages`, nikoliv jednu zprávu na řádek. Export není Claude Code log ani zpětná rekonstrukce. Před veřejným sdílením zkontrolovat osobní údaje a lokální cesty.

Postup a současné omezení viz `docs/AI_USAGE.md`. Snapshot nezahrnuje zprávy vzniklé po exportu; pro finální handoff jej znovu exportovat s ověřeným ID a secrets redaction. Skutečné delegation runtime logs lze uchovat jako dílčí záznam se zřetelně popsanou proveniencí; neoznačovat je jako kompletní parent chat.


`codex-2026-10-12-visual-redesign.jsonl` je dílčí skutečný snapshot Codex desktop session `01a12ffc-0538-7ac3-b519-cd9fb634cf99`, vytvořený 12. října 2026 z lokálního runtime JSONL. Každý řádek je nezměněný skutečný `response_item`: uživatelské/asistentské zprávy a volání/výstupy nástrojů. Systémové/developerské instrukce, interní reasoning, provozní metadata a jiné typy záznamů jsou vynechány. Nejde o úplný raw log ani Claude Code export; snapshot nezahrnuje pozdější závěrečné kroky. Kontrola credential patterns před uložením nenašla hodnoty; export obsahuje lokální cesty a jméno z projektového zadání. Před veřejným publikováním zkontrolovat osobní údaje.

`codex-2026-10-14-traffic.jsonl` je dílčí skutečný snapshot aktuální Codex desktop session `01a139b9-1f78-72e1-87cb-b464b4157768`, vybraný od požadavku na návštěvnost 14. října 2026. Obsahuje zatím jediný nezměněný runtime response_item: skutečný uživatelský požadavek. Aktivní odpověď asistenta při vytváření snapshotu ještě nebyla v runtime souboru uložená. Neobsahuje reasoning, systémové instrukce ani nástrojová volání/výstupy. Jde tedy pouze o dílčí záznam vstupu, nikoli dokončený export rozhovoru ani Claude Code log; po ukončení turnu je pro úplnější handoff nutné export obnovit.

`codex-2026-10-14-analytics-cookies.jsonl` rozšiřuje předchozí neúplný snapshot skutečnými runtime message záznamy od žádosti o zdroje návštěv po dostupnou část práce na cookie liště. Obsahuje skutečné uživatelské a asistentské zprávy; runtime zde u asistentských zpráv nemá channel, proto jsou zahrnuté message záznamy bez pole channel (předchozí filtr je chybně vynechal). Neobsahuje reasoning, systémové instrukce, tool calls ani tool outputs. Aktivní turn nemusí být na konci kompletní; nejde o Claude Code export ani zpětnou rekonstrukci.

`codex-2026-10-14-vercel.jsonl` je skutečný dílčí runtime snapshot žádosti o Vercel a následných dostupných uživatelských/asistentských zpráv včetně potvrzení loginu/podmínek. Bez tool calls/outputs, bez reasoning a bez credential obsahu. Aktivní závěrečný turn nemusí být úplný. Není rekonstruovaný ani Claude Code export.

`codex-2026-10-14-devel.jsonl`: dílčí skutečné runtime user/assistant message záznamy od požadavku na push → deployment z devel. Neobsahuje tool calls/outputs ani reasoning; aktivní závěrečný turn nemusí být úplný. Není rekonstruovaný přepis.
