import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const studentSchema = z.object({
  studentId: z
    .string()
    .min(2, "Student ID must be at least 2 characters")
    .max(50, "Student ID is too long")
    .transform((val) => val.trim().toUpperCase()),
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long")
    .transform((val) => val.trim()),
  phone: z
    .string()
    .max(25, "Phone number is too long")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val ? val.trim() : "")),
  email: z
    .string()
    .email("Invalid email format")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val ? val.trim().toLowerCase() : "")),
  cohort: z.string().optional().default("Cohort 1"),
});

export const sessionSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title is too long")
    .transform((val) => val.trim()),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .default(""),
  date: z.string().min(1, "Session date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  status: z.enum(["upcoming", "open", "closed"]).default("upcoming"),
});

export const checkInSchema = z.object({
  sessionSlug: z.string().min(1, "Session slug is required"),
  studentId: z
    .string()
    .min(2, "Student ID is required")
    .max(50, "Student ID is too long")
    .transform((val) => val.trim().toUpperCase()),
  fullName: z
    .string()
    .max(100, "Name is too long")
    .optional()
    .transform((val) => (val ? val.trim() : "")),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type StudentInput = z.infer<typeof studentSchema>;
export type SessionInput = z.infer<typeof sessionSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
