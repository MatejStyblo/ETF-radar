"use client";
import { useState,useRef } from 'react';
import { track,trackOnce } from '@/lib/analytics/client';
import { VisibilityEvent } from '../analytics/visibility-event';
import { getEtf, type EtfId, type Etf } from '@/data/etfs';
import { project, type Scenario } from '@/lib/calculations/project';
import { DEFAULT_SCENARIO, scenarioSchema } from '@/lib/validation/schemas';
import { FundSelector } from './fund-selector';
import { ScenarioInputs, type Draft } from '../calculator/scenario-inputs';
import { Results } from '../calculator/results';
import { LeadForm, type PrivacyIdentity } from '../lead-form/lead-form';
import type { LeadInput } from '@/lib/validation/schemas';
export function Workspace({attribution,privacy}:{attribution:LeadInput['attribution'];privacy:PrivacyIdentity}) {
 const dirty=useRef(false);
 const [ids,setIds]=useState<[EtfId,EtfId]>(['spy','ivv']);
 const [draft,setDraft]=useState<Draft>({initial:String(DEFAULT_SCENARIO.initial),monthly:String(DEFAULT_SCENARIO.monthly),years:String(DEFAULT_SCENARIO.years),grossReturnPct:String(DEFAULT_SCENARIO.grossReturnPct)});
 const raw=Object.fromEntries(Object.entries(draft).map(([key,value])=>[key,value.trim()===''?NaN:Number(value.trim().replace(',','.'))]));
 const parsed=scenarioSchema.safeParse(raw);
 const errors:Partial<Record<keyof Scenario,string>>={};
 if(!parsed.success) for(const issue of parsed.error.issues) errors[issue.path[0] as keyof Scenario]='Zadejte platnou hodnotu v uvedeném rozsahu.';
 const funds:[Etf,Etf]=[getEtf(ids[0]),getEtf(ids[1])];
 const pairValid=ids[0]!==ids[1];
 return <div className="workspace" id="srovnani"><div className="workspace-inputs"><div className="section-label"><span className="step">01</span><h2>Dva fondy. Jeden index.</h2><span className="public-tag">Bez registrace</span></div><div className="fund-pair">{funds.map((fund,i)=><FundSelector key={i} fund={fund} index={i} invalid={!pairValid} onChange={id=>{const next:[EtfId,EtfId]=i===0?[id,ids[1]]:[ids[0],id];trackOnce('comparison_started');if(next[0]!==next[1])void track('etf_selected',next);setIds(next);}}/>)}</div>{!pairValid&&<p id="etf-pair-error" className="field-error" role="alert">Zvolte dva různé fondy.</p>}<p className="availability">{funds.some(f=>!f.ucits)?'SPY a IVV jsou americké reference na NYSE Arca, ne na hlavním NYSE. Českému retailu nemusí být dostupné. ':''}{funds.some(f=>f.ucits)?'CSPX je evropské UCITS na LSE, nikoliv NYSE. ':''}KID a dostupnost vždy ověřte u brokera.</p><ScenarioInputs draft={draft} errors={errors} onCommit={()=>{if(dirty.current&&parsed.success){dirty.current=false;void track('calculator_interaction');}}} onChange={(key,value)=>{dirty.current=true;trackOnce('comparison_started');setDraft(old=>({...old,[key]:value}));}}/></div><div className="workspace-output">{parsed.success&&pairValid?<VisibilityEvent name="results_viewed"><Results funds={funds} scenario={parsed.data} results={[project(parsed.data,funds[0].chargePct),project(parsed.data,funds[1].chargePct)]}/></VisibilityEvent>:<section className="invalid-result" role="status"><h2>Nejdřív upravte vstupy</h2><p>Výsledek zobrazíme až pro platný scénář a dva různé fondy. Předchozí čísla by teď byla zavádějící.</p></section>}<VisibilityEvent name="lead_offer_viewed"><LeadForm scenario={parsed.success&&pairValid?parsed.data:null} etfIds={ids} attribution={attribution} privacy={privacy}/></VisibilityEvent></div></div>;
}
