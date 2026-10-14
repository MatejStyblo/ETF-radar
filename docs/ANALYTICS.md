# Analytics — skutečná implementace a čitelné metriky

Stav podle kódu k 9. říjnu 2026. ETF Radar je výhradně testovací/hiring demo; používejte syntetické emaily a testovací data. Žádná komerční kampaň ani emailové rozesílání neběží. Tato dokumentace odlišuje uložená data od návrhů v PLAN/DECISIONS; níže uvedené SQL jsou reportingové příklady, nikoli naměřené konverze.

## Autoritativní soubory

- [eventSchema a DB zápis](../lib/db/analytics.ts), [migrace 002](../lib/db/migrations/002.sql).
- [Client preference/fronta](../lib/analytics/client.ts), [panel](../components/analytics/measurement-panel.tsx), [visibility](../components/analytics/visibility-event.tsx).
- [Event endpoint](../app/api/events/route.ts), [podpis cookie](../lib/security/analytics.ts).
- [Lead endpoint](../app/api/leads/route.ts), [transakce/receipt](../lib/db/leads.ts), [schémata](../lib/validation/schemas.ts).
- Callers: [PrimaryLink](../components/landing/primary-link.tsx), [Workspace](../components/comparison/workspace.tsx), [LeadForm](../components/lead-form/lead-form.tsx), [ReportView](../components/report/report-view.tsx), [ReportActions](../components/report/report-actions.tsx).
- [Cleanup](../scripts/cleanup.mjs), [TESTING](TESTING.md), [privacy UI](../app/privacy/page.tsx).

## Souhlas a chování browseru

Preference má stavy `unset`, `allowed`, `denied`. V localStorage se ukládá pouze volba pod `etf-radar-measurement`; není tam email, scénář ani ID analytics relace. `unset` i `denied` znamenají bez POST eventů. Výběr fondů, výpočet, lead i report fungují bez analytics consent. Marketing consent je oddělený a nezaškrtnutý; jeho zaškrtnutí nepovoluje analytics a žádný email ve skutečnosti neposílá.

Panel inicializuje uloženou preference a explicitní druh stránky. Na `/` bootstrap používá `landing_view`; na `/report` používá `session_start`, takže report-only návštěva nezvětšuje landing denominator. Při první další události nejprve zajistí consented session. **Chování před souhlasem se nefrontuje zpětně.** Výchozí viditelný výsledek/nabídka se však mohou zaznamenat po opt-in, pokud jsou tehdy viditelné.

`track()` používá sekvenční Promise frontu, UUID pro každé odeslání a kontrolu aktuální preference/generation. Změna preference ruší čekající události staré generace. Není to durable outbox; síťové chyby jsou potlačené bez obecných retries eventů a bez sledování úspěšnosti příjmu. `trackOnce()` označí událost před odesláním; neúspěšná jednorázová událost může zůstat ztracená do resetu klientského stavu.

Odmítnutí/odvolání zastaví client tracking ihned a pošle `DELETE /api/events`. Server označí aktuální platnou relaci `revoked=true` a smaže cookie; historické eventy nemaže. Neúspěšnou revokaci klient zkouší znovu po 5 sekundách a ukládá pouze marker `etf-radar-measurement-revocation=pending`, aby retry přežil reload. Nové tracking requesty čekají na úspěšnou revokaci. Preference se synchronizuje mezi taby přes `storage` event; cookies i localStorage sdílí browser/origin, nikoli samostatný tab.

Lead API vyžaduje pro přiřazení měření **aktuální explicitní `X-Analytics-Consent: true` a platnou nerevokovanou session**. Samotná dosud platná cookie nestačí, včetně replaye po odvolání. Browser může být nedůvěryhodný; endpoint neprokazuje právní platnost souhlasu. Backend analytics používá `requireConfig()`, tedy potřebuje i zapnutý capture, DB, identity a oba secrets. Při neúplné konfiguraci neměří; to není režim „console-only“.

## Relace a její životnost

`analytics_sessions.id` je náhodné serverové UUID. `etf_analytics` obsahuje ID, podepsanou expiraci a HMAC, nikoli fingerprint. Cookie je HttpOnly, SameSite=Lax, path `/`, maxAge 1800 sekund; Secure pouze pro HTTPS `APP_ORIGIN`. DB uchovává `created_at`, `expires_at`, `ad_variant` a `revoked`.

- Nová session vznikne přijetím `landing_view` nebo reportového `session_start`, pokud platná session neexistuje.
- Ostatní client eventy bez platné session dostanou 401. Klient po 401 resetuje `ready` a `once`; **ztracenou událost okamžitě neopakuje**. Až další track request zahájí novou session landingem.
- Úspěšný client POST posouvá DB expiraci i podepsanou cookie o 30 minut. Aktivita je tedy **úspěšně přijatý měřicí request**, nikoli každé kliknutí či pohyb browseru. Serverový lead success TTL neprodlužuje.
- UUID není člověk ani účet. Reload/tabs mohou sdílet session; po expiraci vzniká nová. Žádná deduplikace napříč zařízeními nebo podle identity.
- Neukládá se libovolná URL ani page path. Od opravy z 10. října 2026 používá klient na `/report` `session_start`, nikoli `landing_view`. Landing denominator se tak nově vztahuje k návštěvám `/`; report-only session jej nezvětší. Staré false landing eventy z dřívější verze nelze z uložených dat spolehlivě rozlišit. Pro čisté vyhodnocení použijte kohortu vzniklou po opravě a znovu sestaveném buildu.

Odvolaná session není automaticky fyzicky vymazána. Expirované session v historickém reportingu ponecháme; `expires_at>now()` by zkreslilo historickou kohortu. Revokované naopak níže vylučujeme z kohorty i návazných metrik. Po odvolání nelze číst SQL výsledek jako neměnný historický snapshot.

## Taxonomie a skutečné spouštěče

Client envelope je strict Zod objekt `{eventId: UUID, name, adVariant: 'a'|'b', consent: true}`; žádné dodatečné properties. Název `lead_submit_success` je z client schématu vyloučen. Endpoint kontroluje JSON/origin přes `readJson`, má limit 2048 bytů a DB kvótu 120 nových event requestů / session / 1 minutu.

| Událost | Autorita a spouštěč | Dedupe / význam |
| --- | --- | --- |
| `landing_view` | Client na `/` po povolení/obnovení preference nebo před prvním track. | Jednou v DB/session; souhlasový landing, ne všechny pageviews. |
| `session_start` | Bootstrap měření na `/report`, včetně obnovy session. | Technická opakovatelná událost, ne další landing návštěva. |
| `primary_cta_click` | Kliknutí hero odkazu ke vstupům. | Opakovatelná; není konverze. |
| `comparison_started` | Hero CTA, změna ETF nebo první edit scénáře. | Client once + DB once. CTA se počítá i bez editace; ne render. |
| `etf_selected` | `onChange` selektoru fondu. | Opakovatelná; neukládá ID vybraného fondu. |
| `calculator_interaction` | Blur vstupu při dirty stavu a validním schématu scénáře. | Opakovatelná; ne každý keystroke ani timer debounce. Dvojice ETF zde není podmínkou, jen validní scénář. |
| `results_viewed` | IntersectionObserver wrapperu validního výsledku. | Client/DB once. Může jít o default výsledek bez comparison start. |
| `lead_offer_viewed` | Visibility wrapper nabídky/formuláře. | Client/DB once; může nastat i při vypnutém capture nebo nevalidním scénáři. |
| `lead_form_started` | Focus libovolného prvku formuláře. | Client/DB once; nikoli jen první znak emailu. |
| `lead_submit_attempt` | Vstup do submit callback po client RHF/Zod validaci, platném scénáři a lock check. | Opakovatelná. Nevalidní email odmítnutý klientem event nemá. |
| `lead_submit_error` | Neúspěšná API odpověď nebo síťová/response chyba. | Opakovatelná; bez error code a attempt ID. Není server failure log. |
| `lead_submit_success` | Server po durable lead/report/receipt commitu nebo úspěšném replayi. | `(attempt_id,'server')`, s `is_new_lead`. Best effort mimo capture transakci. |
| `report_viewed` | Visibility wrapper coveru skutečně dostupného reportu. | Client `trackOnce`; DB **nemá** once index pro tento název. Reload může vložit další event. |
| `report_downloaded` | Client po úspěšném fetch `/report/download`, blobu a spuštění download odkazu. | Opakovatelná; není server audit downloadu ani důkaz uložení na disk. Přímý GET nebo tisk se neměří. |

Visibility wrapper používá `threshold: .15`, ale callback testuje `entry.isIntersecting`, nikoli `intersectionRatio >= .15`. Proto nejde garantovat 15% visibility ani minimální dobu čtení. Viditelnost není porozumění obsahu.

DB event má `event_id`, `source`, `session_id`, `name`, `ad_variant`, nullable `is_new_lead`, `schema_version=1`, `created_at` z DB. Časy jsou serverové, nikoli client timestamps. Success nevypovídá o doručení emailu či přihlášení k marketingu.

## Deduplikace a capture identity

- Primární klíč eventů je `(event_id,source)`. Stejný client UUID kontroluje advisory lock a payload name/variant; konfliktní použití může vrátit 409. Server pro success používá attempt UUID; client attempt event používá jiné UUID, **nelze je párovat přes event_id**.
- DB partial unique index `(session_id,name)` se týká jen `landing_view`, `comparison_started`, `results_viewed`, `lead_offer_viewed`, `lead_form_started`. Report view je dedupovaný pouze v běžícím client modulu. Repeatable events nejsou počty unikátních session.
- `submission_receipts.attempt_id` je durable idempotency klíč. Stejný payload retry vrátí stejný dostupný report; změněný payload 409, nedostupný původní report 410. Nový attempt se stejným emailem vytvoří nový capture/report, ale ne nový lead.
- `leads.email_key` je unikátní serverový HMAC normalizované adresy: schéma trimuje, doména lowercase, lokální část zachována. Plus/dot aliasy se neslučují. Klíč ani raw email nejsou analytics properties.
- `is_new_lead=true` znamená, že právě tento capture vložil lead; false znamená existující klíč. Validní lead není ověřený mailbox. Dedupe platí pouze po dobu uchování leadu a stabilního dedupe secretu; po výmazu může stejná adresa založit nový řádek.
- Duplicate capture nepřepisuje původní marketingový souhlas. `leads.marketing_consent` zachycuje vložení identity, ne checkbox posledního capture a ne historii revokací.

### Důležité omezení success replaye

Receipt ukládá původní `analytics_session_id`. Lead route po opravě vyžaduje aktuální explicitní souhlas, platnou session a **shodu aktuální session s původní session receipt**. Success se zapisuje pouze původní session; původně neměřený capture ani replay v jiné session nezíská dodatečně atribuci. Recovery chybějícího eventu v téže platné session je možná. Pokud event už existuje, conflict jej nepřepíše. Čas eventu může být časem retry, ne commitu.

Proto business kohortu níže ukotvujeme v **receipt.created_at a původním receipt.analytics_session_id**, nikoli jen v počtu success eventů. Success event je diagnostika měření; není plně spolehlivý původní conversion attribution ledger. Ani receipts bez session později automaticky nepřiřazujeme.

## Atribuce a minimalizace

`app/page.tsx` přijme `ad_variant=b`, jinak A, a pouze `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`. Hodnota musí být jediný string, max 64 znaků a regex `^[a-zA-Z0-9_-]*$`. API má strict stejné schéma. URL/email-like hodnoty s běžnou interpunkcí jsou odmítnuty, ale **není to registr povolených kampaní ani záruka neosobního obsahu**. Do UTM nedávejte osobní data.

- UTM se ukládají v `submission_receipts.attribution`, i bez analytics opt-in jako metadata capture. Tento testovací produkt nerozhoduje, jaký právní základ by pro takový obchodní provoz byl vhodný.
- `analytics_sessions` a `analytics_events` obsahují pouze A/B, **žádná UTM ani referrer/page URL**. Session variant je určena prvním bootstrap eventem a další events používají variantu uloženou session, nikoli aktuální variantu requestu.
- Není cross-page first/last-touch historie, reklamní spend, click ID, experiment ID, kvalifikační score ani consent timestamp/version v analytics session.
- Z lead receipts lze seskupit captures podle jejich UTM; nelze z toho získat campaign-specific visitor denominator. Rozdělit všechny leady podle UTM a dělit je pouze A/B sessions by míchalo kohorty.
- Aplikační analytics DB neukládá email/hash emailu, částky, report token, IP, UA, fingerprint ani volný text. Receipts však explicitně spojují lead a session; jde o pseudonymní, **ne zaručeně anonymní** data. Hostingové logy je nutné hodnotit zvlášť.

## Definice metrik a způsobilost

1. **Captures:** committed unikátní attempt receipts. Retry stejného attemptu jednou; nové pokusy existující adresy mohou počet zvýšit.
2. **Nové leady:** vložené emailové identity; v receipts `is_new_lead=true`. Všechna nová vložení lze samostatně spočítat z `leads.created_at`, ale nejde o historicky neomezený údaj po cleanupu.
3. **Marketingové identity:** aktuálně uložené lead rows s `marketing_consent=true`; není to doklad uskutečněného odesílání nebo připravený mailing list.
4. **Způsobilé měřené relace v příkladech:** session s uloženým client landingem v `[from,to)`, `revoked=false`, mimo explicitní seznam známých testovacích/session UUID. Bez filtru aktuální expirace. Maturity cutoff je pevný `as_of`; započítáváme jen landingy s alespoň 24 hodinami následného pozorování.
5. **Primární acquisition ratio:** nové leady z receipts přiřazených téže session kohortě, vytvořené od jejího landingu do 24 hodin po něm, nejpozději `as_of`, / počet relací kohorty. Okno 24 hodin je **reportingový návrh**, ne vestavěný atribuční mechanismus nebo existence 24h analytics session.
6. **Session conversion rate:** relace s alespoň jedním takovým novým leadem / relace kohorty. Od primárního new-lead ratio ji odlišujte: session může vložit více odlišných emailů, takže new-lead ratio není automaticky omezené na 100 %.

V test-only demu není žádná produkční kohorta; SQL může sloužit k ověření na testovací kohortě, označené jako test. Automatické test/bot označení chybí. Pro případné metodické vyhodnocení mimo demo musí analytik dodat známá excluded UUID; prázdný seznam neznamená „bots odstraněni“. Nový klient odlišuje report bootstrap od landing; server nepovažuje klientské tvrzení za důkaz identity návštěvníka. Nesmíme tvrdit celkovou visitor-to-lead konverzi, consent share všech návštěv, cohort-specific UTM conversion, CPL nebo uplift bez dalších dat.

## SQL příklady pro PostgreSQL

Read-only dotazy. Datum intervalů a `as_of` změňte explicitně podle požadovaného záznamu a dostatečné maturity; příklady jsou v UTC, horní hranice je exkluzivní. Žádné výsledky z těchto příkladů zde nepředstíráme. Nečtou raw emaily ani tajemství. Při odečtu 24h od `as_of` jde o analytické okno, nikoli retention/expiry.

### 1. Stejná kohorta pro denominator i nové leady

```sql
WITH params AS (
  SELECT timestamptz '2026-10-01 00:00:00+00' AS from_at,
         timestamptz '2026-10-08 00:00:00+00' AS to_at,
         timestamptz '2026-10-09 00:00:00+00' AS as_of,
         ARRAY[]::uuid[] AS excluded_session_ids
), cohort AS (
  SELECT s.id, s.ad_variant, e.created_at AS landing_at
  FROM analytics_sessions s
  JOIN analytics_events e ON e.session_id=s.id
    AND e.source='client' AND e.name='landing_view'
  CROSS JOIN params p
  WHERE NOT s.revoked
    AND NOT (s.id=ANY(p.excluded_session_ids))
    AND e.created_at>=p.from_at AND e.created_at<p.to_at
    AND e.created_at<=p.as_of-interval '24 hours'
), per_session AS (
  SELECT c.id, c.ad_variant,
         count(r.attempt_id) AS captures,
         count(r.attempt_id) FILTER (WHERE r.is_new_lead) AS new_leads
  FROM cohort c CROSS JOIN params p
  LEFT JOIN submission_receipts r ON r.analytics_session_id=c.id
    AND r.created_at>=c.landing_at
    AND r.created_at<c.landing_at+interval '24 hours'
    AND r.created_at<=p.as_of
  GROUP BY c.id,c.ad_variant
)
SELECT ad_variant, count(*) AS eligible_sessions,
       sum(captures) AS captures, sum(new_leads) AS new_leads,
       round(100.0*sum(new_leads)/nullif(count(*),0),2) AS new_leads_per_100_sessions,
       count(*) FILTER (WHERE new_leads>0) AS converted_sessions,
       round(100.0*count(*) FILTER (WHERE new_leads>0)/nullif(count(*),0),2)
         AS session_conversion_pct
FROM per_session GROUP BY ad_variant ORDER BY ad_variant;
```

Řádky bez měřené původní session do čitatele nevstupují. Více receipts za session nezvětšuje denominator. Variantou je původní **session** A/B; receipt může nést jinou A/B po změně URL. Query záměrně nepoužívá `s.expires_at>now()` ani timestamp success eventu. Retence omezuje historický rozsah a výmaz jej může změnit.

### 2. Session funnel a error guardrail, ne poměr surových event countů

```sql
WITH params AS (
  SELECT timestamptz '2026-10-01 00:00:00+00' AS from_at,
         timestamptz '2026-10-08 00:00:00+00' AS to_at,
         timestamptz '2026-10-09 00:00:00+00' AS as_of,
         ARRAY[]::uuid[] AS excluded_session_ids
), cohort AS (
  SELECT s.id,s.ad_variant,e.created_at AS landing_at
  FROM analytics_sessions s JOIN analytics_events e ON e.session_id=s.id
    AND e.source='client' AND e.name='landing_view'
  CROSS JOIN params p
  WHERE NOT s.revoked AND NOT (s.id=ANY(p.excluded_session_ids))
    AND e.created_at>=p.from_at AND e.created_at<p.to_at
    AND e.created_at<=p.as_of-interval '24 hours'
), flags AS (
  SELECT c.id,c.ad_variant,
    coalesce(bool_or(e.name='comparison_started'),false) AS started,
    coalesce(bool_or(e.name='results_viewed'),false) AS results,
    coalesce(bool_or(e.name='lead_form_started'),false) AS form,
    coalesce(bool_or(e.name='lead_submit_attempt'),false) AS attempted,
    coalesce(bool_or(e.name='lead_submit_error'),false) AS errored,
    coalesce(bool_or(e.name='report_viewed'),false) AS report,
    coalesce(bool_or(e.name='report_downloaded'),false) AS downloaded
  FROM cohort c CROSS JOIN params p
  LEFT JOIN analytics_events e ON e.session_id=c.id AND e.source='client'
    AND e.created_at>=c.landing_at
    AND e.created_at<c.landing_at+interval '24 hours'
    AND e.created_at<=p.as_of
  GROUP BY c.id,c.ad_variant
)
SELECT ad_variant,count(*) AS sessions,
  count(*) FILTER (WHERE started) AS comparison_sessions,
  count(*) FILTER (WHERE results) AS result_sessions,
  count(*) FILTER (WHERE form) AS form_sessions,
  count(*) FILTER (WHERE attempted) AS attempt_sessions,
  count(*) FILTER (WHERE attempted AND errored) AS error_attempt_sessions,
  round(100.0*count(*) FILTER (WHERE attempted AND errored)
    /nullif(count(*) FILTER (WHERE attempted),0),2) AS error_session_pct,
  count(*) FILTER (WHERE report) AS report_sessions,
  count(*) FILTER (WHERE downloaded) AS download_sessions
FROM flags GROUP BY ad_variant ORDER BY ad_variant;
```

Jde o dosažení kroků v jedné kohortě, **ne ordered funnel**: default result může předcházet interaction. Error rate je podíl attempt sessions s alespoň jednou chybou, ne podíl neúspěšných backend attemptů. Client attempt/error nemají společný attempt ID. Pro „saved → report“ guardrail vezměte stejnou receipt kohortu jako v dotazu 1 a vyžadujte report event **po receipt.created_at**, stále jde jen o proxy téže session. Nejde přesně svázat report ID ani report v nové session.

### 3. Všechny captures a nové leady samostatně — bez conversion denominatoru

```sql
SELECT attribution->>'utm_campaign' AS campaign,
       attribution->>'ad_variant' AS capture_ad_variant,
       count(*) AS captures,
       count(*) FILTER (WHERE is_new_lead) AS new_leads,
       count(*) FILTER (WHERE NOT is_new_lead) AS repeat_captures,
       count(*) FILTER (WHERE analytics_session_id IS NULL) AS no_original_session
FROM submission_receipts
WHERE created_at>=timestamptz '2026-10-01 00:00:00+00'
  AND created_at<timestamptz '2026-10-09 00:00:00+00'
GROUP BY attribution->>'utm_campaign',attribution->>'ad_variant';

SELECT count(*) AS new_identity_rows,
       count(*) FILTER (WHERE marketing_consent) AS opted_in_at_creation
FROM leads
WHERE created_at>=timestamptz '2026-10-01 00:00:00+00'
  AND created_at<timestamptz '2026-10-09 00:00:00+00';
```

Tyto totals zahrnují měřené i neměřené captures a bez dalších filtrů také testy. `no_original_session` není přesně počet lidí odmítajících consent — může jít o expiry nebo chybu analytics. Nedělte žádný z těchto totals jen opt-in landing sessions. Receipt count a lead count může po cleanupu divergovat podle stáří/výmazu.

### 4. Diagnostika ztraceného nebo připsaného success eventu

```sql
SELECT count(*) AS measured_receipts,
  count(*) FILTER (WHERE e.event_id IS NULL) AS missing_success_event,
  count(*) FILTER (WHERE e.session_id<>r.analytics_session_id) AS session_mismatch
FROM submission_receipts r
JOIN analytics_sessions s ON s.id=r.analytics_session_id AND NOT s.revoked
LEFT JOIN analytics_events e ON e.event_id=r.attempt_id
  AND e.source='server' AND e.name='lead_submit_success'
WHERE r.created_at>=timestamptz '2026-10-01 00:00:00+00'
  AND r.created_at<timestamptz '2026-10-09 00:00:00+00';
```

Read-only integrity check, nikoli evidence úspěšného client report delivery. Nereportuje raw adresy a nenahrazuje skutečný readback konkrétního testovacího leadu. Best-effort server event může chybět, zatímco transakce uspěla.

## Retence a výmaz

`scripts/cleanup.mjs --retention` v transakci:

- Vybere leady s `created_at < now()-90 days`. Zruší příslušné server success eventy přes attempt receipts, reporty a emailové rate-limit buckets, pak leady; receipts se smažou přes FK cascade.
- Smaže report snapshoty starší 7 dnů. Migrace 003 nastavuje receipt.report_id na NULL při výmazu reportu; receipt může přežít jeho 24h přístup i 7denní storage.
- Smaže analytics session starší 30 dnů **podle created_at, ne expires_at**; eventy přes FK cascade. Dále smaže eventy starší 30 dnů, receipts starší 90 dnů a expirované throttle buckets.
- `submission_receipts.analytics_session_id` nemá FK: po cleanupu session může zůstat dangling UUID, které reportovací JOIN do kohorty nezahrne.

`--lead-id UUID` bez `--retention` smaže konkrétní lead a navázané receipts/reporty/server success eventy/email bucket. **Nesmaže všechny client eventy jeho session**, protože session může obsahovat jiné aktivity a není přímá identita osoby. Není automatický marketing unsubscribe ani kompletní privacy request workflow. Kombinace flagů omezuje výběr leadu i stářím; pro obyčejný konkrétní výmaz je nekombinujte.

Skript nemá scheduler, dry-run ani automatický export auditní evidence; databázové TTL samy řádky nemažou. Cookie/report access expiry není fyzický výmaz. Logy hostingu, zálohy a kopie stažené návštěvníkem nejsou pokryté. Hodnoty 90/7/30 dnů jsou implementovaný retenční návrh pro demo, nikoli právně schválená doporučení. Historické reportingové výsledky je nutné interpretovat podle cleanupu a uchovat jen vhodné neidentifikující agregace, pokud jsou skutečně potřeba.

## Mezery měření — nepředstírat hotovou funkci

- Žádný denominator všech návštěvníků, přesný consent acceptance rate, libovolné page-path rozlišení nebo session-per-tab izolace. Report-only sessions používají odlišný technický bootstrap a nezvětšují nový landing denominator.
- Žádné campaign UTM v session tabulce, cross-device attribution, bot/test flag či automatický seznam kampaní.
- Žádná randomizace, experiment assignment/exposure, sample-size automatika ani změřená statistická významnost. A/B URL je message matching, ne experiment.
- Žádný attempt ID na client attempt/error, error breakdown, mailbox verification, report-ID linkage, tisk/PDF success nebo server download audit.
- Event queue bez durable retry, visibility bez minimální doby a success mimo transakci; replay musí zachovat původní session atribuci. Výpadek analytics lead neblokuje a ztrátu nelze maskovat součtem všech leadů do měřeného čitatele.
- Revokace není historický výmaz; chybí consent-version/time evidence v analytics, scheduler a kompletní backup/delete workflow.

Regrese a skutečný lokální DB/browser důkaz jsou v [TESTING](TESTING.md). Plánovací konverze 2–5 % a prioritní hypotézy v [README](../README.md) nejsou naměřené výsledky ani benchmark. V tomto test-only projektu nemá být žádný skutečný paid traffic nebo osobní databáze kontaktů.

## Lokální dashboard

`/dashboard` čte skutečná data v serverové read-only transakci. Filtry `range=7|30|90|all` (výchozí 30), `variant=all|a|b` a `page` nejsou experiment assignment. Časové okno je klouzavé od DB času načtení; denní řádky a vypsané časy používají UTC. „Všechna dostupná data“ znamená uchovanou historii po retenci, nikoli všechny návštěvy od spuštění.

| Pole přehledu | Přesný význam a omezení |
| --- | --- |
| Měřené relace | Odlišné nerevokované relace s client `landing_view` v okně a vybrané variantě; není to unikátní člověk ani všechna návštěvnost. |
| Unikátní kontakty | Odlišné lead ID s úspěšným receipt v okně/variantě; zahrnuje existující kontakt, který uložil další report. Nejde o všechny nově založené řádky ani ověření mailboxu. |
| Úspěšná uložení | Počet receipts po úspěšném commitu, včetně neměřených a opakovaných captures. |
| Konvertující relace / konverze | Odlišné relace stejné landing kohorty s měřeným server `lead_submit_success` v okně; podíl vůči měřeným relacím. Zahrnuje i capture existujícího kontaktu. Není to primární hypotéza nových leadů uvedená výše ani konverze veškeré návštěvnosti. Chybějící jmenovatel je „—“, ne 0 %. |
| Nové měřené kontakty | Počet serverových success událostí s `is_new_lead` ve stejné kohortě; samostatně od konvertujících relací a všech kontaktů. |
| Nové kontakty / měřené relace | Primární poměr výše definovaných nových měřených kontaktů ke stejným způsobilým landing relacím. Chybějící jmenovatel je „—“. Více nových emailů v jedné relaci může dát přes 100 %; není to podíl odlišných konvertujících relací. |
| Marketingové kontakty | Odlišné kontakty z filtrovaných receipts s uloženým marketingovým souhlasem; ne obchodně kvalifikované osoby a ne skutečná rozesílka. |
| Neměřená uložení | Receipts bez odpovídajícího server success eventu ve způsobilé landing kohortě; může jít o nesouhlas, ztracený event, revokaci, expiraci nebo retenci. Není to consent rejection rate. |

Funnel ukazuje **distinct sessions pro každý krok v jedné kohortě**, ne počet všech eventů ani nutně postupné/klesající průchody: některé výsledky a nabídky se mohou zobrazit automaticky před vědomou interakcí. Denní relace se přiřazují podle prvního landing eventu v okně, captures podle receipt času. Denní unikátní kontakty se nemají prostě sečíst do unikátních kontaktů za celé období.

Kampaně agregují `submission_receipts.attribution`: zdroj, médium, kampaň, varianta, captures a nové captures. Analytics sessions nemají úplné campaign UTM, takže dashboard **nespočítává konverzi kampaní**. Neuvedená atribuce není důkaz přímého trafficu. Měřené výběry dvojic používají skutečně zaznamenanou dvojici z client `etf_selected`; dvojice při úspěšném odeslání pochází zvlášť ze snapshotu reportu, včetně neměřených captures. Starší eventy s chybějící dvojicí se nedopočítávají z katalogu. Chybějící či expirovaný snapshot se označuje jako nedostupný, ne jako určitá dvojice ETF.

Pro přehled dvojic je analytics schema doplněné o nullable `analytics_events.etf_ids TEXT[]` se dvěma odlišnými identifikátory z `spy | ivv | cspx`. Volitelný client payload `etfIds` je dovolený pouze pro `etf_selected`; pořadí dvojice se zachovává a změněný replay dostane 409. Nejde o libovolné properties, investovanou částku nebo email. Nezměněná výchozí dvojice není výběrový event, neplatný výběr stejného fondu se neměří jako platná dvojice. Starší řádky zůstávají `NULL`; migrace jim nesmí vymyslet původní výběr. Taxonomie výše popisuje původní omezený event payload před tímto dashboard rozšířením.

Diagnostický výpis je nejvýše **100 nejnovějších událostí**, nikoli úplný event export. Kontakty jsou po 50 na stránku. Změna filtru a obnovení znamenají nový serverový dotaz; DB chyba zobrazí poctivou nedostupnost bez náhradních nul.

Měřicí panel aktivuje klient jen na landing/report a při unmount vrací cleanup. Dashboard nemá měřicí panel. Globální storage listener může dál synchronizovat souhlas a dokončit withdrawal, ale při neaktivní měřené stránce nesmí poslat POST ani vytvořit novou landing relaci; queued a opožděná práce je generačně invalidována. Ověřeno skutečným SPA návratem do dashboardu a změnou souhlasu v jiné záložce, nejen prvním přímým načtením dashboardu.

`/dashboard/export?range=…&variant=…` je CSV **kontaktů**, se stejným local-only guardem. Email je pouze v chráněném lokálním přehledu/exportu, ne v analytics eventech. Stránku ani CSV nepovolovat při deploymentu: `DASHBOARD_ENABLED=true` je jen explicitní lokální opt-in, `APP_ORIGIN` musí být HTTP loopback, `Host` přesně odpovídat a server musí naslouchat pouze na loopback. Noindex/nofollow, no-referrer a no-store nejsou autentizace; veřejný server/tunel tím bezpečný není.

## Návštěvnost podle zdroje — 14. října 2026

Tato aktualizace nahrazuje starší omezení o chybějící campaign atribuci v sessions: consented landing_view nyní obsahuje volitelnou allowlist acquisition (utm_source, utm_medium, utm_campaign, utm_content, referrer_host), uloženou jednou do analytics_sessions.acquisition. Pole smí být pouze u landing_view. Klient posílá UTM po validaci (jedna hodnota, max 64 ASCII písmen/číslic/_/-), z referrer URL pouze externí hostname bez cesty, query a credentials. Bez souhlasu nic neposílá. Referrer může prohlížeč vynechat. Neznámý zdroj zůstává neuvedený, stará historie NULL. První měřený landing v relaci je neměnný, reload je díky unique indexu stále jedna návštěva.

Sekce dashboardu „Návštěvy a kontaktní formulář“ používá stejnou nerevokovanou landing kohortu podle období a varianty jako původní přehled. Zdroj = neprázdné utm_source, jinak referrer_host, jinak neuvedeno. Počítá návštěvy, relace s lead_form_started, relace s alespoň jedním durable receipt po landing eventu do času snapshotu, jejich rozdíl (zatím bez odeslání), aktivní podmnožinu (expires_at > čas snapshotu) a zahájené bez úspěchu. Duplicitní captures nezvyšují počet konvertujících relací. Úspěch není závislý na best-effort lead_submit_success eventu; původní eventové karty zůstávají označené zvlášť. Capture z jiné reklamní varianty v téže relaci patří pro nový návštěvní funnel k prvnímu zdroji této relace.

Konverze zdroje = relace s durable uložením / stejné měřené landing relace daného zdroje a kampaně. „Bez odeslání“ není detekce opuštění ani tvrzení, že návštěvník nic nevyplnil. Po 30 minutách bez měřicí aktivity je relace neaktivní; zavření tabu se přímo nedetekuje. Souhlas, blokování, síťové chyby, ztráta session vazby a retence omezují úplnost. Žádné cross-device ID, IP ani fingerprint. Retence a výmaz analytics_sessions zahrnují novou acquisition. Po změně starší návštěvy znovu nevyrábět.

## Cookie lišta — 14. října 2026

Na landing page a reportu je první volba měření viditelná v pevné spodní nemodální liště. Před volbou zůstává měření vypnuté. Povolit i Odmítnout schovají lištu a ukládají existující preference; po reloadu se lišta sama nevrací. Změnit nastavení cookies ve spodní sekci ji znovu otevře; Odvolat zůstává přímou akcí. Podmínky consentu, session, serverového uložení a synchronizace mezi záložkami se nemění. Dashboard měření nespouští.
