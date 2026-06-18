export default function GlassCard({ title, description, tag, action, className = '', children }) {
  return (
    <section className={`surface-card p-6 ${className}`}>
      {(title || description || tag || action) && (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            {tag ? <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700 shadow-sm bg-orange-500/15 text-orange-200">{tag}</span> : null}
            {title ? <h2 className="text-xl font-semibold text-slate-900 text-slate-50">{title}</h2> : null}
            {description ? <p className="max-w-2xl text-sm leading-7 text-slate-600 text-slate-300">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}
