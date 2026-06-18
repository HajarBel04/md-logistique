export default function StatCard({ title, value, delta, icon }) {
  return (
    <div className="surface-card p-6 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] font-semibold text-slate-600 text-slate-400">{title}</p>
          <p className="mt-4 text-4xl font-extrabold text-slate-900 text-slate-50">{value}</p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-orange-500 text-white text-xl shadow-sm">
          {icon}
        </div>
      </div>
      {delta ? <p className="mt-4 text-sm text-slate-600 text-slate-300">{delta}</p> : null}
    </div>
  );
}
