import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Workspace } from '@/components/comparison/workspace';
import { FundDetails } from '@/components/report/fund-details';
import { Results } from '@/components/calculator/results';
import { getEtf } from '@/data/etfs';
import { DEFAULT_SCENARIO } from '@/lib/validation/schemas';
import { project } from '@/lib/calculations/project';
vi.mock('@/components/lead-form/lead-form', () => ({ LeadForm: () => null }));
beforeEach(() => vi.stubGlobal('React', React));
afterEach(() => vi.unstubAllGlobals());
test('public default is the primary NYSE pair with grouped exact venues and immediate mixed-index warning', () => {
 const html = renderToStaticMarkup(<Workspace attribution={{ ad_variant: 'a' }} privacy={{ name: null, contact: null, enabled: false }}/>);
 expect(html).toMatch(/value="stxf" selected/);
 expect(html).toMatch(/value="stxg" selected/);
 for (const text of ['NYSE — hlavní výběr','NYSE Arca — reference','Evropský UCITS doplněk (LSE)','STXF','STXG','PRIIPs','Odlišné indexy a strategie','pouze k izolaci nákladů','nejde o porovnání výkonnosti']) expect(html).toContain(text);
 expect(html).not.toContain('Dva fondy. Jeden index.');
 expect(html).not.toContain('SPY a IVV jsou');
});
test('results and fund details describe mixed indices without implying matching risk or performance', () => {
 const funds: [ReturnType<typeof getEtf>, ReturnType<typeof getEtf>] = [{ ...getEtf('spy'), index: 'Index A', indexNote: 'Poznámka k indexu', sourceUrls: ['https://example.invalid/prospectus'] }, { ...getEtf('ivv'), index: 'Index B' }];
 const details = renderToStaticMarkup(<FundDetails funds={funds}/>);
 expect(details).toContain('Odlišné indexy. Odlišné strategie.');
 expect(details).toContain('Poznámka k indexu');
 expect(details).toContain('https://example.invalid/prospectus');
 const html = renderToStaticMarkup(<Results funds={funds} scenario={DEFAULT_SCENARIO} results={[project(DEFAULT_SCENARIO,funds[0].chargePct),project(DEFAULT_SCENARIO,funds[1].chargePct)]}/>);
 expect(html).toContain('pouze k izolaci nákladů');
 expect(html).toContain('nejde o porovnání výkonnosti');
 expect(html).toContain('Index A'); expect(html).toContain('Index B');
});
test('landing ad B and metadata match the NYSE scope rather than promising one S&P index', async () => {
 const { default: Page } = await import('@/app/page');
 const html = renderToStaticMarkup(await Page({searchParams:Promise.resolve({ad_variant:'b'})}));
 expect(html).toContain('ETF na NYSE nejsou všechna stejná.');
 expect(html).not.toContain('Stejný index. Důležité rozdíly.');
 expect(html).not.toContain('ETF na S&amp;P 500');
 const { metadata } = await import('@/app/layout');
 expect(JSON.stringify(metadata)).toContain('NYSE');
 expect(JSON.stringify(metadata)).not.toContain('jeden index');
 expect(JSON.stringify(metadata)).not.toContain('S&P 500');
});
test('legacy same-index details retain an accurate heading without mixed-index warning', () => {
 const html = renderToStaticMarkup(<FundDetails funds={[getEtf('spy'),getEtf('ivv')]}/>);
 expect(html).toContain('Stejný index není stejný fond.');
 expect(html).not.toContain('Odlišné indexy. Odlišné strategie.');
});
