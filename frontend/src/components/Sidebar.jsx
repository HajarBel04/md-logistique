import { NavLink } from 'react-router-dom';
import logo from '../assets/logo1.png';

const navItems = [
  {
    path: '/',
    label: 'Dashboard',
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
    path: '/chauffeurs',
    label: 'Chauffeurs',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5.5 20h13a2 2 0 0 0 2-2v-1a4 4 0 0 0-4-4h-9a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2Z" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    path: '/documents',
    label: 'Documents',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 4h16v16H4V4Z" />
        <path d="M8 8h8M8 12h8M8 16h5" />
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

export default function Sidebar() {
  return (
    <aside className="hidden w-80 shrink-0 border-r border-slate-200/80 bg-white/85 px-6 py-8 backdrop-blur-xl shadow-soft dark:border-slate-800/70 dark:bg-slate-950/95 lg:flex lg:flex-col">
      <div className="mb-4 flex items-center justify-center">
        <img src={logo} alt="MD Logistique" className="h-24 w-24 object-contain" />
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-4 rounded-3xl px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? 'border-l-4 border-orange-400 bg-orange-50/80 text-orange-600 ring-1 ring-orange-200/60 dark:bg-orange-500/10 dark:text-orange-200'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl transition ${
                    isActive ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {item.icon}
                </span>
                <span className="text-sm font-semibold leading-tight">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-[28px] bg-slate-50/90 p-5 shadow-soft dark:bg-slate-900/75">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Astuce</p>
        <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
          Importez vos rapports Webfleet pour générer automatiquement les totaux de conduite, travail et repos.
        </p>
      </div>
    </aside>
  );
}
