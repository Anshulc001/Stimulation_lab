import { ATTACKER_IP, CLIENT_IP, GATEWAY_IP, MATCH_PORT, MATCH_SERVER, WEB_PORT, WEB_SERVER } from '../../lib/packetGenerator';

const ROLES = [
  { label: 'ATTACKER', value: ATTACKER_IP, color: 'text-alert-red' },
  { label: 'CLIENT', value: CLIENT_IP, color: 'text-cyber-cyan' },
  { label: 'GATEWAY', value: GATEWAY_IP, color: 'text-yellow-400' },
  { label: 'GAME SRV', value: `${MATCH_SERVER}:${MATCH_PORT}/UDP`, color: 'text-neon-green' },
  { label: 'WEB / API', value: `${WEB_SERVER}:${WEB_PORT}`, color: 'text-cyber-cyan' },
];

/**
 * Persistent identity strip — makes the network roles explicit so it is always
 * clear that the terminal is the attacker console, not the victim machine.
 */
export function NetworkRoles() {
  return (
    <div className="pointer-events-auto rounded-md border border-slate-800 bg-[#0b1120]/90 px-2.5 py-2 shadow-lg backdrop-blur-sm">
      <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
        <span className="h-1.5 w-1.5 rounded-full bg-alert-red animate-pulse-glow" />
        Network Roles
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-1">
        {ROLES.map((r) => (
          <div key={r.label} className="flex items-center gap-1.5 text-[10px] leading-4">
            <span className="w-14 shrink-0 font-bold text-slate-500">{r.label}</span>
            <span className={`font-mono ${r.color}`}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
