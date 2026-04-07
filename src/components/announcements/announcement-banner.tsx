"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Info, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { AnnouncementGroup } from "@/lib/api/types";

interface AnnouncementBannerProps {
  groups: AnnouncementGroup[];
}

export function AnnouncementBanner({ groups }: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [index, setIndex] = useState(0);

  const all = groups.flatMap((g) =>
    g.announcements.map((a) => ({ ...a, severity: g.type })),
  );

  // Reset on new data
  useEffect(() => {
    setDismissed(false);
    setIndex(0);
  }, [groups]);

  if (all.length === 0 || dismissed) return null;

  const current = all[index];
  const isHigh = current.severity === "high";

  const goPrev = () => setIndex((i) => (i - 1 + all.length) % all.length);
  const goNext = () => setIndex((i) => (i + 1) % all.length);

  return (
    <div
      className={`
        flex items-start gap-2.5 pl-3 pr-2.5 py-2.5
        rounded-xl shadow-lg border backdrop-blur-sm
        max-w-[280px] w-max
      `}
      style={{
        ...(isHigh
          ? {
              background: "rgba(69,10,10,0.92)",
              borderColor: "rgba(153,27,27,0.5)",
              color: "rgb(254,226,226)",
            }
          : {
              background: "rgba(55,32,10,0.92)",
              borderColor: "rgba(146,64,14,0.5)",
              color: "rgb(254,243,199)",
            }),
      }}
    >
      {/* Icon */}
      <div className="shrink-0 mt-px">
        {isHigh ? (
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
        ) : (
          <Info className="w-3.5 h-3.5 text-amber-400" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs leading-snug line-clamp-4">{current.text}</p>

        {/* Navigation */}
        {all.length > 1 && (
          <div className="flex items-center gap-1 mt-1.5">
            {/* Progress dots */}
            <div className="flex gap-1 flex-1">
              {all.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === index ? 12 : 4,
                    height: 4,
                    backgroundColor: "currentColor",
                    opacity: i === index ? 0.8 : 0.25,
                  }}
                />
              ))}
            </div>

            {/* Arrow buttons */}
            <div className="flex gap-0.5">
              <button
                onClick={goPrev}
                className="p-0.5 rounded hover:bg-white/10 transition-colors"
                aria-label="Previous announcement"
              >
                <ChevronLeft className="w-3 h-3 opacity-50" />
              </button>
              <button
                onClick={goNext}
                className="p-0.5 rounded hover:bg-white/10 transition-colors"
                aria-label="Next announcement"
              >
                <ChevronRight className="w-3 h-3 opacity-50" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors mt-px"
        aria-label="Dismiss announcement"
      >
        <X className="w-3 h-3 opacity-50" />
      </button>
    </div>
  );
}
