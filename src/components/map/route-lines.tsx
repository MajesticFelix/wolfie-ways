'use client';

import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useEffect, useRef } from 'react';
import { useTransit } from '@/lib/stores/transit-store';
import { normalizeColor } from '@/lib/utils/maps';
import type { Route } from '@/lib/api/types';

interface RouteLinesProps {
  routes: Route[];
}

export function RouteLines({ routes }: RouteLinesProps) {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const geometryLib = useMapsLibrary('geometry');
  const polylinesRef = useRef<Map<number, google.maps.Polyline>>(new Map());
  const { isRouteVisible } = useTransit();

  useEffect(() => {
    if (!map || !mapsLib || !geometryLib) return;

    // Add/update polylines for each route
    for (const route of routes) {
      if (!route.encLine) continue;

      const existing = polylinesRef.current.get(route.id);
      const visible = isRouteVisible(route.id);
      const color = normalizeColor(route.color);

      if (existing) {
        existing.setVisible(visible);
        existing.setOptions({ strokeColor: color });
      } else {
        const polyline = new mapsLib.Polyline({
          path: geometryLib.encoding.decodePath(route.encLine),
          strokeColor: color,
          strokeOpacity: 0.85,
          strokeWeight: 4,
          map: visible ? map : null,
          clickable: false,
          zIndex: 1,
        });
        polyline.setMap(visible ? map : null);
        polylinesRef.current.set(route.id, polyline);
      }
    }

    // Remove stale polylines
    const routeIds = new Set(routes.map((r) => r.id));
    for (const [id, polyline] of polylinesRef.current.entries()) {
      if (!routeIds.has(id)) {
        polyline.setMap(null);
        polylinesRef.current.delete(id);
      }
    }
  }, [map, mapsLib, geometryLib, routes, isRouteVisible]);

  // Update visibility when filter changes
  useEffect(() => {
    for (const [routeId, polyline] of polylinesRef.current.entries()) {
      polyline.setMap(isRouteVisible(routeId) && map ? map : null);
    }
  }, [map, isRouteVisible]);

  // Cleanup
  useEffect(() => {
    return () => {
      for (const polyline of polylinesRef.current.values()) {
        polyline.setMap(null);
      }
      polylinesRef.current.clear();
    };
  }, []);

  return null;
}
