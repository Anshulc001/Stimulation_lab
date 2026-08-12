import type { ScenarioId } from '../../types';
import type { ScenarioDefinition } from './types';
import { baselineScenario } from './baseline';
import { sniffingScenario } from './sniffing';
import { portscanScenario } from './portscan';
import { arpspoofScenario } from './arpspoof';
import { synfloodScenario } from './synflood';
import { amplificationScenario } from './amplification';
import { slowlorisScenario } from './slowloris';
import { recoveringScenario } from './recovering';

export const SCENARIOS: Record<ScenarioId, ScenarioDefinition> = {
  baseline: baselineScenario,
  sniffing: sniffingScenario,
  portscan: portscanScenario,
  arpspoof: arpspoofScenario,
  synflood: synfloodScenario,
  amplification: amplificationScenario,
  slowloris: slowlorisScenario,
  recovering: recoveringScenario,
};

export const SCENARIO_LIST: ScenarioDefinition[] = Object.values(SCENARIOS);

export function getScenario(id: ScenarioId): ScenarioDefinition {
  return SCENARIOS[id];
}

export const ATTACK_SCENARIO_IDS: ScenarioId[] = SCENARIO_LIST.filter(
  (s) => s.category === 'attack'
).map((s) => s.id);

export function isAttackScenario(id: ScenarioId): boolean {
  return ATTACK_SCENARIO_IDS.includes(id);
}
