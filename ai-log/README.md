# Autentické AI logy

Tento README je návod, nikoliv conversation export. Soubor `hermes-session.jsonl` je skutečný snapshot session `20261009_171555_dc5d1e` exportovaný přes Hermes CLI s `--redact`. Obsahuje jeden session record s polem `messages`, nikoliv jednu zprávu na řádek. Export není Claude Code log ani zpětná rekonstrukce. Před veřejným sdílením zkontrolovat osobní údaje a lokální cesty.

Postup a současné omezení viz `docs/AI_USAGE.md`. Snapshot nezahrnuje zprávy vzniklé po exportu; pro finální handoff jej znovu exportovat s ověřeným ID a secrets redaction. Skutečné delegation runtime logs lze uchovat jako dílčí záznam se zřetelně popsanou proveniencí; neoznačovat je jako kompletní parent chat.


`codex-2026-10-12-visual-redesign.jsonl` je dílčí skutečný snapshot Codex desktop session `01a12ffc-0538-7ac3-b519-cd9fb634cf99`, vytvořený 12. října 2026 z lokálního runtime JSONL. Každý řádek je nezměněný skutečný `response_item`: uživatelské/asistentské zprávy a volání/výstupy nástrojů. Systémové/developerské instrukce, interní reasoning, provozní metadata a jiné typy záznamů jsou vynechány. Nejde o úplný raw log ani Claude Code export; snapshot nezahrnuje pozdější závěrečné kroky. Kontrola credential patterns před uložením nenašla hodnoty; export obsahuje lokální cesty a jméno z projektového zadání. Před veřejným publikováním zkontrolovat osobní údaje.
