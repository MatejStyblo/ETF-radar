import {test,expect} from '@playwright/test';
test('failed withdrawal never blocks capture and submits current consent independently of cookies',async({page})=>{
 const submissions:{headers:Record<string,string>;body:Record<string,unknown>}[]=[];
 let deletes=0;
 await page.route('**/api/events',async route=>{
  if(route.request().method()==='DELETE'){deletes++;await route.fulfill({status:503,json:{ok:false}});return;}
  await route.fulfill({status:200,json:{ok:true}});
 });
 await page.route('**/api/leads',async route=>{submissions.push({headers:route.request().headers(),body:route.request().postDataJSON()});await route.fulfill({status:503,json:{ok:false,message:'Test zachování vstupů.'}});});
 await page.goto('/'); await page.getByRole('button',{name:'Povolit',exact:true}).click();
 await page.getByLabel('Email',{exact:true}).fill('consent-test@example.test');
 await page.getByRole('button',{name:'Získat moje srovnání'}).click();
 await expect.poll(()=>submissions.length).toBe(1);
 expect(submissions[0].headers['x-analytics-consent']).toBe('true');
 await page.getByRole('button',{name:'Odvolat',exact:true}).click(); await expect.poll(()=>deletes).toBe(1);
 await page.getByRole('button',{name:'Získat moje srovnání'}).click(); await expect.poll(()=>submissions.length).toBe(2);
 expect(submissions[1].headers['x-analytics-consent']).toBe('false');
 expect(submissions[1].body.attemptId).toBe(submissions[0].body.attemptId);
 await expect(page.getByLabel('Email',{exact:true})).toHaveValue('consent-test@example.test');
});

test('withdrawal synchronizes already initialized tabs',async({page,context})=>{
 const events:Record<string,unknown>[]=[];
 await context.route('**/api/events',async route=>{
  if(route.request().method()==='POST')events.push(route.request().postDataJSON());
  await route.fulfill({status:200,json:{ok:true}});
 });
 await page.goto('/');await page.getByRole('button',{name:'Povolit',exact:true}).click();
 await expect(page.getByRole('button',{name:'Odvolat',exact:true})).toBeVisible();
 const other=await context.newPage();await other.goto('/');
 await expect(other.getByRole('button',{name:'Odvolat',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Odvolat',exact:true}).click();
 await expect(other.getByText('Měření je odmítnuté.',{exact:true})).toBeVisible();
 const count=events.length;
 await other.getByLabel('Druhé ETF').selectOption('cspx');
 await other.getByLabel('Počáteční vklad').fill('220000');await other.getByLabel('Počáteční vklad').blur();
 await expect(other.getByLabel('Počáteční vklad')).toHaveValue('220000');
 expect(events.length).toBe(count);
});

test('measurement starts only after explicit opt-in; revoke stops it',async({page})=>{
 const events:Record<string,unknown>[]=[];let deleted=0;
 await page.route('**/api/events',async route=>{if(route.request().method()==='DELETE'){deleted++;await route.fulfill({status:200,json:{ok:true}});return;}events.push(route.request().postDataJSON());await route.fulfill({status:200,json:{ok:true}})});
 await page.goto('/');await page.getByLabel('Počáteční vklad').fill('200000');await page.getByLabel('Počáteční vklad').blur();
 expect(events).toEqual([]);
 await page.getByRole('button',{name:'Povolit',exact:true}).click();
 await expect.poll(()=>events.length).toBeGreaterThan(0);expect(events[0].name).toBe('landing_view');
 await page.getByLabel('Počáteční vklad').fill('300000');await page.getByLabel('Počáteční vklad').blur();
 await expect.poll(()=>events.some(e=>e.name==='calculator_interaction')).toBe(true);
 for(const event of events)expect(Object.keys(event).sort()).toEqual(event.name==='landing_view'?['acquisition','adVariant','consent','eventId','name']:['adVariant','consent','eventId','name']);
 await page.getByRole('button',{name:'Odvolat',exact:true}).click();await expect.poll(()=>deleted).toBe(1);
 const count=events.length;await page.getByLabel('Druhé ETF').selectOption('cspx');await page.waitForTimeout(300);expect(events.length).toBe(count);
 expect(await page.evaluate(()=>localStorage.getItem('etf-radar-measurement'))).toBe('denied');
});
