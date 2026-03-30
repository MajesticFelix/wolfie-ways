"use client";

import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { memo } from "react";
import { useTransit } from "@/lib/stores/transit-store";
import { normalizeColor } from "@/lib/utils/maps";
import type { Vehicle, Route } from "@/lib/api/types";

interface BusMarkersProps {
  vehicles: Vehicle[];
  routes: Route[];
}

export const BusMarkers = memo(function BusMarkers({
  vehicles,
  routes,
}: BusMarkersProps) {
  const { selectBus, state } = useTransit();

  const routeMap = new Map(routes.map((r) => [r.id, r]));
  const visibleVehicles = vehicles.filter((v) => {
    // Always show the selected bus even if its route is filtered
    if (v.equipmentID === state.selectedBus) return true;
    return (
      state.selectedRoutes.size === 0 || state.selectedRoutes.has(v.routeID)
    );
  });

  return (
    <>
      {visibleVehicles.map((vehicle) => {
        const route = routeMap.get(vehicle.routeID);
        const color = normalizeColor(route?.color ?? "#3B82F6");
        const isSelected = state.selectedBus === vehicle.equipmentID;

        return (
          <AdvancedMarker
            key={vehicle.equipmentID}
            position={{ lat: vehicle.lat, lng: vehicle.lng }}
            title={`Bus ${vehicle.equipmentID} — ${route?.name ?? "Unknown route"}`}
            onClick={() => selectBus(vehicle.equipmentID)}
            zIndex={isSelected ? 30 : 20}
          >
            <BusPin
              color={color}
              heading={vehicle.h}
              routeAbbr={route?.abbr ?? route?.name ?? ""}
              isSelected={isSelected}
            />
          </AdvancedMarker>
        );
      })}
    </>
  );
});

interface BusPinProps {
  color: string;
  heading: number;
  routeAbbr: string;
  isSelected: boolean;
}

const BusPin = memo(function BusPin({
  color,
  heading,
  routeAbbr,
  isSelected,
}: BusPinProps) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: "pointer",
        gap: 4,
        paddingTop: 18,
      }}
    >
      {/* Direction arrow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: `translateX(-50%) rotate(${heading}deg)`,
          transformOrigin: "50% 100%",
          color: "white",
          fontSize: 15,
          lineHeight: 1,
          filter: `drop-shadow(0 0 3px ${color}) drop-shadow(0 1px 2px rgba(0,0,0,0.9))`,
          pointerEvents: "none",
        }}
      >
        ▲
      </div>

      {/* Bus body */}
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 13,
          background: color,
          border: "3px solid rgba(255,255,255,0.95)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: isSelected
            ? `0 0 0 4px ${color}, 0 6px 20px rgba(0,0,0,0.8)`
            : `0 0 0 2.5px ${color}, 0 4px 16px rgba(0,0,0,0.7)`,
          transform: isSelected ? "scale(1.18)" : "scale(1)",
          transition: "transform 150ms ease, box-shadow 150ms ease",
        }}
        onMouseEnter={(e) => {
          if (isSelected) return;
          const el = e.currentTarget as HTMLElement;
          el.style.transform = "scale(1.18)";
          el.style.boxShadow = `0 0 0 4px ${color}, 0 6px 20px rgba(0,0,0,0.8)`;
        }}
        onMouseLeave={(e) => {
          if (isSelected) return;
          const el = e.currentTarget as HTMLElement;
          el.style.transform = "scale(1)";
          el.style.boxShadow = `0 0 0 2.5px ${color}, 0 4px 16px rgba(0,0,0,0.7)`;
        }}
      >
        <BusIcon />
      </div>

      {/* Route label pill */}
      {routeAbbr && (
        <div
          style={{
            backgroundColor: color,
            color: "white",
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: 20,
            border: "2px solid rgba(255,255,255,0.9)",
            boxShadow: `0 0 0 1.5px ${color}, 0 2px 6px rgba(0,0,0,0.6)`,
            whiteSpace: "nowrap",
            letterSpacing: "0.03em",
            lineHeight: "14px",
          }}
        >
          {routeAbbr}
        </div>
      )}
    </div>
  );
});

export function BusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="currentColor"
      viewBox="0 0 16 16"
      aria-label="Bus icon"
      role="img"
    >
      <path d="M5 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0m8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-6-1a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2zm1-6c-1.876 0-3.426.109-4.552.226A.5.5 0 0 0 3 4.723v3.554a.5.5 0 0 0 .448.497C4.574 8.891 6.124 9 8 9s3.426-.109 4.552-.226A.5.5 0 0 0 13 8.277V4.723a.5.5 0 0 0-.448-.497A44 44 0 0 0 8 4m0-1c-1.837 0-3.353.107-4.448.22a.5.5 0 1 1-.104-.994A44 44 0 0 1 8 2c1.876 0 3.426.109 4.552.226a.5.5 0 1 1-.104.994A43 43 0 0 0 8 3" />
      <path d="M15 8a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1V2.64c0-1.188-.845-2.232-2.064-2.372A44 44 0 0 0 8 0C5.9 0 4.208.136 3.064.268 1.845.408 1 1.452 1 2.64V4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1v3.5c0 .818.393 1.544 1 2v2a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5V14h6v1.5a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-2c.607-.456 1-1.182 1-2zM8 1c2.056 0 3.71.134 4.822.261.676.078 1.178.66 1.178 1.379v8.86a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 11.5V2.64c0-.72.502-1.301 1.178-1.379A43 43 0 0 1 8 1" />
    </svg>
  );
}
