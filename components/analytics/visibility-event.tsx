"use client";
import {useEffect,useRef,useSyncExternalStore} from 'react';
import {trackOnce,measurementSnapshot,measurementServerSnapshot,subscribeMeasurement,type ClientEvent} from '@/lib/analytics/client';
export function VisibilityEvent({name,children}:{name:ClientEvent;children:React.ReactNode}){
 const ref=useRef<HTMLDivElement>(null);const preference=useSyncExternalStore(subscribeMeasurement,measurementSnapshot,measurementServerSnapshot);
 useEffect(()=>{if(preference!=='allowed'||!ref.current)return;const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){trackOnce(name);observer.disconnect();}},{threshold:.15});observer.observe(ref.current);return()=>observer.disconnect();},[name,preference]);
 return <div ref={ref}>{children}</div>;
}
