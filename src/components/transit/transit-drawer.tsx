"use client";

import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { Drawer as DrawerPrimitive } from "vaul";
import { useTransit } from "@/lib/stores/transit-store";
import { DrawerHomeView } from "./drawer-home-view";
import { StopPanel } from "@/components/panels/stop-panel";
import { BusPanel } from "@/components/panels/bus-panel";
import type { Route, Stop, Vehicle, StopImage } from "@/lib/api/types";

// Snap points: home has a peek height + half + near-full; detail views skip peek
const SNAP_HOME: (string | number)[] = ["180px", 0.5, 0.92];
const SNAP_DETAIL: (string | number)[] = [0.4, 0.92];

interface TransitDrawerProps {
  routes: Route[];
  stops: Stop[];
  vehicles: Vehicle[];
  stopImages: Map<number, StopImage>;
}

export function TransitDrawer({
  routes,
  stops,
  vehicles,
  stopImages,
}: TransitDrawerProps) {
  const { state, clearSelection } = useTransit();
  const [activeSnapPoint, setActiveSnapPoint] = useState<string | number>("180px");

  // Snap points derived from drawer view — no local state needed
  const snapPoints = state.drawerView === "home" ? SNAP_HOME : SNAP_DETAIL;

  // Animate to the default snap point whenever the view changes
  useEffect(() => {
    setActiveSnapPoint(state.drawerView === "home" ? "180px" : 0.4);
  }, [state.drawerView]);

  // Build lookup maps (memoized to avoid re-creation on every render)
  const stopMap = useMemo(() => new Map(stops.map((s) => [s.id, s])), [stops]);
  const vehicleMap = useMemo(
    () => new Map(vehicles.map((v) => [v.equipmentID, v])),
    [vehicles],
  );
  const routeMap = useMemo(() => new Map(routes.map((r) => [r.id, r])), [routes]);

  const selectedStop =
    state.selectedStop !== null ? stopMap.get(state.selectedStop) : undefined;
  const selectedVehicle =
    state.selectedBus !== null ? vehicleMap.get(state.selectedBus) : undefined;
  const selectedVehicleRoute = selectedVehicle
    ? routeMap.get(selectedVehicle.routeID)
    : undefined;
  const nextStop = selectedVehicle?.nextStopID
    ? stopMap.get(selectedVehicle.nextStopID)
    : undefined;
  const stopImage = selectedStop ? stopImages.get(selectedStop.id) : undefined;
  const previousBusVehicle =
    state.previousBus !== null ? vehicleMap.get(state.previousBus) : undefined;
  const previousBusRoute = previousBusVehicle
    ? routeMap.get(previousBusVehicle.routeID)
    : undefined;
  const previousStop =
    state.previousStop !== null ? stopMap.get(state.previousStop) : undefined;

  const isDetailView = state.drawerView !== "home";

  return (
    <DrawerPrimitive.Root
      open
      modal={false}
      dismissible={false}
      shouldScaleBackground={false}
      noBodyStyles
      snapPoints={snapPoints}
      activeSnapPoint={activeSnapPoint}
      setActiveSnapPoint={(sp) => { if (sp !== null) setActiveSnapPoint(sp); }}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Content
          className="fixed inset-x-0 bottom-0 z-40 flex h-full flex-col bg-white dark:bg-zinc-950 rounded-t-[20px] border-t border-zinc-200/70 dark:border-zinc-800/60 shadow-2xl focus:outline-none"
          aria-label="Transit panel"
        >
          {/* ── Fixed top section: drag handle + optional header ── */}
          <div className="shrink-0">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="h-1.5 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>

            {/* Detail view header (stop / bus) */}
            {isDetailView && (
              <div className="flex items-center justify-between px-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black tracking-[0.18em] uppercase text-zinc-400 dark:text-zinc-500">
                    {state.drawerView === "bus" ? "Live Bus" : "Bus Stop"}
                  </p>
                  {state.drawerView === "bus" && selectedVehicle && (
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate mt-0.5">
                      {selectedVehicleRoute?.name ?? `Bus ${selectedVehicle.equipmentID}`}
                    </p>
                  )}
                </div>
                <button
                  onClick={clearSelection}
                  className="ml-3 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shrink-0"
                  aria-label="Back to home"
                >
                  <X className="w-4 h-4 text-zinc-500 dark:text-zinc-300" />
                </button>
              </div>
            )}
          </div>

          {/* ── Scrollable content area ── */}
          <div
            className="flex-1 overflow-y-auto scrollbar-none"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {state.drawerView === "home" && (
              <DrawerHomeView
                routes={routes}
                stops={stops}
                vehicles={vehicles}
              />
            )}

            {state.drawerView === "stop" && selectedStop && (
              <div className="px-4 py-4">
                <StopPanel
                  stop={selectedStop}
                  routes={routes}
                  vehicles={vehicles}
                  stopImage={stopImage}
                  previousBusVehicle={previousBusVehicle}
                  previousBusRoute={previousBusRoute}
                />
              </div>
            )}

            {state.drawerView === "bus" && selectedVehicle && (
              <div className="px-4 py-4">
                <BusPanel
                  vehicle={selectedVehicle}
                  route={selectedVehicleRoute}
                  nextStop={nextStop}
                  stops={stopMap}
                  previousStop={previousStop}
                />
              </div>
            )}
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
