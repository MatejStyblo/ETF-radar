"use client";
import { useRef,useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from '@/lib/validation/zod';
import {track,trackOnce,measurementConsent} from '@/lib/analytics/client';
import { useRouter } from 'next/navigation';
import type { Scenario } from '@/lib/calculations/project';
import type { EtfId } from '@/data/etfs';
import type { LeadInput } from '@/lib/validation/schemas';
const formSchema=z.object({email:z.string().trim().min(3,'Zadejte platný email.').max(254,'Email je příliš dlouhý.').email('Zadejte platný email.'),marketingConsent:z.boolean(),website:z.string().max(0)});
type Fields=z.infer<typeof formSchema>;
export type PrivacyIdentity={name:string|null;contact:string|null;enabled:boolean};
export function LeadForm({scenario,etfIds,attribution,privacy}:{scenario:Scenario|null;etfIds:[EtfId,EtfId];attribution:LeadInput['attribution'];privacy:PrivacyIdentity}) {
 const router=useRouter();const attempt=useRef<{key:string;id:string}|null>(null);const locked=useRef(false);
 const [error,setError]=useState('');const errorRef=useRef<HTMLParagraphElement>(null);
 const {register,handleSubmit,formState:{errors,isSubmitting}}=useForm<Fields>({resolver:zodResolver(formSchema),defaultValues:{email:'',marketingConsent:false,website:''}});
 const submit=async(fields:Fields)=>{
  if(!scenario||locked.current)return;locked.current=true;setError('');void track('lead_submit_attempt');
  const payload={...fields,scenario,etfIds,attribution};const key=JSON.stringify(payload);
  if(attempt.current?.key!==key)attempt.current={key,id:crypto.randomUUID()};
  try{
   const response=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json','X-Analytics-Consent':String(measurementConsent())},body:JSON.stringify({...payload,attemptId:attempt.current!.id})});
   const body=await response.json().catch(()=>null);
   if(response.ok&&body?.ok===true&&body.reportUrl==='/report'){router.push('/report');return;}
   if(response.status===410&&body?.code==='REPORT_EXPIRED')attempt.current=null;
   const retry=response.headers.get('Retry-After');
   const message=response.status===429?`Příliš mnoho pokusů. Zkuste to znovu ${retry&&/^\d+$/.test(retry)?`za ${retry} sekund`:'později'}.`:response.status===422?'Zkontrolujte email a parametry srovnání.':typeof body?.message==='string'?body.message:'Report teď nelze vytvořit. Vaše vstupy zůstaly zachované; zkuste to znovu.';
   void track('lead_submit_error');setError(message);
  }catch{void track('lead_submit_error');setError('Spojení se nezdařilo. Vstupy zůstaly zachované. Zkuste odeslání znovu.');}
  finally{locked.current=false;}
  requestAnimationFrame(()=>errorRef.current?.focus());
 };
 return <section className="lead-offer" aria-labelledby="offer-title"><div className="offer-heading"><span className="eyebrow">Váš plán nákladů</span><span className="offer-format">HTML / tisk</span></div><h2 id="offer-title">Jedno číslo není celý příběh.</h2><p>Získejte své ETF srovnání pro 5 až 30 let — včetně rozdílů fondů a checklistu před nákupem.</p><div className="horizon-preview" aria-label="Horizonty v reportu"><span>5 let</span><span>10 let</span><span>20 let</span><span>30 let</span></div><p className="offer-delivery">Report otevřete a stáhnete ihned po zadání emailu. Neposíláme jej emailem. Marketing je volitelný.</p>
 <form noValidate onFocus={()=>trackOnce('lead_form_started')} onSubmit={event=>void handleSubmit(submit)(event)} aria-busy={isSubmitting}><label htmlFor="lead-email" className="email-label">Email</label><input id="lead-email" type="email" autoComplete="email" inputMode="email" placeholder="vas@email.cz" {...register('email')} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email?'email-error':'email-purpose'}/>{errors.email&&<p id="email-error" className="field-error">{errors.email.message}</p>}<p id="email-purpose" className="hint">Email je jediný povinný kontaktní údaj. V reportu se nezobrazí.</p><div className="honeypot" aria-hidden="true"><label htmlFor="website">Webová stránka</label><input id="website" tabIndex={-1} autoComplete="off" {...register('website')}/></div><label className="checkbox-label"><input type="checkbox" {...register('marketingConsent')}/><span>Chci občasné novinky o ETF emailem.<small>Volitelné. Souhlas můžete kdykoli odvolat.</small></span></label>
 {privacy.name&&privacy.contact?<p className="privacy-inline">Správce: {privacy.name}. Podrobnosti o účelu, uchování a vašich právech v <a href="/privacy">informaci o soukromí</a>.</p>:<p className="privacy-inline">Předstartovní režim: správce a kontakt nejsou nakonfigurovány. Sběr kontaktů pro veřejnost není připraven. <a href="/privacy">Podrobnosti</a>.</p>}
 {!privacy.enabled&&<p className="privacy-inline">Sběr kontaktů je vypnutý. Základní srovnání můžete používat bez emailu.</p>}
 {error&&<p ref={errorRef} tabIndex={-1} className="submit-error" role="alert">{error}</p>}
 <button className="primary-button" type="submit" disabled={isSubmitting||!scenario||!privacy.enabled}>{isSubmitting?'Vytváříme vaše srovnání…':'Získat moje srovnání'}<span aria-hidden="true">↗</span></button>{!scenario&&<p className="field-error">Pro report nejprve opravte parametry srovnání.</p>}
 </form></section>;
}
