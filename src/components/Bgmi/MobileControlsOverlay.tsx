import { Crosshair, ChevronsUp, PersonStanding, Compass } from 'lucide-react';

/**
 * A cosmetic, non-functional overlay mimicking a mobile battle-royale touch
 * HUD (virtual joystick, fire button, jump/crouch, compass, weapon slots).
 * Purely visual — it demonstrates what the mobile client UI would look like
 * layered over the same live telemetry-driven match view.
 */
export function MobileControlsOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[5]">
      {/* Compass strip */}
      <div className="absolute left-1/2 top-1 flex -translate-x-1/2 items-center gap-1 overflow-hidden rounded bg-black/40 px-3 py-0.5 text-[9px] text-slate-300">
        <Compass size={10} className="text-cyber-cyan" />
        <span className="font-mono tracking-widest">N · 30 · 60 · E · 120 · 150 · S</span>
      </div>

      {/* Virtual joystick (bottom-left) */}
      <div className="absolute bottom-3 left-3 flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-black/25 backdrop-blur-[1px]">
        <div className="h-7 w-7 rounded-full border border-white/30 bg-white/10 shadow-inner" />
      </div>

      {/* Weapon slots (bottom-center) */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {['M416', 'Vector'].map((w) => (
          <div
            key={w}
            className="flex h-8 w-14 items-center justify-center rounded border border-white/15 bg-black/30 text-[8px] font-semibold text-slate-300"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Fire / jump / crouch (bottom-right) */}
      <div className="absolute bottom-3 right-3 flex flex-col items-end gap-1.5">
        <div className="flex gap-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/25">
            <ChevronsUp size={12} className="text-slate-300" />
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/25">
            <PersonStanding size={12} className="text-slate-300" />
          </div>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-alert-red/60 bg-alert-red/20 shadow-[0_0_16px_rgba(239,68,68,0.35)]">
          <Crosshair size={20} className="text-alert-red" />
        </div>
      </div>
    </div>
  );
}
