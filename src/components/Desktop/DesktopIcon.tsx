import type { ReactNode } from 'react';

interface DesktopIconProps {
  label: string;
  icon: ReactNode;
  onOpen: () => void;
}

export function DesktopIcon({ label, icon, onOpen }: DesktopIconProps) {
  return (
    <button
      onClick={onOpen}
      onDoubleClick={onOpen}
      className="flex w-20 flex-col items-center gap-1 rounded p-2 text-center outline-none transition-colors hover:bg-white/5 focus-visible:bg-cyber-cyan/20 focus-visible:ring-1 focus-visible:ring-cyber-cyan/50 active:scale-95"
    >
      <div className="flex h-11 w-11 items-center justify-center">{icon}</div>
      <span
        className="text-[10.5px] font-medium leading-tight text-slate-100"
        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
      >
        {label}
      </span>
    </button>
  );
}
