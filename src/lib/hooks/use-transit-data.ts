"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchVersionId } from "@/lib/api/spot-client";
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

export interface TransitInitialData {
  routes: Route[];
  stops: Stop[];
  patterns: Pattern[];
  stopImages: StopImage[];
  initialVersion: number;
}

export function useTransitData(initialData: TransitInitialData): TransitStaticData {
  const router = useRouter();
  const [stopImagesMap] = useState<Map<number, StopImage>>(() => {
    const map = new Map<number, StopImage>();
    for (const img of initialData.stopImages) map.set(img.stopid, img);
    return map;
  });
  const lastVersionRef = useRef<number>(initialData.initialVersion);

  useEffect(() => {
    const checkVersion = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const v = await fetchVersionId();
        if (lastVersionRef.current !== v) {
          lastVersionRef.current = v;
          router.refresh();
        }
      } catch {
        // ignore version check errors
      }
    };

    const interval = setInterval(checkVersion, VERSION_POLL_INTERVAL);
    checkVersion();
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    routes: initialData.routes,
    stops: initialData.stops,
    patterns: initialData.patterns,
    stopImages: stopImagesMap,
    isLoading: false,
    error: null,
  };
}
