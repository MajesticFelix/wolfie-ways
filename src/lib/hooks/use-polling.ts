'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface PollingState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

export function usePolling<T>(
  fetchFn: () => Promise<T>,
  intervalMs: number,
  enabled = true,
  key?: string | number,
): PollingState<T> & { refresh: () => void } {
  const [state, setState] = useState<PollingState<T>>({
    data: null,
    error: null,
    isLoading: true,
  });
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  // Generation counter: incremented every time the effect re-runs (key/enabled change).
  // A fetch that resolves after a new generation has started is simply discarded.
  const generationRef = useRef(0);

  const run = useCallback(async (generation: number) => {
    try {
      const data = await fetchFnRef.current();
      if (generationRef.current !== generation) return; // stale — discard
      setState({ data, error: null, isLoading: false });
    } catch (err) {
      if (generationRef.current !== generation) return;
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err : new Error(String(err)),
        isLoading: false,
      }));
    }
  }, []);

  // Clear stale data immediately when the key or enabled flag changes so
  // consumers never display results that belong to a different query.
  useEffect(() => {
    if (!enabled) return;
    setState({ data: null, error: null, isLoading: true });
  }, [key, enabled]);

  useEffect(() => {
    if (!enabled) return;

    const generation = ++generationRef.current;
    run(generation);

    const interval = setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        run(generation);
      }
    }, intervalMs);

    const onVisible = () => {
      if (document.visibilityState === 'visible') run(generationRef.current);
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, intervalMs, run, key]);

  const refresh = useCallback(() => {
    run(generationRef.current);
  }, [run]);

  return { ...state, refresh };
}
