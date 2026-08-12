import { Terminal as TerminalIcon } from 'lucide-react';
import { SCENARIO_LIST } from '../../lib/scenarios/registry';
import { COMMAND_REFERENCE } from '../../lib/commandReference';

const CATEGORY_LABEL: Record<string, string> = {
  idle: 'Idle / Baseline',
  recon: 'Reconnaissance',
  attack: 'Attacks',
  defense: 'Defense',
};

const CATEGORY_COLOR: Record<string, string> = {
  idle: 'text-neon-green border-neon-green/30 bg-neon-green/5',
  recon: 'text-cyber-cyan border-cyber-cyan/30 bg-cyber-cyan/5',
  attack: 'text-alert-red border-alert-red/30 bg-alert-red/5',
  defense: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
};

export function GuideContent() {
  const groups = ['idle', 'recon', 'attack', 'defense'] as const;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4 text-[12px] text-slate-300">
      <p className="mb-4 text-slate-400">
        Every scenario below is a 100% client-side simulation — no real packets are ever sent. Trigger
        each one from its Scenario Control panel, or by typing its terminal command.
      </p>

      {groups.map((category) => {
        const scenarios = SCENARIO_LIST.filter((s) => s.category === category);
        if (scenarios.length === 0) return null;
        return (
          <div key={category} className="mb-5">
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {CATEGORY_LABEL[category]}
            </h3>
            <div className="space-y-2">
              {scenarios.map((s) => (
                <div key={s.id} className={`rounded border p-2.5 ${CATEGORY_COLOR[category]}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-100">{s.label}</span>
                    <code className="rounded bg-black/30 px-1.5 py-0.5 text-[10px] text-slate-300">
                      {s.terminalCommand}
                    </code>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <h3 className="mb-2 mt-6 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <TerminalIcon size={12} /> Terminal Command Reference
      </h3>
      <div className="overflow-hidden rounded border border-slate-800">
        <table className="w-full text-left text-[11px]">
          <tbody>
            {COMMAND_REFERENCE.map((c, i) => (
              <tr key={c.cmd} className={i % 2 === 0 ? 'bg-[#070b16]' : 'bg-[#0b1120]'}>
                <td className="whitespace-nowrap px-2 py-1.5 align-top font-mono text-cyber-cyan">{c.usage}</td>
                <td className="px-2 py-1.5 text-slate-400">{c.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
