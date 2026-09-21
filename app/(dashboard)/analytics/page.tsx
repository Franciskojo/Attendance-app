"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Award,
  RefreshCw,
  Users,
  CalendarCheck,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { LiveBadge } from "@/components/ui/LiveBadge";
import { useToast } from "@/components/ui/Toast";
import { useLiveSync } from "@/hooks/useLiveSync";

interface SessionTrend {
  id: string;
  name: string;
  fullTitle: string;
  date: string;
  status: string;
  present: number;
  absent: number;
  late: number;
  attendanceRate: number;
}

interface StudentRate {
  studentId: string;
  fullName: string;
  email?: string;
  attended: number;
  totalSessions: number;
  rate: number;
}

interface AnalyticsData {
  totalStudents: number;
  totalSessions: number;
  todayAttendanceCount: number;
  overallAttendanceRate: number;
  sessionTrends: SessionTrend[];
  topStudents: StudentRate[];
  atRiskStudents: StudentRate[];
}

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAnalytics = React.useCallback(async () => {
    try {
      const res = await fetch("/api/analytics");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch {
      // Ignore network errors
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Live real-time auto sync for analytics
  const { isLiveConnected, lastUpdated, refreshNow } = useLiveSync(fetchAnalytics, {
    intervalMs: 4000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium">Computing cohort statistics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Cohort Performance Intelligence</span>
            <span>•</span>
            <LiveBadge isLive={isLiveConnected} lastUpdated={lastUpdated} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Attendance Analytics & Trends
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Identify participation patterns, session turnout, and students requiring engagement.
          </p>
        </div>

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
          Refresh Data
        </Button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Overall Attendance"
          value={`${data.overallAttendanceRate}%`}
          subtitle="Cohort average across all sessions"
          icon={TrendingUp}
          accentColor="blue"
        />

        <StatCard
          title="Active Sessions"
          value={data.totalSessions}
          subtitle="Tracked lecture modules"
          icon={CalendarCheck}
          accentColor="purple"
        />

        <StatCard
          title="Total Cohort Size"
          value={data.totalStudents}
          subtitle="Registered participants"
          icon={Users}
          accentColor="emerald"
        />

        <StatCard
          title="Students At Risk"
          value={data.atRiskStudents.length}
          subtitle="Attendance below 75% threshold"
          icon={AlertTriangle}
          accentColor="amber"
          trend={{
            value: data.atRiskStudents.length === 0 ? "Zero Risk" : "Action Needed",
            isPositive: data.atRiskStudents.length === 0,
          }}
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Rate Trend Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Attendance Rate Trend (%)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Percentage of enrolled students present per session
            </p>
          </div>

          <div className="h-72 w-full">
            {data.sessionTrends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No session data available yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.sessionTrends}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="attendanceRate"
                    name="Attendance Rate %"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#rateGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Present vs Absent Stacked Bar Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Turnout Breakdown (Present vs Absent)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Headcount of present, late, and absent students per session
            </p>
          </div>

          <div className="h-72 w-full">
            {data.sessionTrends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No session data available yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.sessionTrends}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Bar
                    dataKey="present"
                    name="Present"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="late"
                    name="Late"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="absent"
                    name="Absent"
                    fill="#f43f5e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard & At Risk Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Attending Students */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Top Attending Students
              </h3>
              <p className="text-xs text-slate-500">Highest consistency in cohort</p>
            </div>
          </div>

          <div className="space-y-3">
            {data.topStudents.map((s, idx) => (
              <div
                key={s.studentId}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {s.fullName}
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400">
                      {s.studentId}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    {s.rate}%
                  </span>
                  <p className="text-[10px] text-slate-400">
                    {s.attended}/{s.totalSessions} sessions
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Risk Alerts */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Attendance Risk Alerts (&lt;75%)
              </h3>
              <p className="text-xs text-slate-500">
                Students eligible for follow-up reminders
              </p>
            </div>
          </div>

          {data.atRiskStudents.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              🎉 No students are currently below the 75% attendance threshold.
            </div>
          ) : (
            <div className="space-y-3">
              {data.atRiskStudents.map((s) => (
                <div
                  key={s.studentId}
                  className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {s.fullName}
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400">
                      {s.studentId}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">
                      {s.rate}%
                    </span>
                    <p className="text-[10px] text-slate-400">
                      {s.attended}/{s.totalSessions} sessions
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
