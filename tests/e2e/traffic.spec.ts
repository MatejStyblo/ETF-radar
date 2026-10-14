import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';

test('consented campaign visits, incomplete form and saved contact appear in the real dashboard', async ({ browser }) => {
 test.skip(process.env.LIVE_TRAFFIC !== '1', 'Requires explicit local database and server opt-in.');
 test.setTimeout(60000);
 const base = process.env.PLAYWRIGHT_BASE_URL!;
 const url = new URL(base);
 const databaseUrl = new URL(process.env.LIVE_TRAFFIC_DATABASE_URL!);
 expect(['localhost','127.0.0.1']).toContain(url.hostname);
 expect(['localhost','127.0.0.1']).toContain(databaseUrl.hostname);
 const db = new Pool({connectionString:databaseUrl.href});
 const campaign = `traffic_${randomUUID().replaceAll('-','')}`;
 const email = `${campaign}@example.invalid`;
 const source = campaign;
 const contexts = [];
 const sessions: string[] = [];
 const landing = `${base}/?utm_source=${source}&utm_campaign=${campaign}&utm_medium=test`;
 try {
  for (const consent of [true,true,false]) {
   const context=await browser.newContext({viewport:{width:375,height:812}});contexts.push(context);
   const page=await context.newPage();
   await page.goto(landing);
   await page.getByRole('button',{name:consent?'Povolit':'Odmítnout',exact:true}).click();
   await page.locator('#lead-email').fill(email);
   if(consent) {
    await expect.poll(async()=> (await db.query("SELECT count(*)::int AS n FROM analytics_sessions WHERE acquisition->>'utm_campaign'=$1",[campaign])).rows[0].n).toBe(contexts.length);
    const cookie=(await context.cookies()).find(cookie=>cookie.name==='etf_analytics')!;
    sessions.push(cookie.value.split('.')[0]);
    await expect.poll(async()=> (await db.query("SELECT count(*)::int AS n FROM analytics_events WHERE session_id=$1 AND name='lead_form_started'",[sessions.at(-1)])).rows[0].n).toBe(1);
   }
   if(contexts.length===2) {
    await page.getByRole('button',{name:'Získat moje srovnání',exact:true}).click();
    await expect(page).toHaveURL(`${base}/report`);
    await expect(page.getByRole('heading',{name:'Vaše ETF srovnání',exact:true})).toBeVisible();
   }
   if(contexts.length===1) {
    await page.goto(`${base}/?utm_source=changed&utm_campaign=changed`);
    await expect(page.getByText('Měření je povolené.',{exact:true})).toHaveText('Měření je povolené.');
   }
  }
  expect((await db.query("SELECT count(*)::int AS n FROM analytics_sessions WHERE acquisition->>'utm_campaign'=$1",[campaign])).rows[0].n).toBe(2);
  const page=await contexts[0].newPage();
  await page.goto(`${base}/dashboard?range=all`);
  const row=page.getByRole('row').filter({has:page.getByRole('rowheader',{name:source,exact:true})});
  await expect(row).toHaveCount(1);
  expect(await row.locator('td').allTextContents()).toEqual(['test',campaign,'A','2','2','1','1','1','50 %']);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  const audit=await new AxeBuilder({page}).include('section[aria-labelledby="visits-title"]').analyze();
  expect(audit.violations).toEqual([]);
 } finally {
  for(const context of contexts)await context.close();
  const reports=await db.query('SELECT report_id FROM submission_receipts WHERE lead_id IN (SELECT id FROM leads WHERE email=$1)',[email]);
  await db.query('DELETE FROM submission_receipts WHERE lead_id IN (SELECT id FROM leads WHERE email=$1)',[email]);
  await db.query('DELETE FROM reports WHERE id=ANY($1::uuid[])',[reports.rows.map(row=>row.report_id)]);
  await db.query("DELETE FROM rate_limit_buckets WHERE bucket_key IN (SELECT 'lead:'||email_key FROM leads WHERE email=$1) OR bucket_key=ANY($2::text[])",[email,sessions.map(id=>`analytics:${id}`)]);
  await db.query('DELETE FROM leads WHERE email=$1',[email]);
  await db.query('DELETE FROM analytics_sessions WHERE id=ANY($1::uuid[])',[sessions]);
  await db.end();
 }
});
