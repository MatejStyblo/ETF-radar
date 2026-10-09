# Final local production QA — October 9, 2026

## Outcome

The genuine browser-to-PostgreSQL acquisition/lead/report path passed, with and without optional analytics consent. Two opt-in live Playwright tests pass against the already-running production server. No route interception, fabricated API response, app change, restart, deployment, push, or commit was used.

This is **local production-build evidence, not deployed performance, real acquisition/conversion data, or launch approval**. The configured controller is a local test identity. Best Practices remains below the assignment target; see findings.

## Environment and artifacts

- Origin: `http://127.0.0.1:3103` (exact origin; existing server left running).
- PostgreSQL: explicitly supplied local `etf_radar_test` on port 55439. No migrations or truncation performed.
- Node: v22.23.1. Real Playwright Chromium: 156.0.8078.4, headless, macOS host.
- Scratch evidence root: `/Users/matejstyblo/.hermes/cache/scratch/etf-qa-final/`.
- `funnel/*/database-evidence.json`: exact event UUIDs, session/lead/report/attempt IDs and selective receipt readback, raw allowlisted client event bodies and API statuses. No connection secrets, report capability cookies, email hashes, or payload hashes are recorded there.
- `funnel/*/cleanup.json`: verified zero remaining own leads, reports, receipts, events, sessions and rate buckets after each test.
- `funnel/*/before-submit.png`, `report.png`, `report.html`: real browser screenshots and downloaded report. Screenshots include only synthetic test identity/email where applicable.
- `responsive.json`, `responsive.cjs`, `mobile.png`, `desktop.png`, `zoom200-css.png`, `zoom200-reflow-equivalent.png`, `keyboard-validation-reduced.png`: reproducible exploratory checks and evidence.
- `lighthouse-mobile.report.{json,html}`, `lighthouse-mobile-repeat2.report.{json,html}`, `lighthouse-mobile-repeat3.report.{json,html}`, `performance-runs.json`, `lighthouse-summary.json`: actual audits and parsed measurements.

Scratch files are not committed assets and may expire; preserve them separately if long-term evidence is needed.

## Genuine acquisition-to-lead verification

Source inspection preceded assertions: migrations `001.sql` and `002.sql`, client event queue/consent handling, analytics persistence, lead persistence, form/workspace visibility tracking, report actions and API response contract.

### Consented flow, 375 × 812

A fresh context arrives with all four UTM fields and `ad_variant=b`. Before consent there are no event POSTs. The test explicitly clicks **Povolit**, waits for the real analytics response, clicks the comparison CTA, consciously changes the first ETF to CSPX, edits the initial investment to 123456 and tabs out to commit the calculator interaction. The model result changes and is visibly scrolled into view. The offer and form become visible, a unique `example.invalid` test email is entered and the unchecked marketing box remains unchecked.

The real `/api/leads` response is 200. Navigation to `/report`, focused report title, visible report and actual HTML browser download all succeed. The snapshot read back from PostgreSQL contains the edited initial investment and selected CSPX/IVV pair, not merely the default inputs. The downloadable HTML contains the selected fund and omits the submitted email.

The exact receipt links one newly saved lead, one report and one analytics session. It preserves `utm_source=qa`, `utm_medium=browser`, the unique campaign, `utm_content=live_funnel`, and variant b. `marketing_consent=false` and `marketing_consent_at=null` are verified.

PostgreSQL contains exactly **12** events on the linked session, each once:

1. `landing_view`
2. `primary_cta_click`
3. `comparison_started`
4. `etf_selected`
5. `calculator_interaction`
6. `results_viewed`
7. `lead_offer_viewed`
8. `lead_form_started`
9. `lead_submit_attempt`
10. `lead_submit_success`
11. `report_viewed`
12. `report_downloaded`

The list describes expected membership, not a forced total ordering: the measurement panel sits below the offer, so consenting after scrolling there can produce an offer impression before the comparison CTA. Visibility is an impression, not proof of preceding interaction. The actual timestamps/order are preserved in database evidence.

`lead_submit_success` is the only server event, keyed by the actual attempt UUID, with `is_new_lead=true`. All other events are client events; all stored events preserve session variant b. Session readback verifies it is not revoked.

### No-consent flow, 1440 × 900

A separate fresh context explicitly clicks **Odmítnout**, then performs the same comparison, calculator, form, saved-lead, report-view and download path. It succeeds without marketing consent or measurement.

Verified: **zero analytics POSTs**, no analytics cookie, `analytics_session_id=null` on the exact receipt, and **zero database events** linked by receipt session or the actual submission-attempt UUID. Initial unset-consent state is also checked before either flow opts in/out; a complete separate unset-consent submission is not included.

### Analytics privacy boundary

Every real event request is asserted to contain only `eventId`, `name`, `adVariant`, and `consent`. Every stored event is asserted to contain only the migration-defined `event_id`, `source`, `session_id`, `name`, `ad_variant`, `is_new_lead`, `schema_version`, and `created_at`. No arbitrary properties column exists. Neither submitted email nor the edited investment amount occurs in stored events. This verifies the executed event payloads and rows, not every possible future event or all network traffic.

### Cleanup

Cleanup is scoped to the unique synthetic email, IDs read from that lead's receipts, and sessions discovered by this browser's exact event UUIDs/attempt UUID. Only corresponding report/receipt/lead/session/event/rate-bucket rows are removed. Session foreign-key cascading removes only those sessions' events. All six own-record categories are read back and asserted empty. No global deletion, wildcard email cleanup, or truncation is used.

## Durable test and executed commands

Only `tests/e2e/live-funnel.spec.ts` was added for browser testing. Default runs skip it before opening a database connection. It requires explicit opt-in, an exact local production origin and an explicitly supplied localhost database named `etf_radar_test`.

```sh
LIVE_FUNNEL=1 \
LIVE_FUNNEL_DATABASE_URL=postgres://postgres@127.0.0.1:55439/etf_radar_test \
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3103 \
npx playwright test tests/e2e/live-funnel.spec.ts --workers=1 \
  --output=/Users/matejstyblo/.hermes/cache/scratch/etf-qa-final/funnel
```

- Initial live execution: **2 passed** (29.4 s including startup).
- Final execution after adding persisted evidence and exhaustive own-cleanup readbacks: **2 passed** (5.3 s).
- `npm run typecheck`: passed after the final test changes.
- `npx eslint tests/e2e/live-funnel.spec.ts`: passed.
- Non-opt-in execution of this spec: **2 skipped**, no live writes.
- Parent-owned default integration/intercepted browser suites are not represented as rerun here.

## Responsive, keyboard and motion observations

- Landing at 375 × 812 and 1440 × 900: actual document/body widths equal viewport width; no horizontal overflow. Screenshots inspected. Mobile reading order is hero → selectors → calculator → result → offer → methodology → optional measurement. The CTA is visible near the top and the calculator precedes the form.
- Mobile and desktop report screenshots were captured during successful live flows. Mobile report content and download controls are visible without obvious page-level clipping. A numerical report overflow assertion is not part of the current durable test.
- 200% **CSS zoom** at desktop width and a separate 720 × 450 **reflow-equivalent viewport** both show no document horizontal overflow. These are explicitly not a native browser UI zoom test; CSS zoom differs from browser zoom/media-query behavior. Long native select option labels are visually ellipsized in narrow columns.
- Keyboard exploration traverses 25 Tab presses. Skip link is first, controls follow sensible DOM order, the honeypot is excluded, there is no observed focus trap, and interactive controls have 3 px solid focus outlines. The live flow commits calculator changes with Tab and verifies focus moves to the report title. Not a complete keyboard-only funnel or assistive-technology certification.
- Invalid email produces `aria-invalid=true` and the associated Czech error `Zadejte platný email.` without submitting a real lead.
- Reduced-motion emulation matches the media query, computed document scroll behavior is `auto`, and zero elements have a non-none computed animation name. No real-device vestibular/user study was performed.
- Exploratory browser script reports no uncaught page errors or console errors during these interactions. Lighthouse separately detects the missing favicon and CDP records CSP issues; absence of page errors does not imply a clean DevTools Issues panel.

## Mobile Lighthouse: measured results, not target claims

Lighthouse **13.5.0**, default mobile emulation **412 × 823**, DPR **1.75**, simulated throttling (RTT 150 ms, throughput 1638.4 Kbps, CPU slowdown ×4), fresh browser/cache per audit, local loopback server. The CLI used Playwright's real Chrome-for-Testing executable. No remote/CDN/deployed latency is represented.

The configured npm proxy returned **403** for the first isolated install attempt. Retrying with the public npm registry succeeded. `npm exec --package=lighthouse` used the npm cache outside the repository; no package manifest/config changes were made.

Actual command pattern:

```sh
CHROME_PATH='<Playwright Chrome-for-Testing executable>' \
npm exec --yes --registry=https://registry.npmjs.org --package=lighthouse -- \
  lighthouse http://127.0.0.1:3103 --chrome-flags='--headless --no-sandbox' \
  --output=json --output=html --output-path='<scratch report path>' \
  --only-categories=performance,accessibility,best-practices,seo
```

| Run (UTC, 2026-10-09) | Performance | Accessibility | Best Practices | SEO | FCP | LCP | Speed Index | TBT | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 17:52:20 | 75 | 100 | 92 | 100 | 1119 ms | 2827 ms | 8684 ms | 478 ms | 0 |
| 17:55:08 | 97 | 100 | 92 | 100 | 779 ms | 2424 ms | 779 ms | 126 ms | 0 |
| 17:55:20 | 97 | 100 | 92 | 100 | 775 ms | 2427 ms | 775 ms | 126 ms | 0 |

Median local Performance is **97**, but the first measured 75 is retained, not hidden. The first audit was launched alongside test/typecheck work; repeats were sequential after browser work finished. Host scheduling/cache/load could explain the difference, but causality was not established. Every audit reports no run warnings. Accessibility passes the automated target; Best Practices consistently fails the 95 target. This is not field Core Web Vitals and includes no measured INP or paid traffic.

## Findings for parent — not silently fixed

### QA-01 — Missing favicon (Low, asset/console)

- Repro: request `/favicon.ico`; actual status **404**. Lighthouse `errors-in-console` records this exact resource and lowers Best Practices.
- Root cause: there is no favicon/icon file under app/public in this build. Add an actual icon using the framework's supported convention in a parent-owned change, then rebuild and re-audit.
- Evidence: each Lighthouse JSON/HTML and `responsive.json` (`faviconStatus=404`).

### QA-02 — CSP eval probe in validation dependency (Low, security-policy diagnostics)

- Repro: load the production landing. Chrome DevTools Issues reports `ContentSecurityPolicyIssue`, `script-src`, enforced `kEvalViolation`, pointing to `/_next/static/chunks/0au-oe6luuprb.js` line 0 column 6341.
- Root cause traced to the bundle's caught `Function("")` capability probe. Installed Zod source `node_modules/zod/src/v4/core/util.ts:517–534` contains this probe; it explicitly skips under `globalConfig.jitless`. `next.config.ts:5` omits `unsafe-eval` in production. The exception is caught and schema validation/lead delivery still pass, but the browser emits a policy issue and Lighthouse flags `inspector-issues`.
- Parent can investigate a CSP-compatible jitless configuration before schemas are instantiated; **do not weaken production CSP just to hide the warning**. No dependency/app/security configuration was changed here.
- Evidence: `responsive.json` includes exact CDP issue details; Lighthouse reports and installed/built source inspected.

### QA-03 — Performance variance and JavaScript opportunity (Medium, performance acceptance)

- One local run is below Performance 90; two sequential repeats are 97. Treat the target as locally demonstrated in repeats, not universally proven.
- First audit identifies approximately 80 KiB unused JS across three chunks and about 14 KiB legacy JS; those are diagnostics, not proof all of it is removable. The measured bottlenecks in the slower run are Speed Index/TBT, with CLS 0. Precise module attribution or optimization causality was not established; no optimization was attempted.
- Evidence: all three raw audit reports; `performance-runs.json` retains every measurement.

## Acceptance limitations

No deployment, CDN/network geography, production secrets/controller identity, public traffic, email delivery, native Safari/Firefox, real phone, native 200% browser zoom, screen-reader audit, exhaustive report-print verification or long-duration retention behavior was tested. Downloaded HTML is delivered locally; no emailed-report claim is made. The live durable tests exercise campaign variant b; the exploratory/performance landing exercises default variant a. The known NYSE Arca-versus-strict-NYSE assignment exception is not resolved by this QA. Remaining application/config/manifest/README/testing-doc changes belong to the parent and were not touched here.

## Parent final verification — October 10, 2026 (CEST)

The findings above record the earlier build, not the final state. Parent reproduced both security/icon regressions as failing browser tests: an eval `securitypolicyviolation` and `/favicon.ico` HTTP 404. Configuring Zod `jitless` before schema construction removed the capability probe without weakening CSP; a deterministic 32px radar favicon was added. Both production browser regressions now pass.

Analytics corrections distinguish report `session_start` from actual `landing_view`, and prevent lead replay attribution to any session other than the original receipt session. New unit/integration RED → GREEN regressions verify both. The current consented live funnel contains **13 events**, including technical report bootstrap, with only one landing event. Denied flow still delivers the report with zero analytics events. Both real browser/DB tests passed again and cleaned their exact own rows; the original 12-event evidence above remains historical evidence of the prior taxonomy.

Final parent quality gates: 26 unit tests, 25 PostgreSQL integration tests, typecheck, lint and production build passed. Standard Playwright: 19 passed, 2 opt-in tests skipped; explicit live suite: 2 passed. A transient Node static-render import error introduced by `next/navigation` was corrected to `next/navigation.js`, matching existing repository conventions; the complete browser suite then passed.

New mobile Lighthouse audit completed at `2026-10-09T22:10:22.956Z` (October 10, 00:10 CEST): **Performance 99, Accessibility 100, Best Practices 100, SEO 100**; LCP 2.2s, TBT 60ms, CLS 0. `errors-in-console` and `inspector-issues` items are empty. Raw artifacts: scratch `lighthouse-fixed.report.json` and `lighthouse-fixed.report.html`. Same local mobile audit method as above; no field or deployed-performance claim. Earlier 75/97/97 performance measurements remain disclosed.

The runtime now displays the user-supplied exact test name `Matěj STýblo` and deliberately nonfunctional `test@example.invalid`. It is a test-only assignment, not commercial contact processing, and deployment is explicitly excluded.

The final audit is also preserved in repository files `docs/qa/lighthouse-mobile-final.json` and `docs/qa/lighthouse-mobile-final.html`; it does not depend on scratch retention. These are actual Lighthouse artifacts, not reconstructed summaries.
