import type { ScenarioDefinition } from './types';
import { makeGameTickPacket, makeLobbyPacket, makeSniffedPacket } from '../packetGenerator';

export const sniffingScenario: ScenarioDefinition = {
  id: 'sniffing',
  label: 'Trigger IP Sniffing',
  shortLabel: 'Sniffing',
  category: 'recon',
  terminalCommand: 'sniff',
  runCommand: 'sniff',
  aliases: ['tcpdump', 'wireshark'],
  description:
    'Passive packet capture on the local subnet — an attacker with promiscuous-mode NIC access is quietly leaking session token fragments.',
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
  generatePackets: () => {
    const batch = Array.from({ length: Math.floor(Math.random() * 4) + 2 }, () =>
      Math.random() > 0.85 ? makeLobbyPacket() : makeGameTickPacket()
    );
    if (Math.random() > 0.6) batch.push(makeSniffedPacket());
    return batch;
  },
};
