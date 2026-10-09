"use client";
import {useEffect,useRef,useState} from 'react';
import {track} from '@/lib/analytics/client';
export function ReportActions(){
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');const lock=useRef(false);
 useEffect(()=>{
  document.getElementById('report-title')?.focus();
  let closed:HTMLDetailsElement[]=[];
  const beforePrint=()=>{closed=Array.from(document.querySelectorAll<HTMLDetailsElement>('.personal-report details:not([open])'));for(const detail of closed)detail.open=true;};
  const afterPrint=()=>{for(const detail of closed)detail.open=false;closed=[];};
  window.addEventListener('beforeprint',beforePrint);window.addEventListener('afterprint',afterPrint);
  return()=>{window.removeEventListener('beforeprint',beforePrint);window.removeEventListener('afterprint',afterPrint);};
 },[]);
 async function download(event:React.MouseEvent<HTMLAnchorElement>){
  event.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setError('');
  try{const response=await fetch('/report/download');if(!response.ok)throw new Error('download');const blob=await response.blob();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='moje-etf-srovnani.html';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);void track('report_downloaded');}
  catch{setError('Stažení se nezdařilo. Report zůstává otevřený; zkuste to znovu.');}
  finally{lock.current=false;setBusy(false);}
 }
 return <div className="report-action-area"><div className="report-actions"><a href="/report/download" onClick={download} className="primary-button" aria-disabled={busy}>{busy?'Stahujeme…':'Stáhnout HTML'} <span aria-hidden="true">↓</span></a><button className="secondary-button" onClick={()=>window.print()}>Tisk / uložit PDF</button></div>{error&&<p className="field-error" role="alert">{error}</p>}</div>;
}
