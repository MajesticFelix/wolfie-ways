"use client";

import { useEffect, useRef, useState } from "react";
import {
  fetchRoutes,
  fetchStops,
  fetchPatterns,
  fetchStopImages,
  fetchVersionId,
} from "@/lib/api/spot-client";
import type { Route, Stop, Pattern, StopImage } from "@/lib/api/types";

const VERSION_POLL_INTERVAL = 30_000;

export interface TransitStaticData {
  routes: Route[];
  stops: Stop[];
  patterns: Pattern[];
  stopImages: Map<number, StopImage>;
  isLoading: boolean;
  error: Error | null;
}

export function useTransitData(): TransitStaticData {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [stopImages, setStopImages] = useState<Map<number, StopImage>>(
    new Map(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const lastVersionRef = useRef<number | null>(null);

  const loadStaticData = async () => {
    try {
      const [r, s, p, si] = await Promise.all([
        fetchRoutes(),
        fetchStops(),
        fetchPatterns(),
        fetchStopImages(),
      ]);
      setRoutes(r.sort((a, b) => a.order - b.order));
      setStops(s);
      setPatterns(p);
      const imgMap = new Map<number, StopImage>();
      for (const img of si) imgMap.set(img.stopid, img);
      setStopImages(imgMap);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaticData();

    const checkVersion = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const v = await fetchVersionId();
        if (lastVersionRef.current !== null && lastVersionRef.current !== v) {
          loadStaticData();
        }
        lastVersionRef.current = v;
      } catch {
        // ignore version check errors
      }
    };

    const interval = setInterval(checkVersion, VERSION_POLL_INTERVAL);
    checkVersion();
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { routes, stops, patterns, stopImages, isLoading, error };
}
