import type {Etf} from '@/data/etfs';
import {percent} from '@/lib/format';
const attributes:{label:string;value:(fund:Etf)=>string}[]=[
 {label:'Celý název',value:f=>f.name},{label:'Značka / poskytovatel',value:f=>f.issuer},{label:'ISIN',value:f=>f.isin??'neověřeno'},
 {label:'Sledovaný index',value:f=>f.index},{label:'Průběžný náklad',value:f=>`${percent(f.chargePct)} · ${f.chargeLabel}`},
 {label:'Konkrétní burza',value:f=>f.exchange},{label:'Obchodní měna',value:f=>f.tradingCurrency},
 {label:'Měna třídy',value:f=>f.shareClassCurrency??'neověřeno'},{label:'Domicil',value:f=>f.domicile??'neověřeno'},
 {label:'Výnosy fondu',value:f=>f.income},{label:'Struktura',value:f=>f.structure},{label:'UCITS',value:f=>f.ucits?'Ano':'Ne · americký fond'},
 {label:'Velikost fondu (AUM)',value:f=>f.aum??'neověřeno'},
];
export function FundDetails({funds}:{funds:[Etf,Etf]}){return <section className="report-section"><div className="report-section-heading"><span className="step">02</span><h2>{funds[0].index===funds[1].index?'Stejný index není stejný fond.':'Odlišné indexy. Odlišné strategie.'}</h2></div><table className="fund-details"><caption className="sr-only">Strukturální srovnání vybraných ETF</caption><thead><tr><th scope="col">Vlastnost</th>{funds.map(f=><th scope="col" key={f.id}>{f.ticker}</th>)}</tr></thead><tbody>{attributes.map(a=><tr key={a.label}><th scope="row">{a.label}</th>{funds.map(f=><td key={f.id}>{a.value(f)}</td>)}</tr>)}</tbody></table><div className="availability-pair">{funds.map(f=><div key={f.id}><h3>{f.ticker} / Dostupnost pro ČR</h3><p>{f.availability}</p>{f.indexNote&&<p>{f.indexNote}</p>}{(f.sourceUrls??[]).map((url,i)=><p key={url}><a href={url} target="_blank" rel="noopener noreferrer">{f.ticker} · ověřovací zdroj {i+1} ↗</a></p>)}</div>)}</div><p className="report-small">{funds.map(f=>`${f.ticker}: ${f.exchange}. `).join('')}{funds.some(f=>f.exchange==='NYSE Arca')?'NYSE Arca není hlavní NYSE. ':''}{funds.some(f=>f.ucits)?'CSPX je evropský UCITS doplněk na LSE, nikoliv NYSE. ':''} Dostupnost u konkrétního brokera ani aktuální KID pro ČR zde neověřujeme. Obchodní měna není měnová expozice.</p></section>}
