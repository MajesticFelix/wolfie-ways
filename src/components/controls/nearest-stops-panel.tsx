'use client';

import { MapPin, Navigation, LocateFixed, WifiOff } from 'lucide-react';
import { memo } from 'react';
import { useNearestStops } from '@/lib/hooks/use-nearest-stops';
import { useTransit } from '@/lib/stores/transit-store';
import { resolveRouteColor } from '@/lib/utils/maps';
import { useDarkMode } from '@/lib/hooks/use-dark-mode';
import type { Stop, Route } from '@/lib/api/types';

interface NearestStopsPanelProps {
  stops: Stop[];
  routes: Route[];
}

export const NearestStopsPanel = memo(function NearestStopsPanel({ stops, routes }: NearestStopsPanelProps) {
  const { geoState, nearest, requestLocation } = useNearestStops(stops);
  const { selectStop, panMap } = useTransit();
  const isDark = useDarkMode();

  // Build stopId → route colors map
  const stopRouteColors = new Map<number, string[]>();
  for (const route of routes) {
    const color = resolveRouteColor(route.color, isDark);
    for (const stopId of route.stops) {
      const existing = stopRouteColors.get(stopId) ?? [];
      if (!existing.includes(color)) stopRouteColors.set(stopId, [...existing, color]);
    }
  }

  return (
    <div className="w-full select-none">
      <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
        <span className="text-[10px] font-black tracking-[0.18em] uppercase text-black dark:text-white">
          Nearby
        </span>
        {geoState === 'granted' && (
          <button
            onClick={requestLocation}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            aria-label="Refresh location"
          >
            <LocateFixed className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="px-2 pb-2">
        {geoState === 'idle' && (
          <button
            onClick={requestLocation}
            className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg bg-black/4 dark:bg-white/6 hover:bg-black/8 dark:hover:bg-white/10 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Use my location
            </span>
          </button>
        )}

        {geoState === 'loading' && (
          <div className="flex items-center gap-2.5 px-2.5 py-2.5">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-600 dark:border-t-zinc-300 animate-spin shrink-0" />
            <span className="text-xs text-zinc-400 dark:text-zinc-500">Finding you…</span>
          </div>
        )}

        {(geoState === 'denied' || geoState === 'unavailable') && (
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <WifiOff className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="text-xs text-zinc-400 dark:text-zinc-500">Location unavailable</span>
          </div>
        )}

        {geoState === 'granted' && nearest.length === 0 && (
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="text-xs text-zinc-400 dark:text-zinc-500">No stops found</span>
          </div>
        )}

        {geoState === 'granted' && nearest.map(({ stop, distanceM }) => {
          const colors = stopRouteColors.get(stop.id) ?? ['#3B82F6'];
          return (
            <button
              key={stop.id}
              onClick={() => {
                selectStop(stop.id);
                panMap(stop.lat, stop.lng, 16);
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-black/4 dark:hover:bg-white/4 transition-colors group"
            >
              {/* Route color dots */}
              <div className="flex items-center gap-0.5 shrink-0">
                {colors.slice(0, 3).map((c, i) => (
                  <div
                    key={i}
                    className="rounded-full"
                    style={{ width: 5, height: 5, backgroundColor: c }}
                  />
                ))}
              </div>

              {/* Stop name */}
              <span className="flex-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white truncate transition-colors">
                {stop.name}
              </span>

              {/* Distance */}
              <span className="text-[10px] font-mono tabular-nums text-zinc-400 dark:text-zinc-500 shrink-0">
                {formatDistance(distanceM)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
