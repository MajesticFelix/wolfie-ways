"use client";

import { X } from "lucide-react";
import { useTransit } from "@/lib/stores/transit-store";
import { StopPanel } from "./stop-panel";
import { BusPanel } from "./bus-panel";
import type { Route, Stop, Vehicle, StopImage } from "@/lib/api/types";

interface DetailsPanelProps {
  routes: Route[];
  stops: Stop[];
  vehicles: Vehicle[];
  stopImages: Map<number, StopImage>;
}

export function BottomSheet({
  routes,
  stops,
  vehicles,
  stopImages,
}: DetailsPanelProps) {
  const { state, clearSelection } = useTransit();
  const open = state.panelMode !== null;

  const stopMap = new Map(stops.map((s) => [s.id, s]));
  const vehicleMap = new Map(vehicles.map((v) => [v.equipmentID, v]));
  const routeMap = new Map(routes.map((r) => [r.id, r]));

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

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={clearSelection}
        aria-hidden="true"
      />

      {/* Right side panel */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-[400px] flex flex-col bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800/80 shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Details panel"
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-zinc-100 dark:border-zinc-800/60 shrink-0">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            {state.panelMode === "bus" ? "Live Bus" : "Bus Stop"}
          </h3>
          <button
            onClick={clearSelection}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            aria-label="Close panel"
          >
            <X className="w-4 h-4 text-zinc-500 dark:text-zinc-300" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-none">
          {state.panelMode === "stop" && selectedStop && (
            <StopPanel
              stop={selectedStop}
              routes={routes}
              stopImage={stopImage}
            />
          )}
          {state.panelMode === "bus" && selectedVehicle && (
            <BusPanel
              vehicle={selectedVehicle}
              route={selectedVehicleRoute}
              nextStop={nextStop}
              stops={stopMap}
            />
          )}
        </div>
      </aside>
    </>
  );
}
