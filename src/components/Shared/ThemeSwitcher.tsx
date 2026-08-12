import { useState } from 'react';
import { Palette } from 'lucide-react';
import { useSimStore } from '../../store/simStore';
import type { Theme } from '../../types';

const THEMES: { id: Theme; label: string; swatch: string }[] = [
  { id: 'cyberpunk', label: 'Cyberpunk', swatch: '#22c55e' },
  { id: 'neon-purple', label: 'Neon Purple', swatch: '#a855f7' },
  { id: 'amber', label: 'Amber', swatch: '#f59e0b' },
];

export function ThemeSwitcher() {
  const theme = useSimStore((s) => s.theme);
  const setTheme = useSimStore((s) => s.setTheme);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Switch color theme"
        aria-label="Switch color theme"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center justify-center rounded border border-slate-700 p-1.5 text-slate-400 transition-all hover:border-slate-500 hover:text-slate-200 hover:shadow-[0_0_10px_color-mix(in_srgb,var(--np-neon-green)_15%,transparent)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-green/60"
      >
        <Palette size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-1.5 w-40 overflow-hidden rounded border border-slate-700 bg-[#0b1120] shadow-xl">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] transition-all hover:bg-slate-800/60 hover:pl-4 focus-visible:outline-none focus-visible:bg-slate-800/60 ${
                  theme === t.id ? 'text-slate-100' : 'text-slate-400'
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full border border-white/20"
                  style={{ background: t.swatch }}
                />
                {t.label}
                {theme === t.id && <span className="ml-auto text-[9px] text-slate-500">active</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
