import TrackingCard from '../TrackingCard/TrackingCard';
import './Hero.css';

/* ── Orange location-pin icon ──────────────────────────────── */
const PinIcon = () => (
  <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden="true">
    <path d="M6 0C3.79 0 2 1.79 2 4c0 2.98 4 8 4 8s4-5.02 4-8c0-2.21-1.79-4-4-4z"
          fill="#ff5a00"/>
    <circle cx="6" cy="4" r="1.5" fill="#fff"/>
  </svg>
);

/* ── Arrow icon for primary button ─────────────────────────── */
const ArrowIcon = () => (
  <svg className="hero-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
       aria-hidden="true">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

/* ═══════════════════════════════════════════════════════════ */
export default function Hero() {
  return (
    <section className="hero">

      {/* ── Background photo ──────────────────────── */}
      <div className="hero-visual" role="img" aria-label="Camionnette MD Logistique" />

      {/* ── Main content ──────────────────────────── */}
      <div className="hero-container">
        <div className="hero-copy">

          {/* Status pill */}
          <div className="hero-status">
            <PinIcon />
            <span>Livraison en temps réel partout au Benelux</span>
          </div>

          {/* Headline */}
          <h1 className="hero-title">
            <span className="hero-line hero-line--1">Votre livraison,</span>
            <span className="hero-line hero-line--2">
              notre <strong>priorité.</strong>
            </span>
          </h1>

          {/* Description */}
          <p className="hero-desc">
            MD Logistique assure la distribution de vos colis
            avec précision, rapidité et traçabilité GPS en
            Belgique, aux Pays-Bas et au Luxembourg.
          </p>

          {/* CTA buttons */}
          <div className="hero-actions">
            <button className="hero-btn hero-btn--primary">
              Demander un devis
              <ArrowIcon />
            </button>
            <button className="hero-btn hero-btn--secondary">
              Découvrir nos services
            </button>
          </div>

        </div>
      </div>

      {/* ── Floating GPS card ─────────────────────── */}
      <div className="hero-card-anchor">
        <TrackingCard />
      </div>

    </section>
  );
}
