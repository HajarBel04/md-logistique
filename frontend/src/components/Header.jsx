import { useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const titleMap = {
  '/': 'Dashboard',
  '/import-webfleet': 'Import Webfleet',
  '/chauffeurs': 'Chauffeurs',
  '/documents': 'Documents',
  '/planning': 'Planning',
  '/payroll': 'Fiches de paie',
  '/parametres': 'Paramètres',
};

export default function Header({ theme, onToggleTheme }) {
  const location = useLocation();
  const title = titleMap[location.pathname] || 'MD Logistique';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-xl transition sm:px-6 lg:px-8 dark:border-slate-800/70 dark:bg-slate-950/95">
      <div className="flex items-center justify-between gap-3">
        {/* Titre — compact sur mobile, large sur desktop */}
        <div className="min-w-0">
          <p className="hidden text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400 sm:block">
            MD Logistique
          </p>
          <h1 className="truncate text-xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-0.5 hidden max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400 sm:block">
            Pilotage des flux, des chauffeurs et des rapports Webfleet.
          </p>
        </div>

        {/* Actions — droite */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Barre de recherche — masquée sur très petit écran */}
          <div className="relative hidden sm:block">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400 dark:text-slate-500">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Rechercher…"
              className="w-48 rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-orange-400 dark:focus:ring-orange-500/20 lg:w-64"
            />
          </div>

          {/* Profil Alex — masqué sur mobile */}
          <div className="hidden items-center gap-2.5 rounded-full bg-slate-50 px-3 py-2 text-sm text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200 md:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-400 text-sm font-semibold text-white">
              A
            </div>
            <div className="hidden lg:block">
              <div className="font-semibold text-slate-900 dark:text-slate-50">Alex</div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">RH</div>
            </div>
          </div>

          <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
        </div>
      </div>
    </header>
  );
}
