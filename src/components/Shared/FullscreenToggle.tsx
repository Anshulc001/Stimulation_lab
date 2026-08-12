import { useEffect, useState } from 'react';
import { Maximize, Minimize } from 'lucide-react';

export function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggle = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  return (
    <button
      onClick={toggle}
      title={isFullscreen ? 'Exit fullscreen (kiosk mode)' : 'Enter fullscreen (kiosk mode)'}
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      className="flex items-center justify-center rounded border border-slate-700 p-1.5 text-slate-400 transition-all hover:border-slate-500 hover:text-slate-200 hover:shadow-[0_0_10px_color-mix(in_srgb,var(--np-neon-green)_15%,transparent)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-green/60"
    >
      {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
    </button>
  );
}
