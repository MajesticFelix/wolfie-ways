'use client';

import { useCallback } from 'react';
import { fetchStopETAs, fetchSchedules } from '@/lib/api/spot-client';
import { usePolling } from './use-polling';
import type { StopETA, Schedule } from '@/lib/api/types';

const ETA_INTERVAL = 10_000;

export function useStopETAs(stopId: number | null) {
  const fetchFn = useCallback(() => {
    if (stopId === null) return Promise.resolve([]);
    return fetchStopETAs(stopId);
  }, [stopId]);

  return usePolling<StopETA[]>(fetchFn, ETA_INTERVAL, stopId !== null);
}

export function useStopSchedules(stopId: number | null) {
  const fetchFn = useCallback(() => {
    if (stopId === null) return Promise.resolve([]);
    return fetchSchedules(stopId);
  }, [stopId]);

  return usePolling<Schedule[]>(fetchFn, 60_000, stopId !== null);
}
