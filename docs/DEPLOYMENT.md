# Vercel Hobby — testovací nasazení

## Aktuální stav (14. října 2026)

Uživatel autorizoval bezplatné nasazení do `matejstyblos-projects`.
Lokální produkční build prošel. Přihlášení Vercel CLI 64.0.2 bylo dokončeno uživatelem.
Vytvořen projekt `etf-radar`, ověřen plán Hobby a instalována databáze `etf-radar-db` na plánu Neon `free_v3` ve Frankfurtu; uživatel výslovně přijal podmínky integrace. Migrace 001–005 aplikovány do oddělené cloud DB, bez přenosu lokálních kontaktů.
Veřejná adresa: https://etf-radar-dun.vercel.app. Po prvním deploymentu upraven APP_ORIGIN na skutečný přidělený alias a aplikace nasazena znovu. Finální ověření viz docs/TESTING.md.
Nejde o souhlas s placeným plánem, placenou databází nebo spuštěním reklam.

## Připravená konfigurace

- `vercel.json`: Next.js, `npm ci`, `npm run build`, region Frankfurt (`fra1`).
- `package.json`: Node `24.x`; stejná major verze jako lokální ověření.
- `.vercelignore`: vylučuje secrets, lokální artefakty, AI logy, testy a dokumentaci z uploadu aplikace.
- `.gitignore`: vylučuje lokální `.vercel` metadata.
- Databáze zůstává PostgreSQL; lokální loopback URL není použitelná z Vercelu.

## Dokončení po přihlášení

1. Ověřit správný Vercel účet/scope a plán Hobby. Vytvořit nebo vybrat projekt, neprovádět upgrade.
2. Připojit oddělený bezplatný PostgreSQL, například přes Neon integraci, pouze pokud nabídka skutečně ukazuje bezplatný plán. Neaktivovat placený tarif ani platební kartu.
3. Nastavit cloudové `DATABASE_URL` s požadovaným TLS; connection string nevypisovat do logů. Nemigrovat ani nekopírovat lokální kontakty bez důvodu.
4. Na nové cloud DB aplikovat migrace `001.sql` až `005.sql` přes `scripts/migrate.mjs`. Nikdy nevystavovat migrační endpoint na webu.
5. Vygenerovat dvě nezávislá serverová tajemství (`LEAD_DEDUPE_SECRET`, `REPORT_TOKEN_SECRET`), nevkládat je do Gitu ani klienta.
6. Nastavit přesný HTTPS `APP_ORIGIN` podle stabilní projektové domény; formulář, origin guard a secure cookies musí používat stejnou doménu. `LEADS_ENABLED` zapnout teprve po funkční DB a ostatní konfiguraci.
7. Zachovat pravdivé označení testovacího účelu a testovací identity; nepředstírat komerční právní připravenost.
8. Nasadit přes Vercel CLI a ověřit na skutečné HTTPS doméně: veřejnou kalkulačku, consent bez/při souhlasu, skutečný syntetický lead v cloud DB, report a HTML download. Zaznamenat výsledky a URL.

## Dashboard

Cloud dashboard vyžaduje `DASHBOARD_ENABLED=true`, `DASHBOARD_REMOTE_ENABLED=true`, přesný HTTPS APP_ORIGIN, `DASHBOARD_ACCESS_KEY_HASH` (SHA-256 náhodného 32byte base64url klíče) a nezávislý `DASHBOARD_SESSION_SECRET`. Klíč není součástí aplikace ani Gitu; předán v soukromém lokálním souboru.

`/dashboard/login` ověří klíč constant-time porovnáním a nastaví podepsanou HttpOnly/Secure/SameSite=Strict cookie pouze pro `/dashboard` na 8 hodin. Dashboard i CSV vyžadují tuto cookie a přesnou shodu Host; podvržené forwarded hosty se odmítají. Logout vymaže cookie, výměna hash/session secret zneplatní všechny relace. Jde o jednoho správce s vysokou entropií klíče, ne víceuživatelské účty, MFA nebo individuálně revokovatelné serverové sessions.

Login je omezený sdíleným DB limitem 20 pokusů za 15 minut bez ukládání IP; může dočasně omezit i legitimního správce. Zachován původní lokální loopback režim. Rozšíření není prosté odstranění původního host guardu.

## Ceny a limity

Hobby je určený pro nekomerční osobní projekty a má limity. Po jejich překročení nelze slibovat nepřetržitou bezplatnou dostupnost. Testovací hiring projekt není ověřená produkční reklamní kampaň.

- [Vercel Hobby](https://vercel.com/docs/plans/hobby)
- [Podporované Node verze](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [PostgreSQL přes Vercel Marketplace](https://vercel.com/docs/postgres)

Ověřeno 14. října 2026; parametry konkrétní cloud DB se musí ověřit při výběru plánu.
