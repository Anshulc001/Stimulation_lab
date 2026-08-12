import type { Packet, Protocol } from '../types';

let packetCounter = 0;
let simClockStart = performance.now();

export function resetPacketClock() {
  simClockStart = performance.now();
  packetCounter = 0;
}

function elapsedSeconds(): string {
  return ((performance.now() - simClockStart) / 1000).toFixed(6);
}

export const CLIENT_IP = '192.168.1.45';
export const MATCH_SERVER = '104.22.15.89';
export const MATCH_PORT = 7777;
export const LOBBY_SERVER = '104.22.15.10';
export const GATEWAY_IP = '192.168.1.1';
export const ATTACKER_LAN_IP = '192.168.1.66';

const COMMON_PORTS = [21, 22, 23, 25, 53, 80, 110, 143, 443, 3389, 7777, 8080];
const PORT_STATES = ['open', 'closed', 'filtered'];
const NTP_REFLECTORS = ['198.51.100.12', '203.0.113.44', '192.0.2.77', '198.51.100.201'];

const GAME_TICK_INFOS = [
  'Player State Update Seq=',
  'Position Sync Seq=',
  'Input Frame Seq=',
  'Ack Tick Seq=',
  'Health/Ammo Sync Seq=',
];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomHex(bytes: number): string {
  const arr: string[] = [];
  for (let i = 0; i < bytes; i++) {
    arr.push(randInt(0, 255).toString(16).padStart(2, '0'));
  }
  return arr.join(' ');
}

function hexToAscii(hex: string): string {
  return hex
    .split(' ')
    .map((h) => {
      const code = parseInt(h, 16);
      return code >= 32 && code <= 126 ? String.fromCharCode(code) : '.';
    })
    .join('');
}

function randomSpoofedIp(): string {
  return `${randInt(1, 223)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`;
}

export function makeGameTickPacket(): Packet {
  packetCounter += 1;
  const info = GAME_TICK_INFOS[randInt(0, GAME_TICK_INFOS.length - 1)];
  const clientToServer = Math.random() > 0.4;
  const length = randInt(64, 256);
  const hex = randomHex(Math.min(16, length));
  return {
    id: packetCounter,
    no: packetCounter,
    time: elapsedSeconds(),
    src: clientToServer ? CLIENT_IP : `${MATCH_SERVER}`,
    dst: clientToServer ? `${MATCH_SERVER}:${MATCH_PORT}` : `${CLIENT_IP}`,
    protocol: 'UDP' as Protocol,
    length,
    info: `${info}${randInt(10000, 99999)} Port=${MATCH_PORT}`,
    malicious: false,
    hex,
    ascii: hexToAscii(hex),
  };
}

export function makeLobbyPacket(): Packet {
  packetCounter += 1;
  const length = randInt(80, 200);
  const hex = randomHex(16);
  return {
    id: packetCounter,
    no: packetCounter,
    time: elapsedSeconds(),
    src: CLIENT_IP,
    dst: `${LOBBY_SERVER}:443`,
    protocol: 'TCP' as Protocol,
    length,
    info: `[PSH, ACK] Matchmaking Heartbeat Seq=${randInt(1000, 9999)}`,
    malicious: false,
    hex,
    ascii: hexToAscii(hex),
  };
}

export function makeSniffedPacket(): Packet {
  packetCounter += 1;
  const length = randInt(60, 180);
  const hex = randomHex(16);
  return {
    id: packetCounter,
    no: packetCounter,
    time: elapsedSeconds(),
    src: CLIENT_IP,
    dst: `${MATCH_SERVER}:${MATCH_PORT}`,
    protocol: 'UDP' as Protocol,
    length,
    info: `[CAPTURED] Session Token Fragment Leak Seq=${randInt(1000, 9999)}`,
    malicious: true,
    hex,
    ascii: hexToAscii(hex),
  };
}

export function makeFloodPacket(): Packet {
  packetCounter += 1;
  const length = randInt(1, 64);
  const hex = randomHex(16);
  const spoofed = randomSpoofedIp();
  return {
    id: packetCounter,
    no: packetCounter,
    time: elapsedSeconds(),
    src: spoofed,
    dst: `${MATCH_SERVER}:${MATCH_PORT}`,
    protocol: 'UDP' as Protocol,
    length,
    info: `[MALFORMED] Spoofed SYN Flood Seq=${randInt(0, 999999)} TTL=${randInt(1, 32)}`,
    malicious: true,
    hex,
    ascii: hexToAscii(hex),
  };
}

let portScanCursor = 0;

export function makePortScanPacket(target = MATCH_SERVER): Packet {
  packetCounter += 1;
  const port = COMMON_PORTS[portScanCursor % COMMON_PORTS.length];
  portScanCursor += 1;
  const state = PORT_STATES[randInt(0, PORT_STATES.length - 1)];
  const hex = randomHex(16);
  return {
    id: packetCounter,
    no: packetCounter,
    time: elapsedSeconds(),
    src: CLIENT_IP,
    dst: `${target}:${port}`,
    protocol: 'TCP' as Protocol,
    length: randInt(40, 60),
    info: `[SYN] Port Scan Probe :${port} -> ${state.toUpperCase()}`,
    malicious: false,
    hex,
    ascii: hexToAscii(hex),
  };
}

export function makeArpSpoofPacket(): Packet {
  packetCounter += 1;
  const hex = randomHex(16);
  const gratuitous = Math.random() > 0.5;
  return {
    id: packetCounter,
    no: packetCounter,
    time: elapsedSeconds(),
    src: ATTACKER_LAN_IP,
    dst: gratuitous ? 'ff:ff:ff:ff:ff:ff (broadcast)' : CLIENT_IP,
    protocol: 'ARP' as Protocol,
    length: randInt(42, 60),
    info: gratuitous
      ? `[GRATUITOUS] ARP Reply: ${GATEWAY_IP} is-at 00:1a:2b:${randInt(10, 99)}:ff:ee (spoofed)`
      : `Rerouted via ${ATTACKER_LAN_IP} (attacker) — MITM active`,
    malicious: true,
    hex,
    ascii: hexToAscii(hex),
  };
}

export function makeAmplificationPacket(): Packet {
  packetCounter += 1;
  const length = randInt(1200, 4096);
  const hex = randomHex(16);
  const reflector = NTP_REFLECTORS[randInt(0, NTP_REFLECTORS.length - 1)];
  return {
    id: packetCounter,
    no: packetCounter,
    time: elapsedSeconds(),
    src: `${reflector} (NTP-reflector)`,
    dst: `${MATCH_SERVER}:${MATCH_PORT}`,
    protocol: 'UDP' as Protocol,
    length,
    info: `[AMPLIFIED] NTP MONLIST Reply Seq=${randInt(0, 999999)} (${length}B)`,
    malicious: true,
    hex,
    ascii: hexToAscii(hex),
  };
}

let slowlorisConnCounter = 0;

export function makeSlowlorisPacket(): Packet {
  packetCounter += 1;
  slowlorisConnCounter += 1;
  const hex = randomHex(16);
  const spoofed = randomSpoofedIp();
  return {
    id: packetCounter,
    no: packetCounter,
    time: elapsedSeconds(),
    src: spoofed,
    dst: `${MATCH_SERVER}:${MATCH_PORT}`,
    protocol: 'TCP' as Protocol,
    length: randInt(1, 8),
    info: `[SLOWLORIS] Partial HTTP Header Sent (keep-alive) — Conn #${slowlorisConnCounter % 500}`,
    malicious: true,
    hex,
    ascii: hexToAscii(hex),
  };
}

export function makePingPacket(host: string, seq: number): { line: string; ms: number } {
  const ms = Number((Math.random() * 10 + 20).toFixed(1));
  return {
    line: `64 bytes from ${host}: icmp_seq=${seq} ttl=57 time=${ms} ms`,
    ms,
  };
}
