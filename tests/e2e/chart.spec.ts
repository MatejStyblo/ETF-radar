import { test, expect } from '@playwright/test';
import { project } from '../../lib/calculations/project';
import { money } from '../../lib/format';

test('chart explores real annual values by keyboard and switches to costs', async ({ page }) => {
  await page.goto('/');
  const readout = page.getByTestId('chart-readout');
  const slider = page.getByRole('slider', { name: 'Rok v grafu' });
  const scenario = { initial: 100000, monthly: 3000, years: 20, grossReturnPct: 5 };
  const first = project(scenario, .0945);
  await expect(readout).toContainText(money(first.balance));
  await slider.focus(); await page.keyboard.press('Home');
  await expect(slider).toHaveValue('0');
  await expect(readout.locator('dd')).toHaveText([money(100000), money(100000), money(100000)]);
  await page.keyboard.press('ArrowRight');
  await expect(readout).toContainText(money(first.annual[1].balance));
  await page.getByRole('button', { name: 'Dopad nákladů', exact: true }).click();
  await expect(readout).toContainText(money(first.annual[1].costImpact));
  await expect(readout.locator('dd')).toHaveCount(2);
  await page.getByLabel('Investiční horizont').fill('1');
  await expect(slider).toHaveAttribute('max', '1');
  await page.getByLabel('Investiční horizont').fill('0');
  await expect(slider).toHaveCount(0);
});

test('mobile taps select years; zero and negative-return scenarios stay readable', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const svg = page.locator('.chart-plot svg');
  await svg.scrollIntoViewIfNeeded();
  await svg.click({ position: { x: 2, y: 80 } });
  await expect(page.getByRole('slider', { name: 'Rok v grafu' })).toHaveValue('0');
  await page.getByLabel('Počáteční vklad').fill('0');
  await page.getByLabel('Měsíční příspěvek').fill('0');
  await expect(page.getByTestId('chart-readout').locator('dd')).toHaveText([money(0), money(0), money(0)]);
  expect(await page.locator('.chart-line').first().getAttribute('d')).not.toMatch(/NaN|Infinity/);
  await page.getByLabel('Počáteční vklad').fill('100000000');
  await page.getByLabel('Hypotetický hrubý výnos').fill('-30');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
