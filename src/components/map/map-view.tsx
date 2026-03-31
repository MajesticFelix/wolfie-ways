"use client";

import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { useState, useEffect, useRef } from "react";
import {
  SBU_CENTER,
  SBU_DEFAULT_ZOOM,
  haversineM,
  deduplicateStops,
} from "@/lib/utils/maps";
import { useTransit } from "@/lib/stores/transit-store";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import { useDarkMode } from "@/lib/hooks/use-dark-mode";
import { RouteLines } from "./route-lines";
import { StopMarkers } from "./stop-markers";
import { BusMarkers } from "./bus-markers";
import { ZoomControls } from "./zoom-controls";
import type { Route, Stop, Vehicle } from "@/lib/api/types";

interface MapViewProps {
  routes: Route[];
  stops: Stop[];
  vehicles: Vehicle[];
  onCenterChange?: (lat: number, lng: number) => void;
}

export function MapView({
  routes,
  stops,
  vehicles,
  onCenterChange,
}: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
  const isMobile = useIsMobile();
  const isDark = useDarkMode();
  // Pixel offset from map-center to the nearest snapped stop (0,0 = unsnapped)
  const [snapOffset, setSnapOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  // True while the map is actively panning (between dragstart and idle+300ms)
  const [isPanning, setIsPanning] = useState(false);
  const snapped = snapOffset.x !== 0 || snapOffset.y !== 0;

  return (
    <APIProvider apiKey={apiKey}>
      <div className="relative w-full h-full">
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
          {isMobile && onCenterChange && (
            <MapCrosshairTracker
              stops={stops}
              onCenterChange={onCenterChange}
              onSnapOffset={(dx, dy) => setSnapOffset({ x: dx, y: dy })}
              onPanningChange={setIsPanning}
            />
          )}
        </Map>

        {/* Fixed crosshair — same size/shape as a stop pin but purple.
            CSS-translates to snap onto nearby stops; pointer-events none so
            all touch/mouse events fall through to the map. */}
        {isMobile && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: isDark ? "#18181b" : "#ffffff",
                border: "3.5px solid #8b5cf6",
                opacity: isPanning ? 0.75 : 1,
                boxShadow: snapped
                  ? "0 0 0 3px rgba(139,92,246,0.35), 0 2px 8px rgba(0,0,0,0.4)"
                  : "0 0 0 3px rgba(139,92,246,0.15), 0 1px 5px rgba(0,0,0,0.3)",
                transform: `translate(${snapOffset.x}px, ${snapOffset.y}px) scale(${snapped ? 1.4 : 1})`,
                transition:
                  "transform 200ms ease-out, box-shadow 200ms ease-out, opacity 150ms ease",
              }}
            />
          </div>
        )}
      </div>
    </APIProvider>
  );
}

/**
 * Lives inside <Map> so it can use useMap().
 *
 * - dragstart  → immediately reset snap offset so the dot snaps back to
 *               center the moment the user lifts and starts panning again.
 * - idle+300ms → read map center, report it via onCenterChange, then find
 *               the nearest stop. If it is within SNAP_M metres, compute
 *               the pixel offset from map-center to that stop using the
 *               map projection and report it via onSnapOffset.
 */
// AdvancedMarker's default anchor is center-bottom of the content element.
// For a 20 px stop pin the visual circle center is 10 px above the anchor.
// Subtracting this from dy aligns the crosshair center with the circle center.
const STOP_PIN_HALF_H = 10;

function MapCrosshairTracker({
  stops,
  onCenterChange,
  onSnapOffset,
  onPanningChange,
}: {
  stops: Stop[];
  onCenterChange: (lat: number, lng: number) => void;
  onSnapOffset: (dx: number, dy: number) => void;
  onPanningChange: (isPanning: boolean) => void;
}) {
  const map = useMap();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Stable refs — the effect only depends on `map`, never on callback identity.
  const centerRef = useRef(onCenterChange);
  const snapRef = useRef(onSnapOffset);
  const panRef = useRef(onPanningChange);
  centerRef.current = onCenterChange;
  snapRef.current = onSnapOffset;
  panRef.current = onPanningChange;
  const stopsRef = useRef(stops);
  stopsRef.current = stops;
  // The stop we're currently locked to (null = not locked).
  const lockedStopRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!map) return;

    // Recompute the pixel offset from the current map center to a fixed lat/lng.
    // Called both on idle (initial snap) and on zoom_changed (to keep lock accurate).
    const computeOffset = (stopLat: number, stopLng: number) => {
      const center = map.getCenter();
      const projection = map.getProjection();
      const zoom = map.getZoom();
      if (!center || !projection || zoom == null) return;
      const centerPt = projection.fromLatLngToPoint(center);
      const stopPt = projection.fromLatLngToPoint(
        new google.maps.LatLng(stopLat, stopLng),
      );
      if (!centerPt || !stopPt) return;
      const scale = Math.pow(2, zoom);
      snapRef.current(
        (stopPt.x - centerPt.x) * scale,
        (stopPt.y - centerPt.y) * scale - STOP_PIN_HALF_H,
      );
    };

    // Pan → release lock, go translucent, reset crosshair to center.
    const dragListener = map.addListener("dragstart", () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      lockedStopRef.current = null;
      snapRef.current(0, 0);
      panRef.current(true);
    });

    // Zoom → if locked, smoothly re-center on the locked stop.
    const zoomListener = map.addListener("zoom_changed", () => {
      if (lockedStopRef.current) {
        map.panTo({
          lat: lockedStopRef.current.lat,
          lng: lockedStopRef.current.lng,
        });
        snapRef.current(0, -STOP_PIN_HALF_H);
      }
    });

    const idleListener = map.addListener("idle", () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      console.log("Idling");
      timerRef.current = setTimeout(() => {
        const center = map.getCenter();
        if (!center) return;

        // Map has fully settled — restore opacity.
        panRef.current(false);
        centerRef.current(center.lat(), center.lng());

        // If already locked, use a fixed offset instead of computeOffset()
        // to avoid floating-point pixel drift from projection math.
        if (lockedStopRef.current) {
          centerRef.current(
            lockedStopRef.current.lat,
            lockedStopRef.current.lng,
          );
          snapRef.current(0, -STOP_PIN_HALF_H);
          return;
        }

        // Not locked — search for a nearby stop to snap to.
        // Convert a fixed screen-pixel radius into metres using the
        // map projection so the snap feel stays consistent at every zoom.
        const SNAP_PX = 25; // screen pixels
        const projection = map.getProjection();
        const zoom = map.getZoom();
        let SNAP_M = 100; // sane fallback
        if (projection && zoom != null) {
          const centerPt = projection.fromLatLngToPoint(center);
          if (centerPt) {
            const scale = Math.pow(2, zoom);
            const offsetPt = new google.maps.Point(
              centerPt.x + SNAP_PX / scale,
              centerPt.y,
            );
            const offsetLatLng = projection.fromPointToLatLng(offsetPt);
            if (offsetLatLng) {
              SNAP_M = haversineM(
                center.lat(),
                center.lng(),
                offsetLatLng.lat(),
                offsetLatLng.lng(),
              );
            }
          }
        }
        const uniqueStops = deduplicateStops(stopsRef.current);
        let nearest: Stop | null = null;
        let nearestDist = Infinity;
        for (const stop of uniqueStops) {
          const d = haversineM(center.lat(), center.lng(), stop.lat, stop.lng);
          if (d < nearestDist) {
            nearestDist = d;
            nearest = stop;
          }
        }

        if (nearest && nearestDist <= SNAP_M) {
          lockedStopRef.current = { lat: nearest.lat, lng: nearest.lng };
          computeOffset(nearest.lat, nearest.lng);
        } else {
          snapRef.current(0, 0);
        }
      }, 300);
    });

    return () => {
      dragListener.remove();
      zoomListener.remove();
      idleListener.remove();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [map]);

  return null;
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
    const listener = map.addListener("dragstart", () => {
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
      if (
        lastPosRef.current?.lat !== bus.lat ||
        lastPosRef.current?.lng !== bus.lng
      ) {
        map.panTo({ lat: bus.lat, lng: bus.lng });
        lastPosRef.current = { lat: bus.lat, lng: bus.lng };
      }
    }
  }, [map, state.selectedBus, state.busSelectionKey, vehicles]);

  return null;
}
