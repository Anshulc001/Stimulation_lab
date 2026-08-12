import type { ScenarioDefinition } from './types';
import { makeFloodPacket, makeGameTickPacket } from '../packetGenerator';

/**
 * Universal post-mitigation recovery ramp. Reached after an Anti-Cheat HWID
 * ban (or any successful mitigation) regardless of which attack scenario was
 * active beforehand. Ramps CPU/ping/tick back to baseline over ~5s.
 */
export const recoveringScenario: ScenarioDefinition = {
  id: 'recovering',
  label: 'Anti-Cheat Recovery',
  shortLabel: 'Recovering',
  category: 'defense',
  terminalCommand: 'ban',
  runCommand: 'ban',
  aliases: [],
  description:
    'The offending HWID/IP has been dropped at the edge. Server metrics recover smoothly back to baseline over a few seconds.',
  classification: {
    attack: 'None (Recovering)',
    layer: '—',
    family: 'Recovery',
    requiresSessionToken: false,
    requiresLanAccess: false,
    target: '—',
    primaryImpact: 'None',
    primaryDefense: 'Mitigation already enforced',
    note: 'Defense applied — the offending source has been dropped at the edge and telemetry is recovering toward baseline.',
  },
  severity: 'none',
  topologyEffect: 'none',
  mitigable: false,
  // Self-heal back to Baseline once metrics have fully recovered, instead of
  // sitting on "Recovering" forever until the user manually hits Reset.
  autoEndAfterSec: 7,
  telemetryTarget: (elapsedSec) => {
    const recovery = Math.min(1, elapsedSec / 5);
    return {
      cpu: 100 - recovery * 88,
      ping: 999 - recovery * 964,
      tick: recovery * 60,
      packetLoss: (1 - recovery) * 40,
      playerDelta: recovery > 0.5 ? 0.3 : -0.1,
      health: recovery > 0.9 ? 'optimal' : recovery > 0.4 ? 'degraded' : 'critical',
    };
  },
  generatePackets: (_waf, elapsedSec) => {
    const decay = Math.max(0, 1 - elapsedSec / 2.5);
    const legit = Array.from({ length: Math.floor(Math.random() * 4) + 2 }, () => makeGameTickPacket());
    const residual = Math.random() < decay * 0.5 ? [makeFloodPacket()] : [];
    return [...legit, ...residual];
  },
};
