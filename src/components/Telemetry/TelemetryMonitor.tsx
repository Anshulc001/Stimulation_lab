import {
  Activity,
  ShieldAlert,
  ShieldCheck,
  Server,
  Gauge as GaugeIcon,
  CircleAlert,
  Info,
  CheckCircle2,
  Users,
  ArrowDownUp,
  ArrowDown,
  ArrowUp,
  History,
  LayoutDashboard,
} from 'lucide-react';
import { useSimStore } from '../../store/simStore';
import { useUiStore } from '../../store/uiStore';
import { getScenario } from '../../lib/scenarios/registry';
import { PaneHeader } from '../Shared/PaneHeader';
import { Gauge } from './Gauge';
import { MiniLineChart } from './MiniLineChart';
import { IncidentTimeline } from './IncidentTimeline';

const healthConfig = {
  optimal: { label: 'OPTIMAL', dot: 'bg-neon-green', text: 'text-neon-green' },
  degraded: { label: 'DEGRADED', dot: 'bg-yellow-400', text: 'text-yellow-400' },
  critical: { label: 'CRITICAL / OVERLOAD', dot: 'bg-alert-red', text: 'text-alert-red' },
};

const eventLevelStyle: Record<string, { color: string; icon: typeof Info }> = {
  info: { color: 'text-cyber-cyan', icon: Info },
  warning: { color: 'text-yellow-400', icon: CircleAlert },
  critical: { color: 'text-alert-red', icon: ShieldAlert },
  success: { color: 'text-neon-green', icon: CheckCircle2 },
};

const TABS = [
  { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
  { id: 'extended' as const, label: 'Extended', icon: Users },
  { id: 'incidents' as const, label: 'Incidents', icon: History },
];

/** Bandwidth severity — inbound above 10 Mbps is elevated, above 50 is saturated. */
function bandwidthStatus(inbound: number) {
  if (inbound > 50) {
    return {
      label: 'SATURATED',
      badge: 'border-alert-red/40 bg-alert-red/10 text-alert-red animate-pulse-glow',
      value: 'text-alert-red',
      bar: 'bg-alert-red',
    };
  }
  if (inbound > 10) {
    return {
      label: 'ELEVATED',
      badge: 'border-yellow-400/40 bg-yellow-400/10 text-yellow-400',
      value: 'text-yellow-400',
      bar: 'bg-yellow-400',
    };
  }
  return {
    label: 'NOMINAL',
    badge: 'border-neon-green/40 bg-neon-green/10 text-neon-green',
    value: 'text-neon-green',
    bar: 'bg-neon-green',
  };
}

export function TelemetryMonitor() {
  const serverHealth = useSimStore((s) => s.serverHealth);
  const cpuLoad = useSimStore((s) => s.cpuLoad);
  const ping = useSimStore((s) => s.ping);
  const tickRate = useSimStore((s) => s.tickRate);
  const playerCount = useSimStore((s) => s.playerCount);
  const packetLoss = useSimStore((s) => s.packetLoss);
  const bandwidthIn = useSimStore((s) => s.bandwidthIn);
  const bandwidthOut = useSimStore((s) => s.bandwidthOut);
  const telemetry = useSimStore((s) => s.telemetry);
  const securityEvents = useSimStore((s) => s.securityEvents);
  const hwidBanned = useSimStore((s) => s.hwidBanned);
  const activeScenario = useSimStore((s) => s.activeScenario);
  const scenario = getScenario(activeScenario);
  const isAttack = scenario.category === 'attack';
  const tab = useUiStore((s) => s.telemetryTab);
  const setTab = useUiStore((s) => s.setTelemetryTab);
  const health = healthConfig[serverHealth];
  const bwStatus = bandwidthStatus(bandwidthIn);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-slate-800/80 bg-[#05070d]">
      <PaneHeader
        icon={<Server size={14} />}
        title="Match Server & Telemetry"
        subtitle="MATCH-SRV-01 · 10.0.0.10:7777"
        accent={serverHealth === 'critical' ? 'red' : serverHealth === 'degraded' ? 'cyan' : 'green'}
        right={
          <span className={`flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-semibold ${health.text}`}>
            <span
              className={`h-2 w-2 rounded-full ${health.dot} ${
                serverHealth !== 'optimal' ? 'animate-pulse-glow' : ''
              }`}
            />
            {health.label}
          </span>
        }
      />

      {isAttack && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 border-b border-slate-800/80 bg-[#0b1120] px-3 py-1 text-[10px]">
          <span className="flex items-center gap-1 font-bold text-alert-red">
            <Activity size={11} /> Impact focus:
          </span>
          <span className="font-semibold text-slate-100">{scenario.classification.primaryImpact}</span>
          <span className="ml-auto text-slate-500">
            Defense: <span className="text-neon-green">{scenario.classification.primaryDefense}</span>
          </span>
        </div>
      )}

      <div className="flex border-b border-slate-800/80 bg-[#0b1120]">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide transition-colors ${
                active
                  ? 'border-cyber-cyan text-cyber-cyan'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon size={12} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Gauge
                label="CPU Load"
                value={cpuLoad}
                max={100}
                unit="%"
                colorClass={cpuLoad > 80 ? 'text-alert-red' : cpuLoad > 50 ? 'text-yellow-400' : 'text-neon-green'}
              />
              <Gauge
                label="Game Tick Rate"
                value={tickRate}
                max={60}
                unit="Hz"
                colorClass={tickRate < 15 ? 'text-alert-red' : tickRate < 40 ? 'text-yellow-400' : 'text-neon-green'}
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Activity size={12} /> Ping / Latency
                </span>
                <span
                  className={`font-semibold ${
                    ping > 300 ? 'text-alert-red' : ping > 100 ? 'text-yellow-400' : 'text-neon-green'
                  }`}
                >
                  {ping.toFixed(0)}ms
                </span>
              </div>
              <MiniLineChart data={telemetry} dataKey="ping" color="#06b6d4" domain={[0, 1000]} unit="ms" height={112} />
            </div>

            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                <GaugeIcon size={12} /> CPU Load Timeline
              </div>
              <MiniLineChart data={telemetry} dataKey="cpu" color="#22c55e" domain={[0, 100]} unit="%" />
            </div>

            <div className="rounded border border-slate-800 bg-[#070b16]">
              <div className="flex items-center gap-1.5 border-b border-slate-800 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {hwidBanned ? (
                  <ShieldCheck size={12} className="text-neon-green" />
                ) : (
                  <ShieldAlert size={12} className="text-alert-red" />
                )}
                Anti-Cheat &amp; Telemetry Console
                {hwidBanned && (
                  <span className="ml-auto rounded bg-neon-green/10 px-1.5 py-0.5 text-[9px] normal-case text-neon-green">
                    threat contained
                  </span>
                )}
              </div>
              <div className="max-h-44 space-y-1 overflow-y-auto p-2 text-[10.5px] font-mono">
                {securityEvents.length === 0 && (
                  <div className="p-2 text-center text-slate-600">No security events recorded.</div>
                )}
                {securityEvents.map((e) => {
                  const style = eventLevelStyle[e.level];
                  const Icon = style.icon;
                  return (
                    <div key={e.id} className="flex items-start gap-2 animate-fade-in">
                      <span className="mt-0.5 text-slate-600">{e.timestamp}</span>
                      <Icon size={11} className={`mt-0.5 flex-shrink-0 ${style.color}`} />
                      <span className={style.color}>{e.message}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {tab === 'extended' && (
          <>
            {/* CPU + tick live alongside players/packet-loss/bandwidth so every
                attack's primary impact is visible from this tab too. */}
            <div className="grid grid-cols-2 gap-3">
              <Gauge
                label="CPU Load"
                value={cpuLoad}
                max={100}
                unit="%"
                colorClass={cpuLoad > 80 ? 'text-alert-red' : cpuLoad > 50 ? 'text-yellow-400' : 'text-neon-green'}
              />
              <Gauge
                label="Game Tick Rate"
                value={tickRate}
                max={60}
                unit="Hz"
                colorClass={tickRate < 15 ? 'text-alert-red' : tickRate < 40 ? 'text-yellow-400' : 'text-neon-green'}
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Users size={12} /> Players Online
                </span>
                <span className="font-semibold text-cyber-cyan">{playerCount.toFixed(0)}</span>
              </div>
              <MiniLineChart data={telemetry} dataKey="playerCount" color="#06b6d4" domain={[0, 100]} unit="" />
            </div>

            <Gauge
              label="Packet Loss"
              value={packetLoss}
              max={100}
              unit="%"
              colorClass={packetLoss > 40 ? 'text-alert-red' : packetLoss > 10 ? 'text-yellow-400' : 'text-neon-green'}
            />

            <div className="rounded border border-slate-800 bg-[#070b16] p-2.5">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <ArrowDownUp size={12} /> Bandwidth
                </span>
                <span
                  className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${bwStatus.badge}`}
                >
                  {bwStatus.label}
                </span>
              </div>

              {/* Inbound / Outbound explained with arrows + levels */}
              <div className="space-y-1.5">
                <div>
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="flex items-center gap-1 text-slate-400">
                      <ArrowDown size={11} className="text-neon-green" /> Inbound (to server)
                    </span>
                    <span className={`font-mono font-semibold ${bwStatus.value}`}>
                      {bandwidthIn.toFixed(1)} Mbps
                    </span>
                  </div>
                  <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${bwStatus.bar}`}
                      style={{ width: `${Math.min(100, (bandwidthIn / 100) * 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="flex items-center gap-1 text-slate-400">
                      <ArrowUp size={11} className="text-cyber-cyan" /> Outbound (from server)
                    </span>
                    <span className="font-mono font-semibold text-cyber-cyan">{bandwidthOut.toFixed(1)} Mbps</span>
                  </div>
                  <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
                    <div
                      className="h-full rounded-full bg-cyber-cyan transition-all duration-300"
                      style={{ width: `${Math.min(100, (bandwidthOut / 100) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <MiniLineChart data={telemetry} dataKey="bandwidthIn" color="#f59e0b" domain={[0, 200]} unit=" Mbps" />

              <p className="mt-1.5 border-t border-slate-800/60 pt-1.5 text-[9.5px] leading-4 text-slate-500">
                Inbound = traffic arriving at the match server · Outbound = traffic it sends back.
                Under a flood, inbound spikes while outbound stays low.
              </p>
            </div>
          </>
        )}

        {tab === 'incidents' && <IncidentTimeline />}
      </div>
    </div>
  );
}
