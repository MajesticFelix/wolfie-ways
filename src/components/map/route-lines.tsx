'use client';

import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useEffect, useRef } from 'react';
import { useTransit } from '@/lib/stores/transit-store';
import { resolveRouteColor, splitPathAtJumps } from '@/lib/utils/maps';
import { useDarkMode } from '@/lib/hooks/use-dark-mode';
import type { Route, Stop, Vehicle } from '@/lib/api/types';

interface RouteLinesProps {
  routes: Route[];
  stops: Stop[];
  vehicles: Vehicle[];
}

/**
 * Per-route polyline store. Arrays because routes with a bad jump segment in
 * their encoded line are rendered as multiple separate polylines (one per
 * continuous sub-path) so the spurious straight connector is never drawn.
 */
interface RoutePolylines {
  full: google.maps.Polyline[];
  past: google.maps.Polyline[];
  future: google.maps.Polyline[];
}

/** Returns the index of the closest vertex in `path` to (lat, lng). */
function findClosestVertexIndex(
  path: google.maps.LatLng[],
  lat: number,
  lng: number,
): number {
  let minDist = Infinity;
  let idx = 0;
  for (let i = 0; i < path.length; i++) {
    const d = (path[i].lat() - lat) ** 2 + (path[i].lng() - lng) ** 2;
    if (d < minDist) { minDist = d; idx = i; }
  }
  return idx;
}

function destroyEntry(entry: RoutePolylines) {
  for (const p of [...entry.full, ...entry.past, ...entry.future]) p.setMap(null);
}

/**
 * Resize `arr` to `count` polylines, creating with `mapsLib` or destroying as
 * needed, then return it.
 */
function resizePolylineArray(
  arr: google.maps.Polyline[],
  count: number,
  mapsLib: google.maps.MapsLibrary,
): google.maps.Polyline[] {
  while (arr.length > count) arr.pop()!.setMap(null);
  while (arr.length < count) arr.push(new mapsLib.Polyline({ clickable: false }));
  return arr;
}

export function RouteLines({ routes, stops, vehicles }: RouteLinesProps) {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const geometryLib = useMapsLibrary('geometry');
  const polylinesRef = useRef<Map<number, RoutePolylines>>(new Map());
  const { state } = useTransit();
  const isDark = useDarkMode();

  useEffect(() => {
    if (!map || !mapsLib || !geometryLib) return;

    const selectedBus = state.selectedBus
      ? vehicles.find((v) => v.equipmentID === state.selectedBus)
      : null;

    const isEffectivelyVisible = (routeId: number): boolean => {
      if (selectedBus) return routeId === selectedBus.routeID;
      if (state.selectedStop != null) {
        const servesStop = routes.some((r) => r.id === routeId && r.stops.includes(state.selectedStop!));
        if (!servesStop) return false;
        return state.selectedRoutes.size === 0 || state.selectedRoutes.has(routeId);
      }
      return state.selectedRoutes.size === 0 || state.selectedRoutes.has(routeId);
    };

    for (const route of routes) {
      if (!route.encLine) continue;

      const visible = isEffectivelyVisible(route.id);
      const color = resolveRouteColor(route.color, isDark);
      const fullPath = geometryLib.encoding.decodePath(route.encLine);

      // Split the path at any anomalously long segments (removes bad connectors
      // like the Railroad route's SAC → LIRR straight line in the API data).
      const { paths: segPaths, startIndices } = splitPathAtJumps(fullPath);
      const validSegPaths = segPaths.filter((p) => p.length > 1);

      // Compute the split index (in fullPath coords) for past/future rendering.
      let splitIdx = -1;
      if (selectedBus?.routeID === route.id) {
        const nextIdx = route.stops.indexOf(selectedBus.nextStopID);
        if (nextIdx > 0) {
          const lastStop = stops.find((s) => s.id === route.stops[nextIdx - 1]);
          if (lastStop) splitIdx = findClosestVertexIndex(fullPath, lastStop.lat, lastStop.lng);
        }
      } else if (state.selectedStop != null && route.stops.includes(state.selectedStop)) {
        const selectedStop = stops.find((s) => s.id === state.selectedStop);
        if (selectedStop) splitIdx = findClosestVertexIndex(fullPath, selectedStop.lat, selectedStop.lng);
      }

      const isSplit = splitIdx > 0;

      // Compute past / future sub-paths across segments.
      let pastPaths: google.maps.LatLng[][] = [];
      let futurePaths: google.maps.LatLng[][] = [];
      if (isSplit) {
        // Locate which segment contains splitIdx.
        let segIdx = segPaths.length - 1;
        for (let s = 0; s < startIndices.length - 1; s++) {
          if (splitIdx < startIndices[s + 1]) { segIdx = s; break; }
        }
        const offset = splitIdx - startIndices[segIdx];
        pastPaths = [
          ...segPaths.slice(0, segIdx),
          segPaths[segIdx].slice(0, offset + 1),
        ].filter((p) => p.length > 1);
        futurePaths = [
          segPaths[segIdx].slice(offset),
          ...segPaths.slice(segIdx + 1),
        ].filter((p) => p.length > 1);
      }

      const fullOpts: google.maps.PolylineOptions = { strokeColor: color, strokeOpacity: 0.85, strokeWeight: 5, zIndex: 1 };
      const pastOpts: google.maps.PolylineOptions = { strokeColor: color, strokeOpacity: 0.5, strokeWeight: 5, zIndex: 1 };
      const futureOpts: google.maps.PolylineOptions = { strokeColor: color, strokeOpacity: 1.0, strokeWeight: 7, zIndex: 2 };

      let entry = polylinesRef.current.get(route.id);

      if (!entry) {
        entry = { full: [], past: [], future: [] };
        polylinesRef.current.set(route.id, entry);
      }

      if (isSplit) {
        // Hide all full polylines.
        for (const p of entry.full) p.setMap(null);

        resizePolylineArray(entry.past, pastPaths.length, mapsLib);
        for (let i = 0; i < pastPaths.length; i++) {
          entry.past[i].setPath(pastPaths[i]);
          entry.past[i].setOptions(pastOpts);
          entry.past[i].setMap(visible ? map : null);
        }

        resizePolylineArray(entry.future, futurePaths.length, mapsLib);
        for (let i = 0; i < futurePaths.length; i++) {
          entry.future[i].setPath(futurePaths[i]);
          entry.future[i].setOptions(futureOpts);
          entry.future[i].setMap(visible ? map : null);
        }
      } else {
        // Hide all past/future polylines.
        for (const p of entry.past) p.setMap(null);
        for (const p of entry.future) p.setMap(null);

        resizePolylineArray(entry.full, validSegPaths.length, mapsLib);
        for (let i = 0; i < validSegPaths.length; i++) {
          entry.full[i].setPath(validSegPaths[i]);
          entry.full[i].setOptions(fullOpts);
          entry.full[i].setMap(visible ? map : null);
        }
      }
    }

    // Remove polylines for routes that no longer exist.
    const routeIds = new Set(routes.map((r) => r.id));
    for (const [id, entry] of polylinesRef.current.entries()) {
      if (!routeIds.has(id)) {
        destroyEntry(entry);
        polylinesRef.current.delete(id);
      }
    }
  }, [map, mapsLib, geometryLib, routes, stops, vehicles, state.selectedBus, state.selectedStop, state.selectedRoutes, isDark]);

  useEffect(() => {
    return () => {
      for (const entry of polylinesRef.current.values()) destroyEntry(entry);
      polylinesRef.current.clear();
    };
  }, []);

  return null;
}
