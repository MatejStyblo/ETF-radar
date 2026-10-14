import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [375, 1280]) {
 test(`cookie banner is visible, accessible and remembers reversible choices at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({width,height:812});
  const events: Record<string,unknown>[]=[];
  await page.route('**/api/events',async route=>{
   if(route.request().method()==='POST')events.push(route.request().postDataJSON());
   await route.fulfill({status:200,json:{ok:true}});
  });
  await page.goto('/?utm_source=cookie_test');
  const banner=page.getByRole('complementary',{name:'Cookies a měření návštěv'});
  await expect(banner).toBeVisible();
  await expect(banner.getByRole('button',{name:'Povolit',exact:true})).toBeInViewport();
  await expect(banner.getByRole('button',{name:'Odmítnout',exact:true})).toBeInViewport();
  const allowed=await banner.getByRole('button',{name:'Povolit',exact:true}).boundingBox();
  const denied=await banner.getByRole('button',{name:'Odmítnout',exact:true}).boundingBox();
  expect(allowed!.width).toBeCloseTo(denied!.width,0);
  expect(events).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  expect((await new AxeBuilder({page}).include('#cookie-banner').analyze()).violations).toEqual([]);
  await page.screenshot({path:info.outputPath(`cookie-banner-${width}.png`)});
  await banner.getByRole('button',{name:'Odmítnout',exact:true}).click();
  await expect(banner).not.toBeVisible();
  expect(events).toEqual([]);
  await page.reload();
  await expect(page.getByText('Měření je odmítnuté.',{exact:true})).toBeVisible();
  await expect(banner).not.toBeVisible();
  const settings=page.getByRole('button',{name:'Změnit nastavení cookies',exact:true});
  await settings.click();
  await expect(banner.getByRole('button',{name:'Odmítnout',exact:true})).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(banner).not.toBeVisible();
  await expect(settings).toBeFocused();
  await settings.click();
  await banner.getByRole('button',{name:'Povolit',exact:true}).click();
  await expect(banner).not.toBeVisible();
  await expect.poll(()=>events.some(event=>event.name==='landing_view')).toBe(true);
  await expect(settings).toBeFocused();
  await page.getByRole('button',{name:'Odvolat',exact:true}).click();
  await expect(page.getByText('Měření je odmítnuté.',{exact:true})).toBeVisible();
  await expect(banner).not.toBeVisible();
 });
}
