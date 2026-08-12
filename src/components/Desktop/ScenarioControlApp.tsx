import { SlidersHorizontal } from 'lucide-react';
import { ScenarioBar } from '../ScenarioBar';

export function ScenarioControlApp() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-slate-800/80 bg-[#05070d]">
      <div className="flex items-center gap-2 border-b border-slate-800/80 bg-[#0b1120] px-3 py-2">
        <SlidersHorizontal size={14} className="text-neon-green" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-200">Scenario Control Panel</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ScenarioBar />
      </div>
    </div>
  );
}
