import { describe, expect, it } from 'vitest';
import { createSimStore } from './simStore';

describe('createSimStore', () => {
  it('creates isolated store instances that do not share state', () => {
    const storeA = createSimStore();
    const storeB = createSimStore();

    storeA.getState().setScenario('synflood');
    expect(storeA.getState().activeScenario).toBe('synflood');
    expect(storeB.getState().activeScenario).toBe('baseline');
  });

  it('resetAll restores baseline metrics but preserves theme', () => {
    const store = createSimStore();
    store.getState().setTheme('amber');
    store.getState().setScenario('synflood');
    store.getState().setHwidBanned(true);

    store.getState().resetAll();

    const state = store.getState();
    expect(state.activeScenario).toBe('baseline');
    expect(state.hwidBanned).toBe(false);
    expect(state.theme).toBe('amber');
    expect(state.gameActive).toBe(false);
  });

  it('the game server starts stopped by default', () => {
    const store = createSimStore();
    expect(store.getState().gameActive).toBe(false);
  });

  it('setGameActive toggles the game server state', () => {
    const store = createSimStore();
    store.getState().setGameActive(true);
    expect(store.getState().gameActive).toBe(true);
    store.getState().setGameActive(false);
    expect(store.getState().gameActive).toBe(false);
  });

  it('launching a non-idle scenario implies the game is running', () => {
    const store = createSimStore();
    store.getState().setScenario('synflood');
    expect(store.getState().gameActive).toBe(true);
    // Returning to the idle baseline does not start the game.
    store.getState().setScenario('baseline');
    expect(store.getState().gameActive).toBe(true);
  });

  it('setHwidBanned(true) logs a success incident', () => {
    const store = createSimStore();
    store.getState().setHwidBanned(true);
    expect(store.getState().incidents.some((i) => i.label.includes('HWID Ban Enforced'))).toBe(true);
  });

  it('blockIp is idempotent and only logs an incident once per ip', () => {
    const store = createSimStore();
    store.getState().blockIp('45.33.12.201');
    store.getState().blockIp('45.33.12.201');
    expect(store.getState().blockedIps).toEqual(['45.33.12.201']);
    expect(store.getState().incidents.filter((i) => i.label.includes('45.33.12.201')).length).toBe(1);
  });
});
