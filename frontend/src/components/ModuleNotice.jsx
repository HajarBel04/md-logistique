// Message clair pour un module qui n'est pas encore disponible en ligne (au lieu d'une erreur rouge).
import { Link } from 'react-router-dom';

export default function ModuleNotice({ title = 'Module bientôt disponible', children, links = [] }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100" role="status">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 8v5M12 16.5v.5" /><circle cx="12" cy="12" r="9" /></svg>
        </span>
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-6 text-amber-800 dark:text-amber-200/90">{children}</p>
          {links.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {links.map(([to, label]) => (
                <Link key={to} to={to} className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-amber-900 ring-1 ring-amber-200 transition hover:ring-amber-400 dark:bg-amber-500/10 dark:text-amber-100 dark:ring-amber-500/30">
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
