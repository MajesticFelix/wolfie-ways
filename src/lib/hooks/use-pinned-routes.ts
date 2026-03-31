'use client';

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'wolfie-ways:pinned-routes';

function readPinned(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

export function usePinnedRoutes() {
  const [pinned, setPinned] = useState<Set<number>>(() => {
    if (typeof window === 'undefined') return new Set();
    return readPinned();
  });

  const togglePin = useCallback((routeId: number) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(routeId)) next.delete(routeId);
      else next.add(routeId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // storage full or unavailable — no-op
      }
      return next;
    });
  }, []);

  return { pinned, togglePin };
}
