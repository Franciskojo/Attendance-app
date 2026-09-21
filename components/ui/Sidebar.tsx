"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck2,
  Users2,
  BarChart3,
  QrCode,
  Sparkles,
  PlusCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpenCreateSession?: () => void;
}

export function Sidebar({ isOpen, onClose, onOpenCreateSession }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Sessions",
      href: "/sessions",
      icon: CalendarCheck2,
    },
    {
      name: "Students",
      href: "/students",
      icon: Users2,
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4">
      <div className="space-y-6">
        {/* Mobile close button */}
        <div className="flex items-center justify-between md:hidden px-2 pt-1 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              A
            </div>
            <span className="font-bold text-slate-900 dark:text-white">AttendFlow</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick Action */}
        {onOpenCreateSession && (
          <button
            onClick={() => {
              onOpenCreateSession();
              if (onClose) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            New Session
          </button>
        )}

        {/* Navigation links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-blue-50 text-blue-600 font-semibold dark:bg-blue-950/60 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-900/50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Cohort Info Widget */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-100 to-blue-50/50 dark:from-slate-800/80 dark:to-blue-950/20 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
          <QrCode className="w-4 h-4" />
          Quick Tip
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
          Open Fullscreen Projector on any session to project live QR codes for your lecture room.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md h-[calc(100vh-4rem)] sticky top-16 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
          />
          <aside className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl z-10 animate-scale-up">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
