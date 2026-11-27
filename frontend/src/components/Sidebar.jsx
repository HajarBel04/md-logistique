import { NavLink } from 'react-router-dom';
import { useNavBadges } from './NavBadges';
import BrandHeader from './BrandHeader';

const I = (paths) => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {paths.map((d) => <path key={d} d={d} />)}
  </svg>
);

const flotteItems = [
  { path: '/conformite', label: 'Tableau de bord', icon: I(['M4 13h6V4H4v9Z', 'M4 20h6v-4H4v4Z', 'M14 20h6v-9h-6v9Z', 'M14 4v4h6V4h-6Z']) },
  { path: '/vehicules', label: 'Véhicules', icon: I(['M3 16V7a1 1 0 0 1 1-1h10v10', 'M14 9h4l3 4v3h-7', 'M7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z', 'M17 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z']) },
  { path: '/chauffeurs', label: 'Chauffeurs', icon: I(['M5.5 20h13a2 2 0 0 0 2-2v-1a4 4 0 0 0-4-4h-9a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2Z', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z']) },
  { path: '/documents', label: 'Documents & outil scan', icon: I(['M4 8V5a1 1 0 0 1 1-1h3', 'M16 4h3a1 1 0 0 1 1 1v3', 'M20 16v3a1 1 0 0 1-1 1h-3', 'M8 20H5a1 1 0 0 1-1-1v-3', 'M8 9h8v6H8z']) },
  { path: '/messagerie', label: 'Messagerie', icon: I(['M4 5h16v11H8l-4 4V5Z', 'M8 9h8M8 12h5']) },
  { path: '/alertes', label: 'Alertes & paramètres', icon: I(['M6 16V11a6 6 0 1 1 12 0v5l2 2H4l2-2Z', 'M10 21h4']) },
];

const operationsItems = [
  { path: '/trajets', label: 'Formulaires chauffeurs', icon: I(['M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2', 'M9 3h6v4H9z', 'M9 12h6M9 16h4']) },
  { path: '/facturation', label: 'Facturation', icon: I(['M6 3h12v18l-3-2-3 2-3-2-3 2V3Z', 'M9 8h6M9 12h6M9 16h3']) },
  { path: '/referentiels', label: 'Routes & référentiels', icon: I(['M4 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z', 'M20 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z', 'M6 17h6a4 4 0 0 0 0-8h-1a4 4 0 0 1 0-8h7']) },
  { path: '/comptes', label: 'Comptes', icon: I(['M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M19 8v6M16 11h6']) },
];

const exploitationItems = [
  {
    path: '/',
    label: 'Dashboard paie',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 12h7V3H3v9Zm0 9h7v-7H3v7Zm11 0h7V12h-7v9Zm0-18v7h7V3h-7Z" />
      </svg>
    ),
  },
  {
    path: '/import-webfleet',
    label: 'Import Webfleet',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3v12m0 0l4-4m-4 4l-4-4" />
        <path d="M5 21h14" />
      </svg>
    ),
  },
  {
    path: '/planning',
    label: 'Planning',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M4 11h16" />
      </svg>
    ),
  },
  {
    path: '/payroll',
    label: 'Fiches de paie',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="16" rx="2"/>
        <path d="M7 8h10M7 12h6M7 16h4"/>
        <circle cx="18" cy="16" r="3" fill="none"/>
        <path d="M18 14.5v1.5l1 1"/>
      </svg>
    ),
  },
  {
    path: '/lbd',
    label: 'LBD Tracking',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
    ),
  },
  {
    path: '/gps',
    label: 'GPS Analysis',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z"/>
        <circle cx="12" cy="9" r="2.5"/>
      </svg>
    ),
  },
  {
    path: '/parametres',
    label: 'Paramètres',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="M19.4 15a1.88 1.88 0 0 0 .4 2.1 1.92 1.92 0 0 1-2.7 2.7 1.88 1.88 0 0 0-2.1-.4 1.88 1.88 0 0 0-1.2 1.8v2.3a1 1 0 0 1-2 0v-2.3a1.88 1.88 0 0 0-1.2-1.8 1.88 1.88 0 0 0-2.1.4 1.92 1.92 0 0 1-2.7-2.7 1.88 1.88 0 0 0 .4-2.1 1.88 1.88 0 0 0-1.8-1.2H2.6a1 1 0 0 1 0-2h2.3a1.88 1.88 0 0 0 1.8-1.2 1.88 1.88 0 0 0-.4-2.1 1.92 1.92 0 0 1 2.7-2.7 1.88 1.88 0 0 0 2.1.4h.1a1.88 1.88 0 0 0 1.2-1.8V2.6a1 1 0 0 1 2 0v2.3a1.88 1.88 0 0 0 1.2 1.8 1.88 1.88 0 0 0 2.1-.4 1.92 1.92 0 0 1 2.7 2.7 1.88 1.88 0 0 0-.4 2.1 1.88 1.88 0 0 0 1.8 1.2h2.3a1 1 0 0 1 0 2h-2.3a1.88 1.88 0 0 0-1.8 1.2Z" />
      </svg>
    ),
  },
];

/** Groupes du menu, partagés avec la navigation mobile et la recherche ⌘K. */
export const NAV_GROUPS = [
  { title: 'Flotte & conformité', items: flotteItems },
  { title: 'Exploitation & facturation', items: operationsItems },
  { title: 'Paie & analyses', items: exploitationItems },
];

export default function Sidebar() {
  const badges = useNavBadges();
  return (
    <aside className="sticky top-0 hidden h-screen w-[233px] shrink-0 border-r border-slate-200/80 bg-white/85 px-2 py-6 backdrop-blur-xl shadow-soft dark:border-slate-800/70 dark:bg-slate-950/95 lg:flex lg:flex-col">
      <div className="mb-6 shrink-0">
        <BrandHeader />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto pr-1 scrollbar-none">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-2 text-xs font-bold uppercase tracking-[0.13em] text-slate-400 dark:text-slate-500">{group.title}</p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-2xl px-2 py-2 text-xs font-semibold transition ${
                      isActive
                        ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-200/70 dark:bg-orange-500/10 dark:text-orange-200 dark:ring-orange-500/20'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition [&>svg]:h-[18px] [&>svg]:w-[18px] ${
                        isActive ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {item.icon}
                      </span>
                      <span className="min-w-0 flex-1 leading-tight">{item.label}</span>
                      {badges[item.path] > 0 && (
                        <span
                          className={`ml-auto shrink-0 rounded-full px-2 text-xs font-bold leading-5 tabular-nums ${
                            item.path === '/messagerie' ? 'bg-orange-600 text-white' : 'bg-red-600 text-white'
                          }`}
                          aria-label={item.path === '/messagerie' ? `${badges[item.path]} message(s) non lu(s)` : `${badges[item.path]} échéance(s) expirée(s)`}
                        >
                          {badges[item.path] > 99 ? '99+' : badges[item.path]}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

    </aside>
  );
}
