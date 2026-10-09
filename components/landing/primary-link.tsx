"use client";
import {track,trackOnce} from '@/lib/analytics/client';
export function PrimaryLink({variant}:{variant:'a'|'b'}){return <a className="intro-cta" href="#vstupy" onClick={()=>{void track('primary_cta_click');trackOnce('comparison_started');}}>{variant==='b'?'Porovnat ETF':'Spočítat modelový dopad'} <span aria-hidden="true">↓</span></a>}
