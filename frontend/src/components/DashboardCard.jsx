// Indicateur du tableau de bord paie — aligné sur les indicateurs Flotte (une seule couleur d'accent).
const accentMap = {
  orange: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  purple: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  rose: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
};

export default function DashboardCard({ icon, label, value, subtitle, status, accent = 'orange', className = '' }) {
  return (
    <article className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-base ${accentMap[accent] ?? accentMap.orange}`} aria-hidden="true">{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
      {status ? (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />{status}
        </p>
      ) : null}
    </article>
  );
}
