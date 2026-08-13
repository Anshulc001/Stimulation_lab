import { useEffect, useState, type ReactNode } from 'react';
import { Monitor, Smartphone } from 'lucide-react';

/**
 * Blocks the app on phone-sized viewports (< 768px wide) and shows a
 * "desktop required" message instead. Because it only renders `children`
 * on desktop viewports, the simulation engine and desktop UI never mount
 * (or run) on mobile. Resizing/rotating into a desktop width switches
 * back live, and a small "continue anyway" bypass exists for testing.
 */
const MOBILE_QUERY = '(max-width: 767px)';

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_QUERY).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}

function DesktopOnlyMessage({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="bg-grid flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-[#05070d] p-6 text-slate-200">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-neon-green/40 bg-neon-green/10 text-neon-green shadow-[0_0_30px_rgba(34,197,94,0.25)]">
            <Monitor size={30} />
          </div>
        </div>

        <h1 className="mb-3 text-center text-xl font-bold text-slate-100">
          This experience needs a <span className="text-neon-green">bigger screen</span>
        </h1>

        <p className="mb-2 text-center text-sm leading-relaxed text-slate-400">
          CyberLab is a desktop-only network simulation lab. Open it on a PC or laptop to explore the full
          experience.
        </p>
        <p className="mb-8 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
          <Smartphone size={13} className="text-slate-600" />
          Keyboard &amp; mouse required for the terminal, packet analyzer, and network topology.
        </p>

        <button
          type="button"
          onClick={onContinue}
          className="mx-auto block cursor-pointer rounded border border-slate-700 px-4 py-2 text-xs text-slate-500 transition-colors hover:border-neon-green/40 hover:text-neon-green"
        >
          Continue anyway (not recommended)
        </button>
      </div>
    </div>
  );
}

export function DesktopOnlyGate({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [bypassed, setBypassed] = useState(false);

  // Lock body scrolling while the blocker is showing so mobile visitors
  // can't scroll around behind it.
  useEffect(() => {
    if (isMobile && !bypassed) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isMobile, bypassed]);

  if (isMobile && !bypassed) {
    return <DesktopOnlyMessage onContinue={() => setBypassed(true)} />;
  }

  return <>{children}</>;
}
