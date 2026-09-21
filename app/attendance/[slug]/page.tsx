"use client";

import React, { useState, useEffect, use, useRef } from "react";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Hash,
  Lock,
  UserCheck,
  UserPlus,
  Mail,
  Phone,
  GraduationCap,
  Info,
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

  // Mode: "checkin" or "register"
  const [activeTab, setActiveTab] = useState<"checkin" | "register">("checkin");

  // Check-In fields
  const [studentId, setStudentId] = useState("");
  const [fullName, setFullName] = useState("");
  const [isPreRegistered, setIsPreRegistered] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupAttempted, setLookupAttempted] = useState(false);

  // Registration fields
  const [regStudentId, setRegStudentId] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regCohort, setRegCohort] = useState("Cohort 1");

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

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved studentId from localStorage
  useEffect(() => {
    const savedId = localStorage.getItem("attendance_student_id");
    if (savedId) {
      setStudentId(savedId);
      setRegStudentId(savedId);
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
    const cleanId = idToLookUp.trim().toUpperCase();
    if (!cleanId || cleanId.length < 3) {
      setIsPreRegistered(false);
      setFullName("");
      setLookupAttempted(false);
      return;
    }

    setIsLookingUp(true);
    try {
      const res = await fetch(
        `/api/attendance/lookup?studentId=${encodeURIComponent(cleanId)}`
      );
      const data = await res.json();
      if (data.success && data.exists && data.student) {
        setFullName(data.student.fullName);
        setIsPreRegistered(true);
        setLookupAttempted(true);
        setErrorMsg("");
      } else {
        setFullName("");
        setIsPreRegistered(false);
        setLookupAttempted(true);
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
    setRegStudentId(val);
    setErrorMsg("");

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length >= 3) {
      debounceTimerRef.current = setTimeout(() => {
        lookupStudent(val);
      }, 300);
    } else {
      setIsPreRegistered(false);
      setFullName("");
      setLookupAttempted(false);
    }
  };

  const handleQuickCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanId = studentId.trim().toUpperCase();
    if (!cleanId) {
      setErrorMsg("Please enter your Student ID");
      return;
    }

    if (!isPreRegistered) {
      setErrorMsg(
        `Student ID "${cleanId}" is not registered. Please switch to the "Register Student" tab below to complete your registration.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionSlug,
          studentId: cleanId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Check-in failed");
        return;
      }

      // Save studentId to localStorage
      localStorage.setItem("attendance_student_id", cleanId);
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

  const handleRegisterAndCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanId = regStudentId.trim().toUpperCase();
    const cleanName = regFullName.trim();

    if (!cleanId || cleanId.length < 2) {
      setErrorMsg("Please enter a valid Student ID");
      return;
    }

    if (!cleanName || cleanName.length < 2) {
      setErrorMsg("Please enter your Full Name");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/attendance/register-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionSlug,
          studentId: cleanId,
          fullName: cleanName,
          email: regEmail.trim(),
          phone: regPhone.trim(),
          cohort: regCohort.trim() || "Cohort 1",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Registration failed");
        return;
      }

      // Save studentId to localStorage
      localStorage.setItem("attendance_student_id", cleanId);
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

  const switchToRegister = (initialId?: string) => {
    if (initialId) {
      setRegStudentId(initialId);
    }
    setActiveTab("register");
    setErrorMsg("");
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

  // Active Check-In & Registration Screen
  return (
    <div className="min-h-screen flex flex-col justify-between items-center p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-[#0c1220] dark:to-slate-950">
      {/* Top Brand Header */}
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

      {/* Main Card */}
      <div className="w-full max-w-md my-auto animate-fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl">
          {/* Session Details */}
          <div className="mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
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

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => {
                setActiveTab("checkin");
                setErrorMsg("");
              }}
              className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "checkin"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Check-In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setErrorMsg("");
              }}
              className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "register"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Student</span>
            </button>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: QUICK CHECK-IN */}
          {activeTab === "checkin" && (
            <form onSubmit={handleQuickCheckIn} className="space-y-4">
              {/* Student ID Input */}
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
                    placeholder="e.g. ZOBI-2026-001"
                    value={studentId}
                    onChange={handleIdChange}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono uppercase tracking-wider font-bold"
                  />
                </div>

                {isLookingUp && (
                  <p className="text-[11px] text-blue-500 mt-1.5 font-medium flex items-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin inline-block" />
                    Checking student directory...
                  </p>
                )}
              </div>

              {/* Verified Student Badge Card */}
              {isPreRegistered && fullName && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 animate-fade-in">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified Cohort Member
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-500 font-semibold">
                      {studentId}
                    </span>
                  </div>
                  <div className="text-base font-black text-emerald-950 dark:text-emerald-100 flex items-center gap-2 mt-0.5">
                    <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>{fullName}</span>
                  </div>
                </div>
              )}

              {/* Unregistered Call-To-Action Card */}
              {!isLookingUp && lookupAttempted && !isPreRegistered && studentId.trim().length >= 3 && (
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs animate-fade-in">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="font-bold text-blue-950 dark:text-blue-100">
                        First-Time Check-In?
                      </p>
                      <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
                        <span className="font-mono font-bold">{studentId}</span> is not registered in the directory yet. Complete your quick registration to record attendance now.
                      </p>
                      <button
                        type="button"
                        onClick={() => switchToRegister(studentId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Complete Registration
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={!isPreRegistered || isLookingUp}
                isLoading={isSubmitting}
                className={`w-full mt-2 font-bold shadow-lg transition-all ${
                  isPreRegistered
                    ? "shadow-blue-500/25 bg-blue-600 hover:bg-blue-700"
                    : "opacity-60 cursor-not-allowed bg-slate-400"
                }`}
              >
                {isLookingUp
                  ? "Verifying..."
                  : isPreRegistered
                  ? "Submit Attendance"
                  : "Enter Registered Student ID"}
                {isPreRegistered && <ArrowRight className="w-4 h-4 ml-1" />}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => switchToRegister(studentId)}
                  className="text-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                >
                  New to this cohort? <span className="underline font-bold">Register as a new student</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: FIRST-TIME REGISTRATION */}
          {activeTab === "register" && (
            <form onSubmit={handleRegisterAndCheckIn} className="space-y-3.5 animate-fade-in">
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300 flex items-start gap-2 mb-1">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  Registering will add you to the cohort directory and instantly record your attendance for this session.
                </span>
              </div>

              {/* Student ID */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Student ID *
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. ZOBI-2026-002"
                    value={regStudentId}
                    onChange={(e) => setRegStudentId(e.target.value.toUpperCase())}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono uppercase tracking-wider font-bold"
                  />
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kojo John"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Contact Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Email (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="student@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="+233..."
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Cohort */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Cohort
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Cohort 1"
                    value={regCohort}
                    onChange={(e) => setRegCohort(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              {/* Register & Submit Attendance Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full mt-3 font-bold shadow-lg shadow-blue-500/25 bg-blue-600 hover:bg-blue-700"
              >
                Register & Mark Attendance
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("checkin");
                    setErrorMsg("");
                  }}
                  className="text-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                >
                  Already registered? <span className="underline font-bold">Switch to Quick Check-In</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-3">
        Instant QR Attendance System • ZOBI
      </footer>
    </div>
  );
}
