import { expect, test } from 'vitest';
import { buildReport } from '@/lib/report/model';
import { renderReportHtml } from '@/lib/report/html';
import { DEFAULT_SCENARIO } from '@/lib/validation/schemas';
import { DEFAULT_ETF_PAIR, ETF_IDS, ETFs, getEtf } from '@/data/etfs';
test('catalog constants cover exactly the five funds without guessing metadata', () => {
 expect(ETF_IDS).toEqual(['stxf','stxg','spy','ivv','cspx']); expect(DEFAULT_ETF_PAIR).toEqual(['stxf','stxg']); expect(ETFs.map(f=>f.id)).toEqual([...ETF_IDS]);
 for(const id of DEFAULT_ETF_PAIR) expect(getEtf(id)).toMatchObject({tradingCurrency:'Neověřeno',shareClassCurrency:null,domicile:null,isin:null,aum:null,role:'nyse-primary',ucits:false});
 expect(getEtf('stxf').index).toBe('Bloomberg US Large Cap Index'); expect(getEtf('stxg').index).toBe('Bloomberg US 1000 Growth Total Return Index');
});
test('different-index report isolates fees and does not imply return equivalence or best fund', () => {
 const report=buildReport(DEFAULT_SCENARIO,['stxf','stxg']); const text=report.assumptions.join(' '); const html=renderReportHtml(report);
 expect(text).toContain('Odlišné indexy'); expect(text).toContain('izolaci nákladů'); expect(text).toContain('nižší náklad neznamená nejlepší fond');
 expect(html).toContain('Odlišné indexy'); expect(html).toContain('Bloomberg US Large Cap Index'); expect(html).toContain('Bloomberg US 1000 Growth Total Return Index');
 expect(html).toContain('starší prospekt'); expect(html).toContain('650255_STXF_2Q26_Fact_Sheet.pdf'); expect(html).toContain('638062_STXG_2Q26_Fact_Sheet.pdf');
 expect(report.selected[0].baseline).toBe(report.selected[1].baseline);
});
test('historical S&P reference pairs preserve their index and lack different-index warning', () => {
 const report=buildReport(DEFAULT_SCENARIO,['spy','ivv']); expect(report.etfs.map(f=>f.index)).toEqual(['S&P 500','S&P 500']); expect(report.assumptions.join(' ')).not.toContain('Odlišné indexy'); expect(renderReportHtml(report)).not.toContain('Odlišné indexy');
});
