import { useEffect, useState } from 'react';
import { BatteryMedium, Minus, Plus, RotateCcw, Volume2, Wifi } from 'lucide-react';
import { useWindowStore } from '../../store/windowStore';
import { useUiStore } from '../../store/uiStore';
import { APPS } from './apps';
import { ThemeSwitcher } from '../Shared/ThemeSwitcher';
import { FullscreenToggle } from '../Shared/FullscreenToggle';

function useClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);
  return time;
}

export function TopPanel() {
  const [menuOpen, setMenuOpen] = useState(false);
  const openApp = useWindowStore((s) => s.openApp);
  const time = useClock();
  const fontSize = useUiStore((s) => s.fontSize);
  const increaseFontSize = useUiStore((s) => s.increaseFontSize);
  const decreaseFontSize = useUiStore((s) => s.decreaseFontSize);
  const resetFontSize = useUiStore((s) => s.resetFontSize);

  const launch = (appId: string) => {
    const app = APPS.find((a) => a.id === appId)!;
    openApp({ appId: app.id, title: app.title, width: app.defaultWidth, height: app.defaultHeight });
    setMenuOpen(false);
  };

  return (
    <div className="relative z-[9999] flex h-11 flex-shrink-0 items-center gap-1 border-b border-neon-green/10 bg-[#0a0e14]/80 px-2 text-[11px] text-slate-300 shadow-sm shadow-black/20 backdrop-blur-md sm:h-8">
      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className={`rounded px-2 py-1 font-semibold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-green/60 ${menuOpen ? 'bg-neon-green/20 text-neon-green' : 'hover:bg-white/10'}`}
        >
          Applications
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute left-0 top-full z-50 mt-1 w-56 overflow-hidden rounded border border-slate-700 bg-[#0b1120] py-1 shadow-2xl">
              {APPS.map((app) => (
                <button
                  key={app.id}
                  onClick={() => launch(app.id)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] text-slate-300 transition-all hover:bg-slate-800/70 hover:pl-4 focus-visible:outline-none focus-visible:bg-slate-800/70"
                >
                  <app.icon size={13} style={{ color: app.iconColor }} />
                  {app.shortLabel}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <button className="hidden rounded px-2 py-1 transition-all hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-green/60 sm:inline">Places</button>
      <button className="hidden rounded px-2 py-1 transition-all hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-green/60 sm:inline">System</button>

      <div className="flex-1" />

      <span className="hidden items-center gap-1 rounded px-1.5 py-0.5 text-slate-400 md:flex">
        <Wifi size={12} />
      </span>
      <span className="hidden items-center gap-1 rounded px-1.5 py-0.5 text-slate-400 md:flex">
        <Volume2 size={12} />
      </span>
      <span className="hidden items-center gap-1 rounded px-1.5 py-0.5 text-slate-400 md:flex">
        <BatteryMedium size={12} />
      </span>
      <div className="flex items-center gap-0.5 rounded border border-slate-700 bg-slate-900/40 p-0.5">
        <button
          onClick={decreaseFontSize}
          disabled={fontSize <= 12}
          title="Decrease font size"
          aria-label="Decrease font size"
          className="rounded p-1 text-slate-400 transition-all hover:bg-slate-700/60 hover:text-slate-100 focus-visible:ring-1 focus-visible:ring-neon-green/60 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Minus size={12} />
        </button>
        <span className="min-w-[2.25ch] px-1 text-center text-[10px] font-mono tabular-nums text-slate-300">
          {fontSize}
        </span>
        <button
          onClick={increaseFontSize}
          disabled={fontSize >= 22}
          title="Increase font size"
          aria-label="Increase font size"
          className="rounded p-1 text-slate-400 transition-all hover:bg-slate-700/60 hover:text-slate-100 focus-visible:ring-1 focus-visible:ring-neon-green/60 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Plus size={12} />
        </button>
        <button
          onClick={resetFontSize}
          title="Reset font size"
          aria-label="Reset font size"
          className="rounded p-1 text-slate-400 transition-all hover:bg-slate-700/60 hover:text-slate-100 focus-visible:ring-1 focus-visible:ring-neon-green/60"
        >
          <RotateCcw size={11} />
        </button>
      </div>
      <ThemeSwitcher />
      <FullscreenToggle />
      <span className="whitespace-nowrap rounded px-2 py-1 font-mono text-slate-200">
        <span className="hidden sm:inline">
          {time.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}{' '}
        </span>
        {time.toLocaleTimeString('en-US', { hour12: false })}
      </span>
    </div>
  );
}
