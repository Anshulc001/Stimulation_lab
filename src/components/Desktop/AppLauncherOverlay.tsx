import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useWindowStore } from '../../store/windowStore';
import { APPS } from './apps';

export function AppLauncherOverlay({ onClose }: { onClose: () => void }) {
  const openApp = useWindowStore((s) => s.openApp);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      className="absolute inset-0 z-[200] flex flex-col bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div className="flex items-center justify-between border-b border-slate-800/60 bg-[#0b1120]/80 p-3 sm:p-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          Applications
        </h2>
        <button
          onClick={onClose}
          aria-label="Close application launcher"
          className="rounded p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <X size={24} />
        </button>
      </div>
      <div className="flex flex-1 items-start justify-center overflow-y-auto p-4" onClick={(e) => e.stopPropagation()}>
        <div className="grid w-full max-w-md grid-cols-3 gap-4 sm:grid-cols-4">
          {APPS.map((app) => (
            <button
              key={app.id}
              onClick={() => {
                openApp({ appId: app.id, title: app.title, width: app.defaultWidth, height: app.defaultHeight });
                onClose();
              }}
              className="flex flex-col items-center gap-2 rounded-xl p-3 text-center transition-colors hover:bg-white/10 active:scale-95"
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl border sm:h-12 sm:w-12"
                style={{ borderColor: `${app.iconColor}55`, background: `${app.iconColor}1a` }}
              >
                <app.icon className="h-7 w-7 sm:h-5 sm:w-5" style={{ color: app.iconColor }} />
              </div>
              <span className="text-xs text-slate-200 sm:text-[11px]">{app.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
