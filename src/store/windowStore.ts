import { create } from 'zustand';

export interface OpenWindow {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  prevRect?: { x: number; y: number; width: number; height: number };
}

interface WindowStoreState {
  windows: OpenWindow[];
  nextZIndex: number;
  bounds: { width: number; height: number };
  setBounds: (width: number, height: number) => void;
  openApp: (opts: { appId: string; title: string; width: number; height: number }) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximize: (id: string, deskWidth: number, deskHeight: number) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, width: number, height: number) => void;
  restoreWindow: (id: string) => void;
}

const SMALL_SCREEN_BREAKPOINT = 700;

let instanceCounter = 0;
let offsetCounter = 0;

function initialBounds() {
  if (typeof window === 'undefined') return { width: 1280, height: 800 };
  return { width: window.innerWidth, height: Math.max(240, window.innerHeight - 70) };
}

export const useWindowStore = create<WindowStoreState>((set, get) => ({
  windows: [],
  nextZIndex: 10,
  bounds: initialBounds(),

  setBounds: (width, height) => set({ bounds: { width, height } }),

  openApp: ({ appId, title, width, height }) => {
    const existing = get().windows.find((w) => w.appId === appId);
    const { width: boundsWidth, height: boundsHeight } = get().bounds;
    const isSmallScreen = boundsWidth < SMALL_SCREEN_BREAKPOINT;

    if (existing) {
      set((s) => ({
        windows: s.windows.map((w) =>
          w.id === existing.id ? { ...w, minimized: false, zIndex: s.nextZIndex } : w
        ),
        nextZIndex: s.nextZIndex + 1,
      }));
      return;
    }

    instanceCounter += 1;
    offsetCounter = (offsetCounter + 1) % 6;
    const offset = offsetCounter * 24;

    const clampedWidth = Math.min(width, Math.max(320, boundsWidth - 24));
    const clampedHeight = Math.min(height, Math.max(240, boundsHeight - 24));

    // Keep the Scenario Control panel reachable: when a new window would land on
    // top of it, nudge it to the right (or below) so its buttons stay clickable.
    let x = Math.min(60 + offset, Math.max(0, boundsWidth - clampedWidth));
    let y = Math.min(50 + offset, Math.max(0, boundsHeight - clampedHeight));
    if (!isSmallScreen && appId !== 'scenarios') {
      const scenario = get().windows.find((w) => w.appId === 'scenarios');
      if (scenario && !scenario.minimized) {
        const overlapX = x < scenario.x + scenario.width && x + clampedWidth > scenario.x;
        const overlapY = y < scenario.y + scenario.height && y + clampedHeight > scenario.y;
        if (overlapX && overlapY) {
          const rightX = scenario.x + scenario.width + 8;
          if (rightX + clampedWidth <= boundsWidth) {
            x = rightX;
          } else {
            const belowY = scenario.y + scenario.height + 8;
            y = Math.min(belowY, Math.max(0, boundsHeight - clampedHeight));
            x = Math.min(60 + offset, Math.max(0, boundsWidth - clampedWidth));
          }
        }
      }
    }

    const newWindow: OpenWindow = isSmallScreen
      ? {
          id: `win-${instanceCounter}`,
          appId,
          title,
          x: 4,
          y: 4,
          width: Math.max(320, boundsWidth - 8),
          height: Math.max(240, boundsHeight - 8),
          zIndex: get().nextZIndex,
          minimized: false,
          maximized: true,
        }
      : {
          id: `win-${instanceCounter}`,
          appId,
          title,
          x,
          y,
          width: clampedWidth,
          height: clampedHeight,
          zIndex: get().nextZIndex,
          minimized: false,
          maximized: false,
        };

    set((s) => ({
      windows: [...s.windows, newWindow],
      nextZIndex: s.nextZIndex + 1,
    }));
  },

  closeWindow: (id) => set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),

  focusWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, zIndex: s.nextZIndex } : w)),
      nextZIndex: s.nextZIndex + 1,
    })),

  minimizeWindow: (id) =>
    set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)) })),

  restoreWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: false, zIndex: s.nextZIndex } : w)),
      nextZIndex: s.nextZIndex + 1,
    })),

  toggleMaximize: (id, deskWidth, deskHeight) =>
    set((s) => ({
      windows: s.windows.map((w) => {
        if (w.id !== id) return w;
        if (w.maximized) {
          const prev = w.prevRect ?? { x: 80, y: 60, width: w.width, height: w.height };
          return { ...w, maximized: false, ...prev };
        }
        return {
          ...w,
          maximized: true,
          prevRect: { x: w.x, y: w.y, width: w.width, height: w.height },
          x: 8,
          y: 8,
          width: Math.max(320, deskWidth - 16),
          height: Math.max(240, deskHeight - 16),
        };
      }),
    })),

  moveWindow: (id, x, y) =>
    set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)) })),

  resizeWindow: (id, width, height) =>
    set((s) => {
      const maxWidth = Math.max(320, s.bounds.width - 8);
      const maxHeight = Math.max(240, s.bounds.height - 8);
      return {
        windows: s.windows.map((w) =>
          w.id === id
            ? { ...w, width: Math.min(width, maxWidth), height: Math.min(height, maxHeight) }
            : w
        ),
      };
    }),
}));
