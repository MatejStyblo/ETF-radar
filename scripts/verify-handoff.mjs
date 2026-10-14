// Only synthetic demo submissions; opt in explicitly to write to the deployed demo.
import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const origin = process.env.HANDOFF_ORIGIN ?? 'http://127.0.0.1:3103';
const remote = new URL(origin).hostname !== '127.0.0.1';
if (remote) assert.equal(process.env.HANDOFF_DEMO_WRITE_AUTHORIZED, '1');
const output = process.env.HANDOFF_OUTPUT ?? 'docs/qa/handoff/production-funnel';
const campaign = `handoff_${randomUUID().replaceAll('-', '')}`;
const email = `${campaign}@example.invalid`;
const result = { origin, checkedAt: new Date().toISOString(), campaign, email, flows: [], persistenceEvidence: 'Report reload and PDF from the server-stored snapshot; no independent production SQL query.', cleanup: 'Synthetic demo fixtures retained under the campaign above; no unrelated data removed.' };
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  for (const [variant, consent, width] of [['a', true, 375], ['b', false, 1440]]) {
    const context = await browser.newContext({ viewport: { width, height: 812 } });
    const page = await context.newPage();
    const errors = [], events = [];
    let submission;
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      if (request.method() !== 'POST') return;
      if (new URL(request.url()).pathname === '/api/events') events.push(request.postDataJSON());
      if (new URL(request.url()).pathname === '/api/leads') submission = request.postDataJSON();
    });
    await page.goto(`${origin}/?ad_variant=${variant}&utm_source=qa&utm_medium=handoff&utm_campaign=${campaign}`);
    assert.equal(events.length, 0);
    await page.getByRole('button', { name: consent ? 'Povolit' : 'Odmítnout', exact: true }).click();
    if (consent) {
      for (let i = 0; i < 50 && !(await context.cookies()).some(cookie => cookie.name === 'etf_analytics'); i++) await page.waitForTimeout(100);
      assert.ok((await context.cookies()).some(cookie => cookie.name === 'etf_analytics'));
    }
    const expectedHeadline = variant === 'a' ? 'Malý roční poplatek. Jaký rozdíl udělá za 20 let?' : 'ETF na NYSE nejsou všechna stejná.';
    assert.equal((await page.locator('h1').innerText()).replace(/\s+/g, ' '), expectedHeadline);
    const before = await page.locator('.report-preview tbody').innerText();
    await page.getByLabel('Počáteční vklad', { exact: true }).fill('234567');
    await page.getByLabel('Počáteční vklad', { exact: true }).press('Tab');
    assert.notEqual(await page.locator('.report-preview tbody').innerText(), before);
    await page.locator('#lead-email').fill('invalid');
    await page.getByRole('button', { name: 'Získat moje srovnání', exact: true }).click();
    assert.equal(await page.locator('#lead-email').getAttribute('aria-invalid'), 'true');
    await page.locator('#lead-email').fill(email);
    assert.equal(await page.getByRole('checkbox').isChecked(), false);
    const saving = page.waitForResponse(response => new URL(response.url()).pathname === '/api/leads' && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Získat moje srovnání', exact: true }).click();
    assert.equal((await saving).status(), 200);
    await page.waitForURL(`${origin}/report`);
    await page.locator('#report-title').waitFor();
    await page.reload();
    await page.locator('#report-title').waitFor();
    const reportText = await page.locator('main').innerText();
    assert.ok(reportText.includes('234') && reportText.includes('STXF') && reportText.includes('STXG'));
    assert.ok(!reportText.includes(email));
    const pdfResponse = await context.request.get(`${origin}/report/download/pdf`);
    assert.equal(pdfResponse.status(), 200);
    assert.ok(pdfResponse.headers()['content-type'].includes('application/pdf'));
    const pdfBytes = await pdfResponse.body();
    assert.equal(pdfBytes.subarray(0, 5).toString(), '%PDF-');
    const pdf = await PDFDocument.load(pdfBytes);
    assert.ok(pdf.getPageCount() >= 2);
    await writeFile(`${output}/report-${variant}.pdf`, pdfBytes);
    const html = await context.request.get(`${origin}/report/download`);
    assert.equal(html.status(), 200);
    assert.ok((await html.text()).includes('Checklist'));
    const retry = await context.request.post(`${origin}/api/leads`, { headers: { Origin: origin, 'X-Analytics-Consent': String(consent) }, data: submission });
    assert.equal(retry.status(), 200);
    assert.deepEqual(await retry.json(), { ok: true, reportUrl: '/report' });
    await page.screenshot({ path: `${output}/report-${variant}.png`, fullPage: true });
    if (!consent) assert.equal(events.length, 0);
    assert.deepEqual(errors, []);
    result.flows.push({ variant, consent, width, reportReload: true, pdfPages: pdf.getPageCount(), idempotentRetry: true, invalidEmailRejected: true, previewRespondsToInputs: true, analyticsPosts: events.length, runtimeErrors: errors });
    await context.close();
  }
} finally {
  await browser.close();
  await writeFile(`${output}/results.json`, JSON.stringify(result, null, 2));
}
console.log(JSON.stringify(result, null, 2));
