import type { ScenarioDefinition } from './types';
import {
  makeArpPacket,
  makeDhcpPacket,
  makeDnsPacket,
  makeGameTickPacket,
  makeIcmpPacket,
  makeLobbyPacket,
  makeNtpPacket,
  makeTlsPacket,
} from '../packetGenerator';
import type { Packet } from '../../types';

/** Normal, everyday LAN chatter for when the game server is stopped. */
function backgroundTraffic(): Packet[] {
  const count = Math.floor(Math.random() * 4) + 2;
  const packets: Packet[] = [];
  for (let i = 0; i < count; i++) {
    const roll = Math.random();
    if (roll < 0.2) packets.push(makeArpPacket());
    else if (roll < 0.4) packets.push(makeDnsPacket());
    else if (roll < 0.55) packets.push(makeNtpPacket());
    else if (roll < 0.68) packets.push(makeDhcpPacket());
    else if (roll < 0.82) packets.push(makeIcmpPacket());
    else if (roll < 0.93) packets.push(makeTlsPacket());
    else packets.push(makeLobbyPacket());
  }
  return packets;
}

/** Nominal UDP game-tick traffic between the client and the running match server. */
function gameplayTraffic(): Packet[] {
  return Array.from({ length: Math.floor(Math.random() * 4) + 2 }, () =>
    Math.random() > 0.85 ? makeLobbyPacket() : makeGameTickPacket()
  );
}

export const baselineScenario: ScenarioDefinition = {
  id: 'baseline',
  label: 'Baseline',
  shortLabel: 'Baseline',
  category: 'idle',
  terminalCommand: 'status',
  runCommand: 'status',
  aliases: [],
  description:
    'Healthy reference state. With the game server stopped, Wireshark only shows normal background LAN traffic (ARP, DNS, NTP, TLS…). Start the game (`start` or BGMI → FIND MATCH) to see nominal UDP game-tick traffic. No threats active.',
  classification: {
    attack: 'None (Baseline)',
    layer: '—',
    family: 'Normal operation',
    requiresSessionToken: false,
    requiresLanAccess: false,
    target: 'Nominal traffic (game ticks once the server is running)',
    primaryImpact: 'None',
    primaryDefense: 'None — healthy',
    note: 'No threats active. While the game server is stopped only background LAN traffic is visible; start the game to observe nominal game ticks as the healthy baseline for comparison.',
  },
  severity: 'none',
  topologyEffect: 'none',
  mitigable: false,
  telemetryTarget: (_elapsedSec, _waf, gameActive) =>
    gameActive
      ? {
          cpu: 12,
          ping: 35,
          tick: 60,
          packetLoss: 0.2,
          playerDelta: 0,
          playerTarget: 92,
          health: 'optimal',
          bandwidthIn: 0.8,
          bandwidthOut: 0.6,
        }
      : {
          // Server idle: no players, no ticks, no game bandwidth.
          cpu: 6,
          ping: 0,
          tick: 0,
          packetLoss: 0,
          playerDelta: 0,
          playerTarget: 0,
          health: 'optimal',
          bandwidthIn: 0.1,
          bandwidthOut: 0.05,
        },
  generatePackets: (_waf, _elapsedSec, gameActive) =>
    gameActive ? gameplayTraffic() : backgroundTraffic(),
};
