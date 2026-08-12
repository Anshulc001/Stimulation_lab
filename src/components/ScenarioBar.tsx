import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Eye,
  Radar,
  Radiation,
  Waves,
  Hourglass,
  Cable,
  Shield,
  ShieldBan,
  RotateCcw,
} from 'lucide-react';
import { useSimStore } from '../store/simStore';
import { executeCommand } from '../lib/commands';
import { SCENARIO_LIST } from '../lib/scenarios/registry';
import type { ScenarioId } from '../types';
import { AttackClassification } from './Shared/AttackClassification';

const ICONS: Record<ScenarioId, typeof Activity> = {
  baseline: Activity,
  sniffing: Eye,
  portscan: Radar,
  arpspoof: Cable,
  synflood: Radiation,
  amplification: Waves,
  slowloris: Hourglass,
  recovering: ShieldBan,
};

const ACCENT: Record<string, { active: string; idle: string }> = {
  recon: {
    active: 'border-cyber-cyan bg-cyber-cyan/15 text-cyber-cyan shadow-[0_0_12px_rgba(6,182,212,0.25)]',
    idle: 'border-slate-700 text-slate-400 hover:border-cyber-cyan/50 hover:text-cyber-cyan hover:bg-cyber-cyan/5',
  },
  attack: {
    active: 'border-alert-red bg-alert-red/15 text-alert-red shadow-[0_0_12px_rgba(239,68,68,0.3)]',
    idle: 'border-slate-700 text-slate-400 hover:border-alert-red/50 hover:text-alert-red hover:bg-alert-red/5',
  },
  defense: {
    active: 'border-yellow-400 bg-yellow-400/15 text-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.25)]',
    idle: 'border-slate-700 text-slate-400 hover:border-yellow-400/50 hover:text-yellow-400 hover:bg-yellow-400/5',
  },
  idle: {
    active: 'border-neon-green bg-neon-green/15 text-neon-green shadow-[0_0_12px_rgba(34,197,94,0.25)]',
    idle: 'border-slate-700 text-slate-400 hover:border-neon-green/50 hover:text-neon-green hover:bg-neon-green/5',
  },
};

const GROUPS: { label: string; category: 'idle' | 'recon' | 'attack' | 'defense' }[] = [
  { label: 'Recon', category: 'recon' },
  { label: 'Attacks', category: 'attack' },
  { label: 'Defense', category: 'defense' },
];

function runScenario(id: ScenarioId, runCommand: string) {
  if (id === 'baseline') {
    useSimStore.getState().resetAll();
    useSimStore.getState().pushTerminalLine('success', 'Scenario: Baseline Gameplay — nominal UDP tick traffic restored.');
    return;
  }
  executeCommand(runCommand);
}

export function ScenarioBar() {
  const activeScenario = useSimStore((s) => s.activeScenario);
  const wafActive = useSimStore((s) => s.wafActive);
  const baseline = SCENARIO_LIST.find((s) => s.id === 'baseline')!;

  // Flash the button belonging to the scenario that just became active — this
  // fires both when a Scenario Control button is clicked AND when the same
  // command is typed into the terminal, so the two stay visually connected.
  const [flashId, setFlashId] = useState<ScenarioId | null>(null);
  const prevScenario = useRef(activeScenario);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (prevScenario.current === activeScenario) return;
    prevScenario.current = activeScenario;
    setFlashId(activeScenario);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashId(null), 1100);
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, [activeScenario]);

  return (
    <div className="border-b border-slate-800/80 bg-[#0b1120] px-4 py-2">
      <div className="flex flex-wrap items-center gap-2 py-0.5">
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Idle</span>
        <ScenarioButton scenario={baseline} active={activeScenario === 'baseline'} flashing={flashId === 'baseline'} />
        <button
          onClick={() => useSimStore.getState().resetAll()}
          className="flex items-center gap-1.5 rounded border border-slate-700 px-3 py-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:border-slate-500 hover:bg-slate-800/50 hover:text-slate-200 active:scale-95"
        >
          <RotateCcw size={13} />
          Reset
        </button>
        <button
          onClick={() => executeCommand(`waf ${wafActive ? 'off' : 'on'}`)}
          className={`ml-1 flex items-center gap-1.5 rounded border px-3 py-1.5 text-[11px] font-medium transition-all active:scale-95 ${
            wafActive
              ? 'border-neon-green bg-neon-green/15 text-neon-green shadow-[0_0_12px_rgba(34,197,94,0.25)]'
              : 'border-slate-700 text-slate-400 hover:border-neon-green/50 hover:text-neon-green hover:bg-neon-green/5'
          }`}
          title="Toggle WAF traffic-shaping mitigation for the active attack"
        >
          <Shield size={13} />
          WAF {wafActive ? 'ON' : 'OFF'}
        </button>
        <span className="ml-auto rounded bg-slate-800/80 px-2.5 py-1 text-[10px] font-semibold uppercase text-slate-400">
          Scenario: <span className="text-slate-100">{activeScenario}</span>
        </span>
      </div>

      {GROUPS.map((group) => {
        const scenarios = SCENARIO_LIST.filter((s) => s.category === group.category);
        if (scenarios.length === 0) return null;
        return (
          <div key={group.category} className="flex flex-wrap items-center gap-2 py-0.5">
            <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {group.label}
            </span>
            {scenarios.map((s) => (
              <ScenarioButton key={s.id} scenario={s} active={activeScenario === s.id} flashing={flashId === s.id} />
            ))}
            {group.category === 'recon' && (
              <button
                onClick={() => executeCommand('sniff --insecure')}
                title="sniff --insecure — demonstrate how plaintext HTTP traffic leaks a readable session token (teaching demo)"
                className="flex items-center gap-1.5 rounded border border-dashed border-slate-700 px-3 py-1.5 text-[11px] font-medium text-slate-500 transition-all duration-150 hover:border-alert-red/50 hover:text-alert-red hover:bg-alert-red/5 active:scale-95"
              >
                <Eye size={13} />
                Capture Insecure
              </button>
            )}
          </div>
        );
      })}

      <AttackClassification />
    </div>
  );
}

function ScenarioButton({
  scenario,
  active,
  flashing,
}: {
  scenario: (typeof SCENARIO_LIST)[number];
  active: boolean;
  flashing: boolean;
}) {
  const Icon = ICONS[scenario.id];
  const accent = ACCENT[scenario.category] ?? ACCENT.idle;
  return (
    <button
      onClick={() => runScenario(scenario.id, scenario.runCommand)}
      title={scenario.description}
      className={`group relative flex items-center gap-1.5 rounded border bg-transparent px-3 py-1.5 text-[11px] font-medium transition-all duration-150 hover:-translate-y-0.5 active:scale-95 ${
        active ? accent.active : accent.idle
      } ${flashing ? 'animate-btn-flash' : ''}`}
    >
      <Icon size={13} className={`transition-transform duration-200 group-hover:scale-125 ${active ? 'animate-pulse-glow' : ''}`} />
      {scenario.label}
      {active && (
        <span className={`ml-0.5 h-1.5 w-1.5 rounded-full bg-current animate-blink`} />
      )}
    </button>
  );
}
