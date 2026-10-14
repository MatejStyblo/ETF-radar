'use client';

import { useMemo } from 'react';
import type { EtfId } from '@/data/etfs';
import type { Scenario } from '@/lib/calculations/project';
import { money } from '@/lib/format';
import { buildReport } from '@/lib/report/model';

export function ReportPreview({ scenario, etfIds }: { scenario: Scenario | null; etfIds: [EtfId, EtfId] }) {
  const report = useMemo(() => scenario ? buildReport(scenario, etfIds) : null, [scenario, etfIds]);
  if (!report) return null;

  return <div className="report-preview">
    <p className="eyebrow">Ukázka vašeho reportu</p>
    <table>
      <caption>Modelový rozdíl zůstatků · {report.etfs[0].ticker} / {report.etfs[1].ticker}</caption>
      <thead><tr><th scope="col">Horizont</th><th scope="col">Rozdíl</th></tr></thead>
      <tbody>{report.horizons.filter(row => [5, 10, 20, 30].includes(row.years)).map(row => <tr key={row.years}>
        <th scope="row">{row.years} let</th>
        <td>{money(Math.abs(row.results[0].balance - row.results[1].balance))}</td>
      </tr>)}</tbody>
    </table>
    <p className="hint">Stejné vlastní vklady a hypotetický hrubý výnos. Izolovaný dopad nákladů, ne předpověď.</p>
    <p className="preview-checklist">V plném reportu: roční tabulka, zdroje a checklist pro ověření KID, dostupnosti a nákladů brokera.</p>
  </div>;
}
