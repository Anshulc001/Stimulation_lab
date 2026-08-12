import { useEffect, useRef } from 'react';
import { Waypoints, X } from 'lucide-react';
import type { Packet } from '../../types';

interface PacketDrawerProps {
  packet: Packet | null;
  onClose: () => void;
  onFollowStream?: (ip: string) => void;
}

function stripPort(addr: string): string {
  return addr.replace(/:\d+$/, '').split(' ')[0];
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function PacketDrawer({ packet, onClose, onFollowStream }: PacketDrawerProps) {
  // Stash onClose in a ref instead of listing it as an effect dependency —
  // the parent (PacketAnalyzer) re-renders every ~100ms while capturing live
  // traffic and passes a new inline `onClose` each time, which would
  // otherwise tear down and re-add this global keydown listener constantly
  // for as long as the drawer stays open.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!packet) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [packet]);

  if (!packet) return null;
  const hexBytes = packet.hex.split(' ');
  const rows = chunk(hexBytes, 8);
  const asciiRows = chunk(packet.ascii.split(''), 8);

  return (
    <div className="absolute inset-0 z-20 flex justify-end bg-black/60 animate-fade-in" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto border-l border-slate-800 bg-[#0b1120] p-4 text-[11px] text-slate-300 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-cyber-cyan">Packet #{packet.no} Details</h3>
          <div className="flex items-center gap-2">
            {onFollowStream && (
              <button
                onClick={() => onFollowStream(stripPort(packet.src))}
                title="Filter the table to this conversation"
                className="flex items-center gap-1 rounded bg-cyber-cyan/10 px-2 py-1 text-[10px] font-semibold text-cyber-cyan hover:bg-cyber-cyan/20"
              >
                <Waypoints size={11} />
                Follow Stream
              </button>
            )}
            <button onClick={onClose} aria-label="Close packet details" className="text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="mb-4 space-y-1 rounded border border-slate-800 bg-[#070b16] p-3">
          <Row label="Timestamp" value={`${packet.time}s`} />
          <Row label="Source" value={packet.src} />
          <Row label="Destination" value={packet.dst} />
          <Row label="Protocol" value={packet.protocol} />
          <Row label="Length" value={`${packet.length} bytes`} />
          <Row
            label="Classification"
            value={packet.malicious ? 'MALICIOUS / ANOMALOUS' : 'Legitimate Game Traffic'}
            danger={packet.malicious}
          />
          <Row label="Info" value={packet.info} />
        </div>

        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Raw Bytes
        </h4>
        <div className="rounded border border-slate-800 bg-black/40 p-3 font-mono">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-4 py-0.5">
              <span className="w-14 flex-shrink-0 text-slate-600">
                {(i * 8).toString(16).padStart(4, '0')}
              </span>
              <span className="flex-1 text-neon-green tracking-widest">{row.join(' ')}</span>
              <span className="flex-shrink-0 text-slate-400">{asciiRows[i].join('')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-500">{label}</span>
      <span className={danger ? 'text-alert-red font-semibold' : 'text-slate-200'}>{value}</span>
    </div>
  );
}
