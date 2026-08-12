import { useMemo } from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Packet } from '../../types';

const PROTOCOL_COLOR: Record<string, string> = {
  UDP: '#06b6d4',
  TCP: '#22c55e',
  ICMP: '#facc15',
  ARP: '#ef4444',
};

export function ProtocolDistributionChart({ packets }: { packets: Packet[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of packets) counts[p.protocol] = (counts[p.protocol] ?? 0) + 1;
    return Object.entries(counts).map(([protocol, count]) => ({ protocol, count }));
  }, [packets]);

  if (data.length === 0) return null;

  return (
    <div className="border-b border-slate-800/80 bg-[#070b16] px-3 py-1.5">
      <div className="h-14 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="protocol"
              width={36}
              tick={{ fill: '#64748b', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ background: '#0b1120', border: '1px solid #1e293b', fontSize: 11, borderRadius: 6 }}
            />
            <Bar dataKey="count" radius={[0, 3, 3, 0]}>
              {data.map((d) => (
                <Cell key={d.protocol} fill={PROTOCOL_COLOR[d.protocol] ?? '#64748b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
