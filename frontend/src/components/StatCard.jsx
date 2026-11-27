// Chiffre clé — même style que les indicateurs du tableau de bord Conformité.
export default function StatCard({ title, value, delta, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
        {icon ? <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300" aria-hidden="true">{icon}</span> : null}
      </div>
      <p className="mt-2 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">{value}</p>
      {delta ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{delta}</p> : null}
    </div>
  );
}
