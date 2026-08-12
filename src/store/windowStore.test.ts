import { beforeEach, describe, expect, it } from 'vitest';
import { useWindowStore } from './windowStore';

describe('windowStore', () => {
  beforeEach(() => {
    useWindowStore.setState({ windows: [], nextZIndex: 10 });
  });

  it('opens a new window for an app', () => {
    useWindowStore.getState().openApp({ appId: 'terminal', title: 'Terminal', width: 500, height: 400 });
    const windows = useWindowStore.getState().windows;
    expect(windows).toHaveLength(1);
    expect(windows[0].appId).toBe('terminal');
    expect(windows[0].minimized).toBe(false);
  });

  it('focuses (does not duplicate) an already-open app', () => {
    const { openApp } = useWindowStore.getState();
    openApp({ appId: 'terminal', title: 'Terminal', width: 500, height: 400 });
    openApp({ appId: 'terminal', title: 'Terminal', width: 500, height: 400 });
    expect(useWindowStore.getState().windows).toHaveLength(1);
  });

  it('minimize then restore toggles the minimized flag', () => {
    const { openApp, minimizeWindow, restoreWindow } = useWindowStore.getState();
    openApp({ appId: 'terminal', title: 'Terminal', width: 500, height: 400 });
    const id = useWindowStore.getState().windows[0].id;
    minimizeWindow(id);
    expect(useWindowStore.getState().windows[0].minimized).toBe(true);
    restoreWindow(id);
    expect(useWindowStore.getState().windows[0].minimized).toBe(false);
  });

  it('toggleMaximize expands then restores to the previous rect', () => {
    const { openApp, toggleMaximize } = useWindowStore.getState();
    openApp({ appId: 'terminal', title: 'Terminal', width: 500, height: 400 });
    const id = useWindowStore.getState().windows[0].id;
    const original = useWindowStore.getState().windows[0];

    toggleMaximize(id, 1280, 800);
    const maximized = useWindowStore.getState().windows[0];
    expect(maximized.maximized).toBe(true);
    expect(maximized.width).toBe(1264);

    toggleMaximize(id, 1280, 800);
    const restored = useWindowStore.getState().windows[0];
    expect(restored.maximized).toBe(false);
    expect(restored.width).toBe(original.width);
  });

  it('closeWindow removes the window entirely', () => {
    const { openApp, closeWindow } = useWindowStore.getState();
    openApp({ appId: 'terminal', title: 'Terminal', width: 500, height: 400 });
    const id = useWindowStore.getState().windows[0].id;
    closeWindow(id);
    expect(useWindowStore.getState().windows).toHaveLength(0);
  });
});
