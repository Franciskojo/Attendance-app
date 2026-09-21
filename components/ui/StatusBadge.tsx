import React from "react";
import { cn } from "@/lib/utils";

type StatusType = "open" | "closed" | "upcoming" | "present" | "late" | "absent" | string;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  dot?: boolean;
}

export function StatusBadge({ status, className, dot = true }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  const getStatusStyles = () => {
    switch (normalized) {
      case "open":
      case "present":
        return {
          wrapper: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60",
          dot: "bg-emerald-500 animate-pulse",
          label: normalized === "open" ? "Live • Open" : "Present",
        };
      case "upcoming":
        return {
          wrapper: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60",
          dot: "bg-amber-500",
          label: "Upcoming",
        };
      case "late":
        return {
          wrapper: "bg-orange-50 text-orange-700 border-orange-200/80 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/60",
          dot: "bg-orange-500",
          label: "Late",
        };
      case "closed":
        return {
          wrapper: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
          dot: "bg-slate-400",
          label: "Closed",
        };
      case "absent":
        return {
          wrapper: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60",
          dot: "bg-rose-500",
          label: "Absent",
        };
      default:
        return {
          wrapper: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
          dot: "bg-slate-400",
          label: status,
        };
    }
  };

  const current = getStatusStyles();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors",
        current.wrapper,
        className
      )}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", current.dot)} />}
      {current.label}
    </span>
  );
}
