"use client";

import { Pin, Settings2, X } from "lucide-react";
import { useTransit } from "@/lib/stores/transit-store";
import { useDarkMode } from "@/lib/hooks/use-dark-mode";
import { resolveRouteColor } from "@/lib/utils/maps";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BusIcon } from "@/components/map/bus-markers";
import type { Route } from "@/lib/api/types";

interface ManagePinsDrawerProps {
  routes: Route[];
}

export function ManagePinsDrawer({ routes }: ManagePinsDrawerProps) {
  const { state, togglePinnedRoute } = useTransit();
  const isDark = useDarkMode();

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 transition-colors text-xs font-semibold text-zinc-600 dark:text-zinc-400">
          <Settings2 className="w-3.5 h-3.5" />
          Manage Pins
        </button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh] border-none rounded-t-[20px]">
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1.5 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        </div>
        <div className="flex items-center justify-between px-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
          <div className="min-w-0 flex-1">
            <DrawerTitle className="text-[10px] font-black tracking-[0.18em] uppercase text-zinc-400 dark:text-zinc-500">
              Manage Pins
            </DrawerTitle>
          </div>
          <DrawerClose asChild>
            <button
              className="ml-3 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shrink-0"
              aria-label="Back to home"
            >
              <X className="w-4 h-4 text-zinc-500 dark:text-zinc-300" />
            </button>
          </DrawerClose>
        </div>
        <ScrollArea className="flex-1 px-4 pb-8 overflow-y-auto w-full">
          <div className="flex flex-col gap-2 pt-2">
            {routes.map((route) => {
              const isPinned = state.pinnedRoutes.has(route.id);
              const color = resolveRouteColor(route.color, isDark);

              return (
                <div
                  key={route.id}
                  className="w-full flex items-stretch rounded-xl overflow-hidden border border-zinc-200/60 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-900/80"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <div
                    className="w-1 shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <button
                    onClick={() => togglePinnedRoute(route.id)}
                    className="flex items-center flex-1 gap-3 px-3 py-3 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 active:bg-zinc-200/60 dark:active:bg-zinc-700/60 transition-colors text-left"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold"
                      style={{ backgroundColor: color }}
                    >
                      <BusIcon />
                    </div>
                    <span className="flex-1 text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {route.name || route.abbr}
                    </span>
                    <div
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors shrink-0 ${
                        isPinned
                          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-500"
                          : "bg-zinc-200/50 dark:bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      <Pin
                        className="w-4 h-4"
                        fill={isPinned ? "currentColor" : "none"}
                      />
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
