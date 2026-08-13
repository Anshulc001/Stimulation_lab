import { describe, expect, it } from 'vitest';
import { ATTACK_SCENARIO_IDS, getScenario, isAttackScenario, SCENARIO_LIST } from './registry';
import { MATCH_PORT, MATCH_SERVER } from '../packetGenerator';

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
        for (const gameActive of [false, true]) {
          for (const t of [0, scenario.autoEndAfterSec ?? 20]) {
            const result = scenario.telemetryTarget(t, waf, gameActive);
            expect(result.cpu).toBeGreaterThanOrEqual(0);
            expect(result.cpu).toBeLessThanOrEqual(100);
            expect(result.ping).toBeGreaterThanOrEqual(0);
            expect(result.tick).toBeGreaterThanOrEqual(0);
            expect(result.tick).toBeLessThanOrEqual(60);
            expect(['optimal', 'degraded', 'critical']).toContain(result.health);
          }
        }
      }
    }
  });

  it('every scenario declares a full classification for the Attack Classification panel', () => {
    for (const scenario of SCENARIO_LIST) {
      const c = scenario.classification;
      expect(c.attack.length).toBeGreaterThan(0);
      expect(c.family.length).toBeGreaterThan(0);
      expect(c.layer.length).toBeGreaterThan(0);
      expect(c.target.length).toBeGreaterThan(0);
      expect(c.primaryImpact.length).toBeGreaterThan(0);
      expect(c.primaryDefense.length).toBeGreaterThan(0);
      expect(c.note.length).toBeGreaterThan(0);
      expect(typeof c.requiresSessionToken).toBe('boolean');
      expect(typeof c.requiresLanAccess).toBe('boolean');
    }
  });

  it('every scenario has a unique classification note (no copy-pasted descriptions)', () => {
    const notes = SCENARIO_LIST.map((s) => s.classification.note);
    expect(new Set(notes).size).toBe(notes.length);
  });

  it('generatePackets returns an array of valid packets for every scenario', () => {
    for (const scenario of SCENARIO_LIST) {
      const packets = scenario.generatePackets(false, 1, false);
      expect(Array.isArray(packets)).toBe(true);
      for (const p of packets) {
        expect(p.src).toBeTruthy();
        expect(p.dst).toBeTruthy();
        expect(p.length).toBeGreaterThan(0);
      }
    }
  });

  it('baseline emits only normal background LAN traffic while the game is stopped', () => {
    const baseline = getScenario('baseline');
    for (let i = 0; i < 25; i++) {
      const packets = baseline.generatePackets(false, 1, false);
      expect(packets.length).toBeGreaterThan(0);
      for (const p of packets) {
        expect(p.malicious).toBe(false);
        // Never a game-tick packet while the server is stopped.
        expect(p.info).not.toContain(`Port=${MATCH_PORT}`);
        expect(p.dst).not.toContain(`${MATCH_SERVER}:${MATCH_PORT}`);
      }
    }
  });

  it('baseline emits game-tick traffic once the game is running', () => {
    const baseline = getScenario('baseline');
    for (let i = 0; i < 10; i++) {
      const packets = baseline.generatePackets(false, 1, true);
      expect(packets.some((p) => p.info.includes(`Port=${MATCH_PORT}`))).toBe(true);
    }
  });

  it('baseline telemetry distinguishes stopped vs running server', () => {
    const baseline = getScenario('baseline');
    const idle = baseline.telemetryTarget(1, false, false);
    expect(idle.playerTarget).toBe(0);
    expect(idle.tick).toBe(0);
    const running = baseline.telemetryTarget(1, false, true);
    expect(running.playerTarget).toBe(92);
    expect(running.tick).toBe(60);
  });

  it('WAF mitigation dampens telemetry for mitigable attack scenarios', () => {
    const attackScenarios = SCENARIO_LIST.filter((s) => s.category === 'attack' && s.mitigable);
    for (const scenario of attackScenarios) {
      const withoutWaf = scenario.telemetryTarget(10, false, true);
      const withWaf = scenario.telemetryTarget(10, true, true);
      expect(withWaf.cpu).toBeLessThanOrEqual(withoutWaf.cpu);
      expect(withWaf.ping).toBeLessThanOrEqual(withoutWaf.ping);
    }
  });
});
