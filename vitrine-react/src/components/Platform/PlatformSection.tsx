import {
  Home as HomeIcon, Package, Navigation2, BarChart2,
  Users, ArrowRight,
} from 'lucide-react';
import './PlatformSection.css';

/* ─── LIGHT TRAILS ──────────────────────────────────────────────────── */
const LightTrails = () => (
  <svg
    className="pt-trails"
    viewBox="0 0 1440 460"
    preserveAspectRatio="xMidYMid slice"
    fill="none"
    aria-hidden="true"
  >
    {/* Primary — thickest, brightest */}
    <path
      d="M-60 420 C140 370 340 290 570 210 C760 145 960 92 1200 52 C1330 30 1440 16 1520 6"
      stroke="#ff4b00" strokeWidth="2.2" opacity=".68"
      filter="url(#glow)"
    />
    {/* Secondary */}
    <path
      d="M-60 448 C100 408 280 344 490 278 C670 220 860 172 1080 128 C1220 97 1370 70 1520 48"
      stroke="#ff4b00" strokeWidth="1.4" opacity=".36"
      filter="url(#glow)"
    />
    {/* Tertiary — thin high trail */}
    <path
      d="M-60 390 C160 356 380 280 618 200 C820 134 1040 78 1290 36 C1390 17 1460 7 1520 0"
      stroke="#ff5500" strokeWidth="0.9" opacity=".24"
      filter="url(#glow)"
    />
    {/* Lower sweeper */}
    <path
      d="M-60 460 C60 430 200 382 400 315 C570 258 748 214 948 172 C1096 141 1254 116 1440 88"
      stroke="#ff4500" strokeWidth="0.7" opacity=".18"
    />
    {/* Wide diffuse glow band */}
    <path
      d="M-60 432 C120 388 310 316 540 242 C720 178 920 128 1140 84 C1290 54 1420 30 1520 12"
      stroke="#ff6200" strokeWidth="7" opacity=".07"
    />
    {/* Very thin accent */}
    <path
      d="M80 460 C240 424 410 375 610 307 C780 249 960 202 1140 162"
      stroke="#ff5a00" strokeWidth="0.6" opacity=".14"
    />
    <defs>
      <filter id="glow" x="-20%" y="-200%" width="140%" height="600%">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
  </svg>
);

/* ─── SIDEBAR NAV ───────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { Icon: HomeIcon,     label: 'Synthèse',    on: true  },
  { Icon: Package,      label: 'Expéditions', on: false },
  { Icon: Navigation2,  label: 'Suivi',       on: false },
  { Icon: BarChart2,    label: 'Rapports',    on: false },
  { Icon: Users,        label: 'Clients',     on: false },
];

/* ─── KPI DATA ──────────────────────────────────────────────────────── */
const KPIS = [
  { label: 'Colis en cours',     val: '128', green: false },
  { label: "Livrés aujourd'hui", val: '342', green: true  },
  { label: 'Taux de livraison',  val: '98%', green: true  },
  { label: 'Chauffeurs actifs',  val: '56',  green: false },
];

/* ─── DELIVERY LIST ─────────────────────────────────────────────────── */
const ROWS = [
  { id: 'MD-0055-7856', done: false },
  { id: 'MD-0055-7055', done: true  },
  { id: 'MD-0055-7054', done: true  },
  { id: 'MD-0055-7053', done: false },
];

/* ─── DASHBOARD MAP SVG ─────────────────────────────────────────────── */
const DashMap = () => (
  <svg viewBox="0 0 320 148" width="100%" height="100%" fill="none">
    {/* Base */}
    <rect width="320" height="148" fill="#eef5ec"/>
    {/* Road grid */}
    <line x1="0" y1="74" x2="320" y2="74" stroke="#d0e8ce" strokeWidth="5"/>
    <line x1="0" y1="47" x2="320" y2="47" stroke="#d0e8ce" strokeWidth="2.5"/>
    <line x1="0" y1="101" x2="320" y2="101" stroke="#d0e8ce" strokeWidth="2.5"/>
    <line x1="80"  y1="0" x2="80"  y2="148" stroke="#d0e8ce" strokeWidth="2.5"/>
    <line x1="160" y1="0" x2="160" y2="148" stroke="#d0e8ce" strokeWidth="2.5"/>
    <line x1="240" y1="0" x2="240" y2="148" stroke="#d0e8ce" strokeWidth="2.5"/>
    {/* Terrain */}
    <path d="M0 0 L100 0 L76 38 L0 32 Z"      fill="#e0eede" opacity=".8"/>
    <path d="M228 0 L320 0 L320 58 L250 50 Z"  fill="#e0eede" opacity=".8"/>
    <path d="M0 118 L66 112 L70 148 L0 148 Z"  fill="#e0eede" opacity=".8"/>
    <path d="M180 110 L240 100 L260 148 L160 148 Z" fill="#e0eede" opacity=".5"/>
    {/* Route glow */}
    <path
      d="M30 118 Q58 104 90 88 Q124 72 160 69 Q196 66 226 54 Q256 43 288 28"
      stroke="#ff4b0a" strokeWidth="5" strokeLinecap="round" opacity=".18"
    />
    {/* Route */}
    <path
      d="M30 118 Q58 104 90 88 Q124 72 160 69 Q196 66 226 54 Q256 43 288 28"
      stroke="#ff4b0a" strokeWidth="2.6" strokeLinecap="round"
    />
    {/* Waypoints */}
    <circle cx="30"  cy="118" r="5.5" fill="#ff4b0a"/>
    <circle cx="30"  cy="118" r="9"   fill="#ff4b0a" opacity=".18"/>
    <circle cx="92"  cy="88"  r="3.5" fill="#ff4b0a" opacity=".9"/>
    <circle cx="160" cy="69"  r="3.5" fill="#ff4b0a" opacity=".9"/>
    <circle cx="226" cy="54"  r="3.5" fill="#ff4b0a" opacity=".9"/>
    {/* Destination */}
    <circle cx="288" cy="28"  r="7.5" fill="#22c55e"/>
    <circle cx="288" cy="28"  r="11"  fill="#22c55e" opacity=".2"/>
    <circle cx="288" cy="28"  r="3.5" fill="#fff"/>
  </svg>
);

/* ─── PERFORMANCE CHART ─────────────────────────────────────────────── */
const PerfChart = () => (
  <svg viewBox="0 0 310 56" width="100%" height="100%" fill="none">
    {/* Month labels */}
    {['Fév','Mar','Avr','Mai','Juin','Juil'].map((m, i) => (
      <text key={m} x={16 + i * 56} y="53" fontSize="7.5" fill="#c0c0c0" textAnchor="middle">{m}</text>
    ))}
    {/* Fill area */}
    <path
      d="M16,42 L72,38 L128,41 L184,30 L240,34 L296,20 L296,48 L16,48 Z"
      fill="rgba(255,75,10,.07)"
    />
    {/* Line */}
    <polyline
      points="16,42 72,38 128,41 184,30 240,34 296,20"
      stroke="#ff4b0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    />
    {/* End dot */}
    <circle cx="296" cy="20" r="4"   fill="#ff4b0a"/>
    <circle cx="296" cy="20" r="7.5" fill="rgba(255,75,10,.2)"/>
  </svg>
);

/* ─── PHONE MAP SVG ─────────────────────────────────────────────────── */
const PhoneMap = () => (
  <svg viewBox="0 0 138 120" width="100%" height="100%" fill="none">
    <rect width="138" height="120" fill="#18232f"/>
    {/* Streets */}
    <line x1="0"  y1="60"  x2="138" y2="60"  stroke="#253040" strokeWidth="6"/>
    <line x1="0"  y1="37"  x2="138" y2="37"  stroke="#253040" strokeWidth="3.5"/>
    <line x1="0"  y1="83"  x2="138" y2="83"  stroke="#253040" strokeWidth="3.5"/>
    <line x1="46" y1="0"   x2="46"  y2="120" stroke="#253040" strokeWidth="3.5"/>
    <line x1="92" y1="0"   x2="92"  y2="120" stroke="#253040" strokeWidth="3.5"/>
    {/* Route glow */}
    <path
      d="M24 90 Q40 74 58 60 Q76 46 94 34 Q110 22 120 14"
      stroke="rgba(255,75,10,.38)" strokeWidth="7" strokeLinecap="round"
    />
    {/* Route */}
    <path
      d="M24 90 Q40 74 58 60 Q76 46 94 34 Q110 22 120 14"
      stroke="#ff4b0a" strokeWidth="2.5" strokeLinecap="round"
    />
    {/* Origin pin (orange) */}
    <g transform="translate(14,80)">
      <path d="M5 0C2.24 0 0 2.24 0 5c0 3.75 5 9 5 9s5-5.25 5-9C10 2.24 7.76 0 5 0z" fill="#ff4b0a"/>
      <circle cx="5" cy="5" r="2.2" fill="#fff"/>
    </g>
    {/* Destination pin (green) */}
    <g transform="translate(113.5,4)">
      <path d="M5 0C2.24 0 0 2.24 0 5c0 3.75 5 9 5 9s5-5.25 5-9C10 2.24 7.76 0 5 0z" fill="#22c55e"/>
      <circle cx="5" cy="5" r="2.2" fill="#fff"/>
    </g>
  </svg>
);

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════ */
export default function PlatformSection() {
  return (
    <>
      {/* ── DARK SECTION ────────────────────────────────────────── */}
      <section className="pt-section">
        <LightTrails />

        <div className="pt-container">

          {/* ── LEFT TEXT ── */}
          <div className="pt-left">
            <span className="pt-badge">Notre plateforme</span>

            <h2 className="pt-heading">
              Toute votre logistique.<br />Un seul espace.
            </h2>

            <p className="pt-desc">
              Gérez vos expéditions, suivez vos colis en temps réel,
              accédez aux preuves de livraison et analysez vos
              performances depuis votre tableau de bord.
            </p>

            <button className="pt-cta">
              Découvrir la plateforme
              <ArrowRight size={14} strokeWidth={2.4} />
            </button>
          </div>

          {/* ── RIGHT DEVICES ── */}
          <div className="pt-right">
            <div className="pt-devices">

              {/* ── DASHBOARD ─────────────────────────── */}
              <div className="dash-device">
                <div className="dash-bezel">

                  {/* Sidebar */}
                  <aside className="dash-sidebar">
                    <img src="/logo1.png" alt="MD Logistique" className="dash-logo" />
                    {NAV_ITEMS.map(({ Icon, label, on }) => (
                      <div key={label} className={`dash-nav-item${on ? ' is-on' : ''}`}>
                        <Icon size={12} strokeWidth={1.9} />
                        <span>{label}</span>
                      </div>
                    ))}
                  </aside>

                  {/* Main panel */}
                  <div className="dash-main">

                    {/* Top bar */}
                    <div className="dash-topbar">
                      <span className="dash-topbar-title">Tableau de bord</span>
                      <div className="dash-topbar-actions">
                        <span className="dash-dot" />
                        <span className="dash-dot" />
                        <span className="dash-dot" />
                      </div>
                    </div>

                    {/* KPIs */}
                    <div className="dash-kpis">
                      {KPIS.map(k => (
                        <div key={k.label} className="dash-kpi">
                          <p className="dash-kpi-lbl">{k.label}</p>
                          <p
                            className="dash-kpi-val"
                            style={{ color: k.green ? '#22c55e' : '#111' }}
                          >{k.val}</p>
                        </div>
                      ))}
                    </div>

                    {/* Middle row */}
                    <div className="dash-mid">
                      <div className="dash-map-wrap">
                        <DashMap />
                      </div>
                      <div className="dash-list">
                        <p className="dash-list-title">Dernières livraisons</p>
                        {ROWS.map(r => (
                          <div key={r.id} className="dash-list-row">
                            <span className="dash-list-id">{r.id}</span>
                            <span className={`dash-pill${r.done ? ' dash-pill--ok' : ' dash-pill--prog'}`}>
                              {r.done ? 'Livré' : 'En cours'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Performance */}
                    <div className="dash-perf">
                      <p className="dash-perf-title">Performances</p>
                      <div className="dash-perf-chart">
                        <PerfChart />
                      </div>
                    </div>

                  </div>{/* /dash-main */}
                </div>{/* /dash-bezel */}
              </div>{/* /dash-device */}

              {/* ── SMARTPHONE ────────────────────────── */}
              <div className="phone-device">
                <div className="phone-notch" />
                <div className="phone-inner">

                  <div className="phone-toprow">
                    <span className="phone-label">Suivi en direct</span>
                    <span className="phone-live-dot" />
                  </div>

                  <p className="phone-trackid">MD-2505-7856</p>

                  <div className="phone-map-wrap">
                    <PhoneMap />
                  </div>

                  <div className="phone-status-row">
                    <span className="phone-green-dot" />
                    <span className="phone-status-txt">En cours de livraison</span>
                  </div>

                  <p className="phone-eta-label">Arrivée estimée</p>
                  <p className="phone-eta-time">14h30 – 15h00</p>

                  <button className="phone-btn">Détails</button>
                </div>
                <div className="phone-orange-bar" />
              </div>{/* /phone-device */}

            </div>{/* /pt-devices */}
          </div>{/* /pt-right */}

        </div>{/* /pt-container */}
      </section>

      {/* ── WHITE TRACKING BAR ──────────────────────────────────── */}
      <div className="track-wrap">
        <div className="track-card">

          {/* Icon */}
          <div className="track-icon-wrap">
            <svg width="44" height="50" viewBox="0 0 44 50" fill="none" aria-hidden="true">
              <path
                d="M22 2C14.82 2 9 7.82 9 15c0 9.34 13 26 13 26s13-16.66 13-26C35 7.82 29.18 2 22 2z"
                stroke="#ff4b0a" strokeWidth="1.9" strokeLinejoin="round"
              />
              <circle cx="22" cy="15" r="5" stroke="#ff4b0a" strokeWidth="1.9"/>
              <rect x="11" y="37" width="22" height="11" rx="2" stroke="#ff4b0a" strokeWidth="1.9"/>
              <line x1="22" y1="31" x2="22" y2="37" stroke="#ff4b0a" strokeWidth="1.9" strokeLinecap="round"/>
              <line x1="11" y1="42.5" x2="33" y2="42.5" stroke="#ff4b0a" strokeWidth="1.4"/>
            </svg>
          </div>

          {/* Copy */}
          <div className="track-copy">
            <p className="track-title">Où est votre colis ?</p>
            <p className="track-sub">
              Entrez votre numéro de suivi et suivez votre livraison en temps réel.
            </p>
          </div>

          {/* Input */}
          <input
            className="track-input"
            type="text"
            placeholder="Ex. : MD-2505-7856"
          />

          {/* Submit */}
          <button className="track-submit">
            Suivre mon colis
            <ArrowRight size={14} strokeWidth={2.4} />
          </button>

        </div>
      </div>
    </>
  );
}
