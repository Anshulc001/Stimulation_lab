import { Fingerprint, Info } from 'lucide-react';
import { useSimStore } from '../../store/simStore';
import { getScenario } from '../../lib/scenarios/registry';

function yesNo(value: boolean) {
  return value ? 'YES' : 'NO';
}

/**
 * Educational classification of the currently active scenario. Makes the two
 * parallel attack paths explicit: network-flood attacks need a reachable
 * service (no session token), while session attacks need a separate credential.
 */
export function AttackClassification() {
  const activeScenario = useSimStore((s) => s.activeScenario);
  const scenario = getScenario(activeScenario);
  const c = scenario.classification;
  const isThreat = scenario.category !== 'idle' && scenario.category !== 'defense';

  return (
    <div className="mt-2 rounded-md border border-slate-800 bg-[#070b16] p-2.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <Fingerprint size={12} className="text-cyber-cyan" />
        Attack Classification
        <span
          className={`ml-auto rounded px-1.5 py-0.5 text-[9px] font-bold ${
            isThreat
              ? 'bg-alert-red/15 text-alert-red'
              : 'bg-neon-green/15 text-neon-green'
          }`}
        >
          {scenario.category}
        </span>
      </div>

      <dl className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-x-3 gap-y-0.5 text-[11px] leading-4">
        <dt className="text-slate-500">Attack</dt>
        <dd className="font-semibold text-slate-100">{c.attack}</dd>

        <dt className="text-slate-500">Family / Layer</dt>
        <dd className="text-slate-300">
          {c.family} · {c.layer}
        </dd>

        <dt className="text-slate-500">Target</dt>
        <dd className="font-mono text-cyber-cyan">{c.target}</dd>

        <dt className="text-slate-500">Session token?</dt>
        <dd className={c.requiresSessionToken ? 'font-semibold text-alert-red' : 'text-slate-300'}>
          {yesNo(c.requiresSessionToken)}
        </dd>

        <dt className="text-slate-500">LAN access?</dt>
        <dd className={c.requiresLanAccess ? 'font-semibold text-yellow-400' : 'text-slate-300'}>
          {yesNo(c.requiresLanAccess)}
        </dd>

        <dt className="text-slate-500">Primary impact</dt>
        <dd className="text-slate-300">{c.primaryImpact}</dd>

        <dt className="text-slate-500">Primary defense</dt>
        <dd className="text-neon-green">{c.primaryDefense}</dd>
      </dl>

      <p className="mt-2 flex items-start gap-1.5 border-t border-slate-800/80 pt-1.5 text-[10px] leading-4 text-slate-500">
        <Info size={11} className="mt-0.5 shrink-0 text-cyber-cyan" />
        {c.note}
      </p>
    </div>
  );
}
