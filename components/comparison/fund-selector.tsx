import { ETFs, type Etf, type EtfId } from '@/data/etfs';
import { percent } from '@/lib/format';
export function FundSelector({fund, index, onChange,invalid}:{fund:Etf; index:number; onChange:(id:EtfId)=>void;invalid:boolean}) {
 return <section className="fund"><div className="fund-top"><label htmlFor={`etf-${index}`} className="eyebrow">{index === 0 ? 'První ETF' : 'Druhé ETF'}</label><span className="fund-role">{fund.role==='nyse-primary'?'NYSE · hlavní výběr':fund.ucits ? 'Evropské UCITS' : 'USA · reference'}</span></div>
 <select id={`etf-${index}`} value={fund.id} aria-invalid={invalid} aria-describedby={invalid?"etf-pair-error":undefined} onChange={e=>onChange(e.target.value as EtfId)}>{([{role:'nyse-primary',label:'NYSE — hlavní výběr'},{role:'us-reference',label:'NYSE Arca — reference'},{role:'eu-comparison',label:'Evropský UCITS doplněk (LSE)'}] as const).map(group=><optgroup key={group.role} label={group.label}>{ETFs.filter(etf=>etf.role===group.role).map(etf=><option key={etf.id} value={etf.id}>{etf.ticker} — {etf.issuer} · {etf.exchange}</option>)}</optgroup>)}</select>
 <p className="fund-name">{fund.name}</p><div className="fund-summary"><div><strong className="fund-cost">{percent(fund.chargePct)}</strong><span className="small"> ročně · {fund.chargeLabel}</span></div><span className="venue">{fund.exchange}</span></div>
 </section>;
}
