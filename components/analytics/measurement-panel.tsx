"use client";
import { useEffect,useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation.js';
import {initializeMeasurement,measurementSnapshot,measurementServerSnapshot,subscribeMeasurement,setMeasurement} from '@/lib/analytics/client';
export function MeasurementPanel({variant}:{variant?:'a'|'b'}){
 const pathname=usePathname();
 const preference=useSyncExternalStore(subscribeMeasurement,measurementSnapshot,measurementServerSnapshot);
 useEffect(()=>{if(pathname==='/'||pathname==='/report')return initializeMeasurement(variant,pathname==='/'?'landing':'report');},[variant,pathname]);
 return <section className="measurement" aria-labelledby="measurement-title"><div><h2 id="measurement-title">Pomůžete nám změřit, co je užitečné?</h2><p>Volitelné měření návštěv, zdroje příchodu a používání formuláře. Ukládáme označení kampaně a případně doménu odkazujícího webu, nikoli celou odkazující adresu, email nebo částky investice v událostech. Kalkulačka i report fungují i bez něj. Volbu si tento prohlížeč zapamatuje.</p><p className="measurement-state" role="status">{preference==='allowed'?'Měření je povolené.':preference==='denied'?'Měření je odmítnuté.':'Měření je vypnuté, dokud jej nepovolíte.'}</p></div><div className="measurement-actions">{preference==='allowed'?<button onClick={()=>setMeasurement(false)}>Odvolat</button>:<><button onClick={()=>setMeasurement(true)}>Povolit</button><button onClick={()=>setMeasurement(false)}>Odmítnout</button></>}</div></section>;
}
