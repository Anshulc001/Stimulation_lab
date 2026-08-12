import { useEffect, useRef, useState } from 'react';
import { Skull } from 'lucide-react';

interface KillEvent {
  id: number;
  text: string;
}

const BOTS = ['Bot_Alpha', 'Bot_Bravo', 'Bot_Charlie', 'Shadow_99', 'Raider_07', 'GhostX', 'Nyx_Prime'];
const WEAPONS = ['M416', 'Vector', 'AKM', 'Kar98k', 'a grenade', 'the Blue Zone'];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

let counter = 0;

interface KillFeedProps {
  /** Higher = more frequent kill events (used to tie flavor pace to attack intensity). */
  intensity: number;
}

export function KillFeed({ intensity }: KillFeedProps) {
  const [events, setEvents] = useState<KillEvent[]>([]);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const baseDelay = Math.max(1400, 4200 - intensity * 350);
    const iv = setInterval(
      () => {
        counter += 1;
        const id = counter;
        const a = randomFrom(BOTS);
        const b = randomFrom(BOTS.filter((x) => x !== a));
        const weapon = randomFrom(WEAPONS);
        const text = weapon === 'the Blue Zone' ? `${a} was eliminated by ${weapon}` : `${a} was knocked by ${b} (${weapon})`;
        setEvents((e) => [...e.slice(-3), { id, text }]);
        const t = setTimeout(() => {
          setEvents((e) => e.filter((ev) => ev.id !== id));
          timeoutsRef.current = timeoutsRef.current.filter((pending) => pending !== t);
        }, 4000);
        timeoutsRef.current.push(t);
      },
      baseDelay + Math.random() * 1500
    );
    return () => {
      clearInterval(iv);
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [intensity]);

  return (
    <div className="pointer-events-none absolute right-2 top-8 z-[6] flex w-44 flex-col items-end gap-1">
      {events.map((e) => (
        <div
          key={e.id}
          className="animate-slide-in-right flex items-center gap-1.5 rounded bg-black/55 px-2 py-1 text-[9px] text-slate-200 backdrop-blur-[1px]"
        >
          <Skull size={10} className="flex-shrink-0 text-alert-red" />
          <span className="truncate">{e.text}</span>
        </div>
      ))}
    </div>
  );
}
