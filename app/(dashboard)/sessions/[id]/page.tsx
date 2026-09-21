"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  QrCode,
  FileSpreadsheet,
  Clock,
  Calendar,
  Users2,
  UserCheck2,
  UserX2,
  Search,
  RefreshCw,
  Maximize2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { QRCodeModal } from "@/components/ui/QRCodeModal";
import { useToast } from "@/components/ui/Toast";
import { formatDate, formatTime } from "@/lib/utils";

interface AttendanceRecordItem {
  _id: string;
  studentId: string;
  studentName: string;
  checkedInAt: string;
  status: "present" | "late";
}

interface AbsentStudentItem {
  _id: string;
  studentId: string;
  fullName: string;
  email?: string;
  phone?: string;
}

interface SessionDetail {
  _id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "upcoming" | "open" | "closed";
  slug: string;
  records: AttendanceRecordItem[];
  absentStudents: AbsentStudentItem[];
  stats: {
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    attendanceRate: number;
  };
}

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;

  const { toast } = useToast();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "present" | "late" | "absent">("all");
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const fetchSessionDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      const data = await res.json();
      if (data.success) {
        setSession(data.data);
      } else {
        toast(data.error || "Failed to load session", "error");
      }
    } catch (err) {
      console.error("Fetch session detail error:", err);
      toast("Error loading session details", "error");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [sessionId, toast]);

  useEffect(() => {
    fetchSessionDetails();
  }, [fetchSessionDetails]);

  const handleToggleStatus = async (newStatus: "upcoming" | "open" | "closed") => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        toast(`Session status updated to ${newStatus.toUpperCase()}`, "success");
        fetchSessionDetails();
      } else {
        toast(data.error || "Failed to update status", "error");
      }
    } catch {
      toast("Error updating status", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Session Not Found</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          The session you are looking for does not exist or has been removed.
        </p>
        <Link href="/sessions">
          <Button variant="primary">Return to Sessions</Button>
        </Link>
      </div>
    );
  }

  // Filter records
  const filteredRecords = session.records.filter((rec) => {
    const matchesSearch =
      rec.studentId.toLowerCase().includes(search.toLowerCase()) ||
      rec.studentName.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === "present") return rec.status === "present";
    if (activeTab === "late") return rec.status === "late";
    return true;
  });

  const filteredAbsent = session.absentStudents.filter((stu) =>
    stu.studentId.toLowerCase().includes(search.toLowerCase()) ||
    stu.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/sessions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sessions
        </Link>
      </div>

      {/* Main Session Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={session.status} />
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(session.date)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {session.startTime} - {session.endTime}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {session.title}
            </h1>

            {session.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                {session.description}
              </p>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsRefreshing(true);
                fetchSessionDetails();
              }}
              isLoading={isRefreshing}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setQrModalOpen(true)}
              className="gap-2"
            >
              <QrCode className="w-4 h-4 text-blue-400" />
              Launch QR Code
            </Button>

            <a href={`/api/export/session/${session._id}`}>
              <Button
                variant="success"
                size="sm"
                className="gap-2 shadow-md shadow-emerald-500/20"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export to Excel
              </Button>
            </a>
          </div>
        </div>

        {/* Live Status Control Segment */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Control Session Status:
            </span>
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {(["open", "upcoming", "closed"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => handleToggleStatus(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all capitalize ${
                    session.status === st
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Slug: <span className="text-slate-700 dark:text-slate-300 font-semibold">{session.slug}</span>
          </div>
        </div>
      </div>

      {/* Session Analytics KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Cohort
            </span>
            <Users2 className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {session.stats.totalStudents}
          </p>
          <span className="text-[11px] text-slate-400">Enrolled students</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Present
            </span>
            <UserCheck2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {session.stats.presentCount}
          </p>
          <span className="text-[11px] text-emerald-600/80 font-medium">
            {session.stats.attendanceRate}% attendance rate
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Late Check-ins
            </span>
            <Clock className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-2">
            {session.stats.lateCount}
          </p>
          <span className="text-[11px] text-slate-400">&gt; 15 mins after start</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Absent
            </span>
            <UserX2 className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {session.stats.absentCount}
          </p>
          <span className="text-[11px] text-slate-400">Unrecorded students</span>
        </div>
      </div>

      {/* Attendance Records & Absentee List Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Filters Header */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "all"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              All Recorded ({session.records.length})
            </button>

            <button
              onClick={() => setActiveTab("present")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "present"
                  ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              On-Time ({session.records.filter((r) => r.status === "present").length})
            </button>

            <button
              onClick={() => setActiveTab("late")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "late"
                  ? "bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Late ({session.records.filter((r) => r.status === "late").length})
            </button>

            <button
              onClick={() => setActiveTab("absent")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "absent"
                  ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Absent ({session.absentStudents.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>
        </div>

        {/* Content View */}
        {activeTab !== "absent" ? (
          filteredRecords.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
                <UserCheck2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                No attendance records found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                Students will show up here in real-time as they scan the QR code.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setQrModalOpen(true)}
              >
                Display QR Code
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="py-3 px-5">#</th>
                    <th className="py-3 px-5">Student ID</th>
                    <th className="py-3 px-5">Student Name</th>
                    <th className="py-3 px-5">Check-in Timestamp</th>
                    <th className="py-3 px-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                  {filteredRecords.map((rec, index) => (
                    <tr
                      key={rec._id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-5 text-xs text-slate-400 font-mono">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-5 font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                        {rec.studentId}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-white">
                        {rec.studentName}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-600 dark:text-slate-300">
                        {formatTime(rec.checkedInAt)}
                        <span className="text-[11px] text-slate-400 ml-2">
                          ({new Date(rec.checkedInAt).toLocaleDateString()})
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <StatusBadge status={rec.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Absentee List */
          filteredAbsent.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex p-4 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                100% Attendance Achieved!
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                All enrolled students checked in for this session.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="py-3 px-5">Student ID</th>
                    <th className="py-3 px-5">Student Name</th>
                    <th className="py-3 px-5">Contact</th>
                    <th className="py-3 px-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                  {filteredAbsent.map((stu) => (
                    <tr
                      key={stu._id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-5 font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                        {stu.studentId}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-white">
                        {stu.fullName}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-500">
                        {stu.email || stu.phone || "No contact info"}
                      </td>
                      <td className="py-3.5 px-5">
                        <StatusBadge status="absent" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        sessionTitle={session.title}
        sessionSlug={session.slug}
      />
    </div>
  );
}
