import { Globe2, ShieldCheck, Clock3, Route } from 'lucide-react';
import './CoverageSection.css';

/* ── Circular country flags ──────────────────────────── */
const FlagBE = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" aria-label="Belgique" style={{ flexShrink: 0 }}>
    <defs>
      <clipPath id="cp-be">
        <circle cx="11" cy="11" r="10.5"/>
      </clipPath>
    </defs>
    {/* Belgian flag — vertical black / yellow / red */}
    <g clipPath="url(#cp-be)">
      <rect x="0"      y="0" width="7.34" height="22" fill="#1a1a1a"/>
      <rect x="7.34"   y="0" width="7.33" height="22" fill="#f8d800"/>
      <rect x="14.67"  y="0" width="7.33" height="22" fill="#ef3340"/>
    </g>
    <circle cx="11" cy="11" r="10.5" fill="none" stroke="rgba(0,0,0,.09)" strokeWidth="1"/>
  </svg>
);

const FlagNL = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" aria-label="Pays-Bas" style={{ flexShrink: 0 }}>
    <defs>
      <clipPath id="cp-nl">
        <circle cx="11" cy="11" r="10.5"/>
      </clipPath>
    </defs>
    {/* Dutch flag — horizontal red / white / blue */}
    <g clipPath="url(#cp-nl)">
      <rect x="0" y="0"     width="22" height="7.34" fill="#ae1c28"/>
      <rect x="0" y="7.34"  width="22" height="7.33" fill="#ffffff"/>
      <rect x="0" y="14.67" width="22" height="7.33" fill="#21468b"/>
    </g>
    <circle cx="11" cy="11" r="10.5" fill="none" stroke="rgba(0,0,0,.09)" strokeWidth="1"/>
  </svg>
);

const FlagLU = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" aria-label="Luxembourg" style={{ flexShrink: 0 }}>
    <defs>
      <clipPath id="cp-lu">
        <circle cx="11" cy="11" r="10.5"/>
      </clipPath>
    </defs>
    {/* Luxembourg flag — horizontal red / white / light-blue */}
    <g clipPath="url(#cp-lu)">
      <rect x="0" y="0"     width="22" height="7.34" fill="#ef3340"/>
      <rect x="0" y="7.34"  width="22" height="7.33" fill="#ffffff"/>
      <rect x="0" y="14.67" width="22" height="7.33" fill="#00a3dd"/>
    </g>
    <circle cx="11" cy="11" r="10.5" fill="none" stroke="rgba(0,0,0,.09)" strokeWidth="1"/>
  </svg>
);

/* ── Orange map pin ──────────────────────────────────── */
const Pin = () => (
  <svg width="18" height="24" viewBox="0 0 18 24" fill="none">
    <path d="M9 1C5.13 1 2 4.13 2 8c0 5.25 7 15 7 15s7-9.75 7-15c0-3.87-3.13-7-7-7z"
          fill="#ff4b0a"/>
    <path d="M9 1C5.13 1 2 4.13 2 8c0 5.25 7 15 7 15s7-9.75 7-15c0-3.87-3.13-7-7-7z"
          stroke="rgba(255,75,10,.3)" strokeWidth="1"/>
    <circle cx="9" cy="8" r="3" fill="#fff"/>
  </svg>
);

/* ── City positions as % of the map container (l=x, t=y) */
const CITIES = [
  { name: 'Amsterdam',  x: 54, y: 10, dir: 'right' as const },
  { name: 'Rotterdam',  x: 48, y: 24, dir: 'right' as const },
  { name: 'Anvers',     x: 50, y: 40, dir: 'right' as const },
  { name: 'Bruxelles',  x: 35, y: 53, dir: 'left'  as const },
  { name: 'Liège',      x: 62, y: 56, dir: 'right' as const },
  { name: 'Luxembourg', x: 64, y: 73, dir: 'right' as const },
];

/* ── Right-card items ───────────────────────────────── */
const INFOS = [
  {
    Icon: Route,       color: '#ff4b0a',
    title: 'Couverture complète',
    sub: '',
  },
  {
    Icon: Globe2,      color: '#999',
    title: 'Livraisons nationales',
    sub: 'et internationales',
  },
  {
    Icon: ShieldCheck, color: '#ff4b0a',
    title: 'Réseau fiable',
    sub: 'et partenaires locaux',
  },
  {
    Icon: Clock3,      color: '#ff4b0a',
    title: 'Délais optimisés',
    sub: 'et suivi en temps réel',
  },
];

export default function CoverageSection() {
  return (
    <section className="cov-section">
      <div className="cov-grid">

        {/* ── Left content ─────────────────────────── */}
        <div className="cov-left">
          {/* Heading */}
          <div className="cov-heading-block">
            <h2 className="cov-heading">
              Zones <span className="cov-or">couvertes</span>
            </h2>
            <span className="cov-rule"/>
          </div>

          {/* Statement */}
          <h3 className="cov-statement">
            Le Benelux,<br/>notre terrain.
          </h3>

          {/* Description */}
          <p className="cov-desc">
            Des livraisons rapides et fiables<br/>
            en Belgique, aux Pays-Bas<br/>
            et au Luxembourg.
          </p>

          {/* Country list */}
          <ul className="cov-countries">
            <li><FlagBE/><span>Belgique</span></li>
            <li><FlagNL/><span>Pays-Bas</span></li>
            <li><FlagLU/><span>Luxembourg</span></li>
          </ul>

          {/* CTA */}
          <button className="cov-cta">
            Découvrir la carte complète
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.4"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        {/* ── Central map ──────────────────────────── */}
        <div className="cov-map">
          <img
            src="/map.png"
            alt="Carte de couverture Benelux — MD Logistique"
            className="cov-map-img"
          />

          {/* Edge fade overlays */}
          <div className="cov-fade cov-fade--l"/>
          <div className="cov-fade cov-fade--r"/>
          <div className="cov-fade cov-fade--t"/>
          <div className="cov-fade cov-fade--b"/>

          {/* City pins */}
          {CITIES.map(city => (
            <div
              key={city.name}
              className={`cov-pin cov-pin--${city.dir}`}
              style={{ left: `${city.x}%`, top: `${city.y}%` }}
            >
              <Pin/>
              <span className="cov-city-label">{city.name}</span>
            </div>
          ))}
        </div>

        {/* ── Right info card ──────────────────────── */}
        <div className="cov-card">
          {INFOS.map((item, i) => (
            <div key={i} className="cov-card-row">
              <span className="cov-card-icon">
                <item.Icon size={20} strokeWidth={1.8} color={item.color}/>
              </span>
              <div>
                <p className="cov-card-title">{item.title}</p>
                {item.sub && <p className="cov-card-sub">{item.sub}</p>}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
