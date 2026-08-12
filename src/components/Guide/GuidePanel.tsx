import { useEffect } from 'react';
import { BookOpen, X } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { GuideContent } from './GuideContent';

/**
 * Slide-over variant of the guide. Not currently mounted in the Kali desktop
 * shell (the desktop uses `GuideApp` inside a window instead), kept available
 * for non-desktop embeds.
 */
export function GuidePanel() {
  const open = useUiStore((s) => s.guideOpen);
  const setOpen = useUiStore((s) => s.setGuideOpen);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 animate-fade-in" onClick={() => setOpen(false)}>
      <div
        className="flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-slate-800 bg-[#0b1120] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-100">
            <BookOpen size={16} className="text-cyber-cyan" />
            CyberLab Guide
          </h2>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <GuideContent />
      </div>
    </div>
  );
}
