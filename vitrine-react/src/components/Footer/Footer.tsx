import { useEffect, useRef, useState, type FormEvent, type CSSProperties } from 'react';
import './Footer.css';

/* ═══════════════════════════════════════════════════════════
   ICONS (orange outline for brand benefits; white/contextual for contact)
═══════════════════════════════════════════════════════════ */

const IcnShield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="#ff5a00" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);

const IcnClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="#ff5a00" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IcnUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="#ff5a00" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
    <path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);

const IcnLeaf = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="#ff5a00" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 8C8 10 5.9 16.17 3.82 19.31 3.38 20 2.77 21 2 21"/>
    <path d="M5 11c0 0 5-3 10-1s7 8 7 8-4 3-10 1S5 11 5 11z"/>
  </svg>
);

const IcnPin = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
       stroke="#ff5a00" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2C8.69 2 6 4.69 6 8c0 5.25 6 12 6 12s6-6.75 6-12c0-3.31-2.69-6-6-6z"/>
    <circle cx="12" cy="8" r="2.5"/>
  </svg>
);

const IcnPhone = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
       stroke="#ff5a00" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.12 1.18 2 2 0 012.1.01h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.18 7.91a16 16 0 006.61 6.61l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
  </svg>
);

const IcnMail = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
       stroke="#ff5a00" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <polyline points="2,4 12,13 22,4"/>
  </svg>
);

const IcnClockSm = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
       stroke="#ff5a00" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IcnSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

/* Social icons */
const IcnLinkedIn = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

const IcnFacebook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
  </svg>
);

const IcnInstagram = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   BACKGROUND MAP SVG DECORATION
═══════════════════════════════════════════════════════════ */

const BgMap = () => (
  <svg className="f-bgmap" viewBox="0 0 500 600" fill="none" aria-hidden="true">
    {/* Route network */}
    <path d="M20 80 L180 150 L310 110 L430 60 L500 110" stroke="#fff" strokeWidth="1.2"/>
    <path d="M180 150 L220 270 L170 390 L240 510" stroke="#fff" strokeWidth="1.2"/>
    <path d="M310 110 L350 230 L300 360 L360 480" stroke="#fff" strokeWidth="1.2"/>
    <path d="M430 60 L460 170 L430 300 L490 420" stroke="#fff" strokeWidth="1.2"/>
    <path d="M0 230 L100 255 L220 270 L350 230 L430 300 L500 275" stroke="#fff" strokeWidth="1.1"/>
    <path d="M40 390 L170 390 L300 360 L430 300" stroke="#fff" strokeWidth="1.1" strokeDasharray="5 5"/>
    <path d="M0 510 L100 490 L240 510 L360 480 L490 520" stroke="#fff" strokeWidth="1"/>

    {/* Nodes with halos */}
    <circle cx="180" cy="150" r="11" stroke="#ff5a00" strokeWidth=".8" fill="none" opacity=".5"/>
    <circle cx="180" cy="150" r="5.5" fill="#ff5a00"/>

    <circle cx="350" cy="230" r="9" stroke="#ff5a00" strokeWidth=".8" fill="none" opacity=".5"/>
    <circle cx="350" cy="230" r="4.5" fill="#ff5a00"/>

    <circle cx="220" cy="270" r="4" fill="#ff5a00"/>
    <circle cx="430" cy="300" r="5" fill="#ff5a00"/>
    <circle cx="170" cy="390" r="3.5" fill="#ff5a00"/>
    <circle cx="300" cy="360" r="4" fill="#ff5a00"/>
    <circle cx="240" cy="510" r="3.5" fill="#ff5a00"/>
    <circle cx="360" cy="480" r="3.5" fill="#ff5a00"/>
    <circle cx="310" cy="110" r="4" fill="#ff5a00"/>
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════ */

const COMPANY_CONTACT = {
  name: 'MD Logistique',
  address: ['Rue de l\'Industrie 12', '1000 Bruxelles, Belgique'],
  phone: '+32 2 123 45 67',
  email: 'info@mdlogistique.com',
  hours: ['Lundi - Vendredi : 8h00 - 18h00', 'Samedi : 9h00 - 13h00'],
};

const BRAND_BENEFITS = [
  { Icon: IcnShield, text: 'Livraisons sécurisées' },
  { Icon: IcnClock,  text: 'Suivi en temps réel'  },
  { Icon: IcnUsers,  text: 'Équipe réactive'       },
  { Icon: IcnLeaf,   text: 'Engagement durable'    },
] as const;

interface NavGroup { heading: string; links: Array<{ label: string; href: string }> }

const NAV_COLS: NavGroup[][] = [
  // Column 2
  [
    {
      heading: 'Services',
      links: [
        { label: 'Livraison de colis',      href: '#' },
        { label: 'Express & même jour',     href: '#' },
        { label: 'Logistique B2B',          href: '#' },
        { label: 'Suivi GPS',               href: '#' },
        { label: 'Reporting & Analytics',   href: '#' },
        { label: 'Voir tous les services',  href: '#' },
      ],
    },
    {
      heading: 'Plateforme',
      links: [
        { label: 'Présentation',          href: '#' },
        { label: 'Fonctionnalités',       href: '#' },
        { label: 'Suivi en temps réel',   href: '#' },
        { label: 'Preuves de livraison',  href: '#' },
        { label: 'Tableaux de bord',      href: '#' },
        { label: 'Accéder à la plateforme', href: '#' },
      ],
    },
  ],
  // Column 3
  [
    {
      heading: 'Entreprises',
      links: [
        { label: 'Solutions dédiées', href: '#' },
        { label: 'Volumes adaptés',   href: '#' },
        { label: 'Import CSV / Excel',href: '#' },
        { label: 'Intégrations',      href: '#' },
        { label: 'API',               href: '#' },
        { label: 'Support dédié',     href: '#' },
      ],
    },
    {
      heading: 'À propos',
      links: [
        { label: 'Qui sommes-nous ?', href: '#' },
        { label: 'Notre mission',     href: '#' },
        { label: 'Nos valeurs',       href: '#' },
        { label: 'Carrières',         href: '#' },
        { label: 'Actualités',        href: '#' },
      ],
    },
  ],
  // Column 4
  [
    {
      heading: 'Zones couvertes',
      links: [
        { label: 'Belgique',          href: '#' },
        { label: 'Pays-Bas',          href: '#' },
        { label: 'Luxembourg',        href: '#' },
        { label: 'Carte interactive', href: '#' },
        { label: 'Délais & zones',    href: '#' },
      ],
    },
    {
      heading: 'Ressources',
      links: [
        { label: 'Blog',                          href: '#' },
        { label: 'Guides',                        href: '#' },
        { label: 'FAQ',                           href: '#' },
        { label: 'Mentions légales',              href: '#' },
        { label: 'Politique de confidentialité',  href: '#' },
      ],
    },
  ],
];

/* ═══════════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════════ */

function NavColumn({ groups }: { groups: NavGroup[] }) {
  return (
    <div className="f-navcol">
      {groups.map((g) => (
        <div key={g.heading} className="f-group">
          <h3 className="f-heading">{g.heading}</h3>
          <ul className="f-links" role="list">
            {g.links.map((l) => (
              <li key={l.label}>
                <a href={l.href} className="f-link">{l.label}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ContactColumn() {
  const [email, setEmail] = useState('');
  const handleNewsletter = (e: FormEvent) => { e.preventDefault(); setEmail(''); };

  const rows = [
    { Icon: IcnPin,     content: [COMPANY_CONTACT.name, ...COMPANY_CONTACT.address] },
    { Icon: IcnPhone,   content: [COMPANY_CONTACT.phone] },
    { Icon: IcnMail,    content: [COMPANY_CONTACT.email] },
    { Icon: IcnClockSm, content: COMPANY_CONTACT.hours },
  ];

  return (
    <div className="f-contactcol">
      <h3 className="f-heading">Contact</h3>

      <ul className="f-crows" role="list">
        {rows.map(({ Icon, content }, i) => (
          <li key={i} className="f-crow">
            <span className="f-crow-icon"><Icon /></span>
            <div className="f-crow-text">
              {content.map((line, j) => (
                <span key={j} className="f-crow-line">{line}</span>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {/* Newsletter card */}
      <div className="nl-card">
        <p className="nl-title">Restez informé</p>
        <p className="nl-desc">Recevez nos actualités et conseils logistiques.</p>
        <form onSubmit={handleNewsletter} className="nl-form" noValidate>
          <div className="nl-row">
            <input
              type="email"
              className="nl-input"
              placeholder="Votre email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <button type="submit" className="nl-btn" aria-label="S'abonner">
              <IcnSend />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN FOOTER COMPONENT
═══════════════════════════════════════════════════════════ */

export default function Footer() {
  const secRef = useRef<HTMLElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const el = secRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold: 0.06 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <footer ref={secRef} className={`site-footer${vis ? ' f--vis' : ''}`}>

      {/* Background decorative map */}
      <BgMap />

      <div className="f-container">
        {/* ── Main grid ───────────────────────────────────── */}
        <div className="f-grid">

          {/* Column 1: Brand */}
          <div
            className="f-brand"
            style={{ '--col-delay': '0ms' } as CSSProperties}
          >
            <img src="/logo1.png" alt="MD Logistique" className="f-logo" />

            <p className="f-tagline">
              Votre partenaire logistique<br />
              de confiance au Benelux.
            </p>
            <span className="f-orange-rule" aria-hidden="true" />
            <p className="f-brand-desc">
              MD Logistique assure la distribution rapide,
              sécurisée et traçable de vos colis en Belgique,
              aux Pays-Bas et au Luxembourg.
            </p>

            {/* Benefits */}
            <ul className="f-benefits" role="list">
              {BRAND_BENEFITS.map(({ Icon, text }) => (
                <li key={text} className="f-benefit">
                  <span className="f-benefit-icon"><Icon /></span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            {/* Social */}
            <div className="f-social-wrap">
              <span className="f-social-label">Suivez-nous</span>
              <div className="f-social-links">
                <a href="#" className="f-social" aria-label="LinkedIn">
                  <IcnLinkedIn />
                </a>
                <a href="#" className="f-social" aria-label="Facebook">
                  <IcnFacebook />
                </a>
                <a href="#" className="f-social" aria-label="Instagram">
                  <IcnInstagram />
                </a>
              </div>
            </div>
          </div>

          {/* Columns 2-4: Nav groups */}
          {NAV_COLS.map((groups, i) => (
            <div
              key={i}
              style={{ '--col-delay': `${(i + 1) * 80}ms` } as CSSProperties}
            >
              <NavColumn groups={groups} />
            </div>
          ))}

          {/* Column 5: Contact + Newsletter */}
          <div style={{ '--col-delay': '320ms' } as CSSProperties}>
            <ContactColumn />
          </div>

        </div>

        {/* ── Divider ─────────────────────────────────────── */}
        <hr className="f-divider" />

        {/* ── Legal bar ───────────────────────────────────── */}
        <div className="f-legal">
          <p className="f-copyright">
            © {new Date().getFullYear()} MD Logistique – Tous droits réservés.
          </p>
          <div className="f-legal-links">
            <a href="#" className="f-legal-link">Mentions légales</a>
            <span className="f-legal-sep" aria-hidden="true">|</span>
            <a href="#" className="f-legal-link">Politique de confidentialité</a>
            <span className="f-legal-sep" aria-hidden="true">|</span>
            <a href="#" className="f-legal-link">Conditions générales</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
