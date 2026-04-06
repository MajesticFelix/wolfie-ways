"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { X } from "lucide-react";
import { useTransit } from "@/lib/stores/transit-store";
import { DrawerHomeView } from "./drawer-home-view";
import { StopPanel } from "@/components/panels/stop-panel";
import { BusPanel } from "@/components/panels/bus-panel";
import type { Route, Stop, Vehicle, StopImage } from "@/lib/api/types";

// Lower bound: enough to show the drag handle + a preview row.
const MIN_HEIGHT = 90;
// Pill height (~40px) + gap (~12px) reserved below the safe area for the header.
const HEADER_BELOW_SAFE_AREA = 52;

function clamp(min: number, val: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

interface TransitDrawerProps {
  routes: Route[];
  stops: Stop[];
  vehicles: Vehicle[];
  stopImages: Map<number, StopImage>;
  mapCenter?: { lat: number; lng: number };
}

export function TransitDrawer({
  routes,
  stops,
  vehicles,
  stopImages,
  mapCenter,
}: TransitDrawerProps) {
  const { state, clearSelection } = useTransit();

  const sheetRef = useRef<HTMLDivElement>(null);
  const heightRef = useRef(200);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(0);
  const [maxHeight, setMaxHeight] = useState(9999);

  // ── Measure upper bound ──
  useLayoutEffect(() => {
    const measure = () => {
      setMaxHeight(window.innerHeight - HEADER_BELOW_SAFE_AREA);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // ── Programmatic height (view changes) ──
  const setHeight = useCallback(
    (h: number) => {
      const clamped = clamp(MIN_HEIGHT, h, maxHeight);
      heightRef.current = clamped;
      if (sheetRef.current) {
        sheetRef.current.style.height = `${clamped}px`;
      }
    },
    [maxHeight],
  );

  const prevDrawerView = useRef(state.drawerView);

  // Animate to sensible defaults when the drawer view actually changes.
  // We compare against prevDrawerView so that re-runs caused by maxHeight
  // updating (safe-area measurement) don't reset the initial 200px height.
  useEffect(() => {
    const el = sheetRef.current;
    if (!el || prevDrawerView.current === state.drawerView) return;
    prevDrawerView.current = state.drawerView;
    el.style.transition = "height 0.35s cubic-bezier(0.32,0.72,0,1)";
    const target =
      state.drawerView === "home"
        ? 200
        : Math.round(window.innerHeight * 0.4);
    const newH = clamp(MIN_HEIGHT, target, maxHeight);
    heightRef.current = newH;
    el.style.height = `${newH}px`;
    const onEnd = () => {
      el.style.transition = "none";
    };
    el.addEventListener("transitionend", onEnd, { once: true });
    return () => el.removeEventListener("transitionend", onEnd);
  }, [state.drawerView, maxHeight]);

  // ── Pointer-based drag ──
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only primary button / single touch.
      if (e.button !== 0) return;
      isDragging.current = true;
      dragStartY.current = e.clientY;
      // Read the actual rendered height (mid-animation safe) rather than the
      // target stored in heightRef, so dragging during a transition doesn't jump.
      dragStartH.current = sheetRef.current
        ? sheetRef.current.getBoundingClientRect().height
        : heightRef.current;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      // Kill any leftover transition so the drag is instant.
      if (sheetRef.current) sheetRef.current.style.transition = "none";
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      const delta = dragStartY.current - e.clientY; // positive = dragging up
      setHeight(dragStartH.current + delta);
    },
    [setHeight],
  );

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // ── Data lookup maps ──
  const stopMap = useMemo(() => new Map(stops.map((s) => [s.id, s])), [stops]);
  const vehicleMap = useMemo(
    () => new Map(vehicles.map((v) => [v.equipmentID, v])),
    [vehicles],
  );
  const routeMap = useMemo(
    () => new Map(routes.map((r) => [r.id, r])),
    [routes],
  );

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
    <>
      <div
        ref={sheetRef}
        role="dialog"
        aria-label="Transit panel"
        className="fixed inset-x-0 bottom-0 z-40 flex flex-col bg-white dark:bg-zinc-950 rounded-t-[20px] border-t border-zinc-200/70 dark:border-zinc-800/60 shadow-2xl"
        style={{
          height: 200,
          willChange: "height",
          touchAction: "none",
        }}
      >
        {/* ── Drag handle ── */}
        <div
          className="shrink-0 touch-none select-none cursor-grab active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="flex justify-center pt-3 pb-2">
            <div className="h-1.5 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          </div>
        </div>

        {/* ── Detail header (stop / bus) ── */}
        {isDetailView && (
          <div className="shrink-0 flex items-center justify-between px-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black tracking-[0.18em] uppercase text-zinc-400 dark:text-zinc-500">
                {state.drawerView === "bus" ? "Live Bus" : "Bus Stop"}
              </p>
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

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto scrollbar-none">
          {state.drawerView === "home" && (
            <DrawerHomeView
              routes={routes}
              stops={stops}
              vehicles={vehicles}
              mapCenter={mapCenter}
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
      </div>
    </>
  );
}
