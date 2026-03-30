'use client';

import { Clock, Bus, MapPin, ChevronDown, ChevronUp, Wifi } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useStopETAs, useStopSchedules } from '@/lib/hooks/use-stop-etas';
import { normalizeColor, formatEtaMinutes, formatTime12h, parseAmenities, stopImageUrl } from '@/lib/utils/maps';
import type { Stop, Route, StopImage } from '@/lib/api/types';

interface StopPanelProps {
  stop: Stop;
  routes: Route[];
  stopImage?: StopImage;
}

export function StopPanel({ stop, routes, stopImage }: StopPanelProps) {
  const [showSchedule, setShowSchedule] = useState(false);
  const { data: etas, isLoading: etasLoading } = useStopETAs(stop.id);
  const { data: schedules } = useStopSchedules(showSchedule ? stop.id : null);

  const routeMap = new Map(routes.map((r) => [r.id, r]));
  const amenities = parseAmenities(stopImage?.amenities ?? '');

  const allETAs = etas?.flatMap((e) => e.enRoute) ?? [];
  const sortedETAs = [...allETAs].sort((a, b) => a.minutes - b.minutes);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5 text-zinc-500 dark:text-zinc-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-base text-zinc-900 dark:text-zinc-100 leading-tight">{stop.name}</h2>
          {stop.shortName && stop.shortName !== stop.name && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{stop.shortName}</p>
          )}
        </div>
      </div>

      {/* Amenities */}
      {amenities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {amenities.map((a) => (
            <Badge
              key={a}
              variant="secondary"
              className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
            >
              {a}
            </Badge>
          ))}
        </div>
      )}

      {/* Stop image */}
      {stopImage?.images?.[0] && (
        <div className="rounded-xl overflow-hidden aspect-video bg-zinc-100 dark:bg-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={stopImageUrl(stopImage.images[0])}
            alt={`${stop.name} stop`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Live ETAs */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Wifi className="w-4 h-4 text-green-500" />
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Live Arrivals</span>
        </div>

        {etasLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            ))}
          </div>
        ) : sortedETAs.length === 0 ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/50">
            <Clock className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <span className="text-sm text-zinc-400 dark:text-zinc-500">No buses en route</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sortedETAs.slice(0, 6).map((eta, i) => {
              const route = routeMap.get(eta.routeID);
              const color = normalizeColor(route?.color ?? '#3B82F6');

              return (
                <div
                  key={`${eta.routeID}-${eta.equipmentID}-${i}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/40"
                >
                  <div
                    className="w-1 h-8 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <Bus className="w-4 h-4 text-zinc-400 dark:text-zinc-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                      {route?.name ?? `Route ${eta.routeID}`}
                    </p>
                    {eta.direction && (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">{eta.direction}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        eta.minutes <= 1 ? 'text-green-500 dark:text-green-400' : 'text-zinc-900 dark:text-zinc-100'
                      }`}
                    >
                      {formatEtaMinutes(eta.minutes)}
                    </span>
                    {eta.time && (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">{formatTime12h(eta.time)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule toggle */}
      <button
        onClick={() => setShowSchedule((s) => !s)}
        className="flex items-center justify-between w-full p-3 rounded-xl bg-zinc-100/60 dark:bg-zinc-800/40 border border-zinc-200/40 dark:border-zinc-700/40 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
      >
        <span className="font-medium">Full Schedule</span>
        {showSchedule ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showSchedule && schedules && schedules.length > 0 && (
        <div className="flex flex-col gap-1 -mt-2">
          {schedules.slice(0, 20).map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2 rounded-lg odd:bg-zinc-100/60 dark:odd:bg-zinc-800/30"
            >
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{s.scheduleName || s.directionLabel}</span>
              <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300">{formatTime12h(s.stopTime)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
