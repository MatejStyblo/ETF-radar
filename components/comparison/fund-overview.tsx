import { ETFs, type Etf, type EtfId } from '@/data/etfs';
import { percent } from '@/lib/format';
import type { Scenario } from '@/lib/calculations/project';

export function FundOverview({ funds, scenario, onSelect }: {
  funds: [Etf, Etf];
  scenario: Scenario | null;
  onSelect: (id: EtfId) => void;
}) {
  return <section className="fund-overview" aria-labelledby="fund-overview-title">
    <div className="overview-toolbar">
      <div>
        <p className="terminal-label">ETF RADAR / SROVNÁVACÍ TERMINÁL</p>
        <h2 id="fund-overview-title"><span>{funds[0].ticker}</span><span className="overview-divider">/</span>{funds[1].ticker}<small>Průběžné náklady v souvislostech</small></h2>
      </div>
      <div className="quick-funds" aria-label="Rychlý výběr prvního ETF">
        <span className="terminal-label">Rychlý výběr</span>
        <div>{ETFs.map(fund => <button key={fund.id} type="button" aria-pressed={fund.id === funds[0].id} onClick={() => onSelect(fund.id)}>{fund.ticker}</button>)}</div>
      </div>
    </div>
    <p className="overview-description">Doložené fondy. Přesné listingy. Vlastní hypotetický scénář — bez registrace.</p>
    <dl className="overview-metrics">
      <div><dt>Roční náklad · {funds[0].ticker}</dt><dd>{percent(funds[0].chargePct)}<small>p. a.</small><p>{funds[0].exchange} · {funds[0].chargeLabel}</p></dd></div>
      <div><dt>Roční náklad · {funds[1].ticker}</dt><dd>{percent(funds[1].chargePct)}<small>p. a.</small><p>{funds[1].exchange} · {funds[1].chargeLabel}</p></dd></div>
      <div><dt>Rozdíl ročních sazeb</dt><dd>{new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 4 }).format(Math.abs(funds[0].chargePct - funds[1].chargePct))}<small>p. b.</small><p>Procentní body, nikoli výnos</p></dd></div>
      <div><dt>Investiční horizont</dt><dd>{scenario?.years ?? '—'}<small>let</small><p>Hypotetický model · ne prognóza</p></dd></div>
    </dl>
  </section>;
}
