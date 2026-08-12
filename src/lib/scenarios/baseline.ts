import type { ScenarioDefinition } from './types';
import { makeGameTickPacket, makeLobbyPacket } from '../packetGenerator';

export const baselineScenario: ScenarioDefinition = {
  id: 'baseline',
  label: 'Baseline Gameplay',
  shortLabel: 'Baseline',
  category: 'idle',
  terminalCommand: 'status',
  runCommand: 'status',
  aliases: [],
  description: 'Nominal UDP game-tick traffic between the client and match server. No threats active.',
  classification: {
    attack: 'None (Baseline)',
    layer: '—',
    family: 'Normal operation',
    requiresSessionToken: false,
    requiresLanAccess: false,
    target: 'Nominal UDP game traffic',
    primaryImpact: 'None',
    primaryDefense: 'None — healthy',
    note: 'No threats active — traffic is nominal game ticks. Use this as the healthy baseline for comparison.',
  },
  severity: 'none',
  topologyEffect: 'none',
  mitigable: false,
  telemetryTarget: () => ({
    cpu: 12,
    ping: 35,
    tick: 60,
    packetLoss: 0.2,
    playerDelta: 0,
    health: 'optimal',
  }),
  generatePackets: () =>
    Array.from({ length: Math.floor(Math.random() * 4) + 2 }, () =>
      Math.random() > 0.85 ? makeLobbyPacket() : makeGameTickPacket()
    ),
};
