'use client';

import { useCallback, useMemo } from 'react';
import { fetchAllStopETAs } from '@/lib/api/spot-client';
import { usePolling } from './use-polling';
import type { ETAEntry } from '@/lib/api/types';

export interface StopDeparture {
  stopId: number;
  eta: ETAEntry;
}

/**
 * Polls ETAs for multiple stops simultaneously. Fetches ALL stop ETAs in a
 * single request and filters client-side, so every user shares one CDN cache
 * entry instead of N per-stop entries.
 */
export function useMultiStopETAs(stopIds: number[]) {
  // Stable key from sorted IDs — prevents re-fetching when array reference changes but IDs haven't
  const key = useMemo(
    () => JSON.stringify([...stopIds].sort((a, b) => a - b)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stopIds],
  );

  const stopIdSet = useMemo(() => new Set(stopIds), [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchFn = useCallback(async (): Promise<StopDeparture[]> => {
    if (stopIds.length === 0) return [];
    const allEtas = await fetchAllStopETAs();
    const flat: StopDeparture[] = [];
    for (const stopEta of allEtas) {
      const stopId = Number(stopEta.id);
      if (!stopIdSet.has(stopId)) continue;
      for (const eta of stopEta.enRoute) {
        flat.push({ stopId, eta });
      }
    }
    return flat.sort((a, b) => a.eta.minutes - b.eta.minutes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return usePolling<StopDeparture[]>(fetchFn, 15_000, stopIds.length > 0, key);
}
