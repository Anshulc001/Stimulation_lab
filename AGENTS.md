# AGENTS.md — CyberLab Project Rules

This file is the persistent contract for every session working in this repo. **Read it
before making changes.** It encodes the project's model and conventions so nothing has
to be re-explained from scratch.

> **Self-updating rule:** whenever a change introduces or alters a behavior,
> convention, or principle, update this file in the same change so it stays accurate
> for future sessions. If a rule here no longer matches the code, fix the code or fix
> the rule — never leave them out of sync.

## What this project is

CyberLab is a fully client-side cyber-security **teaching simulator**:
- A BGMI (Battlegrounds Mobile India) match simulator, a Wireshark-style packet
  analyzer, match-server telemetry, and an interactive network topology.
- **Never make real network requests.** Packets, servers, attacks, and telemetry are
  all mocked. No external map tiles/GeoJSON either — the world map is hand-drawn SVG.
- Follow existing patterns: prefer editing existing files over creating new ones, and
  make the fewest changes that address the request. Verify a library is already used
  before employing it.

## The simulation model (do not regress)

The game server starts **stopped** and the client has **no sessions** by default.
Two independent flags in `src/store/simStore.ts` model connectivity:

| Flag          | Meaning                                  | Set when                                             |
|---------------|------------------------------------------|------------------------------------------------------|
| `lobbyActive` | Client ↔ Web/API (lobby) server session  | BGMI → FIND MATCH, terminal `start`                  |
| `gameActive`  | Client ↔ Match (game) server session     | entering the match (`in-match` stage), terminal `start` |

Invariants:

- **Scenarios never auto-start the game.** `setScenario` must not touch
  `lobbyActive`/`gameActive`. The server is brought up explicitly (`start` command or
  BGMI → FIND MATCH).
- **BGMI flow** (`src/components/Bgmi/BgmiApp.tsx`): FIND MATCH sets `lobbyActive`
  only (client is searching); reaching the `in-match` stage sets `gameActive`;
  leaving the match or closing the BGMI window sets **both** to false.
- **Close = disconnect everywhere.** Closing the BGMI window runs its `onClose` hook
  (`src/components/Desktop/apps.ts`), which clears both flags so the topology,
  Wireshark subtitle, telemetry idle banner, and `netstat` all flip to "disconnected"
  at the same time.
- **Topology reflects state** (`src/components/Topology/NetworkTopology.tsx`): link
  lines and particle streams are gated on the flags — client↔lobby on `lobbyActive`,
  client↔match on `gameActive`, lobby↔match on either. Offline = dimmed links, no
  particles, match node labeled `OFFLINE`. `WorldMapView` follows the same rules.
- **Minimize preserves state.** Minimized windows stay mounted with `display: none`
  (`src/components/Desktop/Window.tsx`); restoring must not reset app state (e.g. an
  in-progress BGMI match). Never revert this to unmounting on minimize.
- **Onboarding tour** (`src/components/Onboarding/OnboardingTour.tsx`): the container
  is `pointer-events-none` (only the visible card captures clicks) and dismissal is
  persisted to `localStorage` — it must not reappear on every reload or block clicks
  to windows behind it.

## Verification (always run before finishing)

- Typecheck: `npx tsc --noEmit`
- Tests: `npx vitest run` — keep them green; update tests when behavior changes
- Lint: `npx oxlint`

Commands run in **bash (Git Bash) on Windows** — use POSIX syntax (`ls`, `mv`, `rm`,
`grep`), never PowerShell/cmd built-ins. Create/edit files with the editing tools, not
`cat`/`echo`.

## Git & push rules

- Commit messages are concise, imperative, and focused on **why** — match the style in
  `git log`.
- **No AI/assistant branding anywhere**: not in commit messages, footers, code
  comments, or docs. No "Generated with", no co-author lines, no tool names. If one
  slips into a commit, amend it out before pushing.
- Only push when the user explicitly asks; push to `origin main`.
- Don't stage unrelated changes; keep the working tree meaningful.
