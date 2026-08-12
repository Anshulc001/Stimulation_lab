import { useEffect } from 'react';
import { useSimStore } from '../store/simStore';
import { getScenario } from './scenarios/registry';

/**
 * Central client-side simulation loop. Drives packet generation and telemetry
 * values based on the currently active scenario definition. Everything here
 * is a mock — no real network requests are ever made.
 */
export function useSimulationEngine() {
  useEffect(() => {
    const packetInterval = setInterval(() => {
      const state = useSimStore.getState();
      const scenario = getScenario(state.activeScenario);
      const elapsedSec = (Date.now() - state.scenarioStartedAt) / 1000;
      let packets = scenario.generatePackets(state.wafActive, elapsedSec);
      if (state.blockedIps.length > 0) {
        packets = packets.filter((p) => !state.blockedIps.some((ip) => p.src.includes(ip)));
      }
      if (packets.length > 0) state.pushPackets(packets);

      if (scenario.autoEndAfterSec && elapsedSec >= scenario.autoEndAfterSec) {
        state.setScenario('baseline');
      }
    }, 100);

    return () => clearInterval(packetInterval);
  }, []);

  useEffect(() => {
    const telemetryInterval = setInterval(() => {
      const state = useSimStore.getState();
      const scenario = getScenario(state.activeScenario);
      const elapsedSec = (Date.now() - state.scenarioStartedAt) / 1000;
      const target = scenario.telemetryTarget(elapsedSec, state.wafActive);

      const lerp = (cur: number, tgt: number, speed: number) => cur + (tgt - cur) * speed;
      const jitter = (v: number, amt: number) => v + (Math.random() - 0.5) * amt;

      const isSevere = scenario.severity === 'critical' && !state.wafActive;

      const newCpu = Math.max(0, Math.min(100, lerp(state.cpuLoad, jitter(target.cpu, 3), 0.35)));
      const newPing = Math.max(15, lerp(state.ping, jitter(target.ping, isSevere ? 60 : 4), 0.3));
      const newTick = Math.max(0, Math.min(60, lerp(state.tickRate, target.tick, 0.4)));
      const newLoss = Math.max(0, Math.min(100, lerp(state.packetLoss, jitter(target.packetLoss, 2), 0.3)));
      const newPlayers = Math.max(
        0,
        Math.min(100, state.playerCount + target.playerDelta * 0.5 + (Math.random() - 0.5) * 0.4)
      );

      // Rough bandwidth estimate from the last packet batch's total size.
      // Only used as a fallback when the scenario doesn't declare its own
      // explicit bandwidth target (packet sizes alone understate
      // bandwidth-centric attacks like amplification).
      const recentBytes = state.packets.slice(0, 40).reduce((sum, p) => sum + p.length, 0);
      const mbpsEstimate = (recentBytes * 8) / 1_000_000 / 0.1;
      // Explicit scenario targets are intentionally decoupled from the packet
      // byte counts above — packet sizes are tuned for the analyzer's visuals,
      // while bandwidth targets carry the teaching value (e.g. amplification
      // must read as a bandwidth-saturating attack).
      const tgtIn = target.bandwidthIn ?? mbpsEstimate * 0.7;
      const tgtOut = target.bandwidthOut ?? mbpsEstimate * 0.3;
      const newBandwidthIn = Math.max(0, lerp(state.bandwidthIn, tgtIn, 0.4));
      const newBandwidthOut = Math.max(0, lerp(state.bandwidthOut, tgtOut, 0.4));

      state.setTelemetry({
        cpuLoad: newCpu,
        ping: newPing,
        tickRate: newTick,
        serverHealth: target.health,
        packetLoss: newLoss,
        playerCount: newPlayers,
        bandwidthIn: newBandwidthIn,
        bandwidthOut: newBandwidthOut,
      });
      state.pushTelemetryPoint();
    }, 500);

    return () => clearInterval(telemetryInterval);
  }, []);
}
