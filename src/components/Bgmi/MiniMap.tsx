import { useEffect, useState } from 'react';

interface MiniMapProps {
  ping: number;
  playersAlive: number;
}

interface Dot {
  id: number;
  baseX: number;
  baseY: number;
  team: 'self' | 'squad' | 'enemy';
}

const DOTS: Dot[] = [
  { id: 0, baseX: 50, baseY: 50, team: 'self' },
  { id: 1, baseX: 44, baseY: 46, team: 'squad' },
  { id: 2, baseX: 56, baseY: 44, team: 'squad' },
  { id: 3, baseX: 47, baseY: 58, team: 'squad' },
  { id: 4, baseX: 20, baseY: 30, team: 'enemy' },
  { id: 5, baseX: 78, baseY: 22, team: 'enemy' },
  { id: 6, baseX: 70, baseY: 72, team: 'enemy' },
  { id: 7, baseX: 25, baseY: 75, team: 'enemy' },
];

const TEAM_COLOR: Record<Dot['team'], string> = {
  self: '#22c55e',
  squad: '#06b6d4',
  enemy: '#ef4444',
};

export function MiniMap({ ping, playersAlive }: MiniMapProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(iv);
  }, []);

  // Slowly shrink the safe zone, looping, purely for visual flavor — derived
  // directly from `tick` at render time instead of via a second state+effect
  // (which would otherwise double the re-renders on every 250ms tick).
  const zoneRadius = 46 - ((tick % 120) / 120) * 30;

  // Rubber-banding: higher ping = bigger random jitter on non-self dots.
  const jitterAmount = Math.min(6, ping / 60);

  return (
    <div className="relative h-full w-full overflow-hidden rounded border border-slate-700/60 bg-[#0c1710]">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <rect x={0} y={0} width={100} height={100} fill="#0f2016" />
        <path d="M10,20 L35,10 L60,18 L90,12 L92,40 L70,55 L80,85 L45,92 L15,70 Z" fill="#16301f" stroke="#1f3d28" strokeWidth={0.6} />
        <circle cx={30} cy={35} r={5} fill="#1c3624" />
        <circle cx={68} cy={60} r={6} fill="#1c3624" />
        <circle cx={50} cy={20} r={4} fill="#1c3624" />

        {/* shrinking safe zone */}
        <circle cx={50} cy={50} r={zoneRadius} fill="none" stroke="#3b82f6" strokeWidth={0.8} opacity={0.7} />
        <circle cx={50} cy={50} r={zoneRadius} fill="#3b82f6" opacity={0.04} />

        {DOTS.map((d) => {
          const jitterX = d.team === 'self' ? 0 : (Math.sin(tick * 1.3 + d.id) * jitterAmount) / 4;
          const jitterY = d.team === 'self' ? 0 : (Math.cos(tick * 1.1 + d.id * 2) * jitterAmount) / 4;
          return (
            <circle
              key={d.id}
              cx={d.baseX + jitterX}
              cy={d.baseY + jitterY}
              r={d.team === 'self' ? 2.2 : 1.6}
              fill={TEAM_COLOR[d.team]}
              stroke="#05070a"
              strokeWidth={0.4}
            />
          );
        })}
      </svg>
      <div className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-semibold text-slate-300">
        {playersAlive} alive
      </div>
    </div>
  );
}
