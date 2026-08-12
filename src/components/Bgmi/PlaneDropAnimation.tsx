import { Plane } from 'lucide-react';

export function PlaneDropAnimation() {
  return (
    <div className="relative h-24 w-full overflow-hidden">
      <div className="absolute left-0 top-2 w-full animate-plane-fly">
        <Plane size={22} className="rotate-90 text-slate-300" />
      </div>
      <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-gradient-to-b from-transparent via-slate-700/40 to-transparent" />
      <div className="absolute left-1/2 top-2 -translate-x-1/2 animate-parachute-fall text-cyber-cyan">
        <svg width={26} height={30} viewBox="0 0 26 30" fill="none">
          <path d="M2 10 A11 9 0 0 1 24 10" stroke="currentColor" strokeWidth={1.6} />
          <line x1={2} y1={10} x2={11} y2={22} stroke="currentColor" strokeWidth={1} />
          <line x1={24} y1={10} x2={15} y2={22} stroke="currentColor" strokeWidth={1} />
          <line x1={9} y1={9} x2={11} y2={22} stroke="currentColor" strokeWidth={1} />
          <line x1={17} y1={9} x2={15} y2={22} stroke="currentColor" strokeWidth={1} />
          <circle cx={13} cy={24} r={2.4} fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}
