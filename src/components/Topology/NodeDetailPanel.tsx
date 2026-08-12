import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useSimStore } from '../../store/simStore';

export interface TopologyNodeInfo {
  id: string;
  label: string;
  sub: string;
  role: string;
  region: string;
  status: string;
  statusColor: string;
}

export function NodeDetailPanel({ node, onClose }: { node: TopologyNodeInfo | null; onClose: () => void }) {
  const playerCount = useSimStore((s) => s.playerCount);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!node) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [node]);

  if (!node) return null;

  return (
    <div className="absolute inset-0 z-20 flex justify-end bg-black/60 animate-fade-in" onClick={onClose}>
      <div
        className="h-full w-full max-w-xs overflow-y-auto border-l border-slate-800 bg-[#0b1120] p-4 text-[11px] text-slate-300 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-cyber-cyan">{node.label}</h3>
          <button onClick={onClose} aria-label="Close node details" className="text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-1.5 rounded border border-slate-800 bg-[#070b16] p-3">
          <Row label="Role" value={node.role} />
          <Row label="Address" value={node.sub} />
          <Row label="Region" value={node.region} />
          <Row label="Status" value={node.status} valueClass={node.statusColor} />
          {node.id === 'match' && <Row label="Connected clients" value={playerCount.toFixed(0)} />}
        </div>
        <p className="mt-3 text-[10.5px] text-slate-500">
          This is a simulated node for demonstration purposes — all values are mock/derived from the current
          scenario, not a real host.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-500">{label}</span>
      <span className={valueClass ?? 'text-slate-200'}>{value}</span>
    </div>
  );
}
