import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, ShieldCheck, Wifi, Zap } from 'lucide-react';
import { useWindowStore } from '../../store/windowStore';
import { useSimStore } from '../../store/simStore';
import { getScenario } from '../../lib/scenarios/registry';
import { APPS } from './apps';
import { DesktopIcon } from './DesktopIcon';
import { Window } from './Window';
import { TopPanel } from './TopPanel';
import { Taskbar } from './Taskbar';
import { AppLauncherOverlay } from './AppLauncherOverlay';
import { Wallpaper } from './Wallpaper';
import { OnboardingTour } from '../Onboarding/OnboardingTour';

const categoryMeta: Record<string, { className: string; icon: typeof ShieldCheck }> = {
  idle: { className: 'border-neon-green/40 bg-neon-green/10 text-neon-green', icon: ShieldCheck },
  recon: { className: 'border-cyber-cyan/40 bg-cyber-cyan/10 text-cyber-cyan', icon: Wifi },
  attack: { className: 'border-alert-red/50 bg-alert-red/10 text-alert-red animate-flash-border', icon: AlertTriangle },
  defense: { className: 'border-yellow-400/40 bg-yellow-400/10 text-yellow-400', icon: ShieldCheck },
};

export function Desktop() {
  const desktopRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ width: 1280, height: 800 });
  const [launcherOpen, setLauncherOpen] = useState(false);
  const windows = useWindowStore((s) => s.windows);
  const openApp = useWindowStore((s) => s.openApp);
  const setStoreBounds = useWindowStore((s) => s.setBounds);
  const activeScenario = useSimStore((s) => s.activeScenario);
  const scenario = getScenario(activeScenario);
  const meta = categoryMeta[scenario.category];
  const MetaIcon = meta.icon;

  // Launch a friendly default layout after the very first real size measurement.
  const launchedDefaults = useRef(false);
  const launchDefaults = useCallback(() => {
    if (launchedDefaults.current) return;
    launchedDefaults.current = true;
    const scenarios = APPS.find((a) => a.id === 'scenarios')!;
    const terminal = APPS.find((a) => a.id === 'terminal')!;
    openApp({ appId: scenarios.id, title: scenarios.title, width: scenarios.defaultWidth, height: scenarios.defaultHeight });
    openApp({ appId: terminal.id, title: terminal.title, width: terminal.defaultWidth, height: terminal.defaultHeight });
  }, [openApp]);

  useEffect(() => {
    const el = desktopRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const next = { width: entry.contentRect.width, height: entry.contentRect.height };
        setBounds(next);
        setStoreBounds(next.width, next.height);
        launchDefaults();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [launchDefaults, setStoreBounds]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden text-slate-200">
      <TopPanel />

      <div ref={desktopRef} className="relative flex-1 overflow-hidden bg-[#05070a]">
        <Wallpaper />
        <div className="pointer-events-none absolute right-3 top-3 z-30 flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 rounded border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${meta.className}`}
          >
            <MetaIcon size={12} />
            {scenario.shortLabel}
          </span>
        </div>

        <div className="pointer-events-none absolute left-3 top-3 z-30 flex items-center gap-2 opacity-80">
          <div className="flex h-6 w-6 items-center justify-center rounded border border-neon-green/30 bg-neon-green/10">
            <Zap className="text-neon-green" size={13} />
          </div>
          <span className="text-[11px] font-bold text-slate-200" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
            Cyber<span className="text-neon-green">Lab</span> OS
          </span>
        </div>

        {/* Desktop icons - hidden on small screens; use the launcher/taskbar instead */}
        <div className="absolute left-2 top-14 z-20 hidden max-h-[calc(100%-4rem)] flex-col flex-wrap gap-1 sm:flex">
          {APPS.map((app) => (
            <DesktopIcon
              key={app.id}
              label={app.shortLabel}
              icon={
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg border"
                  style={{ borderColor: `${app.iconColor}55`, background: `${app.iconColor}1f` }}
                >
                  <app.icon size={20} style={{ color: app.iconColor }} />
                </div>
              }
              onOpen={() =>
                openApp({ appId: app.id, title: app.title, width: app.defaultWidth, height: app.defaultHeight })
              }
            />
          ))}
        </div>

        {/* Windows */}
        {windows.map((w) => {
          const appDef = APPS.find((a) => a.id === w.appId);
          if (!appDef) return null;
          return <Window key={w.id} win={w} appDef={appDef} boundsWidth={bounds.width} boundsHeight={bounds.height} />;
        })}

        {launcherOpen && <AppLauncherOverlay onClose={() => setLauncherOpen(false)} />}
      </div>

      <Taskbar onLaunchMenu={() => setLauncherOpen((o) => !o)} />
      <OnboardingTour />
    </div>
  );
}
