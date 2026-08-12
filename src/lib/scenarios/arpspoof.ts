import type { ScenarioDefinition } from './types';
import { makeArpSpoofPacket, makeGameTickPacket, makeLobbyPacket } from '../packetGenerator';

export const arpspoofScenario: ScenarioDefinition = {
  id: 'arpspoof',
  label: 'Simulate ARP Spoof / MITM',
  shortLabel: 'ARP Spoof',
  category: 'attack',
  terminalCommand: 'arpspoof -t <gateway> -r <lobby>',
  runCommand: 'arpspoof -t 192.168.1.1 -r 104.22.15.10',
  aliases: ['mitm'],
  description:
    'An on-path attacker poisons the local ARP cache, rerouting client <-> lobby traffic through their own machine to intercept or tamper with it.',
  severity: 'moderate',
  topologyEffect: 'mitm-reroute',
  mitigable: true,
  telemetryTarget: (elapsedSec, waf) => {
    const ramp = Math.min(1, elapsedSec / 6);
    const dampen = waf ? 0.35 : 1;
    // Deterministic periodic "rubber-banding" spike from the MITM re-route,
    // instead of raw Math.random() — keeps telemetryTarget a pure function of
    // (elapsedSec, waf) so it stays testable and WAF dampening always holds.
    const spikeWave = Math.max(0, Math.sin(elapsedSec * 1.4)) * 70 * dampen;
    return {
      cpu: 18 + ramp * 10 * dampen,
      ping: 40 + ramp * 90 * dampen + spikeWave,
      tick: 60 - ramp * 8 * dampen,
      packetLoss: 1 + ramp * 6 * dampen,
      playerDelta: -0.02,
      health: ramp > 0.6 && !waf ? 'degraded' : 'optimal',
    };
  },
  generatePackets: (waf) => {
    const count = waf ? 1 : Math.floor(Math.random() * 2) + 1;
    const batch = Array.from({ length: count }, () => makeArpSpoofPacket());
    if (Math.random() > 0.5) batch.push(Math.random() > 0.5 ? makeGameTickPacket() : makeLobbyPacket());
    return batch;
  },
};
