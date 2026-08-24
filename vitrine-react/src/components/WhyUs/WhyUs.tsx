import {
  MapPin, Truck, Headphones, FileText, Tag,
  BriefcaseBusiness, FileSpreadsheet, Webhook, ArrowRight,
} from 'lucide-react';
import './WhyUs.css';

/* ─── BENEFIT DATA ───────────────────────────────────────────── */
const BENEFITS = [
  {
    Icon: MapPin,
    line1: 'Suivi GPS',
    line2: 'en temps réel',
  },
  {
    Icon: Truck,
    line1: 'Livraison rapide',
    line2: 'et fiable',
  },
  {
    Icon: Headphones,
    line1: 'Équipe réactive',
    line2: '7j/7',
  },
  {
    Icon: FileText,
    line1: 'Preuves de livraison',
    line2: 'signature & photo',
  },
  {
    Icon: Tag,
    line1: 'Tarifs compétitifs',
    line2: 'et transparents',
  },
];

/* ─── RIGHT FEATURE DATA ─────────────────────────────────────── */
const FEATURES = [
  {
    Icon: BriefcaseBusiness,
    line1: 'Solutions sur mesure',
    line2: 'pour entreprises',
  },
  {
    Icon: FileSpreadsheet,
    line1: 'Importez vos fichiers',
    line2: 'Excel / CSV',
  },
  {
    Icon: Webhook,
    line1: 'API & intégrations',
    line2: 'e-commerce / ERP',
  },
];

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function WhyUs() {
  return (
    <section className="why-section">
      <div className="why-container">

        {/* ── TITLE ── */}
        <div className="why-title-block">
          <h2 className="why-title">
            Pourquoi choisir{' '}
            <span className="why-title-brand">MD Logistique</span>
            {' '}?
          </h2>
          <span className="why-title-rule" aria-hidden="true" />
        </div>

        {/* ── BENEFITS ROW ── */}
        <div className="why-benefits">
          {BENEFITS.map(({ Icon, line1, line2 }, i) => (
            <div
              key={line1}
              className={`why-benefit${i < BENEFITS.length - 1 ? ' why-benefit--sep' : ''}`}
            >
              <Icon
                className="why-benefit-icon"
                size={32}
                strokeWidth={1.75}
                color="#ff4b0a"
                aria-hidden="true"
              />
              <span className="why-benefit-text">
                {line1}
                <br />
                {line2}
              </span>
            </div>
          ))}
        </div>

        {/* ── B2B BANNER ── */}
        <div className="why-banner">

          {/* Left copy */}
          <div className="why-banner-left">
            <h3 className="why-banner-title">Vous expédiez régulièrement ?</h3>
            <p className="why-banner-desc">
              Optimisez vos livraisons et gagnez du temps avec
              <br />
              nos solutions adaptées à votre activité.
            </p>
            <button className="why-banner-cta">
              Demander un devis personnalisé
              <ArrowRight size={14} strokeWidth={2.2} />
            </button>
          </div>

          {/* Center photo */}
          <div className="why-banner-photo-wrap">
            <img
              src="/whyus.png"
              alt="Professionnel MD Logistique"
              className="why-banner-photo"
            />
            {/* Fade masks */}
            <div className="why-banner-fade why-banner-fade--l" />
            <div className="why-banner-fade why-banner-fade--r" />
          </div>

          {/* Right features */}
          <div className="why-banner-right">
            {FEATURES.map(({ Icon, line1, line2 }) => (
              <div key={line1} className="why-feature">
                <span className="why-feature-icon-wrap">
                  <Icon size={22} strokeWidth={1.8} color="#ff4b0a" aria-hidden="true" />
                </span>
                <span className="why-feature-text">
                  <strong>{line1}</strong>
                  <br />
                  {line2}
                </span>
              </div>
            ))}
          </div>

        </div>{/* /why-banner */}

      </div>{/* /why-container */}
    </section>
  );
}
