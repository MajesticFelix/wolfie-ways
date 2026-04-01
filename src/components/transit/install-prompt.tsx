"use client";

import { useState, useEffect } from "react";
import { Share, Ellipsis, EllipsisVertical, X } from "lucide-react";

type Platform = "ios" | "android";

export function InstallPrompt() {
  const [platform, setPlatform] = useState<Platform | null>(null);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if ((navigator as unknown as { standalone?: boolean }).standalone) return;

    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) setPlatform("ios");
    else if (/Android/.test(ua)) setPlatform("android");
  }, []);

  if (!platform) return null;

  return (
    <div className="flex items-center gap-2 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-zinc-200/70 dark:border-zinc-800/60 rounded-2xl px-3 py-2 shadow-lg">
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <p className="text-[9px] font-black tracking-[0.14em] uppercase text-red-600 dark:text-red-500 leading-none">
          Add to Home Screen
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-tight">
          {platform === "ios" ? (
            <>
              Tap{" "}
              <Ellipsis className="inline w-3 h-3 -mt-px text-zinc-500" strokeWidth={2.5} />
              {" → "}
              <Share className="inline w-3 h-3 -mt-px text-blue-500" strokeWidth={2.5} />{" "}
              <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">Share</strong>
              {" → "}
              <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">Add to Home Screen</strong>
            </>
          ) : (
            <>
              Tap{" "}
              <EllipsisVertical className="inline w-3 h-3 -mt-px text-zinc-500" strokeWidth={2.5} />{" "}
              <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">menu</strong>
              {" → "}
              <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">Install app</strong>
            </>
          )}
        </p>
      </div>
      <button
        onClick={() => setPlatform(null)}
        className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
        aria-label="Hide"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
