// Carte de section — même style que les cartes du module Flotte (bordure fine, en-tête séparé).
export default function GlassCard({ title, description, tag, action, className = '', children }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      {(title || description || tag || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="min-w-0">
            {tag ? <p className="mb-1 text-xs font-semibold uppercase tracking-[0.13em] text-orange-700 dark:text-orange-300">{tag}</p> : null}
            {title ? <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">{title}</h2> : null}
            {description ? <p className="mt-0.5 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
