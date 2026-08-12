import { useEffect, useMemo, useRef, useState } from 'react';
import { TerminalSquare } from 'lucide-react';
import { useSimStore } from '../../store/simStore';
import { executeCommand } from '../../lib/commands';
import { COMMAND_REFERENCE } from '../../lib/commandReference';
import { isAttackScenario } from '../../lib/scenarios/registry';
import { PaneHeader } from '../Shared/PaneHeader';

const lineColor: Record<string, string> = {
  input: 'text-cyber-cyan',
  output: 'text-slate-300',
  error: 'text-alert-red',
  success: 'text-neon-green',
};

const COMMAND_NAMES = COMMAND_REFERENCE.map((c) => c.cmd);

export function Terminal() {
  const lines = useSimStore((s) => s.terminalLines);
  const activeScenario = useSimStore((s) => s.activeScenario);
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    if (!value || value.includes(' ')) return [];
    return COMMAND_NAMES.filter((c) => c.startsWith(value.toLowerCase())).slice(0, 5);
  }, [value]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const submit = () => {
    if (!value.trim() && value !== '') return;
    executeCommand(value);
    setHistory((h) => [...h, value]);
    setHistoryIdx(-1);
    setValue('');
    setShowSuggestions(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(nextIdx);
      setValue(history[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx === -1) return;
      const nextIdx = historyIdx + 1;
      if (nextIdx >= history.length) {
        setHistoryIdx(-1);
        setValue('');
      } else {
        setHistoryIdx(nextIdx);
        setValue(history[nextIdx]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const match = COMMAND_NAMES.find((c) => c.startsWith(value.toLowerCase()));
      if (match) setValue(match + ' ');
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const isFlooding = isAttackScenario(activeScenario);

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-slate-800/80 bg-[#05070d] shadow-inner"
      onClick={() => inputRef.current?.focus()}
    >
      <PaneHeader
        icon={<TerminalSquare size={14} />}
        title="Command Console"
        subtitle="root@kali:~ (simulated attacker shell — no real traffic is sent)"
        accent="green"
        right={
          <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isFlooding ? 'bg-alert-red animate-pulse-glow' : 'bg-neon-green'
              }`}
            />
            {isFlooding ? 'flooding' : 'idle'}
          </span>
        }
      />
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-3 py-2 text-[12px] leading-5 [scrollbar-gutter:stable]"
      >
        {lines.map((l) => (
          <div key={l.id} className={`${lineColor[l.type]} animate-fade-in`}>
            {l.type === 'input' ? (
              <span>
                <span className="text-neon-green">➜</span>{' '}
                <span className="text-cyber-cyan">~</span> <span className="text-slate-100">{l.text}</span>
              </span>
            ) : (
              <span className="whitespace-pre-wrap">{l.text || '\u00A0'}</span>
            )}
          </div>
        ))}
      </div>
      <div className="relative border-t border-slate-800/80 bg-[#070b16]">
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 border-t border-slate-800 bg-[#0b1120] shadow-lg">
            {suggestions.map((s) => (
              <button
                key={s}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setValue(s + ' ');
                  inputRef.current?.focus();
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] text-slate-300 hover:bg-slate-800/60"
              >
                <span className="text-cyber-cyan">{s}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="text-xs text-neon-green">➜</span>
          <span className="text-xs text-cyber-cyan">~</span>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={onKeyDown}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            className="flex-1 bg-transparent font-mono text-[12px] text-slate-100 caret-neon-green outline-none placeholder:text-slate-600"
            placeholder="type a command… try 'help' or 'guide'"
          />
        </div>
      </div>
    </div>
  );
}
