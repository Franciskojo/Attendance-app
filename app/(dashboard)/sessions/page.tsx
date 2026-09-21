"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  CalendarCheck2,
  Plus,
  Search,
  QrCode,
  FileSpreadsheet,
  Trash2,
  Clock,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { QRCodeModal } from "@/components/ui/QRCodeModal";
import { CreateSessionModal } from "@/components/sessions/CreateSessionModal";
import { LiveBadge } from "@/components/ui/LiveBadge";
import { useToast } from "@/components/ui/Toast";
import { useLiveSync } from "@/hooks/useLiveSync";
import { formatDate } from "@/lib/utils";

interface SessionItem {
  _id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "upcoming" | "open" | "closed";
  slug: string;
  presentCount: number;
  totalStudents: number;
  attendanceRate: number;
}

export default function SessionsPage() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // QR Modal
  const [selectedQR, setSelectedQR] = useState<{
    isOpen: boolean;
    title: string;
    slug: string;
  }>({
    isOpen: false,
    title: "",
    slug: "",
  });

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (search) params.append("search", search);

      const res = await fetch(`/api/sessions?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSessions(data.data);
      }
    } catch (err) {
      console.error("Fetch sessions error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [statusFilter, search]);

  // Live real-time sync
  const { isLiveConnected, lastUpdated, refreshNow } = useLiveSync(fetchSessions, {
    intervalMs: 3000,
  });

  const handleToggleStatus = async (
    sessionId: string,
    currentStatus: "upcoming" | "open" | "closed"
  ) => {
    const nextStatus = currentStatus === "open" ? "closed" : "open";
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        toast(`Session is now ${nextStatus.toUpperCase()}`, "success");
        refreshNow();
      } else {
        toast(data.error || "Failed to toggle status", "error");
      }
    } catch {
      toast("Error updating session", "error");
    }
  };

  const handleDelete = async (sessionId: string, title: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete session "${title}"? All associated attendance records will be removed.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast("Session deleted", "success");
        refreshNow();
      } else {
        toast(data.error || "Failed to delete session", "error");
      }
    } catch {
      toast("Error deleting session", "error");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <CalendarCheck2 className="w-3.5 h-3.5" />
            <span>Attendance Manager</span>
            <span>•</span>
            <LiveBadge isLive={isLiveConnected} lastUpdated={lastUpdated} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Attendance Sessions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Create, open/close sessions, display QR codes, and export attendance sheets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsRefreshing(true);
              refreshNow();
            }}
            isLoading={isRefreshing}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="gap-2 shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            New Session
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Status Pill Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-full sm:w-auto overflow-x-auto">
          {[
            { id: "all", label: "All Sessions" },
            { id: "open", label: "Live • Open" },
            { id: "upcoming", label: "Upcoming" },
            { id: "closed", label: "Closed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search session title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
          />
        </div>
      </div>

      {/* Sessions Grid */}
      {sessions.length === 0 && !isLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="inline-flex p-4 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mb-3">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            No matching sessions found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Try adjusting your search filter or create a new session.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
          >
            Create New Session
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sessions.map((session) => (
            <div
              key={session._id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <StatusBadge status={session.status} />
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {session.startTime} - {session.endTime}
                  </span>
                </div>

                <Link
                  href={`/sessions/${session._id}`}
                  className="text-base font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2 transition-colors"
                >
                  {session.title}
                </Link>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {session.description || "No session description provided."}
                </p>

                <div className="text-xs text-slate-400 font-medium mt-3">
                  Date: <span className="text-slate-700 dark:text-slate-300 font-semibold">{formatDate(session.date)}</span>
                </div>
              </div>

              {/* Progress & Attendance */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Attendance Rate
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {session.presentCount} / {session.totalStudents} ({session.attendanceRate}%)
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${session.attendanceRate}%` }}
                  />
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setSelectedQR({
                          isOpen: true,
                          title: session.title,
                          slug: session.slug,
                        })
                      }
                      title="Display QR Code"
                      className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>

                    <a
                      href={`/api/export/session/${session._id}`}
                      title="Export Attendance to Excel"
                      className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </a>

                    <button
                      onClick={() => handleDelete(session._id, session.title)}
                      title="Delete Session"
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleToggleStatus(session._id, session.status)
                      }
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                        session.status === "open"
                          ? "border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                          : "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                      }`}
                    >
                      {session.status === "open" ? "Close" : "Open"}
                    </button>

                    <Link
                      href={`/sessions/${session._id}`}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                      title="View Details"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={selectedQR.isOpen}
        onClose={() => setSelectedQR({ isOpen: false, title: "", slug: "" })}
        sessionTitle={selectedQR.title}
        sessionSlug={selectedQR.slug}
      />

      {/* Create Session Modal */}
      <CreateSessionModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSessionCreated={fetchSessions}
      />
    </div>
  );
}
