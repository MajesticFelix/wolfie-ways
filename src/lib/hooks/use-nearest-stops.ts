'use client';

import { useState } from 'react';
import { deduplicateStops } from '@/lib/utils/maps';
import type { Stop } from '@/lib/api/types';

export type GeoState = 'idle' | 'loading' | 'granted' | 'denied' | 'unavailable';

export interface NearestStop {
  stop: Stop;
  distanceM: number;
}

export function useNearestStops(stops: Stop[], count = 3) {
  const [geoState, setGeoState] = useState<GeoState>('idle');
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGeoState('unavailable');
      return;
    }
    setGeoState('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState('granted');
      },
      () => setGeoState('denied'),
      { timeout: 10_000, maximumAge: 60_000 },
    );
  };

  const nearest: NearestStop[] = userPos
    ? deduplicateStops(stops)
        .map((stop) => ({ stop, distanceM: haversineM(userPos.lat, userPos.lng, stop.lat, stop.lng) }))
        .sort((a, b) => a.distanceM - b.distanceM)
        .slice(0, count)
    : [];

  return { geoState, nearest, requestLocation };
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
