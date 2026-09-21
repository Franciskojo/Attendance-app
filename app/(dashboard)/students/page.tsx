"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Users2,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Mail,
  Phone,
  GraduationCap,
  Sparkles,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StudentModal, StudentData } from "@/components/students/StudentModal";
import { LiveBadge } from "@/components/ui/LiveBadge";
import { useToast } from "@/components/ui/Toast";
import { useLiveSync } from "@/hooks/useLiveSync";

interface EnrichedStudent extends StudentData {
  _id: string;
  attendanceCount: number;
  createdAt: string;
}

export default function StudentsPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<EnrichedStudent[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<StudentData | null>(null);

  const fetchStudents = useCallback(async () => {
    try {
      const url = search
        ? `/api/students?search=${encodeURIComponent(search)}`
        : "/api/students";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setStudents(data.data);
      }
    } catch (err) {
      console.error("Fetch students error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [search]);

  // Real-time live auto sync for students
  const { isLiveConnected, lastUpdated, refreshNow } = useLiveSync(fetchStudents, {
    intervalMs: 3000,
    onEvent: (event) => {
      if (event.type === "STUDENT_CREATED") {
        toast(`👤 New Student Registered: ${event.studentName} (${event.studentId})`, "info");
      }
    },
  });

  const handleDelete = async (studentId: string, fullName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to remove ${fullName} (${studentId}) from the student roster?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/students/${studentId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast("Student record removed successfully", "success");
        refreshNow();
      } else {
        toast(data.error || "Failed to delete student", "error");
      }
    } catch {
      toast("Error deleting student", "error");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Cohort Directory</span>
            <span>•</span>
            <LiveBadge isLive={isLiveConnected} lastUpdated={lastUpdated} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Student Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage enrolled students, contact info, and track attendance participation.
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
            onClick={() => {
              setStudentToEdit(null);
              setModalOpen(true);
            }}
            className="gap-2 shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, Name, or Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
            {students.length}
          </span>
          <span>Students Found</span>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {students.length === 0 && !isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-flex p-4 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mb-3">
              <Users2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              No students found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              {search
                ? `No students matching "${search}". Try clearing your search.`
                : "Your cohort directory is currently empty. Add students or seed sample data."}
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setStudentToEdit(null);
                setModalOpen(true);
              }}
            >
              Add First Student
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3.5 px-5">Student ID</th>
                  <th className="py-3.5 px-4">Full Name</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Cohort</th>
                  <th className="py-3.5 px-4">Attended Sessions</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {students.map((student) => (
                  <tr
                    key={student._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-5 font-mono font-bold text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {student.studentId}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {student.fullName}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        {student.email ? (
                          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {student.email}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No email</span>
                        )}
                        {student.phone && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Phone className="w-2.5 h-2.5 text-slate-400" />
                            {student.phone}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium">
                        {student.cohort || "Cohort 1"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                      <span className="font-bold text-slate-900 dark:text-white px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40">
                        {student.attendanceCount} sessions
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setStudentToEdit({ ...student });
                            setModalOpen(true);
                          }}
                          title="Edit Student"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(student._id, student.fullName)}
                          title="Delete Student"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Add/Edit Modal */}
      <StudentModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setStudentToEdit(null);
        }}
        studentToEdit={studentToEdit}
        onStudentSaved={fetchStudents}
      />
    </div>
  );
}
