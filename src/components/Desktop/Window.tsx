import { Suspense, useRef } from 'react';
import { Maximize2, Minimize2, Minus, X } from 'lucide-react';
import { useWindowStore, type OpenWindow } from '../../store/windowStore';
import { PaneSkeleton } from '../Shared/PaneSkeleton';
import { ErrorBoundary } from '../Shared/ErrorBoundary';
import type { AppDef } from './apps';

interface WindowProps {
  win: OpenWindow;
  appDef: AppDef;
  boundsWidth: number;
  boundsHeight: number;
}

const TITLE_BAR_HEIGHT = 34;

export function Window({ win, appDef, boundsWidth, boundsHeight }: WindowProps) {
  const { focusWindow, closeWindow, minimizeWindow, toggleMaximize, moveWindow, resizeWindow } = useWindowStore();
  const dragRef = useRef<{ startX: number; startY: number; winX: number; winY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; width: number; height: number } | null>(null);
  const Component = appDef.component;
  const isMobile = boundsWidth < 640;

  if (win.minimized) return null;

  const onTitlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isMobile || win.maximized) return;
    focusWindow(win.id);
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, winX: win.x, winY: win.y };
  };
  const onTitlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const newX = Math.min(Math.max(-win.width + 120, dragRef.current.winX + dx), boundsWidth - 60);
    const newY = Math.min(Math.max(0, dragRef.current.winY + dy), boundsHeight - TITLE_BAR_HEIGHT);
    moveWindow(win.id, newX, newY);
  };
  const onTitlePointerUp = () => {
    dragRef.current = null;
  };

  const onResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isMobile) return;
    e.stopPropagation();
    focusWindow(win.id);
    (e.target as Element).setPointerCapture(e.pointerId);
    resizeRef.current = { startX: e.clientX, startY: e.clientY, width: win.width, height: win.height };
  };
  const onResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeRef.current) return;
    const dx = e.clientX - resizeRef.current.startX;
    const dy = e.clientY - resizeRef.current.startY;
    resizeWindow(
      win.id,
      Math.max(320, resizeRef.current.width + dx),
      Math.max(240, resizeRef.current.height + dy)
    );
  };
  const onResizePointerUp = () => {
    resizeRef.current = null;
  };

  const windowStyle = isMobile
    ? { left: 0, top: 0, width: boundsWidth, height: boundsHeight, zIndex: win.zIndex }
    : { left: win.x, top: win.y, width: win.width, height: win.height, zIndex: win.zIndex };

  return (
    <div
      className={`absolute flex flex-col overflow-hidden bg-[#0b1120] shadow-2xl ${isMobile ? 'inset-0 rounded-none border-0' : 'rounded-lg border border-slate-700/80'}`}
      style={windowStyle}
      onPointerDown={() => focusWindow(win.id)}
    >
      <div
        className={`flex flex-shrink-0 items-center gap-2 border-b border-slate-800 bg-gradient-to-b from-[#1a2236] to-[#101726] px-3 sm:px-2 ${isMobile ? 'h-12 py-2' : 'cursor-grab py-1.5 active:cursor-grabbing'}`}
        style={isMobile ? undefined : { touchAction: 'none' }}
        onPointerDown={onTitlePointerDown}
        onPointerMove={onTitlePointerMove}
        onPointerUp={onTitlePointerUp}
        onDoubleClick={() => toggleMaximize(win.id, boundsWidth, boundsHeight)}
      >
        <appDef.icon size={isMobile ? 16 : 13} style={{ color: appDef.iconColor }} />
        <span className={`flex-1 truncate font-medium text-slate-300 ${isMobile ? 'text-sm' : 'text-[11px]'}`}>{win.title}</span>
        <button
          onClick={() => minimizeWindow(win.id)}
          className={`rounded text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-slate-100 ${isMobile ? 'p-3' : 'p-1.5'}`}
          title="Minimize"
          aria-label={`Minimize ${win.title}`}
        >
          <Minus size={isMobile ? 14 : 11} />
        </button>
        {!isMobile && (
          <button
            onClick={() => toggleMaximize(win.id, boundsWidth, boundsHeight)}
            className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-slate-100"
            title={win.maximized ? 'Restore' : 'Maximize'}
            aria-label={win.maximized ? `Restore ${win.title}` : `Maximize ${win.title}`}
          >
            {win.maximized ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
          </button>
        )}
        <button
          onClick={() => closeWindow(win.id)}
          className={`rounded text-slate-400 transition-colors hover:bg-alert-red/80 hover:text-white ${isMobile ? 'p-3' : 'p-1.5'}`}
          title="Close"
          aria-label={`Close ${win.title}`}
        >
          <X size={isMobile ? 15 : 12} />
        </button>
      </div>
      <div className="min-h-0 flex-1 bg-[#05070d] p-1.5">
        <ErrorBoundary label={appDef.shortLabel}>
          <Suspense fallback={<PaneSkeleton label={appDef.shortLabel} />}>
            <Component />
          </Suspense>
        </ErrorBoundary>
      </div>
      {!isMobile && !win.maximized && (
        <div
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
          style={{ touchAction: 'none' }}
          className="absolute bottom-0 right-0 h-5 w-5 cursor-nwse-resize"
        >
          <svg viewBox="0 0 16 16" className="h-full w-full text-slate-600">
            <path d="M14 2 L2 14 M14 8 L8 14 M14 14 L14 14" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      )}
    </div>
  );
}
