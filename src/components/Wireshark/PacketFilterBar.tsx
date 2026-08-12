import { Filter, X } from 'lucide-react';

interface PacketFilterBarProps {
  value: string;
  onChange: (v: string) => void;
  resultCount: number;
  totalCount: number;
}

export function PacketFilterBar({ value, onChange, resultCount, totalCount }: PacketFilterBarProps) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-800/80 bg-[#070b16] px-3 py-1.5">
      <Filter size={12} className="flex-shrink-0 text-slate-500" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder="filter: e.g. ip.addr==45.33.12.201, proto==udp, malformed"
        className="flex-1 bg-transparent font-mono text-[11px] text-slate-200 outline-none placeholder:text-slate-600"
      />
      {value && (
        <button onClick={() => onChange('')} className="text-slate-500 hover:text-slate-300">
          <X size={12} />
        </button>
      )}
      <span className="flex-shrink-0 text-[10px] text-slate-500">
        {resultCount}/{totalCount}
      </span>
    </div>
  );
}
