import { lazy } from 'react';
import type { ComponentType } from 'react';
import { TerminalSquare, Radar, Server, Network, SlidersHorizontal, BookOpen, Gamepad2 } from 'lucide-react';

export interface AppDef {
  id: string;
  title: string;
  shortLabel: string;
  icon: typeof TerminalSquare;
  iconColor: string;
  component: ComponentType;
  defaultWidth: number;
  defaultHeight: number;
}

const Terminal = lazy(() => import('../Terminal/Terminal').then((m) => ({ default: m.Terminal })));
const PacketAnalyzer = lazy(() =>
  import('../Wireshark/PacketAnalyzer').then((m) => ({ default: m.PacketAnalyzer }))
);
const TelemetryMonitor = lazy(() =>
  import('../Telemetry/TelemetryMonitor').then((m) => ({ default: m.TelemetryMonitor }))
);
const NetworkTopology = lazy(() =>
  import('../Topology/NetworkTopology').then((m) => ({ default: m.NetworkTopology }))
);
const ScenarioControlApp = lazy(() =>
  import('./ScenarioControlApp').then((m) => ({ default: m.ScenarioControlApp }))
);
const GuideApp = lazy(() => import('../Guide/GuideApp').then((m) => ({ default: m.GuideApp })));
const BgmiApp = lazy(() => import('../Bgmi/BgmiApp').then((m) => ({ default: m.BgmiApp })));

export const APPS: AppDef[] = [
  {
    id: 'terminal',
    title: 'Terminal — root@client-pc',
    shortLabel: 'Terminal',
    icon: TerminalSquare,
    iconColor: '#22c55e',
    component: Terminal,
    defaultWidth: 560,
    defaultHeight: 420,
  },
  {
    id: 'wireshark',
    title: 'Wireshark — Packet Analyzer',
    shortLabel: 'Wireshark',
    icon: Radar,
    iconColor: '#06b6d4',
    component: PacketAnalyzer,
    defaultWidth: 720,
    defaultHeight: 460,
  },
  {
    id: 'telemetry',
    title: 'System Monitor — Match Server',
    shortLabel: 'Sys Monitor',
    icon: Server,
    iconColor: '#06b6d4',
    component: TelemetryMonitor,
    defaultWidth: 480,
    defaultHeight: 520,
  },
  {
    id: 'topology',
    title: 'Network Manager — Topology',
    shortLabel: 'Network',
    icon: Network,
    iconColor: '#22c55e',
    component: NetworkTopology,
    defaultWidth: 640,
    defaultHeight: 460,
  },
  {
    id: 'scenarios',
    title: 'Scenario Control Panel',
    shortLabel: 'Scenarios',
    icon: SlidersHorizontal,
    iconColor: '#facc15',
    component: ScenarioControlApp,
    defaultWidth: 460,
    defaultHeight: 420,
  },
  {
    id: 'guide',
    title: 'CyberLab Guide',
    shortLabel: 'Guide',
    icon: BookOpen,
    iconColor: '#a855f7',
    component: GuideApp,
    defaultWidth: 520,
    defaultHeight: 500,
  },
  {
    id: 'bgmi',
    title: 'BGMI Match Simulator',
    shortLabel: 'BGMI',
    icon: Gamepad2,
    iconColor: '#facc15',
    component: BgmiApp,
    defaultWidth: 480,
    defaultHeight: 560,
  },
];

export function getApp(id: string): AppDef | undefined {
  return APPS.find((a) => a.id === id);
}
