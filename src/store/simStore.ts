import { create } from 'zustand';
import type {
  Incident,
  Packet,
  ScenarioId,
  SecurityEvent,
  ServerHealth,
  TelemetryPoint,
  TerminalLine,
  Theme,
} from '../types';
import { getScenario } from '../lib/scenarios/registry';
import { ATTACKER_IP, CLIENT_IP, GATEWAY_IP, MATCH_PORT, MATCH_SERVER } from '../lib/packetGenerator';

let eventCounter = 0;
let terminalLineCounter = 0;
let telemetryCounter = 0;
let incidentCounter = 0;

const MAX_PACKETS = 400;
const MAX_TELEMETRY = 60;
const MAX_SECURITY_EVENTS = 50;
const MAX_INCIDENTS = 30;

function nowStamp() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

export interface SimState {
  activeScenario: ScenarioId;
  scenarioStartedAt: number;
  serverHealth: ServerHealth;
  cpuLoad: number;
  ping: number;
  tickRate: number;
  playerCount: number;
  packetLoss: number;
  bandwidthIn: number;
  bandwidthOut: number;
  hwidBanned: boolean;
  wafActive: boolean;
  /** Whether the game client is connected to / playing on the match server.
   *  When false, the default state, Wireshark shows normal background LAN
   *  traffic and telemetry reads as "server idle" — no game packets flow. */
  gameActive: boolean;
  blockedIps: string[];
  theme: Theme;
  packets: Packet[];
  securityEvents: SecurityEvent[];
  incidents: Incident[];
  telemetry: TelemetryPoint[];
  terminalLines: TerminalLine[];

  setScenario: (id: ScenarioId) => void;
  setTelemetry: (
    partial: Partial<
      Pick<
        SimState,
        'cpuLoad' | 'ping' | 'tickRate' | 'serverHealth' | 'playerCount' | 'packetLoss' | 'bandwidthIn' | 'bandwidthOut'
      >
    >
  ) => void;
  pushPacket: (p: Packet) => void;
  pushPackets: (p: Packet[]) => void;
  pushTelemetryPoint: () => void;
  pushSecurityEvent: (level: SecurityEvent['level'], message: string) => void;
  pushIncident: (severity: Incident['severity'], label: string) => void;
  pushTerminalLine: (type: TerminalLine['type'], text: string) => void;
  clearTerminal: () => void;
  setHwidBanned: (b: boolean) => void;
  setWafActive: (b: boolean) => void;
  setGameActive: (b: boolean) => void;
  blockIp: (ip: string) => void;
  setTheme: (t: Theme) => void;
  resetAll: () => void;
}

const INITIAL_TERMINAL_LINES: TerminalLine[] = [
  { id: -9, type: 'success', text: 'root@kali:~ (simulated attacker shell — no real traffic is sent)' },
  { id: -8, type: 'output', text: '' },
  { id: -7, type: 'success', text: 'CyberLab Terminal v1.0.0 — Attacker Console' },
  { id: -6, type: 'output', text: `Attacker IP : ${ATTACKER_IP}` },
  { id: -5, type: 'output', text: `Client IP   : ${CLIENT_IP}` },
  { id: -4, type: 'output', text: `Gateway     : ${GATEWAY_IP}` },
  { id: -3, type: 'output', text: `Game Server : ${MATCH_SERVER}:${MATCH_PORT}/UDP` },
  { id: -2, type: 'output', text: '' },
  { id: -1, type: 'output', text: "Type 'help' to list available commands, 'guide' for the full walkthrough, or use the Scenario buttons above." },
];

function baseState() {
  return {
    activeScenario: 'baseline' as ScenarioId,
    scenarioStartedAt: Date.now(),
    serverHealth: 'optimal' as ServerHealth,
    // The game server starts stopped, so initial metrics read as idle —
    // no players, no ticks — until the game is started.
    cpuLoad: 6,
    ping: 15,
    tickRate: 0,
    playerCount: 0,
    packetLoss: 0,
    bandwidthIn: 0.1,
    bandwidthOut: 0.05,
    hwidBanned: false,
    wafActive: false,
    gameActive: false,
    blockedIps: [] as string[],
    packets: [] as Packet[],
    securityEvents: [] as SecurityEvent[],
    incidents: [] as Incident[],
    telemetry: [] as TelemetryPoint[],
  };
}

/** Factory so tests can create isolated store instances instead of sharing global state. */
export function createSimStore() {
  return create<SimState>((set, get) => ({
    ...baseState(),
    theme: 'cyberpunk',
    terminalLines: INITIAL_TERMINAL_LINES,

    setScenario: (id) => {
      const def = getScenario(id);
      const severity =
        def.category === 'attack' ? 'critical' : def.category === 'defense' ? 'success' : 'info';
      get().pushIncident(severity, `Scenario changed: ${def.label}`);
      set({
        activeScenario: id,
        scenarioStartedAt: Date.now(),
        // Recon / attack / defense scenarios all demo a live match server, so
        // launching one implies the game is running. Only the idle baseline
        // leaves the server stopped.
        gameActive: def.category !== 'idle' ? true : get().gameActive,
      });
    },

    setTelemetry: (partial) => set(partial),

    pushPacket: (p) =>
      set((s) => ({
        packets: [p, ...s.packets].slice(0, MAX_PACKETS),
      })),

    pushPackets: (ps) =>
      set((s) => ({
        packets: [...[...ps].reverse(), ...s.packets].slice(0, MAX_PACKETS),
      })),

    pushTelemetryPoint: () =>
      set((s) => {
        telemetryCounter += 1;
        const point: TelemetryPoint = {
          t: telemetryCounter,
          ping: s.ping,
          cpu: s.cpuLoad,
          tick: s.tickRate,
          playerCount: s.playerCount,
          packetLoss: s.packetLoss,
          bandwidthIn: s.bandwidthIn,
          bandwidthOut: s.bandwidthOut,
        };
        return { telemetry: [...s.telemetry, point].slice(-MAX_TELEMETRY) };
      }),

    pushSecurityEvent: (level, message) =>
      set((s) => {
        eventCounter += 1;
        const event: SecurityEvent = {
          id: eventCounter,
          timestamp: nowStamp(),
          level,
          message,
        };
        return { securityEvents: [event, ...s.securityEvents].slice(0, MAX_SECURITY_EVENTS) };
      }),

    pushIncident: (severity, label) =>
      set((s) => {
        incidentCounter += 1;
        const incident: Incident = {
          id: incidentCounter,
          timestamp: nowStamp(),
          label,
          severity,
        };
        return { incidents: [incident, ...s.incidents].slice(0, MAX_INCIDENTS) };
      }),

    pushTerminalLine: (type, text) =>
      set((s) => {
        terminalLineCounter += 1;
        const line: TerminalLine = { id: terminalLineCounter, type, text };
        return { terminalLines: [...s.terminalLines, line] };
      }),

    clearTerminal: () => set({ terminalLines: [] }),

    setHwidBanned: (b) => {
      if (b) get().pushIncident('success', 'HWID Ban Enforced');
      set({ hwidBanned: b });
    },

    setWafActive: (b) => {
      get().pushIncident(b ? 'success' : 'info', `WAF Mitigation ${b ? 'Enabled' : 'Disabled'}`);
      set({ wafActive: b });
    },

    setGameActive: (b) => {
      get().pushIncident(b ? 'success' : 'info', `Game Server ${b ? 'Started' : 'Stopped'}`);
      set({ gameActive: b });
    },

    blockIp: (ip) =>
      set((s) => {
        if (s.blockedIps.includes(ip)) return s;
        get().pushIncident('success', `Manual Firewall Rule: DROP ${ip}`);
        return { blockedIps: [...s.blockedIps, ip] };
      }),

    setTheme: (t) => set({ theme: t }),

    resetAll: () =>
      set((s) => ({
        ...baseState(),
        theme: s.theme,
        terminalLines: s.terminalLines,
      })),
  }));
}

export const useSimStore = createSimStore();
