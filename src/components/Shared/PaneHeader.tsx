import type { ReactNode } from 'react';

interface PaneHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  accent?: 'green' | 'cyan' | 'red';
  right?: ReactNode;
}

const accentClasses: Record<NonNullable<PaneHeaderProps['accent']>, string> = {
  green: 'text-neon-green',
  cyan: 'text-cyber-cyan',
  red: 'text-alert-red',
};

const glowClasses: Record<NonNullable<PaneHeaderProps['accent']>, string> = {
  green: 'shadow-[inset_0_-1px_0_rgba(34,197,94,0.35)]',
  cyan: 'shadow-[inset_0_-1px_0_rgba(6,182,212,0.35)]',
  red: 'shadow-[inset_0_-1px_0_rgba(239,68,68,0.45)]',
};

export function PaneHeader({ icon, title, subtitle, accent = 'cyan', right }: PaneHeaderProps) {
  return (
    <div
      className={`flex items-center justify-between gap-3 border-b border-slate-800/80 bg-[#0b1120] px-3 py-2 ${glowClasses[accent]}`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className={accentClasses[accent]}>{icon}</span>
        <div className="min-w-0">
          <h2 className="truncate text-xs font-semibold uppercase tracking-wide text-slate-200">
            {title}
          </h2>
          {subtitle && <p className="truncate text-[10px] text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  );
}
