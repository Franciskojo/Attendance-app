import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: "blue" | "emerald" | "amber" | "purple";
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = "blue",
}: StatCardProps) {
  const colorMap = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-950/40",
      text: "text-blue-600 dark:text-blue-400",
      border: "hover:border-blue-300 dark:hover:border-blue-700",
    },
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "hover:border-emerald-300 dark:hover:border-emerald-700",
    },
    amber: {
      bg: "bg-amber-50 dark:bg-amber-950/40",
      text: "text-amber-600 dark:text-amber-400",
      border: "hover:border-amber-300 dark:hover:border-amber-700",
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-950/40",
      text: "text-purple-600 dark:text-purple-400",
      border: "hover:border-purple-300 dark:hover:border-purple-700",
    },
  };

  const currentTheme = colorMap[accentColor];

  return (
    <div
      className={cn(
        "relative p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 shadow-sm hover:shadow-md transition-all duration-200",
        currentTheme.border
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
            {value}
          </h3>
        </div>
        <div className={cn("p-3 rounded-xl", currentTheme.bg, currentTheme.text)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                "font-semibold px-1.5 py-0.5 rounded",
                trend.isPositive
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                  : "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"
              )}
            >
              {trend.value}
            </span>
          )}
          {subtitle && (
            <span className="text-slate-500 dark:text-slate-400">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}
