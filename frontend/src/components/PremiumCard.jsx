export default function PremiumCard({ title, description, tag, action, className = '', children }) {
  return (
    <section className={`surface-card p-6 transition-colors ${className}`}>
      {(title || description || action || tag) && (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            {tag ? (
              <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-orange-700 shadow-sm">
                {tag}
              </span>
            ) : null}
            {title ? <h2 className="text-xl font-semibold text-slate-900">{title}</h2> : null}
            {description ? <p className="max-w-2xl text-sm leading-6 text-slate-600">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}
