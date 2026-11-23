import { ArrowRight, Clock3, Globe2, Route, ShieldCheck } from 'lucide-react';
import './CoverageSection.css';

const COUNTRY_LIST = [
  { name: 'France', key: 'fr' },
  { name: 'Belgique', key: 'be' },
  { name: 'Pays-Bas', key: 'nl' },
  { name: 'Luxembourg', key: 'lu' },
  { name: 'Allemagne', key: 'de' },
];

const INFO_ITEMS = [
  { Icon: Route, title: 'Couverture européenne', sub: 'France, Benelux & Allemagne', color: '#ff4b0a' },
  { Icon: Globe2, title: 'Livraisons nationales', sub: 'et internationales', color: '#777' },
  { Icon: ShieldCheck, title: 'Réseau fiable', sub: 'et partenaires locaux', color: '#ff4b0a' },
  { Icon: Clock3, title: 'Délais optimisés', sub: 'et suivi en temps réel', color: '#ff4b0a' },
];

function CountryFlag({ code }: { code: string }) {
  return <span className={`cov-flag cov-flag--${code}`} aria-label={code} />;
}

export default function CoverageSection() {
  return (
    <section className="cov-section">
      <div className="cov-grid">
        <div className="cov-left">
          <div className="cov-heading-block">
            <h2 className="cov-heading">
              Zones <span className="cov-or">couvertes</span>
            </h2>
            <span className="cov-rule" />
          </div>

          <h3 className="cov-statement">
            L’Europe,<br />
            notre terrain.
          </h3>

          <p className="cov-desc">
            Des livraisons rapides et fiables
            <br />
            en France, au Benelux
            <br />
            et en Allemagne.
          </p>

          <ul className="cov-countries">
            {COUNTRY_LIST.map((country) => (
              <li key={country.key} className="cov-country-row">
                <CountryFlag code={country.key} />
                <span className="cov-country-name">{country.name}</span>
              </li>
            ))}
          </ul>

          <button className="cov-cta" type="button">
            <span>Découvrir la carte complète</span>
            <ArrowRight size={14} strokeWidth={2.2} />
          </button>
        </div>

        <div className="cov-map-wrap">
          <img
            className="cov-map-image"
            src="/map.png"
            alt="Carte de couverture MD Logistique"
          />
        </div>

        <aside className="cov-card">
          {INFO_ITEMS.map(({ Icon, title, sub, color }) => (
            <div key={title} className="cov-card-row">
              <span className="cov-card-icon">
                <Icon size={18} strokeWidth={1.8} color={color} />
              </span>
              <div className="cov-card-text">
                <div className="cov-card-title">{title}</div>
                <div className="cov-card-sub">{sub}</div>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </section>
  );
}