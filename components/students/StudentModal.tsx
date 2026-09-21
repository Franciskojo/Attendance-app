"use client";

import React, { useState, useEffect, useRef } from "react";
import { Hash, User, Mail, Phone, GraduationCap, Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export interface StudentData {
  _id?: string;
  studentId: string;
  fullName: string;
  email?: string;
  phone?: string;
  cohort?: string;
}

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentToEdit?: StudentData | null;
  onStudentSaved?: () => void;
}

export function StudentModal({
  isOpen,
  onClose,
  studentToEdit,
  onStudentSaved,
}: StudentModalProps) {
  const { toast } = useToast();
  const [studentId, setStudentId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cohort, setCohort] = useState("Cohort 1");
  const [isLoading, setIsLoading] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (studentToEdit) {
        setStudentId(studentToEdit.studentId || "");
        setFullName(studentToEdit.fullName || "");
        setEmail(studentToEdit.email || "");
        setPhone(studentToEdit.phone || "");
        setCohort(studentToEdit.cohort || "Cohort 1");
      } else {
        setStudentId("");
        setFullName("");
        setEmail("");
        setPhone("");
        setCohort("Cohort 1");
      }

      const timer = setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [studentToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim() || !fullName.trim()) {
      toast("Student ID and Full Name are required", "error");
      return;
    }

    setIsLoading(true);
    try {
      const targetId = studentToEdit?._id || studentToEdit?.studentId;
      const isEdit = Boolean(targetId);
      const url = isEdit ? `/api/students/${encodeURIComponent(targetId!)}` : "/api/students";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: studentId.trim().toUpperCase(),
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          cohort: cohort.trim() || "Cohort 1",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save student");
      }

      toast(
        isEdit ? "Student details updated!" : "Student registered successfully!",
        "success"
      );
      onClose();
      if (onStudentSaved) onStudentSaved();
    } catch (err: unknown) {
      toast((err as Error).message || "An error occurred", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const isEdit = Boolean(studentToEdit?._id || studentToEdit?.studentId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Student Details" : "Register New Student"}
      description={
        isEdit
          ? "Update the student ID, full name, cohort, or contact information."
          : "Add a student to the cohort roster for automated QR check-in recognition."
      }
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Core Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Student ID */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
              <Hash className="w-3.5 h-3.5 text-blue-500" />
              <span>Student ID *</span>
            </label>
            <div className="relative">
              <input
                ref={firstInputRef}
                type="text"
                required
                placeholder="e.g. ENT-2026-001"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full pl-3.5 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono uppercase transition-colors shadow-sm"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Used by student during QR check-in</p>
          </div>

          {/* Full Name */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
              <User className="w-3.5 h-3.5 text-blue-500" />
              <span>Full Name *</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Alex Johnson"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors shadow-sm"
            />
            <p className="text-[11px] text-slate-400 mt-1">First and last name</p>
          </div>
        </div>

        {/* Contact Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Email */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Email Address</span>
              <span className="text-[10px] text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="email"
              placeholder="alex.j@cohort.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors shadow-sm"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Phone Number</span>
              <span className="text-[10px] text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="tel"
              placeholder="+1 (555) 234-5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors shadow-sm"
            />
          </div>
        </div>

        {/* Cohort / Class Assignment */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
            <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
            <span>Cohort / Class Batch</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Cohort 1, Fall 2026, Batch A"
            value={cohort}
            onChange={(e) => setCohort(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors shadow-sm"
          />
        </div>

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="px-5 text-slate-600 dark:text-slate-400"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="px-6 gap-2 shadow-md shadow-blue-500/20"
          >
            <Check className="w-4 h-4" />
            <span>{isEdit ? "Update Student" : "Save Student"}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
