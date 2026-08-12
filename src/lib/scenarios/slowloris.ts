import type { ScenarioDefinition } from './types';
import { makeGameTickPacket, makeSlowlorisPacket } from '../packetGenerator';

export const slowlorisScenario: ScenarioDefinition = {
  id: 'slowloris',
  label: 'Simulate Slowloris',
  shortLabel: 'Slowloris',
  category: 'attack',
  terminalCommand: 'slowloris <ip>',
  runCommand: 'slowloris 10.0.0.20',
  aliases: [],
  description:
    'A low-and-slow attack: many connections are opened and held with partial data, slowly exhausting the server connection pool over ~15s rather than a sudden spike.',
  classification: {
    attack: 'Slowloris',
    layer: 'L7',
    family: 'DoS / DDoS',
    requiresSessionToken: false,
    requiresLanAccess: false,
    target: '10.0.0.20:80/TCP',
    primaryImpact: 'Connection-pool exhaustion',
    primaryDefense: 'Connection limits + request timeouts',
    note: 'Slowloris exhausts a web server\'s connection pool — a reachable HTTP service is all it needs. No stolen session is required; session compromise is a separate attack path.',
  },
  severity: 'moderate',
  topologyEffect: 'slow-drip',
  mitigable: true,
  telemetryTarget: (elapsedSec, waf) => {
    const ramp = Math.min(1, elapsedSec / 15);
    const dampen = waf ? 0.4 : 1;
    return {
      cpu: 15 + ramp * 55 * dampen,
      ping: 35 + ramp * 300 * dampen,
      tick: Math.max(waf ? 40 : 10, 60 - ramp * 45 * dampen),
      packetLoss: ramp * (waf ? 8 : 25),
      playerDelta: -ramp * (waf ? 0.15 : 0.6),
      health: ramp > 0.8 && !waf ? 'critical' : ramp > 0.35 && !waf ? 'degraded' : 'optimal',
      // Slowloris holds connections open with dribbles of data — bandwidth is
      // deliberately tiny; connection-pool exhaustion is the real impact.
      bandwidthIn: 0.8 + ramp * 2.2 * dampen,
      bandwidthOut: 0.5 + ramp * 1.5 * dampen,
    };
  },
  generatePackets: (waf) => {
    const legit = Array.from({ length: Math.floor(Math.random() * 3) + 2 }, () => makeGameTickPacket());
    const slowCount = Math.random() > (waf ? 0.7 : 0.4) ? 1 : 0;
    const slow = Array.from({ length: slowCount }, () => makeSlowlorisPacket());
    return [...legit, ...slow];
  },
};
