"use client";
import { useEffect,useSyncExternalStore } from 'react';
import {initializeMeasurement,measurementSnapshot,measurementServerSnapshot,subscribeMeasurement,setMeasurement} from '@/lib/analytics/client';
export function MeasurementPanel({variant}:{variant?:'a'|'b'}){
 const preference=useSyncExternalStore(subscribeMeasurement,measurementSnapshot,measurementServerSnapshot);
 useEffect(()=>initializeMeasurement(variant),[variant]);
 return <section className="measurement" aria-labelledby="measurement-title"><div><h2 id="measurement-title">Pomůžete nám změřit, co je užitečné?</h2><p>Volitelné měření používání na tomto webu. Bez emailu a částek vaší investice v událostech. Kalkulačka i report fungují i bez něj. Volbu si tento prohlížeč zapamatuje.</p><p className="measurement-state" role="status">{preference==='allowed'?'Měření je povolené.':preference==='denied'?'Měření je odmítnuté.':'Měření je vypnuté, dokud jej nepovolíte.'}</p></div><div className="measurement-actions">{preference==='allowed'?<button onClick={()=>setMeasurement(false)}>Odvolat</button>:<><button onClick={()=>setMeasurement(true)}>Povolit</button><button onClick={()=>setMeasurement(false)}>Odmítnout</button></>}</div></section>;
}
