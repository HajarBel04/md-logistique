import ServiceCard from './ServiceCard';
import './ServicesSection.css';

/* ── Inline SVG icons ─────────────────────────── */
const TruckIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="1"/>
    <path d="M16 8h4l3 3v5h-7V8z"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);

const BoltIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const WarehouseIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {/* Roof / pediment */}
    <path d="M2 11 L12 3 L22 11"/>
    {/* Walls */}
    <rect x="3" y="11" width="18" height="10" rx="0.5"/>
    {/* Arch door */}
    <path d="M9 21 L9 16 Q9 13 12 13 Q15 13 15 16 L15 21"/>
    {/* Left window */}
    <rect x="5" y="13.5" width="2.5" height="3" rx="0.5"/>
    {/* Right window */}
    <rect x="16.5" y="13.5" width="2.5" height="3" rx="0.5"/>
  </svg>
);

const PinIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="2.5"/>
  </svg>
);

const ReportIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="9" y1="13" x2="15" y2="13"/>
    <line x1="9" y1="17" x2="12" y2="17"/>
    <polyline points="9 9 9 9"/>
  </svg>
);

/* ── Service data ─────────────────────────────── */
const SERVICES = [
  {
    photoUrl: '/service1.png',
    photoAlt: 'Livreur MD Logistique déchargeant des colis',
    icon: <TruckIcon />,
    title: 'Livraison de colis',
    description: 'Distribution aux particuliers et entreprises, J+1 ou J+2.',
  },
  {
    photoUrl: '/service2.png',
    photoAlt: 'Fourgon MD Logistique en milieu urbain',
    icon: <BoltIcon />,
    title: 'Express & même jour',
    description: 'Livraisons urgentes avec fenêtre horaire garantie.',
  },
  {
    photoUrl: '/service3.png',
    photoAlt: 'Entrepôt logistique avec palettes et chariot élévateur',
    icon: <WarehouseIcon />,
    title: 'Logistique B2B',
    description: 'Flux de livraisons récurrents pour vos sites professionnels.',
  },
  {
    photoUrl: '/service4.png',
    photoAlt: 'Smartphone affichant suivi GPS en temps réel',
    icon: <PinIcon />,
    title: 'Suivi GPS',
    description: 'Visibilité en temps réel sur chaque tournée et chaque livreur.',
  },
  {
    photoUrl: '/service5.png',
    photoAlt: 'Laptop affichant tableau de bord analytics logistique',
    icon: <ReportIcon />,
    title: 'Reporting',
    description: 'Tableaux de bord, preuves de livraison, exports Excel.',
  },
];

export default function ServicesSection() {
  return (
    <section className="services-section">
      <div className="site-container">
        {/* Heading */}
        <h2 className="services-heading">
          Nos <span className="services-heading__accent">services</span>
        </h2>

        {/* Cards grid */}
        <div className="services-grid">
          {SERVICES.map((s, i) => (
            <ServiceCard key={i} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}
