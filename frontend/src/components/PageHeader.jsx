export default function PageHeader({ title, description, badge, action, className = '' }) {
  return (
    <div className={`surface-card p-6 shadow-card transition ${className}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            {badge ? (
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700 ring-1 ring-orange-100">
                {badge}
              </span>
            ) : null}
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl text-slate-50">{title}</h1>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-700 text-slate-300">{description}</p>
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
