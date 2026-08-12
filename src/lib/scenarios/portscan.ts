import type { ScenarioDefinition } from './types';
import { makeGameTickPacket, makePortScanPacket, makeUdpPortScanPacket } from '../packetGenerator';
import type { Packet } from '../../types';

export const portscanScenario: ScenarioDefinition = {
  id: 'portscan',
  label: 'Trigger Port Scan',
  shortLabel: 'Port Scan',
  category: 'recon',
  terminalCommand: 'nmap -sS -sU <ip>',
  runCommand: 'nmap -sS -sU 10.0.0.10',
  aliases: ['portscan'],
  description:
    'An external host runs a combined TCP SYN + UDP scan over common ports on the match server — revealing which services are exposed (web on TCP, game on UDP/7777). Low impact, but often the first step before a targeted attack.',
  classification: {
    attack: 'Port Scan',
    layer: 'L4 (TCP SYN + UDP)',
    family: 'Reconnaissance',
    requiresSessionToken: false,
    requiresLanAccess: false,
    target: '10.0.0.10 (multi-port)',
    primaryImpact: 'Attack-surface mapping',
    primaryDefense: 'IDS/IPS alert + firewall filtering',
    note: 'Recon maps the attack surface. Finding a reachable service (e.g. UDP/7777) is all a network-flood scenario needs — no stolen session required.',
  },
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
  generatePackets: () => {
    const packets: Packet[] = [];
    if (Math.random() > 0.4) packets.push(makePortScanPacket());
    if (Math.random() > 0.6) packets.push(makeUdpPortScanPacket());
    if (Math.random() > 0.5) packets.push(makeGameTickPacket());
    return packets;
  },
};
