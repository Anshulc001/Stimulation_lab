# CyberLab — Network & Server Attack Simulator

An interactive, **100% client-side** Kali-style desktop simulator for visualizing network attacks, DDoS floods, packet capture, and live server telemetry. Built for security education, demos, and CTF-style walkthroughs.

> ⚠️ **Everything is simulated.** No real network traffic is ever sent, no real attacks are performed, and nothing leaves your browser. CyberLab is purely a teaching/demo tool.

![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6) ![React](https://img.shields.io/badge/React-19-61dafb) ![Vite](https://img.shields.io/badge/Vite-8-646cff) ![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8) ![Zustand](https://img.shields.io/badge/Zustand-5-orange)

---

## Table of Contents

- [What is it?](#what-is-it)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [How to Run](#how-to-run)
- [How the Simulation Works](#how-the-simulation-works)
- [Adding a New Scenario](#adding-a-new-scenario)
- [Adding a New Scenario Family (Category)](#adding-a-new-scenario-family-category)
- [Adding a New Network Layer / Protocol Operation](#adding-a-new-network-layer--protocol-operation)
- [Adding Something Totally Different (a New Desktop App)](#adding-something-totally-different-a-new-desktop-app)
- [Testing](#testing)
- [Learning / Where to See More](#learning--where-to-see-more)
- [Ethical Note](#ethical-note)

---

## What is it?

CyberLab presents a fake "BGMI match server" under attack. You play the role of a network operator / hacker in a Kali-style desktop environment:

- Launch attacks from a **terminal** (`hping3 --flood`, `nmap`, `arpspoof`, `slowloris`, …) or from one-click **Scenario buttons**.
- Watch **packets** stream in a Wireshark-style analyzer.
- Watch the server's **CPU / ping / tick rate / packet loss / player count** react in real time.
- Mitigate with **WAF toggling**, manual **firewall blocking** (`block <ip>` / `iptables`), or an anti-cheat **HWID ban** (`ban`).
- See the whole attack visualized on a **network topology** map.

Because every scenario is defined by a *pure, data-driven definition* (not hardcoded UI), the sim is very easy to extend — see [Adding a New Scenario](#adding-a-new-scenario).

## Features

| Area | What you get |
| --- | --- |
| 🖥️ **Kali-style Desktop** | Draggable/resizable/maximizable windows, taskbar, app launcher, themes (Cyberpunk / Neon Purple / Amber), fullscreen mode |
| 💻 **Terminal** | `ping`, `traceroute`, `whois`, `netstat`, `nmap`, `arpspoof`, `hping3`, `slowloris`, `sniff`, `waf`, `block`, `iptables`, `ban`, `status`, `guide`, `help` |
| 📡 **Wireshark analyzer** | Live packet table with hex/ASCII dump, protocol distribution chart, filter bar (`src==`, `proto==`, `ip.addr==` …) |
| 📈 **System Monitor** | Live CPU, ping, tick rate, packet loss, player count, bandwidth gauges + line charts |
| 🗺️ **Network Topology** | Animated client → gateway → match server graph; MITM rerouting, flood pulses, amplify bursts |
| 🎛️ **Scenario Control** | One-click launch of every scenario, grouped by Recon / Attack / Defense |
| 🛡️ **Defense ops** | WAF mitigation toggle, per-IP firewall DROP rules, HWID ban enforcement flow |
| 🎮 **BGMI Match Simulator** | In-app gameplay widget (plane drop, kill feed, mini-map) that reacts to network health |
| 📖 **In-app Guide** | Auto-generated from the scenario registry — always in sync with what you add |

## Tech Stack

- **React 19** + **TypeScript 6** — UI & types
- **Vite 8** — dev server & build
- **Tailwind CSS 4** — styling
- **Zustand 5** — state management (`src/store/`)
- **Recharts** — telemetry charts
- **lucide-react** — icons
- **Vitest** — unit tests
- **oxlint** — linting

## Project Structure

```
├── index.html                     # App shell, meta tags
├── package.json                   # Scripts & dependencies
├── vite.config.ts / vitest.config.ts
├── src/
│   ├── main.tsx                   # Entry point
│   ├── App.tsx                    # Root: theme, font-size, sim engine
│   ├── types.ts                   # ★ Central shared types (ScenarioId, Packet, Protocol, …)
│   ├── lib/
│   │   ├── scenarios/
│   │   │   ├── types.ts           # ★ ScenarioDefinition interface
│   │   │   ├── baseline.ts        #    one file per scenario…
│   │   │   ├── sniffing.ts
│   │   │   ├── portscan.ts
│   │   │   ├── arpspoof.ts
│   │   │   ├── synflood.ts
│   │   │   ├── amplification.ts
│   │   │   ├── slowloris.ts
│   │   │   ├── recovering.ts
│   │   │   └── registry.ts        # ★ Registers every scenario in one map
│   │   ├── packetGenerator.ts     # ★ makeXxxPacket() factories (UDP/TCP/ARP…)
│   │   ├── useSimulationEngine.ts # ★ Central 100ms/500ms sim loop
│   │   ├── commands.ts            # ★ Terminal command handlers
│   │   ├── commandReference.ts    #    help/usage text for commands
│   │   └── packetFilter.ts        #    Wireshark-style filter parser
│   ├── store/
│   │   ├── simStore.ts            # ★ Global simulation state (Zustand)
│   │   ├── windowStore.ts         #    Desktop window manager
│   │   └── uiStore.ts             #    UI prefs (font size, …)
│   └── components/
│       ├── Desktop/               # Desktop, Taskbar, Window, apps.ts (app registry)
│       ├── Terminal/              # Terminal UI
│       ├── Wireshark/             # Packet analyzer
│       ├── Telemetry/             # System monitor
│       ├── Topology/              # Network topology views
│       ├── Guide/                 # Auto-generated in-app guide
│       ├── Bgmi/                  # Match simulator
│       └── Shared/                # ErrorBoundary, FullscreenToggle, ThemeSwitcher…
```

Files marked with **★** are the ones you will touch most when extending the sim.

## How to Run

Requires **Node.js 18+** and npm.

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (http://localhost:5173)
npm run dev

# 3. Production build (type-checks first, outputs to dist/)
npm run build

# 4. Preview the production build locally
npm run preview

# 5. Run the unit tests
npm test

# 6. Lint
npm run lint
```

> The `build` script runs `tsc -b && vite build`, so a clean `npm run build` also validates all types.

## How the Simulation Works

A single hook, [`useSimulationEngine`](src/lib/useSimulationEngine.ts), drives everything from the currently **active scenario definition**:

1. Every **100 ms** it calls `scenario.generatePackets(wafActive, elapsedSec)` and pushes the returned `Packet[]` into the store (the Wireshark window renders them).
2. Every **500 ms** it calls `scenario.telemetryTarget(elapsedSec, wafActive)` and eases the live CPU / ping / tick / loss / player values toward those targets (the System Monitor renders them).
3. The active scenario is stored in `simStore.activeScenario`; anything can switch it (`setScenario(id)`).

Scenarios are registered in one map — [`registry.ts`](src/lib/scenarios/registry.ts) — and the **Scenario bar**, **Scenario Control app**, and **Guide** all render automatically from `SCENARIO_LIST`, so a new scenario appears in the UI with **zero UI changes**.

## Adding a New Scenario

A scenario = a `ScenarioDefinition` object (see [`src/lib/scenarios/types.ts`](src/lib/scenarios/types.ts)) that answers two questions: *what telemetry should the server show?* and *what packets should appear?*

For example, to add a **"DNS Amplification"** scenario:

### 1. Add the id to the `ScenarioId` union — `src/types.ts`

```ts
export type ScenarioId =
  | 'baseline' | 'sniffing' | 'portscan' | 'arpspoof'
  | 'synflood' | 'amplification' | 'slowloris' | 'recovering'
  | 'dnsamp';          // ← your new id
```

### 2. Create the scenario file — `src/lib/scenarios/dnsamp.ts`

Copy the shape of an existing scenario (e.g. `amplification.ts`) and fill it in:

```ts
import type { ScenarioDefinition } from './types';

export const dnsampScenario: ScenarioDefinition = {
  id: 'dnsamp',
  label: 'Simulate DNS Amplification',
  shortLabel: 'DNS Amp',
  category: 'attack',                 // 'idle' | 'recon' | 'attack' | 'defense'
  terminalCommand: 'hping3 --udp --spoof <ip> -p 53',   // shown in Guide
  runCommand: 'hping3 --udp --spoof 10.0.0.10 -p 53', // executed by the Scenario button
  aliases: [],
  description: 'Spoofed queries to open DNS resolvers return huge amplified responses.',
  severity: 'critical',               // 'none' | 'recon' | 'moderate' | 'critical'
  topologyEffect: 'amplify-burst',    // see TopologyEffect in src/types.ts
  mitigable: true,                    // does WAF dampen it?
  telemetryTarget: (elapsedSec, waf) => {
    const ramp = Math.min(1, elapsedSec / 4);
    const dampen = waf ? 0.4 : 1;
    return {
      cpu: 20 + ramp * 80 * dampen,
      ping: 35 + ramp * 900 * dampen,
      tick: Math.max(waf ? 25 : 0, 60 - ramp * 60 * dampen),
      packetLoss: ramp * (waf ? 10 : 45),
      playerDelta: -ramp * (waf ? 0.4 : 1.4),
      health: ramp > 0.75 && !waf ? 'critical' : ramp > 0.3 && !waf ? 'degraded' : 'optimal',
    };
  },
  generatePackets: (waf) => {
    const count = Math.floor((Math.random() * 6 + 4) * (waf ? 0.3 : 1));
    return Array.from({ length: count }, () => makeDnsAmpPacket());
  },
  autoEndAfterSec: 25,                // optional: auto-return to baseline
};
```

### 3. Add a packet factory (optional) — `src/lib/packetGenerator.ts`

If your scenario needs a new kind of packet, add a `makeXxxPacket()` factory here:

```ts
export function makeDnsAmpPacket(): Packet {
  packetCounter += 1;
  return {
    id: packetCounter,
    no: packetCounter,
    time: elapsedSeconds(),
    src: '198.51.100.201 (DNS-reflector)',
    dst: `${MATCH_SERVER}:${MATCH_PORT}`,
    protocol: 'UDP',
    length: 4096,
    info: `[AMPLIFIED] ANY Query Reply Seq=${Math.floor(Math.random() * 999999)}`,
    malicious: true,
    hex: randomHex(16),
    ascii: hexToAscii(randomHex(16)),
  };
}
```

### 4. Register it — `src/lib/scenarios/registry.ts`

```ts
import { dnsampScenario } from './dnsamp';

export const SCENARIOS: Record<ScenarioId, ScenarioDefinition> = {
  // ...existing...
  dnsamp: dnsampScenario,   // ← add here
};
```

That's it — the Scenario bar, Scenario Control panel, and Guide pick it up automatically.

### 5. Optional: add a terminal command

To launch it by typing a command, add a handler in [`src/lib/commands.ts`](src/lib/commands.ts) and a usage entry in [`src/lib/commandReference.ts`](src/lib/commandReference.ts).

### 6. Update the registry test — `src/lib/scenarios/registry.test.ts`

The test asserts the exact scenario list. Update the expected ids array:

```ts
expect(ids).toEqual(['amplification', 'arpspoof', 'baseline', 'dnsamp', 'portscan', 'recovering', 'slowloris', 'sniffing', 'synflood'].sort());
```

### Files to touch — summary

| What | File |
| --- | --- |
| Scenario id | `src/types.ts` |
| Scenario definition | `src/lib/scenarios/<name>.ts` (new) |
| Packet factory (optional) | `src/lib/packetGenerator.ts` |
| Registration | `src/lib/scenarios/registry.ts` |
| Terminal command (optional) | `src/lib/commands.ts`, `src/lib/commandReference.ts` |
| Tests | `src/lib/scenarios/registry.test.ts` |

## Adding a New Scenario Family (Category)

"Family" = the scenario **category** (`idle`, `recon`, `attack`, `defense`). Adding a brand-new family, e.g. **`malware`** (host-based threats), touches 4 places:

### 1. Extend the union — `src/types.ts`

```ts
export type ScenarioCategory = 'idle' | 'recon' | 'attack' | 'defense' | 'malware';
```

### 2. Guide label & color — `src/components/Guide/GuideContent.tsx`

Add entries to `CATEGORY_LABEL` and `CATEGORY_COLOR`:

```ts
const CATEGORY_LABEL = { idle: 'Idle / Baseline', recon: 'Reconnaissance', attack: 'Attacks', defense: 'Defense', malware: 'Malware' };
const CATEGORY_COLOR = { /* ... */ malware: 'text-purple-400 border-purple-400/30 bg-purple-400/5' };
```

### 3. Scenario bar grouping & colors — `src/components/ScenarioBar.tsx`

Add your family to `GROUPS` and `ACCENT`:

```ts
const GROUPS = [
  { label: 'Recon', category: 'recon' },
  { label: 'Attacks', category: 'attack' },
  { label: 'Defense', category: 'defense' },
  { label: 'Malware', category: 'malware' },   // ← new row of buttons
];
```

### 4. Incident severity mapping — `src/store/simStore.ts`

`setScenario` maps category → incident severity (`attack` → `critical`, `defense` → `success`, else `info`). Add your family if it deserves its own severity:

```ts
const severity =
  def.category === 'attack' ? 'critical'
  : def.category === 'malware' ? 'critical'
  : def.category === 'defense' ? 'success' : 'info';
```

Then just follow [Adding a New Scenario](#adding-a-new-scenario) with `category: 'malware'` on each scenario.

## Adding a New Network Layer / Protocol Operation

"Layer operation" = a new protocol / packet kind in the packet stream. Protocols live in the `Protocol` union in `src/types.ts` (`UDP | TCP | ICMP | ARP`). To add e.g. **`DNS`** (application layer over UDP) or a raw layer-2 protocol:

### 1. Extend the `Protocol` union — `src/types.ts`

```ts
export type Protocol = 'UDP' | 'TCP' | 'ICMP' | 'ARP' | 'DNS';
```

### 2. Add a packet factory — `src/lib/packetGenerator.ts`

```ts
export function makeDnsQueryPacket(): Packet { /* ... protocol: 'DNS', malicious: false/true ... */ }
```

### 3. Use it in a scenario — `src/lib/scenarios/<name>.ts`

Call your factory inside `generatePackets`. The Wireshark window and `proto==dns` filter work automatically because they read `packet.protocol`.

> If you add a **new severity, topology effect, or health state**, extend `ScenarioSeverity` / `TopologyEffect` / `ServerHealth` in `src/types.ts` and handle the new topology effect in `src/components/Topology/NetworkTopology.tsx`.

## Adding Something Totally Different (a New Desktop App)

Want an entirely new subsystem — e.g. a **SQL injection lab** or a **log viewer**? Add it as a new desktop app:

### 1. Create the component — `src/components/Sqlinjection/SqlinjectionApp.tsx`

Just a normal React component. Read sim state from `useSimStore` (or `useWindowStore`) — everything is reactive.

### 2. Register it — `src/components/Desktop/apps.ts`

```ts
import { Syringe } from 'lucide-react';
const SqlinjectionApp = lazy(() => import('../Sqlinjection/SqlinjectionApp').then(m => ({ default: m.SqlinjectionApp })));

export const APPS: AppDef[] = [
  // ...existing...
  {
    id: 'sqlinjection',
    title: 'SQL Injection Lab',
    shortLabel: 'SQLi Lab',
    icon: Syringe,
    iconColor: '#f472b6',
    component: SqlinjectionApp,
    defaultWidth: 620,
    defaultHeight: 460,
  },
];
```

The app icon appears in the desktop launcher and taskbar automatically. If your new subsystem needs new store state, add fields/actions to `src/store/simStore.ts`.

## Testing

```bash
npm test              # run all unit tests
npm run lint          # oxlint
npm run build         # full type-check + production build
```

Test files live next to the code they cover:

- `src/lib/scenarios/registry.test.ts` — scenario registry invariants (bounds, packet validity, WAF dampening)
- `src/lib/packetGenerator.test.ts` — packet factories
- `src/lib/packetFilter.test.ts` — Wireshark filter parser
- `src/lib/commands.test.ts` — terminal command parser
- `src/store/simStore.test.ts` — store actions
- `src/store/windowStore.test.ts` — window manager

## Learning / Where to See More

- **In the app:** type `guide` in the terminal (or open the **Guide** app) for the auto-generated scenario + command reference.
- **In the app:** type `help` for every command, `status` for live telemetry.
- **Source maps:** each scenario file is a self-contained worked example of `telemetryTarget` + `generatePackets` — start with `baseline.ts` (simplest), then `synflood.ts` / `amplification.ts`.
- **The simulation engine** `src/lib/useSimulationEngine.ts` is ~70 lines and is the entire "backend" of the sim.

## Ethical Note

CyberLab is an **educational simulation**. The commands are fake, the packets are fake, and the attacks do not exist outside your browser. Don't use real attack tools against systems you don't own — and use what you learn here to defend, not to break.
