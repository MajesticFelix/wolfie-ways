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
  enabled = true
): PollingState<T> & { refresh: () => void } {
  const [state, setState] = useState<PollingState<T>>({
    data: null,
    error: null,
    isLoading: true,
  });
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const run = useCallback(async () => {
    try {
      const data = await fetchFnRef.current();
      setState({ data, error: null, isLoading: false });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err : new Error(String(err)),
        isLoading: false,
      }));
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    run();

    const interval = setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        run();
      }
    }, intervalMs);

    const onVisible = () => { if (document.visibilityState === 'visible') run(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, intervalMs, run]);

  return { ...state, refresh: run };
}
