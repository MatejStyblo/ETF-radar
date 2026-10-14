// Read-only production audit: never sends a valid lead or opts into analytics.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const origin = process.env.AUDIT_ORIGIN ?? 'https://etf-radar-dun.vercel.app';
const output = process.env.AUDIT_OUTPUT ?? 'docs/qa/final-audit/production-browser';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const evidence = { origin, browser: browser.version(), checkedAt: new Date().toISOString(), viewports: [], checks: [], failures: [] };
async function check(name, fn) {
  try { const detail = await fn(); evidence.checks.push({ name, status: 'PASS', detail }); }
  catch (error) { evidence.failures.push({ name, status: 'FAIL', message: error.message }); }
}
const formatted = value => new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(value);
// Independent closed-form annuity, not the application's monthly recurrence.
function balance(s, charge) {
  const q = Math.pow((1 + s.grossReturnPct / 100) * (1 - charge / 100), 1 / 12);
  const n = s.years * 12;
  return s.initial * q ** n + s.monthly * (q === 1 ? n : Math.expm1(n * Math.log(q)) / (q - 1));
}
try {
  for (const width of [375, 390, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 812 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [], failedRequests = [], eventPosts = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('requestfailed', request => failedRequests.push({ path: new URL(request.url()).pathname, error: request.failure()?.errorText }));
    page.on('request', request => { if (new URL(request.url()).pathname === '/api/events' && request.method() === 'POST') eventPosts.push('POST'); });
    const started = Date.now();
    const response = await page.goto(origin);
    await page.getByTestId('model-difference').waitFor();
    const readyMs = Date.now() - started;
    await page.screenshot({ path: `${output}/${width}-initial.png` });
    const initial = await page.evaluate(() => ({ width: innerWidth, documentWidth: document.documentElement.scrollWidth, headline: document.querySelector('h1')?.textContent, demoNotice: Boolean(document.querySelector('.demo-notice')), cookieHeight: document.querySelector('#cookie-banner')?.getBoundingClientRect().height, initialInputBottom: document.querySelector('#initial')?.getBoundingClientRect().bottom, primaryCtaBottom: document.querySelector('.intro-cta')?.getBoundingClientRect().bottom }));
    evidence.viewports.push({ width, height: 812, status: response.status(), readyMs, ...initial });
    await check(`${width}: overflow and pre-consent boundary`, async () => { assert.equal(initial.documentWidth, width); assert.equal(eventPosts.length, 0); return { noEventPosts: true }; });
    await check(`${width}: first-screen interaction`, async () => { assert.ok(initial.primaryCtaBottom <= 812); if (width <= 390) assert.ok(initial.initialInputBottom <= 812, `initial input ends at ${initial.initialInputBottom}px`); return initial.initialInputBottom; });
    await check(`${width}: axe accessibility`, async () => { const result = await new AxeBuilder({ page }).analyze(); await writeFile(`${output}/${width}-axe.json`, JSON.stringify(result.violations, null, 2)); assert.equal(result.violations.length, 0); });
    await page.getByRole('button', { name: 'Odmítnout', exact: true }).click();
    await check(`${width}: honeypot excluded`, async () => { const input = page.locator('#website'); assert.equal(await input.getAttribute('tabindex'), '-1'); assert.equal(await input.isVisible(), false); });
    await page.screenshot({ path: `${output}/${width}-full.png`, fullPage: true });
    if (width === 375) {
      const scenario = { initial: 100000, monthly: 3000, years: 20, grossReturnPct: 5 };
      for (const [name, patch] of [['default', {}], ['zero initial', { initial: 0 }], ['zero monthly', { monthly: 0 }], ['zero investments', { initial: 0, monthly: 0 }], ['zero growth', { grossReturnPct: 0 }], ['negative growth', { grossReturnPct: -30 }], ['max horizon', { years: 50 }], ['decimal comma', { initial: 123456.78, grossReturnPct: 5.5 }]]) {
        const s = { ...scenario, ...patch };
        for (const [key, value] of Object.entries(s)) await page.locator(`#${key}`).fill(String(value).replace('.', ','));
        await check(`financial ${name}`, async () => {
          const expected = [balance(s, 0.0545), balance(s, 0.18)];
          const actual = await page.locator('.result-pair .balance').allTextContents();
          assert.deepEqual(actual, expected.map(formatted));
          assert.equal(await page.getByTestId('model-difference').textContent(), formatted(Math.abs(expected[0] - expected[1])));
          return { scenario: s, independent: expected, baseline: balance(s, 0), actual };
        });
      }
      await page.locator('#years').fill('Infinity');
      await check('invalid numeric hides result', async () => { assert.equal(await page.getByTestId('model-difference').count(), 0); assert.equal(await page.getByRole('button', { name: 'Získat moje srovnání' }).isEnabled(), false); });
      for (const [key, value] of Object.entries(scenario)) await page.locator(`#${key}`).fill(String(value));
      await page.getByLabel('První ETF', { exact: true }).selectOption('spy');
      await page.getByLabel('Druhé ETF', { exact: true }).selectOption('ivv');
      await check('SPY / IVV independent result', async () => { assert.deepEqual(await page.locator('.result-pair .balance').allTextContents(), [balance(scenario, 0.0945), balance(scenario, 0.03)].map(formatted)); });
      await page.getByRole('slider', { name: 'Rok v grafu' }).focus();
      await page.keyboard.press('Home');
      await check('chart keyboard', async () => { assert.equal(await page.getByRole('slider', { name: 'Rok v grafu' }).inputValue(), '0'); });
      await page.getByRole('button', { name: 'Získat moje srovnání' }).click();
      await check('invalid email client validation', async () => { assert.equal(await page.locator('#lead-email').getAttribute('aria-invalid'), 'true'); });
      await page.reload();
      await check('denial persists after refresh', async () => { assert.equal(await page.locator('#cookie-banner').count(), 0); assert.equal(eventPosts.length, 0); });
    }
    await check(`${width}: runtime errors`, async () => { assert.deepEqual(errors, []); assert.deepEqual(failedRequests, []); return { errors, failedRequests }; });
    await context.close();
  }
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${origin}/?ad_variant=b`);
  await check('advertisement B message match', async () => { assert.equal(await page.locator('h1').textContent(), 'ETF na NYSE nejsou všechna stejná.'); assert.equal(await page.getByRole('link', { name: 'Porovnat ETF', exact: true }).count(), 1); });
  await page.goto(`${origin}/privacy`);
  evidence.privacy = { prelaunch: (await page.locator('main').textContent()).includes('není právně schválená'), nonfunctionalContact: (await page.locator('main').textContent()).includes('test@example.invalid') };
  await page.screenshot({ path: `${output}/privacy.png`, fullPage: true });
  for (const [path, expected] of [['/report/download', 401], ['/dashboard/export', 404], ['/favicon.ico', 200]]) await check(`anonymous ${path}`, async () => { const r = await context.request.get(`${origin}${path}`); assert.equal(r.status(), expected); return { status: r.status(), cache: r.headers()['cache-control'] }; });
  await check('anonymous dashboard redirects to login or disabled 404', async () => { const r = await context.request.get(`${origin}/dashboard`, { maxRedirects: 0 }); assert.ok([307, 404].includes(r.status())); return { status: r.status(), location: r.headers().location }; });
  await page.goto(`${origin}/report`);
  await check('unauthorized report has no private content', async () => { assert.equal(await page.locator('h1').textContent(), 'Přístup k reportu chybí nebo vypršel'); });
  // Malformed payloads cannot reach persistence; these are rejection tests only.
  for (const [name, body, extra, expected] of [['invalid email', { email: 'invalid' }, {}, 422], ['cross origin', {}, { Origin: 'https://evil.invalid' }, 403], ['client fee injection', { chargePct: 0 }, {}, 422], ['analytics no consent', { consent: false }, {}, 422]]) await check(`API rejects ${name}`, async () => { const r = await context.request.post(`${origin}/${name.startsWith('analytics') ? 'api/events' : 'api/leads'}`, { headers: { Origin: origin, ...extra }, data: body }); assert.equal(r.status(), expected); assert.equal(r.headers()['set-cookie'], undefined); return r.status(); });
  await context.close();
} finally {
  await browser.close();
  await writeFile(`${output}/results.json`, JSON.stringify(evidence, null, 2));
}
console.log(JSON.stringify({ checks: evidence.checks.length, failures: evidence.failures, output }, null, 2));
if (evidence.failures.length) process.exitCode = 1;
