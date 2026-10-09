import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('ad B matches both headline and comparison action', async ({page})=>{
 await page.goto('/?ad_variant=b');
 await expect(page.getByRole('heading',{level:1})).toHaveText('ETF na S&P 500 nejsou všechna stejná.');
 await expect(page.getByRole('link',{name:'Porovnat ETF'})).toBeVisible();
});
test('invalid inputs hide old result and decimal comma is accepted',async({page})=>{
 await page.goto('/');
 await page.getByLabel('Investiční horizont').fill('0');
 await expect(page.getByTestId('model-difference')).toHaveCount(0);
 await expect(page.getByRole('status').filter({hasText:'Nejdřív upravte vstupy'})).toBeVisible();
 await page.getByLabel('Investiční horizont').fill('20');
 await page.getByLabel('Hypotetický hrubý výnos').fill('5,5');
 await expect(page.getByTestId('model-difference')).toBeVisible();
 await page.getByLabel('Počáteční vklad').fill('Infinity');
 await expect(page.getByTestId('model-difference')).toHaveCount(0);
});
for (const width of [375,768,1440]) test(`responsive ${width}: no overflow and usable first screen`,async({page})=>{
 await page.setViewportSize({width,height:812});
 await page.goto('/');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 if(width===375){
  for(const label of ['První ETF','Druhé ETF','Počáteční vklad']) {
   const box=await page.getByLabel(label).boundingBox();
   expect(box!.y+box!.height).toBeLessThanOrEqual(812);
  }
 }
 await expect(page.getByRole('button',{name:'Získat moje srovnání'})).toBeVisible();
 const a11y=await new AxeBuilder({page}).analyze();
 expect(a11y.violations).toEqual([]);
});

test('same fund is rejected and the selectors describe the problem',async({page})=>{
 await page.goto('/');await page.getByLabel('Druhé ETF').selectOption('spy');
 await expect(page.getByTestId('model-difference')).toHaveCount(0);
 await expect(page.getByLabel('Druhé ETF')).toHaveAttribute('aria-invalid','true');
 await expect(page.getByLabel('Druhé ETF')).toHaveAttribute('aria-describedby','etf-pair-error');
 await expect(page.getByRole('button',{name:'Získat moje srovnání'})).toBeDisabled();
});
test('large valid scenario remains within mobile viewport',async({page})=>{
 await page.setViewportSize({width:375,height:812});await page.goto('/');
 await page.getByLabel('Počáteční vklad').fill('100000000');
 await page.getByLabel('Měsíční příspěvek').fill('1000000');
 await page.getByLabel('Investiční horizont').fill('50');
 await page.getByLabel('Hypotetický hrubý výnos').fill('30');
 await expect(page.getByTestId('model-difference')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
test('public comparison shows real funds and recalculates without email', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Malý roční poplatek. Jaký rozdíl udělá za 20 let?');
  await expect(page.getByLabel('První ETF')).toHaveValue('spy');
  await expect(page.getByLabel('Druhé ETF')).toHaveValue('ivv');
  const result = page.getByTestId('model-difference');
  await expect(result).toBeVisible();
  const before = await result.textContent();
  await page.getByLabel('Počáteční vklad').fill('250000');
  await expect(result).not.toHaveText(before!);
  await page.getByLabel('Druhé ETF').selectOption('cspx');
  await expect(page.getByText('London Stock Exchange', { exact: true })).toBeVisible();
});
