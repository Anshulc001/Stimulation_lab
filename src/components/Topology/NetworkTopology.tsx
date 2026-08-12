import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Globe2, Map as MapIcon, Network, Laptop, Server, ServerCog, Shield, Skull } from 'lucide-react';
import { useSimStore } from '../../store/simStore';
import { getScenario, isAttackScenario } from '../../lib/scenarios/registry';
import { PaneHeader } from '../Shared/PaneHeader';
import { NodeDetailPanel, type TopologyNodeInfo } from './NodeDetailPanel';
import { WorldMapView } from './WorldMapView';
import { useUiStore } from '../../store/uiStore';

interface NodeDef {
  id: string;
  x: number;
  y: number;
  label: string;
  sub: string;
  icon: ReactNode;
  color: string;
  role: string;
  region: string;
}

const NODES: NodeDef[] = [
  { id: 'client', x: 60, y: 200, label: 'Player Client', sub: '192.168.1.45', icon: <Laptop size={18} />, color: '#22c55e', role: 'Game client', region: 'Local subnet' },
  { id: 'lobby', x: 280, y: 60, label: 'Master Lobby Server', sub: '104.22.15.10', icon: <ServerCog size={18} />, color: '#06b6d4', role: 'Matchmaking / lobby', region: 'EU-West' },
  { id: 'firewall', x: 390, y: 260, label: 'Edge Firewall / WAF', sub: 'ingress rate-limiter', icon: <Shield size={18} />, color: '#22c55e', role: 'Traffic-shaping mitigation', region: 'US-East edge' },
  { id: 'match', x: 500, y: 200, label: 'Match Server', sub: '104.22.15.89:7777', icon: <Server size={18} />, color: '#06b6d4', role: 'Authoritative game server', region: 'US-East' },
  { id: 'botnet', x: 280, y: 340, label: 'Attacker Botnet', sub: '1000+ spoofed hosts', icon: <Skull size={18} />, color: '#ef4444', role: 'Malicious traffic source', region: 'Distributed / global' },
];

function nodeById(id: string) {
  return NODES.find((n) => n.id === id)!;
}

function ParticleStream({
  from,
  to,
  color,
  count,
  duration,
  idPrefix,
  size = 3,
}: {
  from: string;
  to: string;
  color: string;
  count: number;
  duration: number;
  idPrefix: string;
  size?: number;
}) {
  const a = nodeById(from);
  const b = nodeById(to);
  const pathId = `${idPrefix}-path`;
  return (
    <>
      <path id={pathId} d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`} fill="none" stroke="none" />
      {Array.from({ length: count }).map((_, i) => (
        <circle key={i} r={size} fill={color}>
          <animateMotion dur={`${duration}s`} begin={`${(i * duration) / count}s`} repeatCount="indefinite">
            <mpath href={`#${pathId}`} />
          </animateMotion>
        </circle>
      ))}
    </>
  );
}

function statusFor(health: string) {
  if (health === 'critical') return { text: 'Critical / Overload', color: 'text-alert-red' };
  if (health === 'degraded') return { text: 'Degraded', color: 'text-yellow-400' };
  return { text: 'Optimal', color: 'text-neon-green' };
}

export function NetworkTopology() {
  const activeScenario = useSimStore((s) => s.activeScenario);
  const serverHealth = useSimStore((s) => s.serverHealth);
  const wafActive = useSimStore((s) => s.wafActive);
  const view = useUiStore((s) => s.topologyView);
  const setView = useUiStore((s) => s.setTopologyView);
  const [selectedNode, setSelectedNode] = useState<TopologyNodeInfo | null>(null);

  const scenario = getScenario(activeScenario);
  const isAttack = isAttackScenario(activeScenario);
  const isRecovering = activeScenario === 'recovering';
  const effect = scenario.topologyEffect;

  const client = nodeById('client');
  const lobby = nodeById('lobby');
  const match = nodeById('match');
  const botnet = nodeById('botnet');
  const firewall = nodeById('firewall');
  const midClientMatch = { x: (client.x + match.x) / 2, y: (client.y + match.y) / 2 };

  // Pan/zoom state
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; moved: boolean } | null>(null);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX - transform.x, startY: e.clientY - transform.y, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current) return;
    const { startX, startY } = dragRef.current;
    const dx = e.clientX - transform.x - startX;
    const dy = e.clientY - transform.y - startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
    setTransform((t) => ({ ...t, x: e.clientX - startX, y: e.clientY - startY }));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };
  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    setTransform((t) => ({ ...t, scale: Math.min(2.5, Math.max(0.6, t.scale - e.deltaY * 0.001)) }));
  };
  const resetView = () => setTransform({ scale: 1, x: 0, y: 0 });

  const openNode = (n: NodeDef) => {
    if (dragRef.current?.moved) return;
    const health = n.id === 'match' ? statusFor(serverHealth) : { text: 'Nominal', color: 'text-neon-green' };
    setSelectedNode({
      id: n.id,
      label: n.label,
      sub: n.sub,
      role: n.role,
      region: n.region,
      status: n.id === 'firewall' ? (wafActive ? 'Active — mitigating' : 'Standby') : health.text,
      statusColor: n.id === 'firewall' ? (wafActive ? 'text-neon-green' : 'text-slate-400') : health.color,
    });
  };

  const showBotnetActive = isAttack;
  const showFirewallActive = wafActive && isAttack;

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-slate-800/80 bg-[#05070d]">
      <PaneHeader
        icon={<Network size={14} />}
        title="Network Topology"
        subtitle={
          isAttack
            ? `${scenario.shortLabel} traffic overwhelming the match server link`
            : isRecovering
              ? 'Attacker blocked at the edge — link recovering'
              : 'All links nominal'
        }
        accent={isAttack ? 'red' : 'green'}
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView(view === 'abstract' ? 'world' : 'abstract')}
              className="flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-[10px] text-slate-400 hover:border-slate-500 hover:text-slate-200"
            >
              {view === 'abstract' ? <Globe2 size={11} /> : <MapIcon size={11} />}
              {view === 'abstract' ? 'World Map' : 'Abstract View'}
            </button>
            <div className="hidden items-center gap-3 text-[9.5px] text-slate-500 lg:flex">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-neon-green" /> game traffic
              </span>
              {isAttack && (
                <span className="flex items-center gap-1 text-alert-red">
                  <span className="h-1.5 w-1.5 rounded-full bg-alert-red animate-pulse-glow" /> attack traffic
                </span>
              )}
            </div>
          </div>
        }
      />
      <div className="min-h-0 flex-1 p-2">
        {view === 'world' ? (
          <WorldMapView />
        ) : (
          <svg
            viewBox="0 0 560 400"
            className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onWheel={onWheel}
            onDoubleClick={resetView}
          >
            <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
              {/* base links */}
              <line x1={client.x} y1={client.y} x2={lobby.x} y2={lobby.y} stroke={effect === 'mitm-reroute' ? '#7f1d1d' : '#334155'} strokeWidth={1.5} opacity={effect === 'mitm-reroute' ? 0.3 : 1} />
              <line x1={lobby.x} y1={lobby.y} x2={match.x} y2={match.y} stroke="#334155" strokeWidth={1.5} />

              {effect === 'mitm-reroute' && (
                <>
                  <line x1={client.x} y1={client.y} x2={botnet.x} y2={botnet.y} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 4" />
                  <line x1={botnet.x} y1={botnet.y} x2={lobby.x} y2={lobby.y} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 4" />
                  <ParticleStream from="client" to="botnet" color="#ef4444" count={2} duration={1.2} idPrefix="mitm1" />
                  <ParticleStream from="botnet" to="lobby" color="#ef4444" count={2} duration={1.2} idPrefix="mitm2" />
                </>
              )}

              <line
                x1={client.x} y1={client.y} x2={match.x} y2={match.y}
                stroke={isAttack ? '#7f1d1d' : '#1e293b'}
                strokeWidth={isAttack ? 1.5 : 2}
                strokeDasharray={isAttack ? '4 10' : undefined}
                opacity={isAttack ? 0.5 : 1}
              />

              {effect === 'flood-pulse' && !showFirewallActive && (
                <line x1={botnet.x} y1={botnet.y} x2={match.x} y2={match.y} stroke="#ef4444" strokeWidth={5} opacity={0.35} className="animate-pulse-glow" />
              )}
              {effect === 'amplify-burst' && !showFirewallActive && (
                <line x1={botnet.x} y1={botnet.y} x2={match.x} y2={match.y} stroke="#ef4444" strokeWidth={7} opacity={0.3} className="animate-pulse-glow" />
              )}
              {effect === 'slow-drip' && (
                <line x1={botnet.x} y1={botnet.y} x2={match.x} y2={match.y} stroke="#ef4444" strokeWidth={2} opacity={0.25} strokeDasharray="2 6" />
              )}

              {(effect === 'flood-pulse' || effect === 'amplify-burst') && (
                <>
                  {showFirewallActive ? (
                    <>
                      <line x1={botnet.x} y1={botnet.y} x2={firewall.x} y2={firewall.y} stroke="#ef4444" strokeWidth={4} opacity={0.3} />
                      <line x1={firewall.x} y1={firewall.y} x2={match.x} y2={match.y} stroke="#22c55e" strokeWidth={2} opacity={0.5} />
                      <ParticleStream from="botnet" to="firewall" color="#ef4444" count={effect === 'amplify-burst' ? 6 : 12} duration={effect === 'amplify-burst' ? 0.9 : 0.5} idPrefix="bf" size={effect === 'amplify-burst' ? 4.5 : 3.5} />
                      <ParticleStream from="firewall" to="match" color="#22c55e" count={3} duration={0.6} idPrefix="fm" />
                    </>
                  ) : (
                    <ParticleStream
                      from="botnet"
                      to="match"
                      color="#ef4444"
                      count={effect === 'amplify-burst' ? 8 : 14}
                      duration={effect === 'amplify-burst' ? 0.9 : 0.5}
                      idPrefix="bm"
                      size={effect === 'amplify-burst' ? 5 : 3.5}
                    />
                  )}
                </>
              )}

              {effect === 'slow-drip' && (
                <ParticleStream from="botnet" to="match" color="#ef4444" count={3} duration={2.2} idPrefix="sl" size={2.5} />
              )}

              {effect === 'flood-pulse' && !showFirewallActive && (
                <g transform={`translate(${midClientMatch.x}, ${midClientMatch.y})`}>
                  <circle r={10} fill="#0b1120" stroke="#ef4444" strokeWidth={1.5} />
                  <line x1={-4} y1={-4} x2={4} y2={4} stroke="#ef4444" strokeWidth={1.5} />
                  <line x1={-4} y1={4} x2={4} y2={-4} stroke="#ef4444" strokeWidth={1.5} />
                </g>
              )}

              {/* client <-> lobby heartbeat (skip while rerouted through MITM) */}
              {effect !== 'mitm-reroute' && (
                <ParticleStream from="client" to="lobby" color="#06b6d4" count={2} duration={2.2} idPrefix="cl" />
              )}
              <ParticleStream from="lobby" to="match" color="#06b6d4" count={2} duration={2.2} idPrefix="lm" />

              {effect === 'none' && (
                <ParticleStream from="client" to="match" color="#22c55e" count={3} duration={1.4} idPrefix="cm" />
              )}
              {effect === 'recon-scan' && (
                <ParticleStream from="client" to="match" color="#06b6d4" count={4} duration={0.6} idPrefix="scan" size={2.5} />
              )}

              {/* nodes */}
              {NODES.map((n) => {
                if (n.id === 'firewall' && !wafActive && !isAttack) return null;
                const dimmed =
                  (n.id === 'botnet' && !showBotnetActive && !isRecovering) ||
                  (n.id === 'firewall' && !wafActive);
                const blocked = n.id === 'botnet' && isRecovering;
                const matchCritical = n.id === 'match' && serverHealth === 'critical';
                const firewallGlow = n.id === 'firewall' && showFirewallActive;
                const ringColor =
                  n.id === 'botnet' ? (blocked ? '#64748b' : '#ef4444') : matchCritical ? '#ef4444' : n.color;
                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x}, ${n.y})`}
                    opacity={dimmed ? 0.35 : 1}
                    className="cursor-pointer"
                    onClick={() => openNode(n)}
                  >
                    <circle
                      r={26}
                      fill="#0b1120"
                      stroke={ringColor}
                      strokeWidth={2}
                      className={(n.id === 'botnet' && isAttack) || matchCritical || firewallGlow ? 'animate-pulse-glow' : ''}
                    />
                    <foreignObject x={-12} y={-12} width={24} height={24}>
                      <div style={{ color: ringColor }} className="flex h-full w-full items-center justify-center">
                        {n.icon}
                      </div>
                    </foreignObject>
                    {blocked && <line x1={-16} y1={16} x2={16} y2={-16} stroke="#64748b" strokeWidth={2} />}
                    <text x={0} y={44} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight={600}>
                      {n.label}
                    </text>
                    <text x={0} y={57} textAnchor="middle" fill="#64748b" fontSize={9}>
                      {n.sub}
                    </text>
                    {blocked && (
                      <text x={0} y={69} textAnchor="middle" fill="#64748b" fontSize={8.5} fontWeight={600}>
                        BLOCKED
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        )}
      </div>
      <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
    </div>
  );
}
