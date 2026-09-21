"use client";

import React from "react";
import { formatTime } from "@/lib/utils";

interface LiveBadgeProps {
  isLive?: boolean;
  lastUpdated?: Date;
  className?: string;
}

export function LiveBadge({
  isLive = true,
  lastUpdated,
  className = "",
}: LiveBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 shadow-sm shadow-emerald-500/10 ${className}`}
      title={
        lastUpdated
          ? `Live sync connected. Last refreshed at ${lastUpdated.toLocaleTimeString()}`
          : "Live real-time feed connected"
      }
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span>LIVE FEED</span>
      {lastUpdated && (
        <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/60 font-mono font-medium">
          • {formatTime(lastUpdated.toISOString())}
        </span>
      )}
    </div>
  );
}
