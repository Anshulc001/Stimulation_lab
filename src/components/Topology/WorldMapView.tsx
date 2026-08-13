import { useSimStore } from '../../store/simStore';
import { isAttackScenario } from '../../lib/scenarios/registry';

// Simplified, stylized continent silhouettes (not geographically precise) —
// hand-drawn directly as SVG paths so no external map tiles/GeoJSON are ever
// fetched. This keeps the "no real network requests" guarantee intact.
const CONTINENTS = [
  'M60,90 Q90,60 140,70 Q170,90 160,130 Q150,170 110,180 Q70,170 55,130 Z', // N. America
  'M140,190 Q160,220 150,260 Q140,300 120,290 Q105,250 115,210 Z', // S. America
  'M330,80 Q370,60 400,80 Q410,110 390,120 Q360,115 340,105 Z', // Europe
  'M340,130 Q390,120 420,160 Q430,210 400,250 Q370,260 350,220 Q335,175 340,130 Z', // Africa
  'M430,70 Q520,60 560,100 Q540,150 480,150 Q440,130 430,70 Z', // Asia
  'M520,240 Q560,230 580,255 Q560,275 525,265 Z', // Australia
];

const MARKERS = [
  { id: 'client', x: 470, y: 110, label: 'Player Client', sub: 'Asia-Southeast', color: '#22c55e' },
  { id: 'lobby', x: 355, y: 95, label: 'Web / API Server', sub: 'Simulated cloud', color: '#06b6d4' },
  { id: 'match', x: 110, y: 130, label: 'Match Server', sub: 'US-East', color: '#06b6d4' },
];

const BOTNET_MARKERS = [
  { x: 150, y: 220, label: 'BR' },
  { x: 380, y: 200, label: 'NG' },
  { x: 500, y: 200, label: 'AU' },
  { x: 400, y: 90, label: 'RU' },
  { x: 200, y: 100, label: 'CA' },
  { x: 490, y: 260, label: 'ID' },
];

export function WorldMapView() {
  const activeScenario = useSimStore((s) => s.activeScenario);
  const gameActive = useSimStore((s) => s.gameActive);
  const isAttack = isAttackScenario(activeScenario);
  const match = MARKERS.find((m) => m.id === 'match')!;

  return (
    <svg viewBox="0 0 620 320" className="h-full w-full">
      <rect x={0} y={0} width={620} height={320} fill="#070b16" rx={8} />
      {CONTINENTS.map((d, i) => (
        <path key={i} d={d} fill="#101a2c" stroke="#1e293b" strokeWidth={1} />
      ))}

      {/* control link */}
      <line x1={MARKERS[1].x} y1={MARKERS[1].y} x2={match.x} y2={match.y} stroke="#334155" strokeDasharray="3 4" strokeWidth={1} />
      {gameActive && (
        <line x1={MARKERS[0].x} y1={MARKERS[0].y} x2={match.x} y2={match.y} stroke={isAttack ? '#7f1d1d' : '#1e293b'} strokeWidth={1.5} opacity={isAttack ? 0.4 : 1} />
      )}

      {isAttack &&
        BOTNET_MARKERS.map((b, i) => {
          const pathId = `world-bot-${i}`;
          return (
            <g key={i}>
              <path id={pathId} d={`M ${b.x},${b.y} L ${match.x},${match.y}`} fill="none" stroke="none" />
              <line x1={b.x} y1={b.y} x2={match.x} y2={match.y} stroke="#ef4444" strokeWidth={1} opacity={0.25} />
              <circle r={2.5} fill="#ef4444">
                <animateMotion dur="0.8s" begin={`${i * 0.1}s`} repeatCount="indefinite">
                  <mpath href={`#${pathId}`} />
                </animateMotion>
              </circle>
              <circle cx={b.x} cy={b.y} r={4} fill="#ef4444" className="animate-pulse-glow" />
            </g>
          );
        })}

      {MARKERS.map((m) => (
        <g key={m.id} transform={`translate(${m.x}, ${m.y})`}>
          <circle r={7} fill="#0b1120" stroke={m.color} strokeWidth={2} />
          <circle r={2.5} fill={m.color} />
          <text x={0} y={-12} textAnchor="middle" fill="#e2e8f0" fontSize={9} fontWeight={600}>
            {m.label}
          </text>
          <text x={0} y={18} textAnchor="middle" fill="#64748b" fontSize={7.5}>
            {m.sub}
          </text>
        </g>
      ))}

      <text x={10} y={310} fill="#475569" fontSize={8}>
        Simplified illustrative map — not geographically precise. No external map data is loaded.
      </text>
    </svg>
  );
}
