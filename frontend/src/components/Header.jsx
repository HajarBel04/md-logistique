import { useLocation } from 'react-router-dom';

const titleMap = {
  '/': 'Dashboard',
  '/import-webfleet': 'Import Webfleet',
  '/chauffeurs': 'Chauffeurs',
  '/planning': 'Planning',
  '/parametres': 'Paramètres',
};

export default function Header() {
  const location = useLocation();
  const title = titleMap[location.pathname] || 'MD Logistique';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 px-4 py-4 shadow-sm backdrop-blur-xl transition sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">MD Logistique</p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            Pilotage des flux, des chauffeurs et des rapports Webfleet depuis une interface premium.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-flow-col sm:auto-cols-max sm:items-center">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Rechercher chauffeur, import, planning..."
              className="w-full min-w-[220px] rounded-full border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:border-orange-400 focus:ring-orange-200/30"
            />
          </div>

          <div className="hidden items-center gap-3 rounded-full bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm sm:flex">
            <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 to-orange-400 text-white font-semibold">A</div>
            <div>
              <div className="font-semibold text-slate-900">Alex</div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Administrateur</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
