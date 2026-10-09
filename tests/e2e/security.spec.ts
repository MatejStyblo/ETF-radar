import { test, expect } from '@playwright/test';

test('production validation respects CSP without eval probes', async ({ page }) => {
  await page.addInitScript(() => {
    const violations: string[] = [];
    Object.assign(window, { validationCspViolations: violations });
    document.addEventListener('securitypolicyviolation', event => {
      if (event.blockedURI === 'eval') violations.push(event.violatedDirective);
    });
  });
  await page.goto('/');
  await page.getByLabel('Počáteční vklad', { exact: true }).fill('120000');
  await page.getByLabel('Počáteční vklad', { exact: true }).press('Tab');
  await expect(page.getByTestId('model-difference')).toBeVisible();
  expect(await page.evaluate(() => Reflect.get(window, 'validationCspViolations'))).toEqual([]);
});

test('brand favicon is available', async ({ request }) => {
  const response = await request.get('/favicon.ico');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/');
  expect((await response.body()).length).toBeGreaterThan(100);
});
