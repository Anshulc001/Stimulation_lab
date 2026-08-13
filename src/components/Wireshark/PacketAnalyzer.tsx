import { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, Download, Radar, TriangleAlert } from 'lucide-react';
import { useSimStore } from '../../store/simStore';
import { getScenario, isAttackScenario } from '../../lib/scenarios/registry';
import { parsePacketFilter } from '../../lib/packetFilter';
import { PaneHeader } from '../Shared/PaneHeader';
import { PacketDrawer } from './PacketDrawer';
import { PacketFilterBar } from './PacketFilterBar';
import { ProtocolDistributionChart } from './ProtocolDistributionChart';
import type { Packet } from '../../types';

const protocolBadge: Record<string, string> = {
  UDP: 'bg-cyber-cyan/10 text-cyber-cyan',
  TCP: 'bg-neon-green/10 text-neon-green',
  ICMP: 'bg-yellow-400/10 text-yellow-400',
  ARP: 'bg-alert-red/10 text-alert-red',
};

function downloadCapture(packets: Packet[]) {
  const blob = new Blob([JSON.stringify(packets, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  a.href = url;
  a.download = `cyberlab-capture-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function PacketAnalyzer() {
  const packets = useSimStore((s) => s.packets);
  const activeScenario = useSimStore((s) => s.activeScenario);
  const gameActive = useSimStore((s) => s.gameActive);
  const [selected, setSelected] = useState<Packet | null>(null);
  const [filter, setFilter] = useState('');
  const [showChart, setShowChart] = useState(false);
  const [pps, setPps] = useState(0);
  const lastTotalRef = useRef(0);

  const scenario = getScenario(activeScenario);
  const isAttack = isAttackScenario(activeScenario);
  const isRecovering = activeScenario === 'recovering';
  const maliciousCount = packets.filter((p) => p.malicious).length;

  const filteredPackets = useMemo(() => {
    const predicate = parsePacketFilter(filter);
    return packets.filter(predicate);
  }, [packets, filter]);

  useEffect(() => {
    const iv = setInterval(() => {
      const total = useSimStore.getState().packets[0]?.no ?? 0;
      setPps(Math.max(0, total - lastTotalRef.current));
      lastTotalRef.current = total;
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-slate-800/80 bg-[#05070d]">
      <PaneHeader
        icon={<Radar size={14} className={isAttack ? 'animate-pulse-glow' : ''} />}
        title="Packet Analyzer"
        subtitle={
          isAttack
            ? `capturing… ${scenario.shortLabel.toLowerCase()} traffic detected`
            : isRecovering
              ? 'capturing… attacker traffic dropped at edge, recovering'
              : gameActive
                ? 'capturing on eth0 · client ↔ match server'
                : 'capturing on eth0 · normal LAN traffic (game server stopped)'
        }
        accent={isAttack ? 'red' : 'cyan'}
        right={
          <div className="flex items-center gap-1.5">
            {maliciousCount > 0 && (
              <span className="flex items-center gap-1 rounded bg-alert-red/20 px-2 py-0.5 text-[10px] font-semibold text-alert-red">
                <TriangleAlert size={10} />
                {maliciousCount} flagged
              </span>
            )}
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                isAttack ? 'bg-alert-red/20 text-alert-red animate-pulse-glow' : 'bg-neon-green/10 text-neon-green'
              }`}
            >
              {pps} pkt/s
            </span>
            <button
              onClick={() => setShowChart((v) => !v)}
              title="Toggle protocol distribution chart"
              className={`rounded p-1 ${showChart ? 'text-cyber-cyan' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <BarChart3 size={13} />
            </button>
            <button
              onClick={() => downloadCapture(packets)}
              title="Export capture as JSON"
              className="rounded p-1 text-slate-500 hover:text-slate-300"
            >
              <Download size={13} />
            </button>
          </div>
        }
      />
      <PacketFilterBar
        value={filter}
        onChange={setFilter}
        resultCount={filteredPackets.length}
        totalCount={packets.length}
      />
      {showChart && <ProtocolDistributionChart packets={filteredPackets} />}
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[46px_78px_1fr_1fr_54px_46px_1.6fr] gap-2 border-b border-slate-800/80 bg-[#0b1120] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 sticky top-0">
            <span>No.</span>
            <span>Time</span>
            <span>Source</span>
            <span>Destination</span>
            <span>Proto</span>
            <span>Len</span>
            <span>Info</span>
          </div>
          <div className="font-mono text-[11px]">
            {filteredPackets.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelected(p)}
                className={`grid cursor-pointer grid-cols-[46px_78px_1fr_1fr_54px_46px_1.6fr] gap-2 border-b border-slate-900/60 px-3 py-1 transition-colors hover:bg-slate-800/50 ${
                  p.malicious ? 'bg-alert-red/10' : ''
                } ${selected?.id === p.id ? 'ring-1 ring-inset ring-cyber-cyan/60 bg-slate-800/40' : ''}`}
              >
                <span className="text-slate-500">{p.no}</span>
                <span className="text-slate-400">{p.time}</span>
                <span className={`truncate ${p.malicious ? 'text-alert-red font-semibold' : 'text-slate-300'}`}>
                  {p.src}
                </span>
                <span className={`truncate ${p.malicious ? 'text-alert-red font-semibold' : 'text-slate-300'}`}>
                  {p.dst}
                </span>
                <span>
                  <span className={`rounded px-1.5 py-0.5 text-[9.5px] font-bold ${protocolBadge[p.protocol]}`}>
                    {p.protocol}
                  </span>
                </span>
                <span className="text-slate-400">{p.length}</span>
                <span className={`truncate ${p.malicious ? 'font-semibold text-alert-red' : 'text-slate-400'}`}>
                  {p.info}
                </span>
              </div>
            ))}
            {filteredPackets.length === 0 && (
              <div className="flex h-40 flex-col items-center justify-center gap-2 p-4 text-center text-xs text-slate-600">
                <Radar size={24} className="text-slate-700" />
                {packets.length === 0
                  ? 'Waiting for traffic — run a scenario or type a command in the terminal.'
                  : 'No packets match the current filter.'}
              </div>
            )}
          </div>
        </div>
      </div>
      <PacketDrawer
        packet={selected}
        onClose={() => setSelected(null)}
        onFollowStream={(ip) => {
          setFilter(`ip.addr==${ip}`);
          setSelected(null);
        }}
      />
    </div>
  );
}
