export default function PageHeader({ title, description, badge, action, className = '' }) {
  return (
    <div className={`surface-card p-4 shadow-card transition sm:p-6 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {badge ? (
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:text-orange-200 dark:ring-orange-500/20">
                {badge}
              </span>
            ) : null}
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-4xl">{title}</h1>
          </div>
          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
          )}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
