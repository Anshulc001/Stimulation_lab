import { describe, expect, it } from 'vitest';
import { ATTACK_SCENARIO_IDS, isAttackScenario, SCENARIO_LIST } from './registry';

describe('scenario registry', () => {
  it('contains all 8 expected scenarios', () => {
    const ids = SCENARIO_LIST.map((s) => s.id).sort();
    expect(ids).toEqual(
      ['amplification', 'arpspoof', 'baseline', 'portscan', 'recovering', 'slowloris', 'sniffing', 'synflood'].sort()
    );
  });

  it('every attack-category scenario is reported by isAttackScenario', () => {
    for (const id of ATTACK_SCENARIO_IDS) {
      expect(isAttackScenario(id)).toBe(true);
    }
    expect(isAttackScenario('baseline')).toBe(false);
    expect(isAttackScenario('recovering')).toBe(false);
  });

  it('telemetryTarget stays within sane bounds at t=0 and at ramp-end for every scenario', () => {
    for (const scenario of SCENARIO_LIST) {
      for (const waf of [false, true]) {
        for (const t of [0, scenario.autoEndAfterSec ?? 20]) {
          const result = scenario.telemetryTarget(t, waf);
          expect(result.cpu).toBeGreaterThanOrEqual(0);
          expect(result.cpu).toBeLessThanOrEqual(100);
          expect(result.ping).toBeGreaterThanOrEqual(0);
          expect(result.tick).toBeGreaterThanOrEqual(0);
          expect(result.tick).toBeLessThanOrEqual(60);
          expect(['optimal', 'degraded', 'critical']).toContain(result.health);
        }
      }
    }
  });

  it('generatePackets returns an array of valid packets for every scenario', () => {
    for (const scenario of SCENARIO_LIST) {
      const packets = scenario.generatePackets(false, 1);
      expect(Array.isArray(packets)).toBe(true);
      for (const p of packets) {
        expect(p.src).toBeTruthy();
        expect(p.dst).toBeTruthy();
        expect(p.length).toBeGreaterThan(0);
      }
    }
  });

  it('WAF mitigation dampens telemetry for mitigable attack scenarios', () => {
    const attackScenarios = SCENARIO_LIST.filter((s) => s.category === 'attack' && s.mitigable);
    for (const scenario of attackScenarios) {
      const withoutWaf = scenario.telemetryTarget(10, false);
      const withWaf = scenario.telemetryTarget(10, true);
      expect(withWaf.cpu).toBeLessThanOrEqual(withoutWaf.cpu);
      expect(withWaf.ping).toBeLessThanOrEqual(withoutWaf.ping);
    }
  });
});
