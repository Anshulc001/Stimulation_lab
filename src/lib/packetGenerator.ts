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

// Network roles — reserved/example addresses, all simulated.
export const CLIENT_IP = '192.168.1.45'; // victim / game client
export const ATTACKER_IP = '192.168.1.50'; // simulated Kali / attacker console
export const GATEWAY_IP = '192.168.1.1'; // LAN router
export const MATCH_SERVER = '10.0.0.10'; // game server
export const MATCH_PORT = 7777; // game traffic: UDP
export const WEB_SERVER = '10.0.0.20'; // web / API server
export const WEB_PORT = 443; // TLS
export const HTTP_PORT = 80;
export const NTP_REFLECTOR_PORT = 123;

export interface ScanResultRow {
  port: number;
  proto: 'TCP' | 'UDP';
  state: 'OPEN' | 'FILTERED' | 'CLOSED';
  service: string;
}

/**
 * Deterministic results for the combined nmap -sS -sU lesson. Single source of
 * truth: the terminal scan table and the probe packets both read from here, so
 * the packet analyzer never contradicts the teaching output.
 */
export const TCP_SCAN_RESULTS: ScanResultRow[] = [
  { port: 21, proto: 'TCP', state: 'OPEN', service: 'ftp' },
  { port: 22, proto: 'TCP', state: 'OPEN', service: 'ssh' },
  { port: 23, proto: 'TCP', state: 'OPEN', service: 'telnet' },
  { port: 25, proto: 'TCP', state: 'OPEN', service: 'smtp' },
  { port: 53, proto: 'TCP', state: 'OPEN', service: 'dns' },
  { port: 80, proto: 'TCP', state: 'FILTERED', service: 'http' },
  { port: 110, proto: 'TCP', state: 'OPEN', service: 'pop3' },
  { port: 143, proto: 'TCP', state: 'OPEN', service: 'imap' },
  { port: 443, proto: 'TCP', state: 'CLOSED', service: 'https' },
  { port: 3389, proto: 'TCP', state: 'FILTERED', service: 'ms-wbt' },
  { port: 8080, proto: 'TCP', state: 'FILTERED', service: 'http-alt' },
];

export const UDP_SCAN_RESULTS: ScanResultRow[] = [
  { port: 53, proto: 'UDP', state: 'OPEN', service: 'dns' },
  { port: NTP_REFLECTOR_PORT, proto: 'UDP', state: 'OPEN', service: 'ntp' },
  { port: MATCH_PORT, proto: 'UDP', state: 'OPEN', service: 'game' },
];

export const COMMON_PORTS = TCP_SCAN_RESULTS.map((r) => r.port);
export const UDP_SCAN_PORTS = UDP_SCAN_RESULTS.map((r) => r.port);
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
    dst: `${WEB_SERVER}:${WEB_PORT}`,
    protocol: 'TCP' as Protocol,
    length,
    info: `[PSH, ACK] API Heartbeat Seq=${randInt(1000, 9999)}`,
    malicious: false,
    hex,
    ascii: hexToAscii(hex),
  };
}

/** TLS/HTTPS capture — traffic is observable but the payload is encrypted. */
export function makeTlsPacket(): Packet {
  packetCounter += 1;
  const length = randInt(120, 320);
  const hex = randomHex(16);
  const serverToClient = Math.random() > 0.5;
  return {
    id: packetCounter,
    no: packetCounter,
    time: elapsedSeconds(),
    src: serverToClient ? WEB_SERVER : CLIENT_IP,
    dst: serverToClient ? CLIENT_IP : `${WEB_SERVER}:${WEB_PORT}`,
    protocol: 'TCP' as Protocol,
    length,
    info: `[TLS] Application Data (encrypted) Seq=${randInt(1000, 9999)}`,
    malicious: false,
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
  const row = TCP_SCAN_RESULTS[portScanCursor % TCP_SCAN_RESULTS.length];
  portScanCursor += 1;
  const hex = randomHex(16);
  return {
    id: packetCounter,
    no: packetCounter,
    time: elapsedSeconds(),
    src: CLIENT_IP,
    dst: `${target}:${row.port}`,
    protocol: row.proto as Protocol,
    length: randInt(40, 60),
    info: `[SYN] Port Scan Probe :${row.port} -> ${row.state}`,
    malicious: false,
    hex,
    ascii: hexToAscii(hex),
  };
}

let udpScanCursor = 0;

export function makeUdpPortScanPacket(target = MATCH_SERVER): Packet {
  packetCounter += 1;
  const row = UDP_SCAN_RESULTS[udpScanCursor % UDP_SCAN_RESULTS.length];
  udpScanCursor += 1;
  const hex = randomHex(16);
  return {
    id: packetCounter,
    no: packetCounter,
    time: elapsedSeconds(),
    src: CLIENT_IP,
    dst: `${target}:${row.port}`,
    protocol: row.proto as Protocol,
    length: randInt(40, 60),
    info: `[UDP-SCAN] Probe :${row.port} -> ${row.state}`,
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
    src: ATTACKER_IP,
    dst: gratuitous ? 'ff:ff:ff:ff:ff:ff (broadcast)' : CLIENT_IP,
    protocol: 'ARP' as Protocol,
    length: randInt(42, 60),
    info: gratuitous
      ? `[GRATUITOUS] ARP Reply: ${GATEWAY_IP} is-at 00:1a:2b:${randInt(10, 99)}:ff:ee (spoofed)`
      : `Rerouted via ${ATTACKER_IP} (attacker) — MITM active`,
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
    dst: `${WEB_SERVER}:${HTTP_PORT}`,
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
