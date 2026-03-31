'use client';

import { useCallback, useMemo } from 'react';
import { fetchStopETAs } from '@/lib/api/spot-client';
import { usePolling } from './use-polling';
import type { ETAEntry } from '@/lib/api/types';

export interface StopDeparture {
  stopId: number;
  eta: ETAEntry;
}

/**
 * Polls ETAs for multiple stops simultaneously. Returns a flattened, sorted array
 * of departures across all provided stop IDs, sorted by soonest arrival.
 */
export function useMultiStopETAs(stopIds: number[]) {
  // Stable key from sorted IDs — prevents re-fetching when array reference changes but IDs haven't
  const key = useMemo(
    () => JSON.stringify([...stopIds].sort((a, b) => a - b)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stopIds],
  );

  const fetchFn = useCallback(async (): Promise<StopDeparture[]> => {
    if (stopIds.length === 0) return [];
    const results = await Promise.all(stopIds.map((id) => fetchStopETAs(id)));
    const flat: StopDeparture[] = [];
    for (let i = 0; i < results.length; i++) {
      const stopId = stopIds[i];
      for (const stopEta of results[i]) {
        for (const eta of stopEta.enRoute) {
          flat.push({ stopId, eta });
        }
      }
    }
    return flat.sort((a, b) => a.eta.minutes - b.eta.minutes);
    // key controls when to re-create; stopIds captured via closure is correct at that point
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return usePolling<StopDeparture[]>(fetchFn, 10_000, stopIds.length > 0);
}
