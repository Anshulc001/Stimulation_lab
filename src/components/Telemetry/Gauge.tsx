interface GaugeProps {
  label: string;
  value: number;
  max: number;
  unit: string;
  colorClass: string;
}

export function Gauge({ label, value, max, unit, colorClass }: GaugeProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const isDanger = colorClass.includes('alert-red');
  return (
    <div className="rounded border border-slate-800 bg-[#070b16] p-2.5">
      <div className="mb-1.5 flex items-center justify-between text-[11px]">
        <span className="text-slate-400">{label}</span>
        <span className={`font-mono font-semibold tabular-nums ${colorClass}`}>
          {value.toFixed(0)}
          {unit}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/80">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${colorClass.replace(
            'text-',
            'bg-'
          )} ${isDanger ? 'animate-pulse-glow' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
