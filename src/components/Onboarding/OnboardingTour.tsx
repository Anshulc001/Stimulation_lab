import { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';

const STEPS = [
  {
    title: 'Welcome to CyberLab',
    body: 'This is a fully client-side simulator — no real packets, servers, or attacks are involved anywhere in this app.',
  },
  {
    title: 'Command Console',
    body: 'Type commands like `hping3`, `nmap`, `ban`, or `guide` here — or use the Scenario buttons above for one-click demos.',
  },
  {
    title: 'Packet Analyzer',
    body: 'Watch simulated traffic in real time. Filter it, inspect raw bytes, and export a capture for a "closer look".',
  },
  {
    title: 'Match Server & Telemetry',
    body: 'CPU, ping, tick rate, player count, and more react live to whatever scenario is running — check the Extended and Incidents tabs.',
  },
  {
    title: 'Network Topology',
    body: 'A live diagram of the network. Pan, zoom, click a node for details, or switch to World Map view from the header toggle.',
  },
];

const STORAGE_KEY = 'cyberlab-onboarding-dismissed';

function readDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function persistDismissed() {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* storage unavailable — ignore */
  }
}

export function OnboardingTour() {
  const [dismissed, setDismissed] = useState(readDismissed);
  const [step, setStep] = useState(0);

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    persistDismissed();
  };
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-lg border border-cyber-cyan/40 bg-[#0b1120] p-4 shadow-2xl animate-fade-in">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-xs font-bold text-cyber-cyan">{current.title}</h3>
            <span className="text-[10px] text-slate-500">
              {step + 1}/{STEPS.length}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">{current.body}</p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => (isLast ? dismiss() : setStep((s) => s + 1))}
              className="flex items-center gap-1 rounded bg-cyber-cyan/15 px-2.5 py-1 text-[11px] font-semibold text-cyber-cyan hover:bg-cyber-cyan/25"
            >
              {isLast ? 'Got it' : 'Next'}
              {!isLast && <ArrowRight size={12} />}
            </button>
            <button onClick={dismiss} className="rounded px-2.5 py-1 text-[11px] text-slate-500 hover:text-slate-300">
              Skip
            </button>
          </div>
        </div>
        <button onClick={dismiss} className="text-slate-500 hover:text-slate-300">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
