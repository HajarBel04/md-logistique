const statusMap = {
  valid: 'bg-emerald-100 text-emerald-700 bg-emerald-200/15 text-emerald-200',
  warning: 'bg-orange-100 text-orange-700 bg-orange-200/15 text-orange-200',
  expired: 'bg-red-100 text-red-700 bg-red-200/15 text-red-200',
  planned: 'bg-slate-100 text-slate-700 bg-slate-700/70 text-slate-200',
  confirmed: 'bg-emerald-100 text-emerald-700 bg-emerald-200/15 text-emerald-200',
  unavailable: 'bg-red-100 text-red-700 bg-red-200/15 text-red-200',
};

export default function StatusBadge({ label, variant = 'planned', className = '' }) {
  const styles = statusMap[variant] || statusMap.planned;
  return (
    <span className={`inline-flex rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] shadow-sm backdrop-blur-sm ${styles} ${className}`}>
      {label}
    </span>
  );
}
