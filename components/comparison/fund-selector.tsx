import { ETFs, type Etf, type EtfId } from '@/data/etfs';
import { percent } from '@/lib/format';
export function FundSelector({fund, index, onChange,invalid}:{fund:Etf; index:number; onChange:(id:EtfId)=>void;invalid:boolean}) {
 return <section className="fund"><div className="fund-top"><label htmlFor={`etf-${index}`} className="eyebrow">{index === 0 ? 'První ETF' : 'Druhé ETF'}</label><span className="fund-role">{fund.ucits ? 'Evropské UCITS' : 'USA · reference'}</span></div>
 <select id={`etf-${index}`} value={fund.id} aria-invalid={invalid} aria-describedby={invalid?"etf-pair-error":undefined} onChange={e=>onChange(e.target.value as EtfId)}>{ETFs.map(etf=><option key={etf.id} value={etf.id}>{etf.ticker} — {etf.issuer}</option>)}</select>
 <p className="fund-name">{fund.name}</p><div className="fund-summary"><div><strong className="fund-cost">{percent(fund.chargePct)}</strong><span className="small"> ročně · {fund.chargeLabel}</span></div><span className="venue">{fund.exchange}</span></div>
 <p className="fund-meta">{fund.index} · {fund.income} · {fund.tradingCurrency}</p></section>;
}
