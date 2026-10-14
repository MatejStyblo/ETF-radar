'use client';

import { useEffect, useState } from 'react';
import { Home, Calculator, ChartNoAxesCombined, FileText } from 'lucide-react';

const items = [
  { id: 'main', label: 'Domů', icon: Home },
  { id: 'vstupy', label: 'Kalkulačka', icon: Calculator },
  { id: 'results-title', label: 'Výsledky', icon: ChartNoAxesCombined },
  { id: 'offer-title', label: 'Report', icon: FileText },
] as const;

export function MobileNavigation() {
  const [active, setActive] = useState<string>('main');
  const [resultsAvailable, setResultsAvailable] = useState(true);

  useEffect(() => {
    let frame = 0;
    function update() {
      frame = 0;
      setResultsAvailable(Boolean(document.getElementById('results-title')));
      let current: string = 'main';
      for (const item of items) {
        const section = document.getElementById(item.id);
        if (section && section.getBoundingClientRect().top <= 150) current = item.id;
      }
      setActive(current);
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    const main = document.getElementById('main');
    if (main) observer.observe(main);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return <nav className="mobile-bottom-nav" aria-label="Mobilní navigace">
    {items.map(({ id, label, icon: Icon }) => {
      const disabled = id === 'results-title' && !resultsAvailable;
      return <a key={id} href={`#${id}`} aria-current={active === id ? 'location' : undefined}
        aria-disabled={disabled || undefined} onClick={event => { if (disabled) event.preventDefault(); }}>
        <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
        <span>{label}</span>
      </a>;
    })}
  </nav>;
}
