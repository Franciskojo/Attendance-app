import React from "react";
import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex p-4 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-6 border border-blue-200 dark:border-blue-900/60 shadow-lg shadow-blue-500/10">
          <Compass className="w-12 h-12 animate-pulse" />
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
          404
        </h1>

        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">
          Page Not Found
        </h2>

        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8 leading-relaxed">
          The page or attendance session you requested could not be located. It may have been moved or removed.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
