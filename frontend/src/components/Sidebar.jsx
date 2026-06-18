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
    <aside className="hidden w-72 shrink-0 border-r border-slate-200/80 bg-white/80 px-6 py-8 backdrop-blur-xl shadow-soft border-slate-800 bg-slate-950/80 lg:flex lg:flex-col">
      <div className="mb-10 rounded-[32px] border border-slate-200/70 bg-white/90 p-5 shadow-card border-slate-700/70 bg-slate-950/90">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-200/80 bg-slate-50 shadow-sm border-slate-700/70 bg-slate-900/80">
            <img src={logo} alt="MD Logistique" className="h-14 w-14 object-contain" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-slate-900 text-slate-100">MD LOGISTIQUE</p>
            <p className="mt-2 text-sm font-medium leading-tight text-slate-600 text-slate-400">Espace Alex</p>
          </div>
        </div>
        <div className="mt-5 h-px bg-slate-200/70 bg-slate-700/70" />
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'border-l-4 border-orange-500 bg-orange-50/90 text-orange-800 shadow-[0_10px_30px_-20px_rgba(249,115,22,0.7)] bg-orange-500/10 text-orange-200'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-slate-200 hover:bg-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                    isActive ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600 bg-slate-800 text-slate-300'
                  } transition`}
                >
                  {item.icon}
                </span>
                <span className="text-sm font-semibold leading-tight">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-[28px] bg-slate-50/90 p-5 shadow-soft bg-slate-900/75">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 text-slate-400">Astuce</p>
        <p className="mt-3 text-sm leading-6 text-slate-700 text-slate-300">
          Importez vos rapports Webfleet pour générer automatiquement les totaux de conduite, travail et repos.
        </p>
      </div>
    </aside>
  );
}
