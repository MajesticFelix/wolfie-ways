"use client";

import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useRef } from "react";
import { SBU_CENTER, SBU_DEFAULT_ZOOM } from "@/lib/utils/maps";
import { useTransit } from "@/lib/stores/transit-store";
import { RouteLines } from "./route-lines";
import { StopMarkers } from "./stop-markers";
import { BusMarkers } from "./bus-markers";
import { ZoomControls } from "./zoom-controls";
import type { Route, Stop, Vehicle } from "@/lib/api/types";

interface MapViewProps {
  routes: Route[];
  stops: Stop[];
  vehicles: Vehicle[];
}

export function MapView({ routes, stops, vehicles }: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={SBU_CENTER}
        defaultZoom={SBU_DEFAULT_ZOOM}
        mapId={mapId}
        disableDefaultUI
        gestureHandling="greedy"
        clickableIcons={false}
        className="w-full h-full"
        style={{ width: "100%", height: "100%" }}
        colorScheme={"FOLLOW_SYSTEM" as google.maps.ColorScheme}
      >
        <RouteLines routes={routes} stops={stops} vehicles={vehicles} />
        <StopMarkers stops={stops} routes={routes} vehicles={vehicles} />
        <BusMarkers vehicles={vehicles} routes={routes} />
        <ZoomControls />
        <MapPanner />
        <BusTracker vehicles={vehicles} />
      </Map>
    </APIProvider>
  );
}

/** Pans (and optionally zooms) the map whenever mapTarget is set. */
function MapPanner() {
  const map = useMap();
  const { state, clearMapTarget } = useTransit();

  // Stable ref so clearMapTarget is never a dep — effect runs only when mapTarget changes.
  const clearRef = useRef(clearMapTarget);
  clearRef.current = clearMapTarget;

  useEffect(() => {
    if (!map || !state.mapTarget) return;
    map.panTo({ lat: state.mapTarget.lat, lng: state.mapTarget.lng });
    if (state.mapTarget.zoom !== undefined) {
      map.setZoom(state.mapTarget.zoom);
    }
    clearRef.current();
  }, [map, state.mapTarget]);

  return null;
}

/**
 * Follows the selected bus as it moves.
 * - Locks tracking when a bus is selected (pans + zooms to it).
 * - Continues panning on every vehicle position update while locked.
 * - Unlocks (stops panning) the moment the user drags the map.
 * - Zooming never unlocks tracking.
 */
function BusTracker({ vehicles }: { vehicles: Vehicle[] }) {
  const map = useMap();
  const { state } = useTransit();
  const isTrackingRef = useRef(false);
  const trackedKeyRef = useRef<number>(-1);
  const lastPosRef = useRef<{ lat: number; lng: number } | null>(null);

  // Unlock tracking on user-initiated pan (drag), but not on programmatic panTo.
  useEffect(() => {
    if (!map) return;
    const listener = map.addListener('dragstart', () => {
      isTrackingRef.current = false;
    });
    return () => listener.remove();
  }, [map]);

  useEffect(() => {
    if (!map) return;

    if (!state.selectedBus) {
      isTrackingRef.current = false;
      trackedKeyRef.current = -1;
      lastPosRef.current = null;
      return;
    }

    const bus = vehicles.find((v) => v.equipmentID === state.selectedBus);
    if (!bus) return;

    // Bus was (re)selected — busSelectionKey changed — lock tracking and zoom in.
    if (trackedKeyRef.current !== state.busSelectionKey) {
      trackedKeyRef.current = state.busSelectionKey;
      isTrackingRef.current = true;
      map.panTo({ lat: bus.lat, lng: bus.lng });
      map.setZoom(18);
      lastPosRef.current = { lat: bus.lat, lng: bus.lng };
      return;
    }

    // Vehicle poll update → follow only if tracking and position changed.
    if (isTrackingRef.current) {
      if (lastPosRef.current?.lat !== bus.lat || lastPosRef.current?.lng !== bus.lng) {
        map.panTo({ lat: bus.lat, lng: bus.lng });
        lastPosRef.current = { lat: bus.lat, lng: bus.lng };
      }
    }
  }, [map, state.selectedBus, state.busSelectionKey, vehicles]);

  return null;
}
