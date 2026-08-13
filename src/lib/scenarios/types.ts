import type { Packet, ScenarioCategory, ScenarioId, ScenarioSeverity, ServerHealth, TopologyEffect } from '../../types';

export interface TelemetryTargetResult {
  cpu: number;
  ping: number;
  tick: number;
  packetLoss: number;
  playerDelta: number;
  health: ServerHealth;
  /**
   * Explicit simulated bandwidth (Mbps) toward/away from the match server.
   * When omitted, the engine falls back to an estimate derived from the last
   * generated packet batch (small packets => tiny values, which understates
   * bandwidth-centric attacks like amplification).
   */
  bandwidthIn?: number;
  bandwidthOut?: number;
  /**
   * Absolute target for the player count when present (e.g. baseline wants
   * 92 during gameplay but 0 when the game server is stopped). When omitted,
   * the engine keeps the delta-based easing used by attack scenarios.
   */
  playerTarget?: number;
}

export interface ScenarioDefinition {
  id: ScenarioId;
  label: string;
  shortLabel: string;
  category: ScenarioCategory;
  /** Display template shown in Guide/help, e.g. "hping3 -S --flood -p <port> <ip>". */
  terminalCommand: string;
  /** Concrete, directly-executable command used by the ScenarioBar button, e.g. "hping3 -S --flood -p 7777 10.0.0.10". */
  runCommand: string;
  aliases: string[];
  description: string;
  /**
   * Educational attack classification shown in the Attack Classification panel.
   * Keeps the attack-path model explicit: DDoS needs a reachable service,
   * session attacks need a separate credential.
   */
  classification: {
    attack: string;
    layer: string;
    family: string;
    requiresSessionToken: boolean;
    requiresLanAccess: boolean;
    target: string;
    primaryImpact: string;
    primaryDefense: string;
    /** Scenario-specific teaching note shown under the Attack Classification panel. */
    note: string;
  };
  /**
   * Optional companion demo shown alongside the scenario in the Guide — e.g.
   * the `sniff --insecure` plaintext-traffic teaching case.
   */
  demoVariant?: {
    label: string;
    command: string;
    description: string;
  };
  severity: ScenarioSeverity;
  topologyEffect: TopologyEffect;
  /** Whether WAF mitigation has any effect on this scenario at all. */
  mitigable: boolean;
  /**
   * Pure function producing telemetry targets given seconds elapsed since the
   * scenario started, whether WAF mitigation is currently active, and whether
   * the game is running (false while the server is stopped).
   */
  telemetryTarget: (elapsedSec: number, waf: boolean, gameActive: boolean) => TelemetryTargetResult;
  /** Called roughly every 100ms to produce this tick's mock packets. */
  generatePackets: (waf: boolean, elapsedSec: number, gameActive: boolean) => Packet[];
  /** Auto-return-to-baseline duration in seconds, if the scenario is self-terminating (e.g. port scan). */
  autoEndAfterSec?: number;
}
