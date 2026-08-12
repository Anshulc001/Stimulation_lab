import type { ScenarioDefinition } from './types';
import { makeGameTickPacket, makeTlsPacket } from '../packetGenerator';

export const sniffingScenario: ScenarioDefinition = {
  id: 'sniffing',
  label: 'Passive Packet Capture',
  shortLabel: 'Packet Capture',
  category: 'recon',
  terminalCommand: 'sniff',
  runCommand: 'sniff',
  aliases: ['tcpdump', 'wireshark'],
  description:
    'Passive packet capture on the local subnet — traffic is observable, but encrypted (TLS) payloads keep session credentials hidden from the passive observer.',
  demoVariant: {
    label: 'Packet Capture — Insecure',
    command: 'sniff --insecure',
    description:
      'The same passive capture against plaintext HTTP on the web / API server — a readable session token (Cookie: SESSION_ID=…) leaks in the captured payload. Encrypted vs. plaintext is the difference between observing traffic and reading secrets.',
  },
  severity: 'recon',
  topologyEffect: 'none',
  mitigable: false,
  telemetryTarget: () => ({
    cpu: 18,
    ping: 42,
    tick: 60,
    packetLoss: 0.3,
    playerDelta: 0,
    health: 'optimal',
  }),
  generatePackets: () =>
    Array.from({ length: Math.floor(Math.random() * 3) + 2 }, () =>
      Math.random() > 0.5 ? makeGameTickPacket() : makeTlsPacket()
    ),
};
