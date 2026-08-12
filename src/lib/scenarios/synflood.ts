import type { ScenarioDefinition } from './types';
import { makeFloodPacket, makeGameTickPacket } from '../packetGenerator';

export const synfloodScenario: ScenarioDefinition = {
  id: 'synflood',
  label: 'Simulate hping3 Flood',
  shortLabel: 'SYN Flood',
  category: 'attack',
  terminalCommand: 'hping3 -S --flood -p 7777 <ip>',
  runCommand: 'hping3 -S --flood -p 7777 104.22.15.89',
  aliases: [],
  description:
    'A classic SYN flood: thousands of spoofed-source TCP/UDP packets overwhelm the match server, spiking CPU and latency and eventually freezing the game tick loop entirely.',
  severity: 'critical',
  topologyEffect: 'flood-pulse',
  mitigable: true,
  telemetryTarget: (elapsedSec, waf) => {
    const ramp = Math.min(1, elapsedSec / 4);
    const dampen = waf ? 0.4 : 1;
    return {
      cpu: 20 + ramp * 80 * dampen,
      ping: 35 + ramp * 964 * dampen,
      tick: Math.max(waf ? 25 : 0, 60 - ramp * 60 * dampen),
      packetLoss: ramp * (waf ? 12 : 55),
      playerDelta: -ramp * (waf ? 0.4 : 1.6),
      health: ramp > 0.75 && !waf ? 'critical' : ramp > 0.3 && !waf ? 'degraded' : 'optimal',
    };
  },
  generatePackets: (waf) => {
    const legitCount = Math.random() > 0.5 ? 1 : 0;
    const floodCount = Math.floor((Math.floor(Math.random() * 15) + 20) * (waf ? 0.3 : 1));
    const legit = Array.from({ length: legitCount }, () => makeGameTickPacket());
    const flood = Array.from({ length: floodCount }, () => makeFloodPacket());
    return [...legit, ...flood];
  },
};
