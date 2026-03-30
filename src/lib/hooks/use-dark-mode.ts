'use client';

import { useState, useEffect } from 'react';

/** Returns true when system preference is dark, reactive to changes. */
export function useDarkMode(): boolean {
  const [dark, setDark] = useState(true); // safe SSR default

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return dark;
}
