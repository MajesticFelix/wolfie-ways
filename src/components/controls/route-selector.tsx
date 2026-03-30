'use client';

import { memo } from 'react';
import { useTransit } from '@/lib/stores/transit-store';
import { normalizeColor } from '@/lib/utils/maps';
import type { Route } from '@/lib/api/types';

interface RouteSelectorProps {
  routes: Route[];
}

export const RouteSelector = memo(function RouteSelector({ routes }: RouteSelectorProps) {
  const { state, toggleRoute, selectAllRoutes, isRouteVisible } = useTransit();
  const allSelected = state.selectedRoutes.size === 0;

  if (routes.length === 0) return null;

  const activeCount = allSelected ? routes.length : state.selectedRoutes.size;

  return (
    <div className="w-full select-none">
      {/* Panel header */}
      <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
        <span className="text-[10px] font-black tracking-[0.18em] uppercase text-black dark:text-white">
          Lines
        </span>
        <span className="text-[10px] font-mono tabular-nums text-black dark:text-white">
          {activeCount}/{routes.length}
        </span>
      </div>

      {/* All Routes row */}
      <div className="px-2 pb-1">
        <button
          onClick={selectAllRoutes}
          aria-pressed={allSelected}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 ${
            allSelected
              ? 'bg-black/8 dark:bg-white/10 text-zinc-900 dark:text-white'
              : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-black/4 dark:hover:bg-white/4'
          }`}
        >
          {/* Dot constellation */}
          <div className="flex items-center gap-0.5 shrink-0">
            {routes.slice(0, 6).map((r) => (
              <div
                key={r.id}
                className="rounded-full transition-all duration-300"
                style={{
                  width: 5,
                  height: 5,
                  backgroundColor: normalizeColor(r.color),
                  opacity: allSelected ? 1 : 0.35,
                }}
              />
            ))}
            {routes.length > 6 && (
              <span className="text-[9px] text-zinc-400 dark:text-zinc-600 ml-0.5">+{routes.length - 6}</span>
            )}
          </div>
          <span className="text-xs font-semibold tracking-wide">All Routes</span>
          {allSelected && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-zinc-500 dark:bg-white/60 shrink-0" />
          )}
        </button>
      </div>

      {/* Divider */}
      <div className="mx-3.5 mb-1 border-t border-zinc-200 dark:border-zinc-800/80" />

      {/* Route list */}
      <div
        className="flex flex-col pb-2 max-h-[calc(100dvh-13rem)] overflow-y-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {routes.map((route) => {
          const active = isRouteVisible(route.id) && !allSelected;
          const color = normalizeColor(route.color);
          return (
            <RouteRow
              key={route.id}
              route={route}
              active={active}
              color={color}
              onToggle={() => toggleRoute(route.id)}
            />
          );
        })}
      </div>
    </div>
  );
});

interface RouteRowProps {
  route: Route;
  active: boolean;
  color: string;
  onToggle: () => void;
}

const RouteRow = memo(function RouteRow({ route, active, color, onToggle }: RouteRowProps) {
  return (
    <div className="px-2">
      <button
        onClick={onToggle}
        aria-pressed={active}
        className="w-full flex items-center gap-2.5 py-2 px-2.5 rounded-lg text-left transition-all duration-200 group relative overflow-hidden"
        style={
          active
            ? { backgroundColor: `${color}18`, color: 'inherit' }
            : undefined
        }
      >
        {/* Hover bg (inactive only) */}
        {!active && (
          <span className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/4 dark:group-hover:bg-white/4 transition-colors duration-150" />
        )}

        {/* Left color accent bar */}
        <div
          className="shrink-0 rounded-full transition-all duration-200"
          style={{
            width: 3,
            height: active ? 28 : 20,
            backgroundColor: color,
            opacity: active ? 1 : 0.45,
          }}
        />

        {/* Route name */}
        <span
          className={`text-sm leading-snug transition-colors duration-200 ${
            active
              ? 'font-semibold text-zinc-900 dark:text-white'
              : 'font-medium text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200'
          }`}
        >
          {route.name}
        </span>

        {/* Active indicator dot */}
        {active && (
          <div
            className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
        )}
      </button>
    </div>
  );
});
