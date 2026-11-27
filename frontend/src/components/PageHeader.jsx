// En-tête de page — identique aux pages Flotte : surtitre orange, titre, description, action à droite.
export default function PageHeader({ title, description, badge, action, className = '' }) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        {badge ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400">{badge}</p> : null}
        <h1 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
