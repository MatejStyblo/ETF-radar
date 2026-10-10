import { expect, test, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { dashboardCsv } from '@/lib/dashboard/export';
test('CSV quotes real contact fields and neutralizes spreadsheet formulas including leading whitespace', () => {
 const dangerous = ['=CMD()', '+CMD()', '-CMD()', '@CMD()', ' \t=CMD()', '\n+CMD()', '\r@CMD()', '\u00a0-CMD()'];
 const rows = dangerous.map((email, n) => ({ id: String(n), email, createdAt: '2026-10-10T00:00:00.000Z', marketingConsent: false, captures: 2 }));
 const csv = dashboardCsv(rows);
 for (const email of dangerous) expect(csv).toContain(`"'${email}"`);
 expect(csv).toContain('"id","email","created_at","marketing_consent","captures"\r\n');
 expect(dashboardCsv([{ ...rows[0], email: 'normal,"quoted"@example.invalid' }])).toContain('"normal,""quoted""@example.invalid"');
});
