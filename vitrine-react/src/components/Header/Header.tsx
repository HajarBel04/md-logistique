import { useEffect, useState } from 'react';
import AnimatedButton from '../AnimatedButton/AnimatedButton';
import './Header.css';

// Plateforme interne (connexion chauffeurs et bureau)
const PLATFORM_URL = 'https://md-logistique.vercel.app';

const NAV_LINKS = [
  { label: 'Accueil',        href: '/',           active: true  },
  { label: 'Services',       href: '/services',   active: false },
  { label: 'Entreprises',    href: '/entreprises',active: false },
  { label: 'Zones couvertes',href: '/zones',      active: false },
  { label: 'À propos',       href: '/about',      active: false },
  { label: 'Contact',        href: '/contact',    active: false },
];

const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="2.5"/>
  </svg>
);

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 25);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`header ${scrolled ? 'header--scrolled' : ''}`}
            style={{ animationDelay: '0ms' }}>
      <div className="header__inner">

        {/* Logo */}
        <a href="/" className="header__logo">
          <img src="/logo1.png" alt="MD Logistique" />
        </a>

        {/* Desktop nav */}
        <nav className="header__nav">
          {NAV_LINKS.map(({ label, href, active }) => (
            <a key={href} href={href} className={`nav-link ${active ? 'nav-link--active' : ''}`}>
              {label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="header__actions">
          <AnimatedButton variant="outline" href="/tracking" icon={<PinIcon />} delay={0}>
            Suivre un colis
          </AnimatedButton>
          <AnimatedButton variant="primary" href={PLATFORM_URL} icon={<UserIcon />} delay={80}>
            Espace chauffeur
          </AnimatedButton>
        </div>

        {/* Hamburger */}
        <button className="header__burger" onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="header__mobile-menu">
          {NAV_LINKS.map(({ label, href }) => (
            <a key={href} href={href} className="mobile-link" onClick={() => setMenuOpen(false)}>{label}</a>
          ))}
          <a href={PLATFORM_URL} className="mobile-link" style={{ color: '#ea580c', fontWeight: 700 }}>Espace chauffeur</a>
        </nav>
      )}
    </header>
  );
}
