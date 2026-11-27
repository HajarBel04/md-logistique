export default function EmptyState({ title, description, icon = '📥', className = '' }) {
  return (
    <div className={`rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-10 text-center text-slate-600 ${className}`}>
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-3xl shadow-sm">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}
