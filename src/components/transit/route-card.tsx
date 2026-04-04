"use client";

import { memo } from "react";
import { Pin } from "lucide-react";
import { BusIcon } from "@/components/map/bus-markers";
import { resolveRouteColor } from "@/lib/utils/maps";
import type { Route, ETAEntry } from "@/lib/api/types";

interface RouteCardProps {
  route: Route;
  stopName: string;
  eta: ETAEntry;
  isLive: boolean;
  isDark: boolean;
  isPinned?: boolean;
  onClick: () => void;
}

export const RouteCard = memo(function RouteCard({
  route,
  stopName,
  eta,
  isLive,
  isDark,
  isPinned,
  onClick,
}: RouteCardProps) {
  const color = resolveRouteColor(route.color, isDark);
  const isArriving = eta.minutes <= 0;

  return (
    <div
      className="relative w-full flex items-stretch rounded-xl overflow-visible border border-zinc-200/60 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-900/80"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {isPinned && (
        <div className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-amber-400 dark:bg-amber-500 flex items-center justify-center shadow-sm">
          <Pin className="w-2.5 h-2.5 text-white fill-white" />
        </div>
      )}
      {/* Left color accent bar */}
      <div className="w-1 shrink-0" style={{ backgroundColor: color }} />

      {/* Main tappable area */}
      <button
        onClick={onClick}
        className="flex items-center flex-1 gap-3 px-3 py-3 min-w-0 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 active:bg-zinc-200/60 dark:active:bg-zinc-700/60 transition-colors text-left"
      >
        {/* Route icon badge */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white"
          style={{ backgroundColor: color }}
        >
          <BusIcon />
        </div>

        {/* Route name + stop */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {route.name}
            </span>
            {isLive && (
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
            {stopName}
          </p>
        </div>

        {/* ETA */}
        <div className="text-right shrink-0 min-w-10">
          <p
            className={`text-lg font-bold tabular-nums leading-tight${isArriving ? " text-green-500" : ""}`}
            style={isArriving ? undefined : { color }}
          >
            {isArriving ? "Now" : eta.minutes}
          </p>
          {!isArriving && (
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium leading-none">
              min
            </p>
          )}
        </div>
      </button>

    </div>
  );
});
