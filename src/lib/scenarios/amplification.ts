import type { ScenarioDefinition } from './types';
import { makeAmplificationPacket, makeGameTickPacket } from '../packetGenerator';

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
  severity: 'critical',
  topologyEffect: 'amplify-burst',
  mitigable: true,
  telemetryTarget: (elapsedSec, waf) => {
    const ramp = Math.min(1, elapsedSec / 3);
    const dampen = waf ? 0.35 : 1;
    return {
      cpu: 22 + ramp * 70 * dampen,
      ping: 35 + ramp * 900 * dampen,
      tick: Math.max(waf ? 30 : 0, 60 - ramp * 55 * dampen),
      packetLoss: ramp * (waf ? 15 : 70),
      playerDelta: -ramp * (waf ? 0.5 : 1.8),
      health: ramp > 0.65 && !waf ? 'critical' : ramp > 0.25 && !waf ? 'degraded' : 'optimal',
    };
  },
  generatePackets: (waf) => {
    const legitCount = Math.random() > 0.6 ? 1 : 0;
    const ampCount = Math.floor((Math.floor(Math.random() * 6) + 4) * (waf ? 0.25 : 1));
    const legit = Array.from({ length: legitCount }, () => makeGameTickPacket());
    const amp = Array.from({ length: ampCount }, () => makeAmplificationPacket());
    return [...legit, ...amp];
  },
};
