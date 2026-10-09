import type { Scenario } from '@/lib/calculations/project';
export type Draft = Record<keyof Scenario,string>;
const fields: {key:keyof Scenario;label:string;unit:string;hint:string}[] = [
 {key:'initial',label:'Počáteční vklad',unit:'Kč',hint:'0 až 100 000 000 Kč'},
 {key:'monthly',label:'Měsíční příspěvek',unit:'Kč',hint:'0 až 1 000 000 Kč; na konci měsíce'},
 {key:'years',label:'Investiční horizont',unit:'let',hint:'1 až 50 celých let'},
 {key:'grossReturnPct',label:'Hypotetický hrubý výnos',unit:'% ročně',hint:'−50 až 30 %. Není předpověď.'},
];
export function ScenarioInputs({draft,onChange,onCommit,errors}:{draft:Draft;onChange:(key:keyof Scenario,value:string)=>void;onCommit:()=>void;errors:Partial<Record<keyof Scenario,string>>}) {
 return <section className="scenario" id="vstupy"><div className="section-label"><span className="step">02</span><h2>Vaše modelová investice</h2></div><div className="input-grid">{fields.map(field=><div className="field" key={field.key}><label htmlFor={field.key}>{field.label}</label><div className="input-unit"><input id={field.key} type="text" inputMode={field.key==='years'?'numeric':'decimal'} value={draft[field.key]} onChange={e=>onChange(field.key,e.target.value)} onBlur={onCommit} aria-invalid={Boolean(errors[field.key])} aria-describedby={`${field.key}-hint`} autoComplete="off"/><span>{field.unit}</span></div><p id={`${field.key}-hint`} className={errors[field.key]?'field-error':'hint'}>{errors[field.key]??field.hint}</p></div>)}</div></section>;
}
