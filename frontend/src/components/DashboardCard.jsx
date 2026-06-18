const accentMap = {
  orange: 'bg-orange-500 text-white',
  amber: 'bg-amber-500 text-white',
  green: 'bg-emerald-500 text-white',
  purple: 'bg-violet-500 text-white',
  rose: 'bg-rose-500 text-white',
};

export default function DashboardCard({ icon, label, value, subtitle, status, accent = 'orange', className = '' }) {
  const accentClass = accentMap[accent] ?? accentMap.orange;

  return (
    <article className={`group surface-card rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-700/70 dark:bg-slate-950/90 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div className={`flex h-14 w-14 items-center justify-center rounded-3xl shadow-sm ${accentClass}`}>
          <span className="text-xl">{icon}</span>
        </div>
        <span className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{label}</span>
      </div>

      <div className="mt-6">
        <p className="text-4xl font-extrabold text-slate-900 dark:text-white">{value}</p>
      </div>

      {subtitle ? (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
      ) : null}

      {status ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 shadow-sm dark:bg-slate-800/90 dark:text-slate-200">
          <span className="text-orange-600">✓</span>
          <span>{status}</span>
        </div>
      ) : null}
    </article>
  );
}
