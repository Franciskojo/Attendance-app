"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users2,
  CalendarCheck2,
  UserCheck2,
  TrendingUp,
  PlusCircle,
  QrCode,
  FileSpreadsheet,
  ArrowRight,
  RefreshCw,
  Clock,
  ChevronRight,
  Sparkles,
  Edit2,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { QRCodeModal } from "@/components/ui/QRCodeModal";
import { CreateSessionModal } from "@/components/sessions/CreateSessionModal";
import { EditSessionModal, SessionEditData } from "@/components/sessions/EditSessionModal";
import { LiveBadge } from "@/components/ui/LiveBadge";
import { useToast } from "@/components/ui/Toast";
import { useLiveSync } from "@/hooks/useLiveSync";
import { formatDate } from "@/lib/utils";

interface DashboardData {
  totalStudents: number;
  totalSessions: number;
  todayAttendanceCount: number;
  overallAttendanceRate: number;
}

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

export default function DashboardPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardData>({
    totalStudents: 0,
    totalSessions: 0,
    todayAttendanceCount: 0,
    overallAttendanceRate: 0,
  });
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // QR Modal State
  const [selectedQR, setSelectedQR] = useState<{
    isOpen: boolean;
    title: string;
    slug: string;
  }>({
    isOpen: false,
    title: "",
    slug: "",
  });

  // Create Session Modal
  const [createSessionOpen, setCreateSessionOpen] = useState(false);

  // Edit Session Modal
  const [sessionToEdit, setSessionToEdit] = useState<SessionEditData | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [analyticsRes, sessionsRes] = await Promise.all([
        fetch("/api/analytics"),
        fetch("/api/sessions"),
      ]);

      const analyticsData = await analyticsRes.json();
      const sessionsData = await sessionsRes.json();

      if (analyticsData.success) {
        setStats({
          totalStudents: analyticsData.data.totalStudents,
          totalSessions: analyticsData.data.totalSessions,
          todayAttendanceCount: analyticsData.data.todayAttendanceCount,
          overallAttendanceRate: analyticsData.data.overallAttendanceRate,
        });
      }

      if (sessionsData.success) {
        setSessions(sessionsData.data);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Set up live real-time auto-sync
  const { isLiveConnected, lastUpdated, refreshNow } = useLiveSync(fetchData, {
    intervalMs: 3000,
    onEvent: (event) => {
      if (event.type === "CHECKIN") {
        toast(`⚡ New Check-In: ${event.studentName} (${event.studentId})`, "info");
      }
    },
  });

  useEffect(() => {
    // Listen for global session creation events from sidebar
    const handleSessionCreated = () => refreshNow();
    window.addEventListener("session-created", handleSessionCreated);
    return () => window.removeEventListener("session-created", handleSessionCreated);
  }, [refreshNow]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshNow();
  };

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
        toast(`Session status changed to ${nextStatus.toUpperCase()}`, "success");
        refreshNow();
      } else {
        toast(data.error || "Failed to update session", "error");
      }
    } catch {
      toast("Error updating status", "error");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <span>Course Rep Command Center</span>
            <span>•</span>
            <LiveBadge isLive={isLiveConnected} lastUpdated={lastUpdated} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Attendance Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor live student attendance, broadcast QR codes, and generate cohort reports.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateSessionOpen(true)}
            className="gap-2 shadow-md shadow-blue-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            Create New Session
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Students"
          value={isLoading ? "..." : stats.totalStudents}
          subtitle="Enrolled in Cohort"
          icon={Users2}
          accentColor="blue"
        />

        <StatCard
          title="Total Sessions"
          value={isLoading ? "..." : stats.totalSessions}
          subtitle="Conducted & Scheduled"
          icon={CalendarCheck2}
          accentColor="purple"
        />

        <StatCard
          title="Today's Attendance"
          value={isLoading ? "..." : stats.todayAttendanceCount}
          subtitle="Check-ins recorded today"
          icon={UserCheck2}
          accentColor="emerald"
        />

        <StatCard
          title="Overall Attendance Rate"
          value={isLoading ? "..." : `${stats.overallAttendanceRate}%`}
          subtitle="Cohort average attendance"
          icon={TrendingUp}
          accentColor="amber"
          trend={{
            value: stats.overallAttendanceRate >= 75 ? "Healthy" : "Attention",
            isPositive: stats.overallAttendanceRate >= 75,
          }}
        />
      </div>

      {/* Live / Recent Sessions Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Recent Attendance Sessions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Launch QR codes for open sessions or export verified records to Excel
            </p>
          </div>

          <Link
            href="/sessions"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            View All Sessions
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {sessions.length === 0 && !isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-flex p-4 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mb-3">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              No sessions created yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Create your first attendance session to generate a QR code for your students.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCreateSessionOpen(true)}
            >
              Create First Session
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3.5 px-5">Session Title</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Attendance</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {sessions.slice(0, 5).map((session) => (
                  <tr
                    key={session._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-4 px-5">
                      <Link
                        href={`/sessions/${session._id}`}
                        className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {session.title}
                      </Link>
                      {session.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md mt-0.5">
                          {session.description}
                        </p>
                      )}
                    </td>

                    <td className="py-4 px-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {formatDate(session.date)}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {session.startTime} - {session.endTime}
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <StatusBadge status={session.status} />
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                          {session.presentCount} / {session.totalStudents}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          ({session.attendanceRate}%)
                        </span>
                      </div>
                      <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${session.attendanceRate}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* QR Code trigger */}
                        <button
                          onClick={() =>
                            setSelectedQR({
                              isOpen: true,
                              title: session.title,
                              slug: session.slug,
                            })
                          }
                          title="Display QR Code"
                          className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        {/* Edit Session trigger */}
                        <button
                          onClick={() => {
                            setSessionToEdit(session);
                            setEditModalOpen(true);
                          }}
                          title="Edit Session"
                          className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Status Toggle button */}
                        <button
                          onClick={() =>
                            handleToggleStatus(session._id, session.status)
                          }
                          title={
                            session.status === "open"
                              ? "Close Attendance"
                              : "Open Attendance"
                          }
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                            session.status === "open"
                              ? "border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                              : "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                          }`}
                        >
                          {session.status === "open" ? "Close" : "Open"}
                        </button>

                        {/* Export Excel link */}
                        <a
                          href={`/api/export/session/${session._id}`}
                          title="Export Attendance to Excel"
                          className="p-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </a>

                        {/* View Session Details */}
                        <Link
                          href={`/sessions/${session._id}`}
                          className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
                          title="View Records"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={selectedQR.isOpen}
        onClose={() => setSelectedQR({ isOpen: false, title: "", slug: "" })}
        sessionTitle={selectedQR.title}
        sessionSlug={selectedQR.slug}
      />

      {/* Create Session Modal */}
      <CreateSessionModal
        isOpen={createSessionOpen}
        onClose={() => setCreateSessionOpen(false)}
        onSessionCreated={fetchData}
      />

      {/* Edit Session Modal */}
      <EditSessionModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSessionToEdit(null);
        }}
        session={sessionToEdit}
        onSessionUpdated={fetchData}
      />
    </div>
  );
}
