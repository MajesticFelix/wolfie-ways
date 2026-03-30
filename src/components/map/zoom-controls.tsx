'use client';

import { useMap } from '@vis.gl/react-google-maps';
import { Plus, Minus } from 'lucide-react';
import { useTransit } from '@/lib/stores/transit-store';

/**
 * Desktop-only zoom in/out buttons.
 * Rendered as a child of <Map> to access useMap().
 * Uses position:fixed so it floats over the map at viewport level.
 * Shifts left when the details panel is open.
 */
export function ZoomControls() {
  const map = useMap();
  const { state } = useTransit();
  const panelOpen = state.panelMode !== null;

  const zoom = (delta: number) => {
    if (!map) return;
    map.setZoom((map.getZoom() ?? 15) + delta);
  };

  return (
    <div
      className="hidden md:flex flex-col gap-1 pointer-events-auto"
      style={{
        position: 'fixed',
        top: '12px',
        right: panelOpen ? '412px' : '12px',
        zIndex: 19,
        transition: 'right 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <button
        onClick={() => zoom(1)}
        aria-label="Zoom in"
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:border-zinc-600 transition-colors shadow-lg"
      >
        <Plus className="w-4 h-4" />
      </button>
      <button
        onClick={() => zoom(-1)}
        aria-label="Zoom out"
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:border-zinc-600 transition-colors shadow-lg"
      >
        <Minus className="w-4 h-4" />
      </button>
    </div>
  );
}
