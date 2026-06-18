const segmentColors = ['#fb923c', '#f59e0b', '#34d399'];

export default function DonutChart({ data }) {
  const total = data.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex h-[220px] w-[220px] items-center justify-center rounded-full bg-slate-50 shadow-soft dark:bg-slate-900/80">
        <svg viewBox="0 0 220 220" className="h-full w-full">
          <g transform="translate(110,110)">
            {data.map((segment, index) => {
              const strokeDasharray = `${(segment.value / total) * circumference} ${circumference}`;
              const segmentStyle = {
                stroke: segmentColors[index % segmentColors.length],
                strokeWidth: 28,
                strokeLinecap: 'round',
                fill: 'none',
                transition: 'stroke-dasharray 0.4s ease, stroke 0.4s ease',
              };
              const segmentOffset = offset;
              offset += (segment.value / total) * circumference;
              return (
                <circle
                  key={segment.label}
                  r={radius}
                  cx="0"
                  cy="0"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={-segmentOffset}
                  style={segmentStyle}
                  transform="rotate(-90)"
                />
              );
            })}
          </g>
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Total</p>
            <p className="text-3xl font-semibold text-slate-900 dark:text-white">{total.toFixed(0)} h</p>
          </div>
        </div>
      </div>
      <div className="grid w-full gap-3 sm:grid-cols-3">
        {data.map((segment, index) => (
          <div key={segment.label} className="rounded-[26px] border border-slate-200/70 bg-white/90 px-4 py-3 text-sm dark:border-slate-800/70 dark:bg-slate-950/95">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-3.5 w-3.5 rounded-full" style={{ backgroundColor: segmentColors[index % segmentColors.length] }} />
              <span className="font-semibold text-slate-700 dark:text-slate-200">{segment.label}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{segment.value.toFixed(0)} h</p>
          </div>
        ))}
      </div>
    </div>
  );
}
