import { Loader2 } from 'lucide-react';

export function PaneSkeleton({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-2 rounded-md border border-slate-800/80 bg-[#05070d] text-slate-600">
      <Loader2 size={18} className="animate-spin" />
      <span className="text-[11px]">Loading {label}…</span>
    </div>
  );
}
