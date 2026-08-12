import { CheckCircle2, CircleAlert, History, Info, ShieldAlert } from 'lucide-react';
import { useSimStore } from '../../store/simStore';

const levelStyle: Record<string, { color: string; icon: typeof Info }> = {
  info: { color: 'text-cyber-cyan', icon: Info },
  warning: { color: 'text-yellow-400', icon: CircleAlert },
  critical: { color: 'text-alert-red', icon: ShieldAlert },
  success: { color: 'text-neon-green', icon: CheckCircle2 },
};

export function IncidentTimeline() {
  const incidents = useSimStore((s) => s.incidents);

  return (
    <div className="rounded border border-slate-800 bg-[#070b16]">
      <div className="flex items-center gap-1.5 border-b border-slate-800 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        <History size={12} />
        Incident History
      </div>
      <div className="max-h-72 space-y-2 overflow-y-auto p-2 text-[10.5px]">
        {incidents.length === 0 && (
          <div className="p-2 text-center text-slate-600">No incidents yet — trigger a scenario to populate the timeline.</div>
        )}
        {incidents.map((inc, i) => {
          const style = levelStyle[inc.severity];
          const Icon = style.icon;
          return (
            <div key={inc.id} className="relative flex gap-2 pl-4">
              {i !== incidents.length - 1 && (
                <span className="absolute left-[7px] top-4 h-full w-px bg-slate-800" />
              )}
              <Icon size={13} className={`absolute left-0 top-0.5 ${style.color}`} />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-semibold ${style.color}`}>{inc.label}</span>
                  <span className="flex-shrink-0 text-slate-600">{inc.timestamp}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
