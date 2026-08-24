import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import './SocialProof.css';

/* ─── COMPANY LOGO MARKS ─────────────────────────────────────── */
const LogoElectro = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect width="20" height="20" rx="4" fill="#f97316"/>
    <path d="M11.5 3.5L6 11h5.5L8.5 17l7.5-9h-5.5l1-4.5z" fill="#fff"/>
  </svg>
);

const LogoHome = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect width="20" height="20" rx="4" fill="#3b82f6"/>
    <path d="M10 4.5L4 9.5h1.5V16h4v-4h1v4h4V9.5H16L10 4.5z" fill="#fff"/>
  </svg>
);

const LogoPharma = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect width="20" height="20" rx="4" fill="#16a34a"/>
    <rect x="9" y="4" width="2" height="12" rx="1" fill="#fff"/>
    <rect x="4" y="9" width="12" height="2" rx="1" fill="#fff"/>
  </svg>
);

/* ─── TESTIMONIAL DATA ───────────────────────────────────────── */
const TESTIMONIALS = [
  {
    id: 0,
    quote:
      'MD Logistique est devenu un partenaire clé dans notre chaîne logistique. Fiables, rapides et toujours disponibles.',
    Logo: LogoElectro,
    company: 'ElectroShop',
    name: 'Sophie Martin',
    role: 'Responsable Logistique',
  },
  {
    id: 1,
    quote:
      'Le suivi en temps réel et les preuves de livraison nous apportent une vraie tranquillité au quotidien.',
    Logo: LogoHome,
    company: 'HomeDesign',
    name: 'Julien Dubois',
    role: 'Directeur Supply Chain',
  },
  {
    id: 2,
    quote:
      'Une équipe réactive et un service de qualité. Nos livraisons sont toujours entre de bonnes mains.',
    Logo: LogoPharma,
    company: 'PharmaPlus',
    name: 'Nadia El Amrani',
    role: 'Responsable des Opérations',
  },
];

/* ─── RESOURCE CARD DATA ─────────────────────────────────────── */
const RESOURCES = [
  {
    id: 0,
    img: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=700&q=80&auto=format&fit=crop',
    category: 'Actualité',
    categoryClass: 'cat--orange',
    title: 'MD Logistique renforce son réseau dans le Benelux',
    desc: 'De nouveaux hubs pour encore plus de proximité et de réactivité.',
  },
  {
    id: 1,
    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=700&q=80&auto=format&fit=crop',
    category: 'Conseils',
    categoryClass: 'cat--purple',
    title: '5 conseils pour optimiser vos expéditions',
    desc: 'Réduisez vos coûts et améliorez vos délais de livraison.',
  },
  {
    id: 2,
    img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=700&q=80&auto=format&fit=crop',
    category: 'Engagement',
    categoryClass: 'cat--green',
    title: 'Notre engagement pour une logistique plus durable',
    desc: 'Des actions concrètes pour réduire notre impact environnemental.',
  },
];

/* ─── LIGHT TRAILS SVG ───────────────────────────────────────── */
const CtaTrails = () => (
  <svg
    className="ec-trails"
    viewBox="0 0 1180 260"
    preserveAspectRatio="xMidYMid slice"
    fill="none"
    aria-hidden="true"
  >
    <defs>
      <filter id="ct-glow" x="-10%" y="-100%" width="120%" height="400%">
        <feGaussianBlur stdDeviation="3" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    {/* Main sweeping trail */}
    <path
      d="M-80 220 C150 190 360 145 590 120 C780 100 970 88 1200 70"
      stroke="#ff4b00" strokeWidth="2.0" opacity=".60"
      filter="url(#ct-glow)"
    />
    {/* Secondary */}
    <path
      d="M-80 248 C120 222 300 180 530 154 C720 133 900 120 1200 100"
      stroke="#ff4b00" strokeWidth="1.2" opacity=".32"
      filter="url(#ct-glow)"
    />
    {/* Thin upper */}
    <path
      d="M-80 198 C170 174 390 132 640 108 C840 88 1040 72 1240 52"
      stroke="#ff5500" strokeWidth="0.8" opacity=".22"
    />
    {/* Wide diffuse glow */}
    <path
      d="M-80 235 C130 205 340 165 570 138 C760 116 960 100 1200 80"
      stroke="#ff6200" strokeWidth="9" opacity=".06"
    />
    {/* Very thin accent */}
    <path
      d="M60 260 C240 232 430 190 660 165 C840 145 1020 132 1200 115"
      stroke="#ff5000" strokeWidth="0.6" opacity=".16"
    />
  </svg>
);

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function SocialProof() {
  const [activeDot, setActiveDot] = useState(0);

  const prev = () => setActiveDot(d => (d === 0 ? 3 : d - 1));
  const next = () => setActiveDot(d => (d === 3 ? 0 : d + 1));

  return (
    <div className="sp-wrap">
      <div className="sp-container">

        {/* ═══════ TESTIMONIALS ════════════════════════════════ */}
        <div className="sp-testimonials">

          {/* Heading */}
          <h2 className="sp-title">
            Ils nous font <span className="sp-orange">confiance</span>
          </h2>

          {/* Row with side arrows */}
          <div className="t-carousel-wrap">
            <button className="t-arrow t-arrow--left" onClick={prev} aria-label="Précédent">
              ‹
            </button>

            <div className="t-row">
              {TESTIMONIALS.map(({ id, quote, Logo, company, name, role }) => (
                <div key={id} className="t-card">
                  <span className="t-quote" aria-hidden="true">"</span>
                  <p className="t-text">{quote}</p>
                  <div className="t-footer">
                    <div className="t-company-row">
                      <Logo />
                      <span className="t-company-name">{company}</span>
                    </div>
                    <p className="t-name">{name}</p>
                    <p className="t-role">{role}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="t-arrow t-arrow--right" onClick={next} aria-label="Suivant">
              ›
            </button>
          </div>

          {/* Dots */}
          <div className="t-dots">
            {[0, 1, 2, 3].map(i => (
              <button
                key={i}
                className={`t-dot${activeDot === i ? ' t-dot--on' : ''}`}
                onClick={() => setActiveDot(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* ═══════ RESOURCES ═══════════════════════════════════ */}
        <div className="sp-resources">

          {/* Heading */}
          <div className="sp-resources-header">
            <h2 className="sp-title">
              Actualités &amp; <span className="sp-orange">ressources</span>
            </h2>
            <span className="sp-rule" aria-hidden="true" />
          </div>

          {/* Cards */}
          <div className="r-grid">
            {RESOURCES.map(({ id, img, category, categoryClass, title, desc }) => (
              <article key={id} className="r-card">
                <div className="r-img-wrap">
                  <img src={img} alt={title} className="r-img" loading="lazy" />
                  <span className={`r-cat ${categoryClass}`}>{category}</span>
                </div>
                <div className="r-body">
                  <h3 className="r-title">{title}</h3>
                  <p className="r-desc">{desc}</p>
                  <a href="#" className="r-link">
                    Lire l'article <ArrowRight size={11} strokeWidth={2.4} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* ═══════ ENTERPRISE CTA ══════════════════════════════ */}
        <div className="ec-banner">
          <CtaTrails />

          <div className="ec-inner">

            {/* LEFT — copy */}
            <div className="ec-left">
              <p className="ec-label">Prêt à expédier autrement ?</p>

              <h2 className="ec-heading">
                Rejoignez les entreprises<br />
                qui nous font déjà{' '}
                <span className="ec-orange">confiance.</span>
              </h2>

              <div className="ec-points">
                <span className="ec-point">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <circle cx="7" cy="7" r="7" fill="#2cc56f"/>
                    <path d="M3.5 7l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.6"
                          strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Mise en place rapide
                </span>
                <span className="ec-point">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <circle cx="7" cy="7" r="7" fill="#2cc56f"/>
                    <path d="M3.5 7l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.6"
                          strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Sans engagement
                </span>
                <span className="ec-point">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <circle cx="7" cy="7" r="7" fill="#2cc56f"/>
                    <path d="M3.5 7l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.6"
                          strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Accompagnement dédié
                </span>
              </div>

              <div className="ec-btns">
                <button className="ec-btn-primary">
                  Demander un devis
                  <ArrowRight size={14} strokeWidth={2.3} />
                </button>
                <button className="ec-btn-secondary">
                  Découvrir nos solutions
                </button>
              </div>
            </div>

            {/* RIGHT — van */}
            <div className="ec-right">
              <img
                src="/footer.png"
                alt="MD Logistique delivery van"
                className="ec-van"
                loading="lazy"
              />
            </div>

          </div>{/* /ec-inner */}
        </div>{/* /ec-banner */}

      </div>{/* /sp-container */}
    </div>
  );
}
