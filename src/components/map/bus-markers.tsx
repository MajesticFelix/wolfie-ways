'use client';

import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { memo } from 'react';
import { useTransit } from '@/lib/stores/transit-store';
import { normalizeColor } from '@/lib/utils/maps';
import type { Vehicle, Route } from '@/lib/api/types';

interface BusMarkersProps {
  vehicles: Vehicle[];
  routes: Route[];
}

export const BusMarkers = memo(function BusMarkers({ vehicles, routes }: BusMarkersProps) {
  const { selectBus, state } = useTransit();

  const routeMap = new Map(routes.map((r) => [r.id, r]));
  const visibleVehicles = vehicles.filter((v) => {
    // Always show the selected bus even if its route is filtered
    if (v.equipmentID === state.selectedBus) return true;
    return state.selectedRoutes.size === 0 || state.selectedRoutes.has(v.routeID);
  });

  return (
    <>
      {visibleVehicles.map((vehicle) => {
        const route = routeMap.get(vehicle.routeID);
        const color = normalizeColor(route?.color ?? '#3B82F6');
        const isSelected = state.selectedBus === vehicle.equipmentID;

        return (
          <AdvancedMarker
            key={vehicle.equipmentID}
            position={{ lat: vehicle.lat, lng: vehicle.lng }}
            title={`Bus ${vehicle.equipmentID} — ${route?.name ?? 'Unknown route'}`}
            onClick={() => selectBus(vehicle.equipmentID)}
            zIndex={isSelected ? 30 : 20}
          >
            <BusPin
              color={color}
              heading={vehicle.h}
              routeAbbr={route?.abbr ?? route?.name ?? ''}
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

const BusPin = memo(function BusPin({ color, heading, routeAbbr, isSelected }: BusPinProps) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        gap: 4,
        paddingTop: 18,
      }}
    >
      {/* Direction arrow */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: `translateX(-50%) rotate(${heading}deg)`,
          transformOrigin: '50% 100%',
          color: 'white',
          fontSize: 15,
          lineHeight: 1,
          filter: `drop-shadow(0 0 3px ${color}) drop-shadow(0 1px 2px rgba(0,0,0,0.9))`,
          pointerEvents: 'none',
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
          border: '3px solid rgba(255,255,255,0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isSelected
            ? `0 0 0 4px ${color}, 0 6px 20px rgba(0,0,0,0.8)`
            : `0 0 0 2.5px ${color}, 0 4px 16px rgba(0,0,0,0.7)`,
          transform: isSelected ? 'scale(1.18)' : 'scale(1)',
          transition: 'transform 150ms ease, box-shadow 150ms ease',
        }}
        onMouseEnter={(e) => {
          if (isSelected) return;
          const el = e.currentTarget as HTMLElement;
          el.style.transform = 'scale(1.18)';
          el.style.boxShadow = `0 0 0 4px ${color}, 0 6px 20px rgba(0,0,0,0.8)`;
        }}
        onMouseLeave={(e) => {
          if (isSelected) return;
          const el = e.currentTarget as HTMLElement;
          el.style.transform = 'scale(1)';
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
            color: 'white',
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: 20,
            border: '2px solid rgba(255,255,255,0.9)',
            boxShadow: `0 0 0 1.5px ${color}, 0 2px 6px rgba(0,0,0,0.6)`,
            whiteSpace: 'nowrap',
            letterSpacing: '0.03em',
            lineHeight: '14px',
          }}
        >
          {routeAbbr}
        </div>
      )}
    </div>
  );
});

function BusIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
      <circle cx="7" cy="18" r="1" />
      <circle cx="17" cy="18" r="1" />
      <path d="M8 6V4" />
      <path d="M16 6V4" />
    </svg>
  );
}
