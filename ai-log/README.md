# Autentické AI logy

Tento README je návod, nikoliv conversation export. Soubor `hermes-session.jsonl` je skutečný snapshot session `20261009_171555_dc5d1e` exportovaný přes Hermes CLI s `--redact`. Obsahuje jeden session record s polem `messages`, nikoliv jednu zprávu na řádek. Export není Claude Code log ani zpětná rekonstrukce. Před veřejným sdílením zkontrolovat osobní údaje a lokální cesty.

Postup a současné omezení viz `docs/AI_USAGE.md`. Snapshot nezahrnuje zprávy vzniklé po exportu; pro finální handoff jej znovu exportovat s ověřeným ID a secrets redaction. Skutečné delegation runtime logs lze uchovat jako dílčí záznam se zřetelně popsanou proveniencí; neoznačovat je jako kompletní parent chat.


`codex-2026-10-12-visual-redesign.jsonl` je dílčí skutečný snapshot Codex desktop session `01a12ffc-0538-7ac3-b519-cd9fb634cf99`, vytvořený 12. října 2026 z lokálního runtime JSONL. Každý řádek je nezměněný skutečný `response_item`: uživatelské/asistentské zprávy a volání/výstupy nástrojů. Systémové/developerské instrukce, interní reasoning, provozní metadata a jiné typy záznamů jsou vynechány. Nejde o úplný raw log ani Claude Code export; snapshot nezahrnuje pozdější závěrečné kroky. Kontrola credential patterns před uložením nenašla hodnoty; export obsahuje lokální cesty a jméno z projektového zadání. Před veřejným publikováním zkontrolovat osobní údaje.

`codex-2026-10-14-traffic.jsonl` je dílčí skutečný snapshot aktuální Codex desktop session `01a139b9-1f78-72e1-87cb-b464b4157768`, vybraný od požadavku na návštěvnost 14. října 2026. Obsahuje zatím jediný nezměněný runtime response_item: skutečný uživatelský požadavek. Aktivní odpověď asistenta při vytváření snapshotu ještě nebyla v runtime souboru uložená. Neobsahuje reasoning, systémové instrukce ani nástrojová volání/výstupy. Jde tedy pouze o dílčí záznam vstupu, nikoli dokončený export rozhovoru ani Claude Code log; po ukončení turnu je pro úplnější handoff nutné export obnovit.
