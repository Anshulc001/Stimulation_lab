import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TelemetryPoint } from '../../types';

const tooltipStyle = { background: '#0b1120', border: '1px solid #1e293b', fontSize: 11, borderRadius: 6 };

interface MiniLineChartProps {
  data: TelemetryPoint[];
  dataKey: keyof TelemetryPoint;
  color: string;
  domain: [number, number];
  unit: string;
  height?: number;
}

export function MiniLineChart({ data, dataKey, color, domain, unit, height = 64 }: MiniLineChartProps) {
  return (
    <div className="w-full rounded border border-slate-800 bg-[#070b16] p-1" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 6, bottom: 0, left: 0 }}>
          <XAxis dataKey="t" hide />
          <YAxis domain={domain} hide />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={() => ''}
            formatter={(value) => [`${Number(value).toFixed(1)}${unit}`, dataKey]}
          />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
