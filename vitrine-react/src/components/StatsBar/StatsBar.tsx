import { useEffect, useRef, useState } from 'react';
import { useCountUp } from '../../hooks/useCountUp';
import './StatsBar.css';

/* ── Custom orange outline icons ───────────────────────────── */
const IconPackage = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none"
       stroke="#ff5a00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
       aria-hidden="true">
    <path d="M5 26V16L18 9l13 7v10L18 33 5 26z"/>
    <path d="M18 33V22"/>
    <path d="M5 16l13 6 13-6"/>
    <path d="M12 12.5l12 6.5"/>
  </svg>
);

const IconTruck = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none"
       stroke="#ff5a00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
       aria-hidden="true">
    <rect x="2" y="9" width="22" height="16" rx="1.5"/>
    <path d="M24 14h5l4 5v6h-9V14z"/>
    <circle cx="9"  cy="27" r="3"/>
    <circle cx="27" cy="27" r="3"/>
  </svg>
);

const IconClock = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none"
       stroke="#ff5a00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
       aria-hidden="true">
    <circle cx="18" cy="18" r="13"/>
    <polyline points="18 10 18 18 23 23"/>
  </svg>
);

const IconPin = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none"
       stroke="#ff5a00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
       aria-hidden="true">
    <path d="M18 3C13.03 3 9 7.03 9 12c0 7.5 9 18 9 18s9-10.5 9-18c0-4.97-4.03-9-9-9z"/>
    <circle cx="18" cy="12" r="3.5"/>
  </svg>
);

/* ── Stat item component ───────────────────────────────────── */
interface StatProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  countTarget?: number;
  countSuffix?: string;
  delay?: number;
  inView: boolean;
}

function StatItem({ icon, value, label, countTarget, countSuffix = '', delay = 0, inView }: StatProps) {
  const count = useCountUp(countTarget ?? 0, 1400, inView && countTarget !== undefined);
  const displayValue = countTarget !== undefined
    ? (countSuffix === '%' ? `${count}%` : count >= 1000 ? `+${count.toLocaleString('fr-FR')}` : `+${count}`)
    : value;

  return (
    <div className="stat-item" style={{ animationDelay: `${delay}ms` }}>
      <div className="stat-icon-bg">{icon}</div>
      <div className="stat-text">
        <span className="stat-value">{displayValue}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
}

/* ── Stats bar ──────────────────────────────────────────────── */
export default function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`stats-bar${inView ? ' stats-bar--visible' : ''}`}
    >
      <div className="stats-grid">

        <StatItem
          icon={<IconPackage/>}
          value="+2 000"
          label="Colis livrés / jour"
          countTarget={2000}
          delay={0}
          inView={inView}
        />

        <StatItem
          icon={<IconTruck/>}
          value="+50"
          label="Chauffeurs actifs"
          countTarget={50}
          delay={100}
          inView={inView}
        />

        <StatItem
          icon={<IconClock/>}
          value="98%"
          label="Taux de livraison en délai"
          countTarget={98}
          countSuffix="%"
          delay={200}
          inView={inView}
        />

        <StatItem
          icon={<IconPin/>}
          value="GPS"
          label="Suivi temps réel"
          delay={300}
          inView={inView}
        />

      </div>
    </div>
  );
}
