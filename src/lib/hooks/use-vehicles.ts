"use client";

import { fetchVehicles } from "@/lib/api/spot-client";
import { usePolling } from "./use-polling";
import type { Vehicle } from "@/lib/api/types";
import { UNASSIGNED_ROUTE_ID } from "@/lib/api/types";

const VEHICLES_INTERVAL = 5_000;

export function useVehicles() {
  const { data, error, isLoading, refresh } = usePolling<Vehicle[]>(
    fetchVehicles,
    VEHICLES_INTERVAL,
  );

  const activeVehicles =
    data?.filter(
      (v) => v.inService === 1 && v.routeID !== UNASSIGNED_ROUTE_ID,
    ) ?? [];

  return {
    vehicles: activeVehicles,
    allVehicles: data ?? [],
    error,
    isLoading,
    refresh,
  };
}
