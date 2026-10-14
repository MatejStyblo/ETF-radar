"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation.js';
import { initializeMeasurement, measurementSnapshot, measurementServerSnapshot, subscribeMeasurement, setMeasurement } from '@/lib/analytics/client';

export function MeasurementPanel({ variant }: { variant?: 'a' | 'b' }) {
 const pathname = usePathname();
 const preference = useSyncExternalStore(subscribeMeasurement, measurementSnapshot, measurementServerSnapshot);
 const [settingsOpen, setSettingsOpen] = useState(false);
 const banner = useRef<HTMLElement>(null);
 const settingsButton = useRef<HTMLButtonElement>(null);
 const firstChoice = useRef<HTMLButtonElement>(null);
 const visible = preference === 'unset' || settingsOpen;
 useEffect(() => {
  if (pathname === '/' || pathname === '/report') return initializeMeasurement(variant, pathname === '/' ? 'landing' : 'report');
 }, [variant, pathname]);
 useEffect(() => {
  if (!visible || !banner.current) return;
  const element = banner.current;
  const update = () => document.documentElement.style.setProperty('--cookie-banner-height', element.getBoundingClientRect().height + 'px');
  update();
  const observer = new ResizeObserver(update);
  observer.observe(element);
  return () => { observer.disconnect(); document.documentElement.style.removeProperty('--cookie-banner-height'); };
 }, [visible]);
 useEffect(() => { if (settingsOpen) firstChoice.current?.focus({ preventScroll: true }); }, [settingsOpen]);
 function closeSettings() {
  setSettingsOpen(false);
  settingsButton.current?.focus({ preventScroll: true });
 }
 function choose(allow: boolean) {
  setMeasurement(allow);
  if (settingsOpen) closeSettings();
 }
 return <>
  <button ref={settingsButton} type="button" className="cookie-settings" aria-describedby="cookie-preference-status" aria-expanded={visible} aria-controls={visible ? 'cookie-banner' : undefined} onClick={() => setSettingsOpen(true)}>Nastavení cookies</button>
  <span id="cookie-preference-status" className="sr-only" role="status">{preference === 'allowed' ? 'Měření je povolené.' : preference === 'denied' ? 'Měření je odmítnuté.' : 'Měření je vypnuté, dokud jej nepovolíte.'}</span>
  {visible && <aside ref={banner} id="cookie-banner" className="cookie-banner" aria-labelledby="cookie-banner-title" onKeyDown={event => { if (event.key === 'Escape' && preference !== 'unset') { event.preventDefault(); closeSettings(); } }}>
   <div className="cookie-banner-copy"><h2 id="cookie-banner-title">Cookies a měření návštěv</h2>
    <p>S vaším souhlasem měříme zdroj návštěvy a používání formuláře. Bez něj funguje kalkulačka i report. Do měření neposíláme email ani částky investice.</p>
    <a href="/privacy">Podrobnosti o soukromí</a>
   </div>
   <div className="cookie-banner-actions">
    <button ref={firstChoice} type="button" onClick={() => choose(false)}>{preference === 'allowed' ? 'Odvolat' : 'Odmítnout'}</button>
    <button type="button" onClick={() => choose(true)}>Povolit</button>
    {preference !== 'unset' && <button type="button" className="cookie-banner-close" onClick={closeSettings}>Zavřít beze změny</button>}
   </div>
  </aside>}
 </>;
}
