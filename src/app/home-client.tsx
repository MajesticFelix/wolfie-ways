"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { useTransitData, type TransitInitialData } from "@/lib/hooks/use-transit-data";
import { useVehicles } from "@/lib/hooks/use-vehicles";
import { useAnnouncements } from "@/lib/hooks/use-announcements";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import { useUserLocation } from "@/lib/hooks/use-user-location";
import { MapView } from "@/components/map/map-view";
import { RouteSelector } from "@/components/controls/route-selector";
import { NearestStopsPanel } from "@/components/controls/nearest-stops-panel";
import { AnnouncementBanner } from "@/components/announcements/announcement-banner";
import { BottomSheet } from "@/components/panels/bottom-sheet";
import { TransitDrawer } from "@/components/transit/transit-drawer";
import {
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";
import { InstallPrompt } from "@/components/transit/install-prompt";

export function HomeClient(props: TransitInitialData) {
  const {
    routes,
    stops,
    stopImages,
    error: staticError,
  } = useTransitData(props);
  const {
    vehicles,
    isLoading: vehiclesLoading,
    refresh: refreshVehicles,
  } = useVehicles();
  const { data: announcementGroups } = useAnnouncements();
  const isMobile = useIsMobile();
  const { position: userPosition, heading: userHeading, requestLocation } = useUserLocation();
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [onCooldown, setOnCooldown] = useState(false);

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRefresh = useCallback(() => {
    if (onCooldown || vehiclesLoading) return;
    refreshVehicles();
    setOnCooldown(true);
    cooldownRef.current = setTimeout(() => setOnCooldown(false), 1000);
  }, [onCooldown, vehiclesLoading, refreshVehicles]);
  const [mapCenter, setMapCenter] = useState<
    { lat: number; lng: number } | undefined
  >(undefined);

  const hasAnnouncements = Boolean(
    announcementGroups && announcementGroups.length > 0,
  );

  return (
    <div className="relative w-full h-dvh overflow-hidden">
      {/* Full-screen map */}
      <div className="absolute inset-0 z-0">
        <MapView
          routes={routes}
          stops={stops}
          vehicles={vehicles}
          onCenterChange={(lat, lng) => setMapCenter({ lat, lng })}
          userLocation={userPosition ? { ...userPosition, heading: userHeading } : null}
        />
      </div>

      {/* Error state */}
      {staticError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-950/90 border border-red-800/60 text-red-200 text-sm shadow-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Failed to load route data</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          MOBILE LAYOUT — Transit-style bottom drawer
          ═══════════════════════════════════════════ */}
      {isMobile && (
        <>
          {/* Floating top-left header stack: Pill + Refresh + Install Prompt */}
          <div
            className="absolute top-0 left-0 z-20 flex flex-col items-start gap-2 pl-3 pb-3 w-full pointer-events-none"
            style={{ paddingTop: "0.75rem" }}
          >
            <div className="flex items-center gap-2 pointer-events-auto">
              {/* Wolfie Ways pill — with optional announcement indicator */}
              <div className="flex items-center gap-1.5 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-zinc-200/70 dark:border-zinc-800/60 rounded-2xl px-2.5 py-2 shadow-lg">
                <Image
                  src="/wolfieways.png"
                  alt="Wolfie Ways"
                  width={20}
                  height={20}
                  className="w-5 h-5 rounded-md shrink-0"
                />
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Wolfie Ways
                </span>
                {hasAnnouncements && (
                  <button
                    onClick={() => setShowAnnouncements((v) => !v)}
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${showAnnouncements ? "bg-red-700" : "bg-red-600 hover:bg-red-700"}`}
                    aria-label={
                      showAnnouncements
                        ? "Hide announcements"
                        : "Show announcements"
                    }
                  >
                    <span className="text-white text-[9px] font-black leading-none select-none">
                      !
                    </span>
                  </button>
                )}
              </div>

              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                disabled={vehiclesLoading || onCooldown}
                className="w-9 h-9 flex items-center justify-center rounded-2xl bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-zinc-200/70 dark:border-zinc-800/60 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors shadow-lg disabled:opacity-50"
                aria-label="Refresh bus positions"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${vehiclesLoading ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            {/* Install prompt */}
            <div className="w-full pr-3 pointer-events-auto">
              <InstallPrompt />
            </div>
          </div>

          {/* Announcement modal — centered overlay with blur backdrop */}
          {showAnnouncements && hasAnnouncements && announcementGroups && (
            <div
              className="absolute inset-0 z-50 flex items-center justify-center p-6"
              onClick={() => setShowAnnouncements(false)}
            >
              {/* Blurred backdrop */}
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

              {/* Modal card */}
              <div
                className="relative z-10 w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-zinc-950/95 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl border border-zinc-800/60">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800/60">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center shrink-0">
                        <span className="text-white text-[9px] font-black leading-none select-none">
                          !
                        </span>
                      </div>
                      <p className="text-sm font-bold text-zinc-100">
                        Announcements
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAnnouncements(false)}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
                      aria-label="Close announcements"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Announcement list */}
                  <div className="p-4 flex flex-col gap-3">
                    {announcementGroups
                      .flatMap((g) =>
                        g.announcements.map((a) => ({
                          ...a,
                          severity: g.type,
                        })),
                      )
                      .map((a, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border text-sm leading-snug ${a.severity === "high"
                              ? "bg-red-950/40 border-red-800/50 text-red-200"
                              : "bg-amber-950/30 border-amber-700/40 text-amber-200"
                            }`}
                        >
                          {a.severity === "high" ? (
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                          ) : (
                            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                          )}
                          <p>{a.text}</p>
                        </div>
                      ))}
                  </div>
                </div>
                <p className="text-center text-xs text-white/40 mt-5">
                  Tap outside to close
                </p>
              </div>
            </div>
          )}

          {/* Top-right: live bus count pill */}
          {vehicles.length > 0 && (
            <div
              className="absolute top-0 right-0 z-20 p-3"
              style={{ paddingTop: "0.75rem" }}
            >
              <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-2xl bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-zinc-200/70 dark:border-zinc-800/60 shadow-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                <span className="text-xs font-semibold text-green-600 dark:text-green-400 tabular-nums whitespace-nowrap">
                  {vehicles.length} live
                </span>
              </div>
            </div>
          )}

          {/* Transit bottom drawer */}
          <TransitDrawer
            routes={routes}
            stops={stops}
            vehicles={vehicles}
            stopImages={stopImages}
            mapCenter={mapCenter}
          />
        </>
      )}

      {/* ═══════════════════════════════════════════
          DESKTOP LAYOUT — existing floating controls
          ═══════════════════════════════════════════ */}
      {!isMobile && (
        <>
          {/* Top-left controls: header row + route selector */}
          <div
            className="absolute top-0 left-0 z-20 flex flex-col gap-2 p-3"
            style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
          >
            {/* Header row: logo | live count | refresh */}
            <div className="flex items-center gap-2">
              {/* Logo pill */}
              <div className="flex items-center gap-2 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-zinc-200/70 dark:border-zinc-800/60 rounded-2xl px-3 py-2 shadow-lg">
                <Image
                  src="/wolfieways.png"
                  alt="Wolfie Ways"
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-lg shrink-0"
                />
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Wolfie Ways
                </span>
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
                onClick={handleRefresh}
                disabled={vehiclesLoading || onCooldown}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-zinc-200/70 dark:border-zinc-800/60 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors shadow-lg disabled:opacity-50"
                aria-label="Refresh bus positions"
              >
                <RefreshCw
                  className={`w-4 h-4 ${vehiclesLoading ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            {/* Route selector card */}
            <div className="w-56 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-zinc-200/70 dark:border-zinc-800/60 rounded-2xl shadow-lg overflow-hidden">
              <RouteSelector routes={routes} />
            </div>

            {/* Nearest stops card */}
            <div className="w-56 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-zinc-200/70 dark:border-zinc-800/60 rounded-2xl shadow-lg overflow-hidden">
              <NearestStopsPanel stops={stops} routes={routes} />
            </div>
          </div>

          {/* Bottom-left: announcements */}
          {announcementGroups && announcementGroups.length > 0 && (
            <div
              className="absolute left-3 z-20"
              style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
            >
              <AnnouncementBanner groups={announcementGroups} />
            </div>
          )}

          {/* Details panel (bus or stop) */}
          <BottomSheet
            routes={routes}
            stops={stops}
            vehicles={vehicles}
            stopImages={stopImages}
          />
        </>
      )}
    </div>
  );
}
