import type { ScenarioDefinition } from './types';
import { makeGameTickPacket, makePortScanPacket } from '../packetGenerator';

export const portscanScenario: ScenarioDefinition = {
  id: 'portscan',
  label: 'Trigger Port Scan',
  shortLabel: 'Port Scan',
  category: 'recon',
  terminalCommand: 'nmap -sS <ip>',
  runCommand: 'nmap -sS 104.22.15.89',
  aliases: ['portscan'],
  description:
    'An external host sweeps common ports on the match server looking for open services. Low impact, but often the first step before a targeted attack.',
  severity: 'recon',
  topologyEffect: 'recon-scan',
  mitigable: false,
  autoEndAfterSec: 6,
  telemetryTarget: (elapsedSec) => ({
    cpu: 14 + Math.min(1, elapsedSec / 6) * 4,
    ping: 38,
    tick: 60,
    packetLoss: 0.2,
    playerDelta: 0,
    health: 'optimal',
  }),
  generatePackets: () =>
    Math.random() > 0.4
      ? [makePortScanPacket()]
      : [makePortScanPacket(), makeGameTickPacket()],
};
