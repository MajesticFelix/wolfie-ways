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
        <RouteLines routes={routes} />
        <StopMarkers stops={stops} routes={routes} />
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

  useEffect(() => {
    if (!map || !state.mapTarget) return;
    map.panTo({ lat: state.mapTarget.lat, lng: state.mapTarget.lng });
    if (state.mapTarget.zoom !== undefined) {
      map.setZoom(state.mapTarget.zoom);
    }
    clearMapTarget();
  }, [map, state.mapTarget, clearMapTarget]);

  return null;
}

/** Continuously pans the map to follow the selected bus as it moves. */
function BusTracker({ vehicles }: { vehicles: Vehicle[] }) {
  const map = useMap();
  const { state } = useTransit();
  const isFirstTrack = useRef(true);

  useEffect(() => {
    if (!state.selectedBus) {
      isFirstTrack.current = true;
      return;
    }
    if (!map) return;

    const bus = vehicles.find((v) => v.equipmentID === state.selectedBus);
    if (!bus) return;

    if (isFirstTrack.current) {
      map.panTo({ lat: bus.lat, lng: bus.lng });
      map.setZoom(18);
      isFirstTrack.current = false;
    } else {
      map.panTo({ lat: bus.lat, lng: bus.lng });
    }
  }, [map, state.selectedBus, vehicles]);

  return null;
}
