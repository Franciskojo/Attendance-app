"use client";

import React, { useState, useEffect, use } from "react";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User,
  Hash,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatTime } from "@/lib/utils";

interface CheckInSuccessData {
  studentId: string;
  studentName: string;
  checkedInAt: string;
  status: "present" | "late";
  sessionTitle: string;
  sessionDate: string;
}

export default function StudentCheckInPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const sessionSlug = resolvedParams.slug;

  const [studentId, setStudentId] = useState("");
  const [fullName, setFullName] = useState("");
  const [isPreRegistered, setIsPreRegistered] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Session Meta
  const [session, setSession] = useState<{
    title: string;
    description?: string;
    date: string;
    startTime: string;
    endTime: string;
    status: "upcoming" | "open" | "closed";
  } | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successData, setSuccessData] = useState<CheckInSuccessData | null>(null);

  // Load saved studentId from localStorage
  useEffect(() => {
    const savedId = localStorage.getItem("attendance_student_id");
    if (savedId) {
      setStudentId(savedId);
      lookupStudent(savedId);
    }
  }, []);

  // Fetch Session details to verify status
  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch(`/api/sessions/${sessionSlug}`);
        const data = await res.json();
        if (data.success) {
          setSession(data.data);
        } else {
          setErrorMsg(data.error || "Session not found");
        }
      } catch {
        setErrorMsg("Unable to connect to attendance server");
      } finally {
        setIsLoadingSession(false);
      }
    }
    loadSession();
  }, [sessionSlug]);

  const lookupStudent = async (idToLookUp: string) => {
    if (!idToLookUp || idToLookUp.trim().length < 3) return;
    setIsLookingUp(true);
    try {
      const res = await fetch(
        `/api/attendance/lookup?studentId=${encodeURIComponent(
          idToLookUp.trim().toUpperCase()
        )}`
      );
      const data = await res.json();
      if (data.success && data.exists && data.student) {
        setFullName(data.student.fullName);
        setIsPreRegistered(true);
      } else {
        setIsPreRegistered(false);
      }
    } catch {
      // Ignore lookup network errors
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setStudentId(val);
    setErrorMsg("");
    if (val.length >= 3) {
      lookupStudent(val);
    } else {
      setIsPreRegistered(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!studentId.trim()) {
      setErrorMsg("Please enter your Student ID");
      return;
    }

    if (!isPreRegistered && !fullName.trim()) {
      setErrorMsg("Please enter your Full Name for your first check-in");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionSlug,
          studentId: studentId.trim().toUpperCase(),
          fullName: fullName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Check-in failed");
        return;
      }

      // Save studentId to localStorage for fast future check-in
      localStorage.setItem("attendance_student_id", studentId.trim().toUpperCase());

      setSuccessData(data.data);

      // Trigger celebratory confetti effect
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (cErr) {
        console.log("Confetti trigger:", cErr);
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Validating attendance session...</p>
        </div>
      </div>
    );
  }

  // Session Not Found / Closed State
  if (!session || session.status !== "open") {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-5 border border-amber-200 dark:border-amber-900/50">
            <Lock className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            {session ? session.title : "Session Inaccessible"}
          </h1>

          <div className="my-3">
            <StatusBadge status={session ? session.status : "closed"} />
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            {session?.status === "closed"
              ? "This attendance session has already been closed by your Course Representative. Submissions are no longer accepted."
              : session?.status === "upcoming"
              ? "This attendance session has not yet opened. Please scan again once the lecture begins."
              : errorMsg || "Invalid session URL."}
          </p>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
            Cohort Attendance System • ZOBI
          </div>
        </div>
      </div>
    );
  }

  // Success Confirmation Screen
  if (successData) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-gradient-to-b from-emerald-50/50 via-slate-50 to-slate-100 dark:from-emerald-950/20 dark:via-slate-950 dark:to-slate-950 animate-fade-in">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-emerald-200/80 dark:border-emerald-800/50 p-8 sm:p-10 shadow-2xl text-center">
          {/* Green Check Icon */}
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20 border-2 border-emerald-200 dark:border-emerald-800 animate-scale-up">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Attendance Verified
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-3">
            Attendance Recorded!
          </h1>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            You are officially marked present for this session.
          </p>

          {/* Student Receipt Box */}
          <div className="my-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-left space-y-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Student Name
              </span>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {successData.studentName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Student ID
                </span>
                <p className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                  {successData.studentId}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Check-in Time
                </span>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {formatTime(successData.checkedInAt)}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Session
              </span>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 line-clamp-1">
                {successData.sessionTitle}
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>You may now close this browser tab</span>
          </div>
        </div>
      </div>
    );
  }

  // Active Check-In Form Screen
  return (
    <div className="min-h-screen flex flex-col justify-between items-center p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-[#0c1220] dark:to-slate-950">
      {/* Top Brand */}
      <div className="w-full max-w-md flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20">
            Z
          </div>
          <span className="font-bold text-base text-slate-900 dark:text-white">
            ZOBI
          </span>
        </div>
        <StatusBadge status="open" />
      </div>

      {/* Main Check-In Card */}
      <div className="w-full max-w-md my-auto animate-fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl">
          {/* Session Header */}
          <div className="mb-6 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(session.date)}</span>
              <span>•</span>
              <Clock className="w-3.5 h-3.5" />
              <span>{session.startTime} - {session.endTime}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {session.title}
            </h1>
            {session.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {session.description}
              </p>
            )}
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Student ID *
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. ENT-2026-001"
                  value={studentId}
                  onChange={handleIdChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono uppercase tracking-wider font-bold"
                />
              </div>
              {isLookingUp && (
                <p className="text-[11px] text-blue-500 mt-1 font-medium">
                  Checking student directory...
                </p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name {isPreRegistered ? "(Auto-Detected)" : "*"}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required={!isPreRegistered}
                  disabled={isPreRegistered}
                  placeholder={isPreRegistered ? fullName : "Enter your Full Name"}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-emerald-50/50 dark:disabled:bg-emerald-950/30 disabled:text-emerald-800 dark:disabled:text-emerald-300 disabled:border-emerald-200 dark:disabled:border-emerald-900/60 font-semibold"
                />
              </div>
              {isPreRegistered && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Recognized from cohort database
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="w-full mt-3 font-bold shadow-lg shadow-blue-500/25"
            >
              Submit Attendance
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>
        </div>
      </div>

      {/* Mobile Footer */}
      <footer className="text-center text-xs text-slate-400 py-3">
        Instant QR Attendance System • ZOBI
      </footer>
    </div>
  );
}
