import { expect, test } from 'vitest';
import { buildReport } from '@/lib/report/model';
import { DEFAULT_SCENARIO, etfPairSchema } from '@/lib/validation/schemas';

test('verified main-NYSE pair is accepted and resolved into a report', () => {
 const ids = etfPairSchema.parse(['stxf', 'stxg']);
 const report = buildReport(DEFAULT_SCENARIO, ids);
 expect(report.etfs.map(f => [f.id, f.exchange, f.chargePct])).toEqual([['stxf', 'NYSE', 0.0545], ['stxg', 'NYSE', 0.18]]);
});
