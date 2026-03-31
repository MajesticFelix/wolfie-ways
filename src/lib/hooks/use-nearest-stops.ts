'use client';

import { useState } from 'react';
import { deduplicateStops, haversineM } from '@/lib/utils/maps';
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
