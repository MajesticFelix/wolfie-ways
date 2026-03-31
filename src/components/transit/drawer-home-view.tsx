"use client";

import { useMemo } from "react";
import { Navigation, Clock, Pin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RouteCard } from "./route-card";
import { ManagePinsDrawer } from "./manage-pins-drawer";
import { useNearestStops } from "@/lib/hooks/use-nearest-stops";
import { useMultiStopETAs } from "@/lib/hooks/use-multi-stop-etas";
import { useTransit } from "@/lib/stores/transit-store";
import { useDarkMode } from "@/lib/hooks/use-dark-mode";
import { resolveRouteColor } from "@/lib/utils/maps";
import { cn } from "@/lib/utils";
import type { Route, Stop, Vehicle } from "@/lib/api/types";

interface DrawerHomeViewProps {
  routes: Route[];
  stops: Stop[];
  vehicles: Vehicle[];
}

export function DrawerHomeView({
  routes,
  stops,
  vehicles,
}: DrawerHomeViewProps) {
  const {
    state,
    toggleRoute,
    selectAllRoutes,
    selectStop,
    selectBusFromStop,
    panMap,
    togglePinnedRoute,
  } = useTransit();
  const isDark = useDarkMode();
  const { geoState, nearest, requestLocation } = useNearestStops(stops, 5);

  const nearestStopIds = useMemo(
    () => nearest.map((n) => n.stop.id),
    [nearest],
  );
  const stopMap = useMemo(() => new Map(stops.map((s) => [s.id, s])), [stops]);
  const routeMap = useMemo(
    () => new Map(routes.map((r) => [r.id, r])),
    [routes],
  );
  const vehicleMap = useMemo(
    () => new Map(vehicles.map((v) => [v.equipmentID, v])),
    [vehicles],
  );

  const { data: departures, isLoading: etasLoading } =
    useMultiStopETAs(nearestStopIds);

  const allSelected = state.selectedRoutes.size === 0;

  // Pinned routes section: one card per route per stop, sorted by arrival
  const pinnedDepartures = useMemo(() => {
    if (!departures || state.pinnedRoutes.size === 0) return [];
    const seen = new Set<string>();
    return departures
      .filter((d) => {
        if (!state.pinnedRoutes.has(d.eta.routeID)) return false;
        const key = `${d.stopId}-${d.eta.routeID}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6);
  }, [departures, state.pinnedRoutes]);

  // Nearby departures: non-pinned routes, respects route filter
  const filteredDepartures = useMemo(() => {
    if (!departures) return [];
    let filtered = departures;
    if (state.selectedRoutes.size > 0) {
      filtered = filtered.filter((d) =>
        state.selectedRoutes.has(d.eta.routeID),
      );
    }
    const seen = new Set<string>();
    return filtered
      .filter((d) => {
        if (state.pinnedRoutes.has(d.eta.routeID)) return false;
        const key = `${d.stopId}-${d.eta.routeID}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 12);
  }, [departures, state.selectedRoutes, state.pinnedRoutes]);

  const showDepartures = geoState === "granted";
  const showGeoPrompt = geoState === "idle";
  const showGeoLoading = geoState === "loading";
  const showGeoDenied = geoState === "denied" || geoState === "unavailable";

  // Pinned routes sort first in pill row
  const sortedRoutes = useMemo(
    () =>
      [...routes].sort((a, b) => {
        const ap = state.pinnedRoutes.has(a.id) ? 0 : 1;
        const bp = state.pinnedRoutes.has(b.id) ? 0 : 1;
        return ap - bp;
      }),
    [routes, state.pinnedRoutes],
  );

  return (
    <div className="flex flex-col pb-4">
      {/* ── Live count + route filter pills ── */}
      <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800/50">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {/* Live count badge */}
          {vehicles.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
              <span className="text-xs font-semibold text-green-600 dark:text-green-400 tabular-nums whitespace-nowrap">
                {vehicles.length} live
              </span>
            </div>
          )}

          {/* All pill */}
          <button
            onClick={selectAllRoutes}
            className={cn(
              "shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 border",
              allSelected
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent"
                : "bg-transparent text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
            )}
          >
            All
          </button>

          {/* Route pills — pinned routes sorted first; pin indicator shown when pinned */}
          {sortedRoutes.map((route) => {
            const color = resolveRouteColor(route.color, isDark);
            const isActive = state.selectedRoutes.has(route.id);
            const isPinned = state.pinnedRoutes.has(route.id);
            return (
              <div key={route.id} className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => toggleRoute(route.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 border",
                    isActive
                      ? "text-white border-transparent"
                      : "bg-transparent text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
                  )}
                  style={
                    isActive
                      ? { backgroundColor: color, borderColor: color }
                      : undefined
                  }
                >
                  {!isActive && (
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                  )}
                  <span>{route.name || route.abbr}</span>
                  {/* Pin indicator — shown when route is pinned */}
                  {isPinned && (
                    <Pin className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Pinned routes ── */}
      <div className="px-4 pt-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black tracking-[0.18em] uppercase text-zinc-400 dark:text-zinc-500">
            Pinned Routes
          </p>
          <ManagePinsDrawer routes={routes} />
        </div>

        {state.pinnedRoutes.size === 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/50">
            <div 
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{
                backgroundColor: "rgba(245, 158, 11, 0.1)",
                border: "1px solid rgba(245, 158, 11, 0.2)"
              }}
            >
              <Pin className="w-4 h-4" color="#f59e0b" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                No pinned routes
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Use Manage Pins above to add favorites
              </p>
            </div>
          </div>
        ) : (
          <>
            {!showDepartures && (
              <button
                onClick={requestLocation}
                className="flex items-center gap-3 p-4 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/50 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/50 transition-colors text-left w-full"
              >
                <div className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Navigation className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Use my location
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    See buses arriving near you
                  </p>
                </div>
              </button>
            )}
            {showDepartures && etasLoading && (
              <div className="flex flex-col gap-2">
                {[1, 2].map((i) => (
                  <Skeleton
                    key={i}
                    className="h-15 rounded-xl bg-zinc-200 dark:bg-zinc-800/80"
                  />
                ))}
              </div>
            )}
            {showDepartures &&
              !etasLoading &&
              pinnedDepartures.length === 0 && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/50">
                  <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">
                    No pinned buses nearby
                  </p>
                </div>
              )}
            {showDepartures && !etasLoading && pinnedDepartures.length > 0 && (
              <div className="flex flex-col gap-2">
                {pinnedDepartures.map((departure, i) => {
                  const route = routeMap.get(departure.eta.routeID);
                  const stop = stopMap.get(departure.stopId);
                  if (!route || !stop) return null;
                  const isLive =
                    departure.eta.equipmentID !== "-" &&
                    vehicleMap.has(departure.eta.equipmentID);
                  return (
                    <RouteCard
                      key={`pinned-${departure.stopId}-${departure.eta.routeID}-${i}`}
                      route={route}
                      stopName={stop.name || stop.shortName}
                      eta={departure.eta}
                      isLive={isLive}
                      isDark={isDark}
                      onClick={() => {
                        if (isLive) {
                          const vehicle = vehicleMap.get(
                            departure.eta.equipmentID,
                          );
                          selectBusFromStop(
                            departure.eta.equipmentID,
                            departure.stopId,
                          );
                          if (vehicle) panMap(vehicle.lat, vehicle.lng, 18);
                        } else {
                          selectStop(departure.stopId);
                          panMap(stop.lat, stop.lng, 18);
                        }
                      }}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Nearby departures ── */}
      <div className="px-4 pt-4 flex flex-col gap-2">
        <p className="text-[10px] font-black tracking-[0.18em] uppercase text-zinc-400 dark:text-zinc-500">
          Nearby Departures
        </p>

        {showGeoPrompt && (
          <button
            onClick={requestLocation}
            className="flex items-center gap-3 p-4 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/50 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/50 transition-colors text-left w-full"
          >
            <div className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Navigation className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Use my location
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                See buses arriving near you
              </p>
            </div>
          </button>
        )}

        {showGeoLoading && (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-15 rounded-xl bg-zinc-200 dark:bg-zinc-800/80"
              />
            ))}
          </div>
        )}

        {showGeoDenied && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/50">
            <Navigation className="w-4 h-4 text-zinc-400 shrink-0" />
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              Location unavailable
            </p>
          </div>
        )}

        {showDepartures && etasLoading && (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-15 rounded-xl bg-zinc-200 dark:bg-zinc-800/80"
              />
            ))}
          </div>
        )}

        {showDepartures && !etasLoading && filteredDepartures.length === 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/50">
            <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              No buses running nearby
            </p>
          </div>
        )}

        {showDepartures && !etasLoading && filteredDepartures.length > 0 && (
          <div className="flex flex-col gap-2">
            {filteredDepartures.map((departure, i) => {
              const route = routeMap.get(departure.eta.routeID);
              const stop = stopMap.get(departure.stopId);
              if (!route || !stop) return null;
              const isLive =
                departure.eta.equipmentID !== "-" &&
                vehicleMap.has(departure.eta.equipmentID);
              return (
                <RouteCard
                  key={`${departure.stopId}-${departure.eta.routeID}-${i}`}
                  route={route}
                  stopName={stop.name || stop.shortName}
                  eta={departure.eta}
                  isLive={isLive}
                  isDark={isDark}
                  onClick={() => {
                    if (isLive) {
                      const vehicle = vehicleMap.get(departure.eta.equipmentID);
                      selectBusFromStop(
                        departure.eta.equipmentID,
                        departure.stopId,
                      );
                      if (vehicle) panMap(vehicle.lat, vehicle.lng, 18);
                    } else {
                      selectStop(departure.stopId);
                      panMap(stop.lat, stop.lng, 18);
                    }
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
