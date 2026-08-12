import type { ScenarioDefinition } from './types';
import { makeAmplificationPacket, makeGameTickPacket, makeReflectionRequestPacket } from '../packetGenerator';

export const amplificationScenario: ScenarioDefinition = {
  id: 'amplification',
  label: 'Simulate Amplification Attack',
  shortLabel: 'Amplification',
  category: 'attack',
  terminalCommand: 'hping3 --amplify -p 123 <ip>',
  runCommand: 'hping3 --amplify -p 123 10.0.0.10',
  aliases: ['amplify'],
  description:
    'A UDP reflection/amplification attack (e.g. NTP monlist): small spoofed requests to open reflectors return massively oversized responses, saturating the match server bandwidth faster than any other attack.',
  classification: {
    attack: 'UDP Amplification',
    layer: 'L4',
    family: 'DoS / DDoS',
    requiresSessionToken: false,
    requiresLanAccess: false,
    target: '10.0.0.10:7777/UDP',
    primaryImpact: 'Bandwidth / packet loss',
    primaryDefense: 'Reflection-source filtering + rate limiting',
    note: 'Amplification floods the target with reflector responses — a reachable UDP service is all it needs. No stolen session is required; session compromise is a separate attack path.',
  },
  severity: 'critical',
  topologyEffect: 'amplify-burst',
  mitigable: true,
  telemetryTarget: (elapsedSec, waf) => {
    const ramp = Math.min(1, elapsedSec / 3);
    const dampen = waf ? 0.35 : 1;
    return {
      // Teaching signature: bandwidth/network saturation is the headline —
      // CPU only rises mildly (the server is overwhelmed by traffic volume,
      // not connection handling). Contrast with SYN flood, where CPU/tick
      // collapse is the dominant effect and bandwidth stays modest.
      cpu: 22 + ramp * 20 * dampen,
      ping: 35 + ramp * 900 * dampen,
      tick: Math.max(waf ? 45 : 30, 60 - ramp * 30 * dampen),
      packetLoss: ramp * (waf ? 15 : 70),
      playerDelta: -ramp * (waf ? 0.5 : 1.8),
      health: ramp > 0.65 && !waf ? 'critical' : ramp > 0.25 && !waf ? 'degraded' : 'optimal',
      // Bandwidth is amplification's signature metric: oversized reflector
      // responses saturate the inbound link (SATURATED >50 Mbps), while
      // outbound stays comparatively modest. WAF scrubbing cuts it hard.
      bandwidthIn: 15 + ramp * 75 * dampen,
      bandwidthOut: 4 + ramp * 10 * dampen,
    };
  },
  generatePackets: (waf) => {
    const legitCount = Math.random() > 0.6 ? 1 : 0;
    const requestCount = Math.floor((Math.floor(Math.random() * 2) + 1) * (waf ? 0.3 : 1));
    const ampCount = Math.floor((Math.floor(Math.random() * 6) + 4) * (waf ? 0.25 : 1));
    const legit = Array.from({ length: legitCount }, () => makeGameTickPacket());
    // request → reflection → amplification chain is visible in the analyzer
    const requests = Array.from({ length: requestCount }, () => makeReflectionRequestPacket());
    const amp = Array.from({ length: ampCount }, () => makeAmplificationPacket());
    return [...legit, ...requests, ...amp];
  },
};
