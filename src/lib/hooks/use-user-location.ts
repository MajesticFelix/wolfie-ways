'use client';

import { useState, useEffect, useRef } from 'react';

export type GeoState = 'idle' | 'loading' | 'granted' | 'denied' | 'unavailable';

export interface UserLocation {
  lat: number;
  lng: number;
}

export function useUserLocation() {
  const [geoState, setGeoState] = useState<GeoState>('idle');
  const [position, setPosition] = useState<UserLocation | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const orientationListenerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (orientationListenerRef.current) {
        window.removeEventListener('deviceorientation', orientationListenerRef.current);
      }
    };
  }, []);

  const startOrientationTracking = () => {
    const handler = (e: DeviceOrientationEvent) => {
      // iOS uses webkitCompassHeading (degrees from true north, clockwise)
      // Android: alpha is degrees from north, counter-clockwise, so invert it
      const ios = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading;
      if (typeof ios === 'number' && !isNaN(ios)) {
        setHeading(ios);
      } else if (e.alpha !== null) {
        setHeading((360 - e.alpha) % 360);
      }
    };
    orientationListenerRef.current = handler;
    window.addEventListener('deviceorientation', handler, { passive: true });
  };

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setGeoState('unavailable');
      return;
    }

    setGeoState('loading');

    // Request device orientation permission on iOS 13+
    const DevOrient = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof DevOrient.requestPermission === 'function') {
      try {
        const perm = await DevOrient.requestPermission();
        if (perm === 'granted') startOrientationTracking();
      } catch {
        // Orientation not available; proceed without it
      }
    } else {
      // Android / desktop — no permission needed
      startOrientationTracking();
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState('granted');
      },
      () => setGeoState('denied'),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 5_000 },
    );
  };

  return { position, heading, geoState, requestLocation };
}
