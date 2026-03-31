'use client';

import { useState, useEffect } from 'react';

/** Returns true when the viewport is narrower than the md breakpoint (768px), reactive to changes. */
export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false); // SSR-safe default: shows desktop layout first

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return mobile;
}
