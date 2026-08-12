import { BookOpen } from 'lucide-react';
import { GuideContent } from './GuideContent';

export function GuideApp() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-slate-800/80 bg-[#05070d]">
      <div className="flex items-center gap-2 border-b border-slate-800/80 bg-[#0b1120] px-3 py-2">
        <BookOpen size={14} className="text-cyber-cyan" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-200">CyberLab Guide</h2>
      </div>
      <GuideContent />
    </div>
  );
}
