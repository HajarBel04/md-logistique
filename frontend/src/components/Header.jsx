// Bandeau du haut : fil d'Ariane (le vrai titre est dans la page), recherche ⌘K, utilisateur, thème.
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../auth/AuthContext';
import { NAV_GROUPS } from './Sidebar';
import { useCommandPalette } from './CommandPalette';
import logo from '../assets/logo-md.png';

function locate(pathname) {
  for (const g of NAV_GROUPS) {
    const it = g.items.find((i) => i.path === pathname);
    if (it) return { section: g.title, page: it.label };
  }
  return { section: null, page: 'MD Logistique' };
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

export default function Header({ theme, onToggleTheme }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { open } = useCommandPalette();
  const initial = (user?.nom || user?.email || '?').trim()[0]?.toUpperCase();
  const { section, page } = locate(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8 dark:border-slate-800/70 dark:bg-slate-950/90">
      <div className="flex items-center justify-between gap-3">
        {/* Fil d'Ariane (ordinateur) / logo + page (mobile) */}
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/conformite" className="shrink-0 lg:hidden" aria-label="Accueil">
            <img src={logo} alt="" className="h-9 w-auto" />
          </Link>
          <nav aria-label="Fil d'Ariane" className="hidden min-w-0 sm:block">
            <ol className="flex min-w-0 items-center gap-2 text-sm">
              {section && (
                <li className="hidden shrink-0 items-center gap-2 text-slate-500 dark:text-slate-400 sm:flex">
                  {section}
                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">/</span>
                </li>
              )}
              <li className="truncate font-semibold text-slate-900 dark:text-slate-100" aria-current="page">{page}</li>
            </ol>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Recherche globale : ouvre la palette ⌘K */}
          <button
            type="button"
            onClick={open}
            aria-label="Rechercher (chauffeur, plaque, facture, page)"
            className="group flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 transition hover:border-orange-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-orange-500/50 sm:w-56 lg:w-72"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
            </svg>
            <span className="hidden flex-1 text-left sm:block">Rechercher…</span>
            <kbd className="hidden rounded-md border border-slate-200 bg-white px-1.5 text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800 sm:block">
              {isMac ? '⌘' : 'Ctrl'} K
            </kbd>
          </button>

          {/* Utilisateur connecté */}
          <div className="flex items-center gap-2 rounded-full bg-slate-50 py-1 pl-1 pr-1 dark:bg-slate-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-600 to-orange-500 text-sm font-semibold text-white" aria-hidden="true">
              {initial}
            </div>
            <div className="hidden max-w-[144px] xl:block">
              <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{user?.nom || user?.email}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Administrateur</div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-full px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-orange-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-orange-300"
            >
              Déconnexion
            </button>
          </div>

          <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
        </div>
      </div>
    </header>
  );
}
