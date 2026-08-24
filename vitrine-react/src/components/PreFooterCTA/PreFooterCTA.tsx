import { useEffect, useRef, useState } from 'react';
import './PreFooterCTA.css';

const IcnHeadset = () => (
  <svg width="58" height="58" viewBox="0 0 24 24" fill="none"
       stroke="#ff5a00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
       aria-hidden="true">
    <path d="M3 18v-6a9 9 0 0118 0v6"/>
    <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3z"/>
    <path d="M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/>
  </svg>
);

const IcnDoc = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
       aria-hidden="true">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

const IcnPhone = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
       aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.12 1.18 2 2 0 012.1.01h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.18 7.91a16 16 0 006.61 6.61l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
  </svg>
);

export default function PreFooterCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="pf-outer">
      <div ref={ref} className={`pf${vis ? ' pf--vis' : ''}`}>

        {/* Left: icon + copy */}
        <div className="pf-left">
          <span className="pf-icon-wrap" aria-hidden="true"><IcnHeadset /></span>
          <div className="pf-copy">
            <h2 className="pf-title">
              Prêt à optimiser{' '}
              <span className="pf-orange">votre logistique</span>{' '}?
            </h2>
            <p className="pf-desc">
              Nos experts sont à votre disposition pour vous accompagner
              et répondre à tous vos besoins.
            </p>
          </div>
        </div>

        {/* Quote button (col 2 — has left border acting as separator) */}
        <a href="/contact" className="pf-btn pf-btn--outline">
          <IcnDoc />
          Demander un devis
        </a>

        {/* Phone button (col 3) */}
        <a href="tel:+3221234567" className="pf-btn pf-btn--phone">
          <IcnPhone />
          +32 2 123 45 67
        </a>

      </div>
    </div>
  );
}
