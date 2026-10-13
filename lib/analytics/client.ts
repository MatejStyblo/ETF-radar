"use client";
// Only this allowlisted envelope leaves the browser. Never add arbitrary properties.
import type { z } from 'zod';
import { ETF_IDS } from '@/data/etfs';
import type { eventSchema } from '@/lib/db/analytics';
// Type-only import: the server module never enters the browser bundle.
export type ClientEvent = z.infer<typeof eventSchema>['name'];
type EtfPair = NonNullable<z.infer<typeof eventSchema>['etfIds']>;
type Preference='unset'|'allowed'|'denied';
export type MeasurementPage='landing'|'report';
let page:MeasurementPage='landing';
let active=false;let activation=0;
const bootstrapEvent=():ClientEvent=>page==='landing'?'landing_view':'session_start';
const KEY='etf-radar-measurement';
let preference:Preference='unset';let variant:'a'|'b'='a';let generation=0;let ready=false;let queue=Promise.resolve();
const listeners=new Set<()=>void>();const once=new Set<ClientEvent>();
export const measurementSnapshot=()=>preference;
export const measurementServerSnapshot=():Preference=>'unset';
export function subscribeMeasurement(callback:()=>void){listeners.add(callback);return()=>{listeners.delete(callback);};}
function emit(){for(const listener of listeners)listener();}
let listening=false;
const REVOCATION_KEY=`${KEY}-revocation`;
let pendingRevocation=false;let retryTimer:ReturnType<typeof setTimeout>|undefined;
function queueRevocation(){queue=queue.then(revoke).catch(()=>{});}
async function revoke(){
 if(!pendingRevocation)return;
 try{
  const response=await fetch('/api/events',{method:'DELETE',keepalive:true});
  if(response.ok){pendingRevocation=false;try{localStorage.removeItem(REVOCATION_KEY);}catch{}if(retryTimer)clearTimeout(retryTimer);retryTimer=undefined;return;}
 }catch{/* Keep the pending withdrawal until the server acknowledges it. */}
 if(!retryTimer)retryTimer=setTimeout(()=>{retryTimer=undefined;queueRevocation();},5000);
}
function requestRevocation(){
 pendingRevocation=true;try{localStorage.setItem(REVOCATION_KEY,'pending');}catch{}
 queueRevocation();
}
function applyPreference(next:Preference){
 if(next===preference)return;
 generation++;ready=false;once.clear();preference=next;emit();
 if(next==='allowed')void track(bootstrapEvent());
 else requestRevocation();
}
export function measurementConsent(){
 try{const saved=localStorage.getItem(KEY);applyPreference(saved==='allowed'?'allowed':saved==='denied'?'denied':'unset');}catch{}
 return preference==='allowed';
}
export function initializeMeasurement(adVariant?:'a'|'b',currentPage:MeasurementPage='landing'){
 const resumed=!active||page!==currentPage;
 active=true;const currentActivation=++activation;
 if(resumed){generation++;ready=false;once.clear();page=currentPage;}
 if(adVariant)variant=adVariant;
 try{if(localStorage.getItem(REVOCATION_KEY)==='pending'){pendingRevocation=true;queueRevocation();}}catch{}
 if(!listening){window.addEventListener('storage',event=>{if(event.key===KEY||event.key===null){try{const saved=localStorage.getItem(KEY);applyPreference(saved==='allowed'?'allowed':saved==='denied'?'denied':'unset');}catch{}}});listening=true;}
 try{const saved=localStorage.getItem(KEY);applyPreference(saved==='allowed'?'allowed':saved==='denied'?'denied':'unset');}catch{/* unavailable storage must not block the tool */}
 if(resumed&&preference==='allowed')void track(bootstrapEvent());
 return()=>{if(activation===currentActivation){active=false;generation++;ready=false;once.clear();}};
}
async function send(name:ClientEvent,epoch:number,etfIds?:EtfPair){
 if(!active||preference!=='allowed'||epoch!==generation)return false;
 try{const response=await fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({eventId:crypto.randomUUID(),name,adVariant:variant,consent:true,...(etfIds ? {etfIds} : {})}),keepalive:true});if(response.status===401&&epoch===generation){ready=false;once.clear();}return response.ok;}catch{return false;}
}
export function track(name:ClientEvent,etfIds?:EtfPair){
 if(!active||preference!=='allowed')return Promise.resolve();
 if(etfIds!==undefined&&(name!=='etf_selected'||!Array.isArray(etfIds)||etfIds.length!==2||etfIds[0]===etfIds[1]||!etfIds.every(id=>ETF_IDS.includes(id))))return Promise.resolve();
 const pair:EtfPair|undefined=etfIds?[etfIds[0],etfIds[1]]:undefined;
 const epoch=generation;
 queue=queue.then(async()=>{
  if(!active||epoch!==generation||preference!=='allowed')return;
  if(pendingRevocation){await revoke();if(pendingRevocation||!active||epoch!==generation||preference!=='allowed')return;}
  const bootstrap=bootstrapEvent();
  if(!ready){const established=await send(bootstrap,epoch);if(!active||epoch!==generation||preference!=='allowed')return;ready=established;if(!ready)return;}
  if(name!==bootstrap)await send(name,epoch,pair);
 }).catch(()=>{});return queue;
}
export function trackOnce(name:ClientEvent){if(!active||preference!=='allowed'||once.has(name))return;once.add(name);void track(name);}
export function setMeasurement(allow:boolean){
 generation++;ready=false;once.clear();preference=allow?'allowed':'denied';
 try{localStorage.setItem(KEY,preference);}catch{}
 emit();
 if(allow)void track(bootstrapEvent());
 else requestRevocation();
}
