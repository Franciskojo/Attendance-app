"use client";

import React, { useEffect, useState } from "react";
import { formatTime } from "@/lib/utils";

interface LiveBadgeProps {
  isLive?: boolean;
  lastUpdated?: Date | null;
  className?: string;
}

export function LiveBadge({
  isLive = true,
  lastUpdated,
  className = "",
}: LiveBadgeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const timeString = mounted && lastUpdated ? formatTime(lastUpdated.toISOString()) : null;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 shadow-sm shadow-emerald-500/10 ${className}`}
      title={
        timeString
          ? `Live sync connected. Last refreshed at ${timeString}`
          : "Live real-time feed connected"
      }
      suppressHydrationWarning
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span>LIVE FEED</span>
      {timeString && (
        <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/60 font-mono font-medium">
          • {timeString}
        </span>
      )}
    </div>
  );
}

