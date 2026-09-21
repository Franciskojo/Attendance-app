"use client";

import React from "react";
import { signOut, useSession } from "next-auth/react";
import { LogOut, User, Menu, Sparkles } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface NavbarProps {
  onMobileMenuToggle?: () => void;
}

export function Navbar({ onMobileMenuToggle }: NavbarProps) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 w-full h-16 glass-nav px-4 sm:px-8 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3">
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            aria-label="Toggle Mobile Menu"
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-blue-500/30">
            Z
          </div>
          <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight hidden sm:inline">
            ZOBI
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <ThemeToggle />

        {session?.user && (
          <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-slate-200 dark:border-slate-800">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {session.user.name || "Course Representative"}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {session.user.email || "Administrator"}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700">
              <User className="w-4 h-4" />
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign Out"
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
