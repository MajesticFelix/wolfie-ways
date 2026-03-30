"use client";

import { Clock, MapPin, ChevronDown, ChevronUp, Wifi, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useStopETAs, useStopSchedules } from "@/lib/hooks/use-stop-etas";
import { useTransit } from "@/lib/stores/transit-store";
import {
  resolveRouteColor,
  formatEtaMinutes,
  formatTime12h,
  parseAmenities,
  stopImageUrl,
} from "@/lib/utils/maps";
import { useDarkMode } from "@/lib/hooks/use-dark-mode";
import type { Stop, Route, StopImage, Vehicle } from "@/lib/api/types";
import { BusIcon } from "../map/bus-markers";

interface StopPanelProps {
  stop: Stop;
  routes: Route[];
  vehicles: Vehicle[];
  stopImage?: StopImage;
  previousBusVehicle?: Vehicle;
  previousBusRoute?: Route;
}

export function StopPanel({
  stop,
  routes,
  vehicles,
  stopImage,
  previousBusVehicle,
  previousBusRoute,
}: StopPanelProps) {
  const [showSchedule, setShowSchedule] = useState(false);
  const { selectBusFromStop, panMap, backToBus, state } = useTransit();
  const isDark = useDarkMode();
  const { data: etas, isLoading: etasLoading } = useStopETAs(stop.id);
  const { data: schedules } = useStopSchedules(showSchedule ? stop.id : null);

  const routeMap = new Map(routes.map((r) => [r.id, r]));
  const vehicleMap = new Map(vehicles.map((v) => [v.equipmentID, v]));
  const amenities = parseAmenities(stopImage?.amenities ?? "");

  const hasRouteFilter = state.selectedRoutes.size > 0;

  const allETAs = etas?.flatMap((e) => e.enRoute) ?? [];
  const sortedETAs = [...allETAs]
    .filter((e) => !hasRouteFilter || state.selectedRoutes.has(e.routeID))
    .sort((a, b) => a.minutes - b.minutes);

  // Filter schedules by selected routes (corridorID maps to route ID)
  const filteredSchedules = hasRouteFilter && schedules
    ? schedules.filter((s) => state.selectedRoutes.has(s.corridorID))
    : schedules;

  const prevColor = resolveRouteColor(previousBusRoute?.color ?? "#3B82F6", isDark);

  function handleETAClick(equipmentID: string, routeName: string) {
    // "-" means the bus is scheduled but not yet dispatched
    if (equipmentID === "-") {
      toast.info("Bus not on route yet", {
        description: `The next ${routeName} bus hasn't departed yet.`,
        duration: 3500,
      });
      return;
    }

    const vehicle = vehicleMap.get(equipmentID);
    if (!vehicle) {
      toast.info("Bus not on route yet", {
        description: `Bus ${equipmentID} hasn't started service yet.`,
        duration: 3500,
      });
      return;
    }

    selectBusFromStop(equipmentID, stop.id);
    panMap(vehicle.lat, vehicle.lng, 18);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Back to bus button */}
      {previousBusVehicle && (
        <button
          onClick={backToBus}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border transition-colors text-left"
          style={{ backgroundColor: `${prevColor}12`, borderColor: `${prevColor}30` }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = `${prevColor}22`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = `${prevColor}12`;
          }}
        >
          <ArrowLeft className="w-4 h-4 shrink-0" style={{ color: prevColor }} />
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: prevColor }}
          >
            <BusIcon />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold block" style={{ color: prevColor }}>
              Back to live bus
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate block">
              {previousBusRoute?.name ?? `Bus ${previousBusVehicle.equipmentID}`}
            </span>
          </div>
        </button>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5 text-zinc-500 dark:text-zinc-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-base text-zinc-900 dark:text-zinc-100 leading-tight">
            {stop.name}
          </h2>
          {stop.shortName && stop.shortName !== stop.name && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              {stop.shortName}
            </p>
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
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
            Live Arrivals
          </span>
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
            <span className="text-sm text-zinc-400 dark:text-zinc-500">
              No buses on this route.
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sortedETAs.slice(0, 6).map((eta, i) => {
              const route = routeMap.get(eta.routeID);
              const color = resolveRouteColor(route?.color ?? "#3B82F6", isDark);
              const isLive = eta.equipmentID !== "-" && vehicleMap.has(eta.equipmentID);

              return (
                <button
                  key={`${eta.routeID}-${eta.equipmentID}-${i}`}
                  onClick={() =>
                    handleETAClick(eta.equipmentID, route?.name ?? `Route ${eta.routeID}`)
                  }
                  className="flex items-center gap-3 p-3 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/40 text-left w-full transition-colors hover:bg-zinc-200/70 dark:hover:bg-zinc-700/50 group"
                >
                  <div
                    className="w-1 h-8 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <div className="shrink-0" style={{ color: isLive ? color : undefined }}>
                    <BusIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                      {route?.name ?? `Route ${eta.routeID}`}
                    </p>
                    {eta.direction && (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        {isLive ? (
                          <span style={{ color }} className="font-medium">Live</span>
                        ) : (
                          eta.direction
                        )}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        eta.minutes <= 1
                          ? "text-green-500 dark:text-green-400"
                          : "text-zinc-900 dark:text-zinc-100"
                      }`}
                    >
                      {formatEtaMinutes(eta.minutes)}
                    </span>
                    {eta.time && (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        {formatTime12h(eta.time)}
                      </p>
                    )}
                  </div>
                </button>
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

      {showSchedule && filteredSchedules && filteredSchedules.length > 0 && (
        <div className="flex flex-col gap-1 -mt-2">
          {filteredSchedules.slice(0, 20).map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2 rounded-lg odd:bg-zinc-100/60 dark:odd:bg-zinc-800/30"
            >
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {s.scheduleName || s.directionLabel}
              </span>
              <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
                {formatTime12h(s.stopTime)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
