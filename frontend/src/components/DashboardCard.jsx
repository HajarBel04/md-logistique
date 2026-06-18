export default function DashboardCard({ icon, label, value, subtitle, className = '' }) {
  return (
    <div className={`surface-card flex flex-col justify-between gap-4 p-6 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 to-orange-400 text-white shadow-sm">
          {icon}
        </div>
        <span className="text-xs uppercase tracking-[0.2em] text-slate-500 text-slate-400">{label}</span>
      </div>
      <div>
        <p className="text-3xl font-semibold text-slate-900 text-white">{value}</p>
        {subtitle ? <p className="mt-2 text-sm text-slate-600 text-slate-300">{subtitle}</p> : null}
      </div>
    </div>
  );
}
