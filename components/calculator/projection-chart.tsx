'use client';

import { useId, useState, type PointerEvent } from 'react';
import type { Projection } from '@/lib/calculations/project';
import { chartCeiling, chartPath, projectionPoints, type ChartMode } from '@/lib/charts/projection';
import { money } from '@/lib/format';

const axisMoney = new Intl.NumberFormat('cs-CZ', { notation: 'compact', maximumFractionDigits: 1 });

export function ProjectionChart({ results, tickers }: { results: [Projection, Projection]; tickers: [string, string] }) {
  const id = useId();
  const [mode, setMode] = useState<ChartMode>('balance');
  const [chosenYear, setChosenYear] = useState<number | null>(null);
  const points = projectionPoints(results, mode);
  const ceiling = chartCeiling(points);
  const lastYear = points.length - 1;
  const index = Math.min(chosenYear ?? lastYear, lastYear);
  const selected = points[index];
  const series = [
    { key: 'first' as const, label: tickers[0], className: 'chart-first' },
    { key: 'second' as const, label: tickers[1], className: 'chart-second' },
    ...(mode === 'balance' ? [{ key: 'baseline' as const, label: 'Bez nákladů', className: 'chart-baseline' }] : []),
  ];
  const paths = series.map(s => ({ ...s, path: chartPath(points, s.key, ceiling) }));
  const x = index / Math.max(1, lastYear) * 100;
  function selectPoint(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    setChosenYear(Math.round(ratio * lastYear));
  }
  const yearText = selected.year === 0 ? 'Na začátku' : `Rok ${selected.year}`;
  const accessibleValue = `${yearText}. ${series.map(s => `${s.label}: ${money(selected[s.key])}`).join('. ')}`;

  return <figure id="graf" className="projection-chart" aria-labelledby={`${id}-heading`}>
    <div className="chart-heading"><div><p className="eyebrow">Váš scénář v čase</p><h3 id={`${id}-heading`}>{mode === 'balance' ? 'Jak se vyvíjí hodnota investice' : 'Jak se postupně projeví náklady'}</h3></div></div>
    <div className="chart-mode" aria-label="Zobrazení grafu">
      <button type="button" aria-pressed={mode === 'balance'} onClick={() => setMode('balance')}>Hodnota investice</button>
      <button type="button" aria-pressed={mode === 'costImpact'} onClick={() => setMode('costImpact')}>Dopad nákladů</button>
    </div>
    <div className="chart-legend">{series.map(s => <span key={s.key}><i className={s.className} aria-hidden="true"/>{s.label}</span>)}</div>
    <div className="chart-axis-unit">Modelové Kč</div>
    <div className="chart-frame">
      <div className="chart-y-axis" aria-hidden="true">{[1, .75, .5, .25, 0].map(f => <span key={f}>{axisMoney.format(ceiling * f)}</span>)}</div>
      <div className="chart-plot">
        <svg viewBox="0 0 1000 300" preserveAspectRatio="none" role="img" aria-labelledby={`${id}-title ${id}-description`} onPointerDown={selectPoint} onPointerMove={event => { if (event.pointerType === 'mouse') selectPoint(event); }}>
          <title id={`${id}-title`}>{`${mode === 'balance' ? 'Modelová hodnota investice' : 'Modelový dopad průběžných nákladů'} od roku 0 do roku ${lastYear}`}</title>
          <desc id={`${id}-description`}>Křivky mají společnou škálu od nuly. Přesné hodnoty každého roku zobrazíte posuvníkem pod grafem. Jde o model, nikoliv předpověď.</desc>
          <defs><linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity=".13"/><stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/></linearGradient></defs>
          {[0, 75, 150, 225, 300].map(y => <line key={y} x1="0" y1={y} x2="1000" y2={y} className="chart-grid" vectorEffect="non-scaling-stroke"/>)}
          <path d={`${paths[1].path} L1000,300 L0,300 Z`} fill={`url(#${id}-fill)`}/>
          {[...paths].reverse().map(s => <path key={s.key} d={s.path} className={`chart-line ${s.className}`} vectorEffect="non-scaling-stroke"/>)}
          <line x1={x * 10} y1="0" x2={x * 10} y2="300" className="chart-cursor" vectorEffect="non-scaling-stroke"/>
        </svg>
        {series.map(s => <span key={s.key} className={`chart-point ${s.className}`} aria-hidden="true" style={{ left: `${x}%`, top: `${100 - selected[s.key] / ceiling * 100}%` }}/>) }
        <div className="chart-x-axis" aria-hidden="true"><span>0</span>{lastYear > 1 && <span>{new Intl.NumberFormat('cs-CZ').format(lastYear / 2)}</span>}<span>{lastYear} let</span></div>
      </div>
    </div>
    <label className="chart-slider-label" htmlFor={`${id}-year`}><span>Prohlédnout rok</span><strong>{yearText}</strong></label>
    <input className="chart-year-slider" id={`${id}-year`} type="range" min="0" max={lastYear} step="1" value={index} aria-label="Rok v grafu" aria-valuetext={accessibleValue} onChange={event => setChosenYear(Number(event.target.value))}/>
    <dl className="chart-readout" data-testid="chart-readout">{series.map(s => <div key={s.key}><dt><i className={s.className} aria-hidden="true"/>{s.label}</dt><dd>{money(selected[s.key])}</dd></div>)}</dl>
  </figure>;
}
