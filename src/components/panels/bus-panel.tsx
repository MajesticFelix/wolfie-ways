'use client';

import { Bus, Users, MapPin, Clock } from 'lucide-react';
import { normalizeColor, formatEtaSeconds, formatEtaMinutes, loadPercent } from '@/lib/utils/maps';
import { useTransit } from '@/lib/stores/transit-store';
import type { Vehicle, Route, Stop } from '@/lib/api/types';

interface BusPanelProps {
  vehicle: Vehicle;
  route?: Route;
  nextStop?: Stop;
  stops?: Map<number, Stop>;
}

export function BusPanel({ vehicle, route, nextStop, stops }: BusPanelProps) {
  const { selectStop, panMap } = useTransit();
  const color = normalizeColor(route?.color ?? '#3B82F6');
  const loadPct = loadPercent(vehicle.load, vehicle.capacity);

  const loadColor =
    loadPct >= 90 ? 'bg-red-500' :
    loadPct >= 70 ? 'bg-amber-500' :
    'bg-green-500';

  const loadLabel =
    loadPct >= 90 ? 'Very Full' :
    loadPct >= 70 ? 'Filling Up' :
    loadPct >= 40 ? 'Moderate' :
    'Available';

  const etaStops = vehicle.minutesToNextStops ?? [];
  const hasEtaStops = etaStops.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: color, boxShadow: `0 0 0 2px ${color}40` }}
        >
          <Bus className="w-7 h-7 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 leading-tight">
            Bus {vehicle.equipmentID}
          </h2>
          {route && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">{route.name}</p>
          )}
        </div>
      </div>

      {/* Next Stop — only show when etaArray is unavailable */}
      {!hasEtaStops && nextStop && (
        <div className="p-3 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/40">
          <div className="flex items-center gap-2 mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
            <span className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wide font-medium">Next Stop</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-snug">{nextStop.name}</span>
            {vehicle.nextStopETA >= 0 && (
              <span
                className="text-sm font-bold tabular-nums shrink-0 px-2 py-0.5 rounded-lg"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {formatEtaSeconds(vehicle.nextStopETA)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Upcoming stops from etaArray */}
      {hasEtaStops && (
        <div className="rounded-xl bg-zinc-100/80 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/40 overflow-hidden">
          <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-zinc-200/60 dark:border-zinc-700/40">
            <Clock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
            <span className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wide font-medium">Upcoming Stops</span>
          </div>
          <div className="divide-y divide-zinc-200/60 dark:divide-zinc-700/30 overflow-y-auto scrollbar-none">
            {etaStops.map((eta, i) => {
              const stop = stops?.get(eta.stopID);
              const stopName = stop?.name ?? `Stop ${eta.stopID}`;
              const isNext = i === 0;
              return (
                <div
                  key={`${eta.stopID}-${i}`}
                  onClick={() => {
                    selectStop(eta.stopID);
                    if (stop) panMap(stop.lat, stop.lng, 18);
                  }}
                  className={`flex items-center justify-between gap-3 px-3 py-3 cursor-pointer transition-colors hover:bg-zinc-200/60 dark:hover:bg-zinc-700/40 ${
                    isNext ? 'bg-zinc-200/40 dark:bg-zinc-700/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center shrink-0 self-stretch justify-center gap-0.5">
                      <div
                        className="rounded-full"
                        style={{
                          width: isNext ? 10 : 7,
                          height: isNext ? 10 : 7,
                          backgroundColor: isNext ? color : undefined,
                          border: isNext ? `2px solid ${color}` : '2px solid currentColor',
                          opacity: isNext ? 1 : 0.3,
                        }}
                      />
                    </div>
                    <span className={`text-sm leading-snug truncate ${
                      isNext
                        ? 'text-zinc-900 dark:text-zinc-100 font-semibold'
                        : 'text-zinc-600 dark:text-zinc-300 font-medium'
                    }`}>
                      {stopName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {eta.status && eta.status !== 'On Time' && (
                      <span className="text-xs text-amber-500 dark:text-amber-400">{eta.status}</span>
                    )}
                    <span
                      className="text-sm font-bold tabular-nums px-2 py-0.5 rounded-lg"
                      style={isNext
                        ? { backgroundColor: `${color}20`, color }
                        : { color: undefined }
                      }
                    >
                      <span className={isNext ? '' : 'text-zinc-500 dark:text-zinc-400'}>
                        {formatEtaMinutes(eta.minutes)}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Capacity */}
      {vehicle.capacity > 0 && (
        <div className="p-3 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
              <span className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wide font-medium">Capacity</span>
            </div>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {vehicle.load} / {vehicle.capacity} —{' '}
              <span className="text-zinc-700 dark:text-zinc-300">{loadLabel}</span>
            </span>
          </div>
          <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${loadColor}`}
              style={{ width: `${loadPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
