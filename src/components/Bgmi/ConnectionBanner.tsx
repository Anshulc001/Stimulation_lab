import { AlertTriangle, ShieldAlert, Wifi } from 'lucide-react';

interface ConnectionBannerProps {
  ping: number;
  packetLoss: number;
  tickRate: number;
}

export function ConnectionBanner({ ping, packetLoss, tickRate }: ConnectionBannerProps) {
  if (tickRate < 15) {
    return (
      <div className="flex items-center gap-1.5 rounded bg-alert-red/20 px-2 py-1 text-[10px] font-bold text-alert-red animate-pulse-glow">
        <ShieldAlert size={11} />
        SEVERE LAG — SERVER OVERLOADED
      </div>
    );
  }
  if (packetLoss > 20 || ping > 250) {
    return (
      <div className="flex items-center gap-1.5 rounded bg-yellow-400/15 px-2 py-1 text-[10px] font-bold text-yellow-400">
        <AlertTriangle size={11} />
        HIGH PING WARNING
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 rounded bg-neon-green/10 px-2 py-1 text-[10px] font-bold text-neon-green">
      <Wifi size={11} />
      STABLE CONNECTION
    </div>
  );
}
