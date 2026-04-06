'use client';

import { useCallback } from 'react';
import { fetchAllStopETAs, fetchSchedules } from '@/lib/api/spot-client';
import { usePolling } from './use-polling';
import type { StopETA, Schedule } from '@/lib/api/types';

const ETA_INTERVAL = 15_000;

/**
 * Fetches ETAs for a single stop by pulling ALL stop ETAs and filtering
 * client-side. This shares the same CDN cache key as useMultiStopETAs,
 * so only one origin hit happens per cache window regardless of how many
 * hooks are active.
 */
export function useStopETAs(stopId: number | null) {
  const fetchFn = useCallback(async () => {
    if (stopId === null) return [];
    const allEtas = await fetchAllStopETAs();
    return allEtas.filter((eta) => Number(eta.id) === stopId);
  }, [stopId]);

  return usePolling<StopETA[]>(fetchFn, ETA_INTERVAL, stopId !== null, stopId ?? undefined);
}

export function useStopSchedules(stopId: number | null) {
  const fetchFn = useCallback(() => {
    if (stopId === null) return Promise.resolve([]);
    return fetchSchedules(stopId);
  }, [stopId]);

  return usePolling<Schedule[]>(fetchFn, 60_000, stopId !== null, stopId ?? undefined);
}
