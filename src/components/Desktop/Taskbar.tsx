import { Grid3x3 } from 'lucide-react';
import { useWindowStore } from '../../store/windowStore';
import { getApp } from './apps';

export function Taskbar({ onLaunchMenu }: { onLaunchMenu: () => void }) {
  const windows = useWindowStore((s) => s.windows);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const minimizeWindow = useWindowStore((s) => s.minimizeWindow);
  const restoreWindow = useWindowStore((s) => s.restoreWindow);

  const topZ = Math.max(0, ...windows.map((w) => w.zIndex));

  const handleClick = (id: string, minimized: boolean, zIndex: number) => {
    if (minimized) {
      restoreWindow(id);
    } else if (zIndex === topZ) {
      minimizeWindow(id);
    } else {
      focusWindow(id);
    }
  };

  return (
    <div className="relative z-[9999] flex h-11 flex-shrink-0 items-center gap-1.5 border-t border-black/60 bg-[#0a0e14]/95 px-2 backdrop-blur sm:h-9">
      <button
        onClick={onLaunchMenu}
        className="flex h-9 w-9 items-center justify-center rounded bg-neon-green/15 p-2 text-neon-green transition-colors hover:bg-neon-green/25 sm:h-7 sm:w-7 sm:p-1.5"
        title="Show Applications"
        aria-label="Show Applications"
      >
        <Grid3x3 className="h-5 w-5 sm:h-4 sm:w-4" />
      </button>

      <div className="mx-1 h-5 w-px bg-slate-700" />

      <div className="flex flex-1 items-center gap-1 overflow-x-auto">
        {windows.map((w) => {
          const app = getApp(w.appId);
          if (!app) return null;
          const active = !w.minimized && w.zIndex === topZ;
          return (
            <button
              key={w.id}
              onClick={() => handleClick(w.id, w.minimized, w.zIndex)}
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded transition-colors sm:h-7 sm:w-auto sm:px-2.5 sm:py-1 sm:text-[10.5px] sm:font-medium ${
                active
                  ? 'bg-slate-700/80 text-slate-100'
                  : w.minimized
                    ? 'text-slate-500 hover:bg-slate-800/60'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800/80'
              }`}
            >
              <app.icon className="h-5 w-5 sm:h-3 sm:w-3" style={{ color: app.iconColor }} />
              <span className="hidden max-w-[110px] truncate sm:inline">{app.shortLabel}</span>
            </button>
          );
        })}
      </div>

      <div className="mx-1 hidden h-5 w-px bg-slate-700 sm:block" />
      <div className="hidden items-center gap-1 pr-1 sm:flex">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={`h-2.5 w-2.5 rounded-sm border border-slate-600 ${n === 1 ? 'bg-slate-600' : ''}`} />
        ))}
      </div>
    </div>
  );
}
