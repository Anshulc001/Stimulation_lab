export type ScenarioId =
  | 'baseline'
  | 'sniffing'
  | 'portscan'
  | 'arpspoof'
  | 'synflood'
  | 'amplification'
  | 'slowloris'
  | 'recovering';

export type ScenarioCategory = 'idle' | 'recon' | 'attack' | 'defense';

export type ScenarioSeverity = 'none' | 'recon' | 'moderate' | 'critical';

export type TopologyEffect =
  | 'none'
  | 'recon-scan'
  | 'mitm-reroute'
  | 'flood-pulse'
  | 'amplify-burst'
  | 'slow-drip';

export type ServerHealth = 'optimal' | 'degraded' | 'critical';

export type Protocol = 'UDP' | 'TCP' | 'ICMP' | 'ARP';

export interface Packet {
  id: number;
  no: number;
  time: string;
  src: string;
  dst: string;
  protocol: Protocol;
  length: number;
  info: string;
  malicious: boolean;
  hex: string;
  ascii: string;
}

export interface SecurityEvent {
  id: number;
  timestamp: string;
  level: 'info' | 'warning' | 'critical' | 'success';
  message: string;
}

export interface Incident {
  id: number;
  timestamp: string;
  label: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
}

export interface TelemetryPoint {
  t: number;
  ping: number;
  cpu: number;
  tick: number;
  playerCount: number;
  packetLoss: number;
  bandwidthIn: number;
  bandwidthOut: number;
}

export interface TerminalLine {
  id: number;
  type: 'input' | 'output' | 'error' | 'success';
  text: string;
}

export interface ThreatLevel {
  health: ServerHealth;
  cpu: number;
  ping: number;
  tick: number;
  packetLoss: number;
  playerDelta: number;
}

export type Theme = 'cyberpunk' | 'neon-purple' | 'amber';
