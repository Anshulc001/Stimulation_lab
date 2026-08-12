import { useEffect, useRef, useState } from 'react';
import { Gamepad2, LogOut, Loader2, Radio, Signal, Users, Smartphone, MonitorSmartphone } from 'lucide-react';
import { useSimStore } from '../../store/simStore';
import { getScenario } from '../../lib/scenarios/registry';
import { MiniMap } from './MiniMap';
import { ConnectionBanner } from './ConnectionBanner';
import { LoadingScreen } from './LoadingScreen';
import { PlaneDropAnimation } from './PlaneDropAnimation';
import { MobileControlsOverlay } from './MobileControlsOverlay';
import { KillFeed } from './KillFeed';

type Stage =
  | 'boot'
  | 'menu'
  | 'connecting-lobby'
  | 'matchmaking'
  | 'connecting-match'
  | 'loading-map'
  | 'dropping'
  | 'in-match';

const STAGE_LABEL: Partial<Record<Stage, string>> = {
  'connecting-lobby': 'Connecting to Lobby Server 104.22.15.10:443…',
  'connecting-match': 'Connecting to Match Server 104.22.15.89:7777…',
  'loading-map': 'Loading Erangel…',
  dropping: 'Deploying from aircraft…',
};

const STAGE_DURATION: Partial<Record<Stage, number>> = {
  'connecting-lobby': 1100,
  'connecting-match': 900,
  'loading-map': 1200,
  dropping: 2200,
};

function pingColor(ping: number) {
  if (ping > 250) return 'text-alert-red';
  if (ping > 100) return 'text-yellow-400';
  return 'text-neon-green';
}

export function BgmiApp() {
  const [stage, setStage] = useState<Stage>('boot');
  const [joined, setJoined] = useState(0);
  const [mobileMode, setMobileMode] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ping = useSimStore((s) => s.ping);
  const tickRate = useSimStore((s) => s.tickRate);
  const packetLoss = useSimStore((s) => s.packetLoss);
  const playerCount = useSimStore((s) => s.playerCount);
  const activeScenario = useSimStore((s) => s.activeScenario);
  const scenario = getScenario(activeScenario);

  const clearTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  };

  useEffect(() => () => clearTimers(), []);

  const goto = (next: Stage, delay: number) => {
    timeoutRef.current = setTimeout(() => setStage(next), delay);
  };

  const findMatch = () => {
    clearTimers();
    setJoined(1);
    setStage('connecting-lobby');
    goto('matchmaking', STAGE_DURATION['connecting-lobby']!);
  };

  useEffect(() => {
    if (stage !== 'matchmaking') return;
    intervalRef.current = setInterval(() => {
      setJoined((j) => {
        const next = Math.min(100, j + Math.floor(Math.random() * 9) + 3);
        if (next >= 100 && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          goto('connecting-match', 500);
        }
        return next;
      });
    }, 180);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [stage]);

  useEffect(() => {
    if (stage === 'connecting-match') goto('loading-map', STAGE_DURATION['connecting-match']!);
    if (stage === 'loading-map') goto('dropping', STAGE_DURATION['loading-map']!);
    if (stage === 'dropping') goto('in-match', STAGE_DURATION.dropping!);
  }, [stage]);

  const leaveMatch = () => {
    clearTimers();
    setStage('menu');
    setJoined(0);
  };

  const connected = Math.round(playerCount);
  const disconnected = tickRate < 8;
  const severeLag = tickRate < 20 || packetLoss > 45;
  const killFeedIntensity = scenario.category === 'attack' ? (scenario.severity === 'critical' ? 3 : 2) : 0.5;

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-slate-800/80 bg-[#05070d]">
      <div className="flex items-center gap-2 border-b border-slate-800/80 bg-[#0b1120] px-3 py-2">
        <Gamepad2 size={14} className="text-yellow-400" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-200">BGMI Match Simulator</h2>
        {stage === 'in-match' && (
          <>
            <button
              onClick={() => setMobileMode((m) => !m)}
              title={mobileMode ? 'Switch to spectator view' : 'Switch to mobile controls view'}
              className={`ml-auto flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold ${
                mobileMode ? 'bg-cyber-cyan/20 text-cyber-cyan' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {mobileMode ? <MonitorSmartphone size={11} /> : <Smartphone size={11} />}
              {mobileMode ? 'Mobile HUD' : 'Spectator'}
            </button>
            <button
              onClick={leaveMatch}
              className="flex items-center gap-1 rounded bg-alert-red/15 px-2 py-0.5 text-[10px] font-semibold text-alert-red hover:bg-alert-red/25"
            >
              <LogOut size={10} /> Leave Match
            </button>
          </>
        )}
      </div>

      <div className={`relative min-h-0 flex-1 ${severeLag && stage === 'in-match' ? 'animate-screen-shake' : ''}`}>
        {stage === 'boot' && <LoadingScreen onDone={() => setStage('menu')} />}

        {stage === 'menu' && (
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#0c1710] to-[#05070d] p-6 text-center animate-fade-in">
            <Gamepad2 size={40} className="animate-bob text-yellow-400" />
            <div>
              <h3 className="text-lg font-black tracking-wide text-slate-100">BATTLEGROUNDS SIMULATOR</h3>
              <p className="mt-1 text-[11px] text-slate-500">
                A mock match lobby that visualizes CyberLab's live network telemetry — ping, tick rate, and
                player connectivity — as if it were an in-game HUD.
              </p>
            </div>
            <button
              onClick={findMatch}
              className="rounded bg-yellow-400 px-6 py-2 text-sm font-bold text-black shadow-[0_0_20px_rgba(250,204,21,0.4)] transition-transform hover:scale-105 active:scale-95"
            >
              FIND MATCH
            </button>
          </div>
        )}

        {(stage === 'connecting-lobby' || stage === 'connecting-match' || stage === 'loading-map') && (
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#0c1710] to-[#05070d] p-6 text-center animate-fade-in">
            <Loader2 size={28} className="animate-spin text-cyber-cyan" />
            <p className="text-[12px] font-semibold text-slate-200">{STAGE_LABEL[stage]}</p>
            <div className="relative h-1 w-48 overflow-hidden rounded-full bg-slate-800">
              <div className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-cyber-cyan animate-progress-indeterminate" />
            </div>
          </div>
        )}

        {stage === 'dropping' && (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-[#0e2233] via-[#0c1710] to-[#05070d] p-4 text-center animate-fade-in">
            <PlaneDropAnimation />
            <p className="text-[12px] font-semibold text-slate-200">{STAGE_LABEL.dropping}</p>
            <p className="text-[10px] text-slate-500">Squad will deploy automatically over the drop zone…</p>
          </div>
        )}

        {stage === 'matchmaking' && (
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#0c1710] to-[#05070d] p-6 text-center animate-fade-in">
            <Users size={28} className="animate-bob text-yellow-400" />
            <p className="text-[12px] font-semibold text-slate-200">Searching for Match…</p>
            <p className="font-mono text-3xl font-black text-yellow-400">{joined}/100</p>
            <div className="relative h-1.5 w-48 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-yellow-400 transition-all duration-150"
                style={{ width: `${joined}%` }}
              />
              <div className="absolute inset-0 overflow-hidden">
                <div className="h-full w-1/4 bg-white/30 animate-shimmer" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500">Players connecting to matchmaking server…</p>
          </div>
        )}

        {stage === 'in-match' && (
          <div className="relative flex h-full flex-col p-2 animate-fade-in">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <div
                className={`flex items-center gap-1 rounded bg-[#0b1120] px-2 py-1 text-[10.5px] font-bold ${pingColor(ping)} ${ping > 250 ? 'animate-pulse-glow' : ''}`}
              >
                <Signal size={11} /> {ping.toFixed(0)}ms
              </div>
              <div className="flex items-center gap-1 rounded bg-[#0b1120] px-2 py-1 text-[10.5px] font-bold text-slate-300">
                <Radio size={11} /> {tickRate.toFixed(0)}Hz tick
              </div>
              <div className="flex items-center gap-1 rounded bg-[#0b1120] px-2 py-1 text-[10.5px] font-bold text-cyber-cyan">
                <Users size={11} /> {connected}/100 connected
              </div>
              <ConnectionBanner ping={ping} packetLoss={packetLoss} tickRate={tickRate} />
              {scenario.category === 'attack' && (
                <span className="rounded bg-alert-red/15 px-2 py-1 text-[10px] font-bold uppercase text-alert-red animate-pulse-glow">
                  {scenario.shortLabel} in progress
                </span>
              )}
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden rounded">
              <MiniMap ping={ping} playersAlive={connected} />
              {mobileMode && <MobileControlsOverlay />}
              <KillFeed intensity={killFeedIntensity} />
              {severeLag && (
                <div className="pointer-events-none absolute inset-0 z-[7] animate-vignette-flash shadow-[inset_0_0_60px_20px_rgba(239,68,68,0.35)]" />
              )}
            </div>

            <div className="mt-2 flex items-center justify-between text-[9.5px] text-slate-500">
              <span>SQUAD: You, Bot_Alpha, Bot_Bravo, Bot_Charlie</span>
              <span>104.22.15.89:7777</span>
            </div>
          </div>
        )}

        {stage === 'in-match' && disconnected && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/80 backdrop-blur-sm animate-fade-in">
            <Loader2 size={26} className="animate-spin text-alert-red" />
            <p className="text-sm font-bold text-alert-red">CONNECTION LOST — REJOINING MATCH…</p>
            <p className="max-w-xs text-[10px] text-slate-400">
              Server tick rate has dropped to {tickRate.toFixed(0)}Hz — this is a simulated freeze caused by
              the active attack scenario.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
