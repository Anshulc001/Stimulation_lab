import { useEffect, useRef, useState } from 'react';
import { Gamepad2 } from 'lucide-react';

const TIPS = [
  'Tip: Use cover to avoid enemy fire.',
  'Tip: High ping can cause hit-registration delays online.',
  'Tip: A stable connection matters more than a fast GPU in online games.',
  'Tip: Anti-cheat systems flag anomalous packet rates automatically.',
  'Tip: SYN floods overwhelm servers with spoofed connection requests.',
  'Tip: Firewalls and rate-limiting can mitigate live DDoS attacks.',
  'Tip: This entire match is simulated — no real players or servers are involved.',
];

interface LoadingScreenProps {
  onDone: () => void;
  durationMs?: number;
}

export function LoadingScreen({ onDone, durationMs = 1800 }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length));
  const [canSkip, setCanSkip] = useState(false);
  const doneRef = useRef(false);

  // Keep the latest callback/duration in refs so the rAF loop below is only
  // ever started once on mount — an inline `onDone={() => ...}` prop (or any
  // parent re-render, e.g. from live telemetry ticking every 500ms) would
  // otherwise create a *new* function each render, retrigger this effect,
  // and restart the timer from 0% forever without ever finishing.
  const onDoneRef = useRef(onDone);
  const durationRef = useRef(durationMs);
  useEffect(() => {
    onDoneRef.current = onDone;
    durationRef.current = durationMs;
  }, [onDone, durationMs]);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDoneRef.current();
  };

  useEffect(() => {
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const pct = Math.min(100, ((now - start) / durationRef.current) * 100);
      setProgress(pct);
      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        finish();
      }
    };
    raf = requestAnimationFrame(tick);
    // Belt-and-suspenders: guarantee the screen never gets stuck even if the
    // rAF loop is somehow starved (e.g. a throttled background tab).
    const hardTimeout = setTimeout(finish, durationRef.current + 2000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(hardTimeout);
    };
    // Intentionally run once on mount only — see comment above.
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 1600);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setCanSkip(true), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-gradient-to-b from-[#161307] via-[#0c1710] to-[#05070d] p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <Gamepad2 size={48} className="animate-bob text-yellow-400 drop-shadow-[0_0_16px_rgba(250,204,21,0.5)]" />
        </div>
        <h1 className="text-xl font-black tracking-widest text-slate-100">
          BATTLE<span className="text-yellow-400">GROUNDS</span>
        </h1>
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">CyberLab Simulation</p>
      </div>

      <div className="w-56">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-300 transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1.5 text-right font-mono text-[10px] text-slate-500">{Math.round(progress)}%</p>
      </div>

      <p key={tipIndex} className="min-h-[14px] max-w-[260px] animate-fade-in text-[10.5px] text-slate-400">
        {TIPS[tipIndex]}
      </p>

      {canSkip && (
        <button
          onClick={finish}
          className="animate-fade-in text-[10px] font-medium text-slate-500 underline decoration-dotted hover:text-slate-300"
        >
          Skip
        </button>
      )}
    </div>
  );
}
