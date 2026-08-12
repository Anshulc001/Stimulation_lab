import type { Packet, ScenarioCategory, ScenarioId, ScenarioSeverity, ServerHealth, TopologyEffect } from '../../types';

export interface TelemetryTargetResult {
  cpu: number;
  ping: number;
  tick: number;
  packetLoss: number;
  playerDelta: number;
  health: ServerHealth;
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
   * scenario started and whether WAF mitigation is currently active.
   */
  telemetryTarget: (elapsedSec: number, waf: boolean) => TelemetryTargetResult;
  /** Called roughly every 100ms to produce this tick's mock packets. */
  generatePackets: (waf: boolean, elapsedSec: number) => Packet[];
  /** Auto-return-to-baseline duration in seconds, if the scenario is self-terminating (e.g. port scan). */
  autoEndAfterSec?: number;
}
