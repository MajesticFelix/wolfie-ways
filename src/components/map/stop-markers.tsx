'use client';

import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { memo } from 'react';
import { useTransit } from '@/lib/stores/transit-store';
import { useDarkMode } from '@/lib/hooks/use-dark-mode';
import { deduplicateStops, normalizeColor } from '@/lib/utils/maps';
import type { Stop, Route } from '@/lib/api/types';

interface StopMarkersProps {
  stops: Stop[];
  routes: Route[];
}

export const StopMarkers = memo(function StopMarkers({ stops, routes }: StopMarkersProps) {
  const { selectStop, panMap, isRouteVisible, state } = useTransit();
  const isDark = useDarkMode();

  const stopColors = new Map<number, string[]>();
  for (const route of routes) {
    if (!isRouteVisible(route.id)) continue;
    for (const stopId of route.stops) {
      const existing = stopColors.get(stopId) ?? [];
      stopColors.set(stopId, [...existing, normalizeColor(route.color)]);
    }
  }

  const uniqueStops = deduplicateStops(stops).filter((s) => {
    const colors = stopColors.get(s.id);
    return colors && colors.length > 0;
  });

  return (
    <>
      {uniqueStops.map((stop) => {
        const colors = stopColors.get(stop.id) ?? ['#3B82F6'];
        const primaryColor = colors[0];
        const isSelected = state.selectedStop === stop.id;

        return (
          <AdvancedMarker
            key={stop.id}
            position={{ lat: stop.lat, lng: stop.lng }}
            title={stop.name}
            onClick={() => {
              selectStop(stop.id);
              panMap(stop.lat, stop.lng, 18);
            }}
            zIndex={isSelected ? 10 : 2}
          >
            <StopPin color={primaryColor} isDark={isDark} isSelected={isSelected} />
          </AdvancedMarker>
        );
      })}
    </>
  );
});

const StopPin = memo(function StopPin({
  color,
  isDark,
  isSelected,
}: {
  color: string;
  isDark: boolean;
  isSelected: boolean;
}) {
  return (
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: isDark ? '#18181b' : '#ffffff',
        border: `3.5px solid ${color}`,
        boxShadow: isSelected
          ? `0 0 0 3px ${color}50, 0 2px 8px rgba(0,0,0,0.4)`
          : isDark
          ? '0 1px 5px rgba(0,0,0,0.6)'
          : '0 1px 5px rgba(0,0,0,0.25)',
        cursor: 'pointer',
        transform: isSelected ? 'scale(1.4)' : 'scale(1)',
        transition: 'transform 150ms ease, box-shadow 150ms ease',
      }}
      onMouseEnter={(e) => {
        if (isSelected) return;
        (e.currentTarget as HTMLElement).style.transform = 'scale(1.4)';
      }}
      onMouseLeave={(e) => {
        if (isSelected) return;
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
      }}
    />
  );
});
