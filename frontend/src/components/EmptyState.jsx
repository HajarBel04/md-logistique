// État vide — même rendu que l'état vide des pages Flotte.
export default function EmptyState({ title, description, icon = null, action = null, className = '' }) {
  return (
    <div className={`rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/40 ${className}`}>
      {icon ? <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-xl dark:bg-slate-800" aria-hidden="true">{icon}</div> : null}
      <p className="font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      {description ? <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
