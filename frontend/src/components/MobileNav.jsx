// Navigation mobile (< 1024 px) : barre d'onglets en bas + panneau « Plus » avec tout le menu.
import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { NAV_GROUPS } from './Sidebar';
import { useNavBadges } from './NavBadges';

const SHORTCUTS = ['/conformite', '/vehicules', '/chauffeurs', '/messagerie'];
const ALL = NAV_GROUPS.flatMap((g) => g.items);
const SHORT_LABEL = { '/conformite': 'Accueil' };

function Badge({ n, tone = 'red' }) {
  if (!n) return null;
  return (
    <span className={`absolute -right-2 -top-1 rounded-full px-1.5 text-xs font-bold leading-5 text-white tabular-nums ${tone === 'orange' ? 'bg-orange-600' : 'bg-red-600'}`}>
      {n > 99 ? '99+' : n}
    </span>
  );
}

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const badges = useNavBadges();
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open]);

  const inMore = !SHORTCUTS.includes(pathname);

  return (
    <>
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 lg:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {SHORTCUTS.map((path) => {
            const item = ALL.find((i) => i.path === path);
            return (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex min-h-[55px] flex-col items-center justify-center gap-1 text-xs font-semibold transition ${
                    isActive ? 'text-orange-700 dark:text-orange-300' : 'text-slate-600 dark:text-slate-400'
                  }`
                }
              >
                <span className="relative [&>svg]:h-5 [&>svg]:w-5">
                  {item.icon}
                  <Badge n={badges[path]} tone={path === '/messagerie' ? 'orange' : 'red'} />
                </span>
                {SHORT_LABEL[path] || item.label}
              </NavLink>
            );
          })}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-haspopup="dialog"
            className={`flex min-h-[55px] flex-col items-center justify-center gap-1 text-xs font-semibold transition ${
              inMore ? 'text-orange-700 dark:text-orange-300' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
            Plus
          </button>
        </div>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu complet">
          <button type="button" aria-label="Fermer le menu" className="md-fade-in absolute inset-0 bg-slate-950/50" onClick={() => setOpen(false)} />
          <div className="md-sheet-in absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+21px)] pt-3 shadow-2xl dark:bg-slate-950">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-700" aria-hidden="true" />
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="mb-5">
                <p className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">{group.title}</p>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/'}
                      className={({ isActive }) =>
                        `flex min-h-[55px] items-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${
                          isActive
                            ? 'bg-orange-50 text-orange-800 ring-1 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-200 dark:ring-orange-500/20'
                            : 'bg-slate-50 text-slate-800 active:bg-slate-100 dark:bg-slate-900 dark:text-slate-200'
                        }`
                      }
                    >
                      <span className="shrink-0 [&>svg]:h-5 [&>svg]:w-5">{item.icon}</span>
                      <span className="min-w-0 flex-1 leading-tight">{item.label}</span>
                      {badges[item.path] > 0 && (
                        <span className="rounded-full bg-red-600 px-1.5 text-xs font-bold leading-5 text-white">{badges[item.path]}</span>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
