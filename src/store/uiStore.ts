import { create } from 'zustand';

interface UiState {
  guideOpen: boolean;
  setGuideOpen: (open: boolean) => void;
  topologyView: 'abstract' | 'world';
  setTopologyView: (v: 'abstract' | 'world') => void;
  telemetryTab: 'overview' | 'extended' | 'incidents';
  setTelemetryTab: (t: 'overview' | 'extended' | 'incidents') => void;
  fontSize: number;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
}

const MIN_FONT = 12;
const MAX_FONT = 22;
const DEFAULT_FONT = 16;

export const useUiStore = create<UiState>((set) => ({
  guideOpen: false,
  setGuideOpen: (open) => set({ guideOpen: open }),
  topologyView: 'abstract',
  setTopologyView: (v) => set({ topologyView: v }),
  telemetryTab: 'overview',
  setTelemetryTab: (t) => set({ telemetryTab: t }),
  fontSize: DEFAULT_FONT,
  increaseFontSize: () => set((s) => ({ fontSize: Math.min(MAX_FONT, s.fontSize + 1) })),
  decreaseFontSize: () => set((s) => ({ fontSize: Math.max(MIN_FONT, s.fontSize - 1) })),
  resetFontSize: () => set({ fontSize: DEFAULT_FONT }),
}));
