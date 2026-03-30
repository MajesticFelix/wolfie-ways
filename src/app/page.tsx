'use client';

import { TransitProvider } from '@/lib/stores/transit-store';
import { useTransitData } from '@/lib/hooks/use-transit-data';
import { useVehicles } from '@/lib/hooks/use-vehicles';
import { useAnnouncements } from '@/lib/hooks/use-announcements';
import { MapView } from '@/components/map/map-view';
import { RouteSelector } from '@/components/controls/route-selector';
import { AnnouncementBanner } from '@/components/announcements/announcement-banner';
import { BottomSheet } from '@/components/panels/bottom-sheet';
import { Bus, RefreshCw, AlertCircle } from 'lucide-react';

export default function Home() {
  return (
    <TransitProvider>
      <AppContent />
    </TransitProvider>
  );
}

function AppContent() {
  const { routes, stops, stopImages, isLoading: staticLoading, error: staticError } = useTransitData();
  const { vehicles, isLoading: vehiclesLoading, refresh: refreshVehicles } = useVehicles();
  const { data: announcementGroups } = useAnnouncements();

  const isInitialLoad = staticLoading && routes.length === 0;

  return (
    <div className="relative w-full h-dvh overflow-hidden">
      {/* Full-screen map */}
      <div className="absolute inset-0 z-0">
        {!isInitialLoad && (
          <MapView routes={routes} stops={stops} vehicles={vehicles} />
        )}
      </div>

      {/* Loading overlay */}
      {isInitialLoad && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-950 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center">
            <Bus className="w-9 h-9 text-white" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Wolfie Ways</p>
            <p className="text-sm text-zinc-500 mt-1">Loading bus data…</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {staticError && !isInitialLoad && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-950/90 border border-red-800/60 text-red-200 text-sm shadow-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Failed to load route data</span>
        </div>
      )}

      {/* Top-left controls: header row + route selector */}
      {!isInitialLoad && (
        <div
          className="absolute top-0 left-0 z-20 flex flex-col gap-2 p-3"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          {/* Header row: logo | live count | refresh */}
          <div className="flex items-center gap-2">
            {/* Logo pill */}
            <div className="flex items-center gap-2 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-zinc-200/70 dark:border-zinc-800/60 rounded-2xl px-3 py-2 shadow-lg">
              <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
                <Bus className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Wolfie Ways</span>
            </div>

            {/* Live bus count badge */}
            {vehicles.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-2xl bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-zinc-200/70 dark:border-zinc-800/60 shadow-lg h-10">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums whitespace-nowrap">
                  {vehicles.length} live
                </span>
              </div>
            )}

            {/* Refresh button */}
            <button
              onClick={refreshVehicles}
              disabled={vehiclesLoading}
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-zinc-200/70 dark:border-zinc-800/60 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors shadow-lg disabled:opacity-50"
              aria-label="Refresh bus positions"
            >
              <RefreshCw className={`w-4 h-4 ${vehiclesLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Route selector card */}
          <div className="w-56 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-zinc-200/70 dark:border-zinc-800/60 rounded-2xl shadow-lg overflow-hidden">
            <RouteSelector routes={routes} />
          </div>
        </div>
      )}

      {/* Bottom-left: announcements */}
      {!isInitialLoad && announcementGroups && announcementGroups.length > 0 && (
        <div
          className="absolute left-3 z-20"
          style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
          <AnnouncementBanner groups={announcementGroups} />
        </div>
      )}

      {/* Details panel (bus or stop) */}
      {!isInitialLoad && (
        <BottomSheet
          routes={routes}
          stops={stops}
          vehicles={vehicles}
          stopImages={stopImages}
        />
      )}
    </div>
  );
}
