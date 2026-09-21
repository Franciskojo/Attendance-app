import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User";
import Student from "../models/Student";
import AttendanceSession from "../models/AttendanceSession";
import AttendanceRecord from "../models/AttendanceRecord";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/attendance_db";

export const SAMPLE_STUDENTS = [
  { studentId: "ENT-2026-001", fullName: "Alex Johnson", email: "alex.j@cohort.edu", phone: "+1 (555) 234-5678", cohort: "Cohort 1" },
  { studentId: "ENT-2026-002", fullName: "Sophia Martinez", email: "sophia.m@cohort.edu", phone: "+1 (555) 345-6789", cohort: "Cohort 1" },
  { studentId: "ENT-2026-003", fullName: "David Chen", email: "david.c@cohort.edu", phone: "+1 (555) 456-7890", cohort: "Cohort 1" },
  { studentId: "ENT-2026-004", fullName: "Amara Okafor", email: "amara.o@cohort.edu", phone: "+1 (555) 567-8901", cohort: "Cohort 1" },
  { studentId: "ENT-2026-005", fullName: "Liam Smith", email: "liam.s@cohort.edu", phone: "+1 (555) 678-9012", cohort: "Cohort 1" },
  { studentId: "ENT-2026-006", fullName: "Fatima Al-Mansoor", email: "fatima.a@cohort.edu", phone: "+1 (555) 789-0123", cohort: "Cohort 1" },
  { studentId: "ENT-2026-007", fullName: "Marcus Brown", email: "marcus.b@cohort.edu", phone: "+1 (555) 890-1234", cohort: "Cohort 1" },
  { studentId: "ENT-2026-008", fullName: "Elena Rostova", email: "elena.r@cohort.edu", phone: "+1 (555) 901-2345", cohort: "Cohort 1" },
  { studentId: "ENT-2026-009", fullName: "Tariq Ibrahim", email: "tariq.i@cohort.edu", phone: "+1 (555) 012-3456", cohort: "Cohort 1" },
  { studentId: "ENT-2026-010", fullName: "Chloe Dubois", email: "chloe.d@cohort.edu", phone: "+1 (555) 123-4568", cohort: "Cohort 1" },
  { studentId: "ENT-2026-011", fullName: "Kwame Mensah", email: "kwame.m@cohort.edu", phone: "+1 (555) 234-5679", cohort: "Cohort 1" },
  { studentId: "ENT-2026-012", fullName: "Isabella Rossi", email: "isabella.r@cohort.edu", phone: "+1 (555) 345-6780", cohort: "Cohort 1" },
  { studentId: "ENT-2026-013", fullName: "Noah Kim", email: "noah.k@cohort.edu", phone: "+1 (555) 456-7891", cohort: "Cohort 1" },
  { studentId: "ENT-2026-014", fullName: "Zainab Patel", email: "zainab.p@cohort.edu", phone: "+1 (555) 567-8902", cohort: "Cohort 1" },
  { studentId: "ENT-2026-015", fullName: "Lucas Silva", email: "lucas.s@cohort.edu", phone: "+1 (555) 678-9013", cohort: "Cohort 1" },
  { studentId: "ENT-2026-016", fullName: "Hannah Schmidt", email: "hannah.s@cohort.edu", phone: "+1 (555) 789-0124", cohort: "Cohort 1" },
  { studentId: "ENT-2026-017", fullName: "Emmanuel Adeleke", email: "emmanuel.a@cohort.edu", phone: "+1 (555) 890-1235", cohort: "Cohort 1" },
  { studentId: "ENT-2026-018", fullName: "Maya Tanaka", email: "maya.t@cohort.edu", phone: "+1 (555) 901-2346", cohort: "Cohort 1" },
  { studentId: "ENT-2026-019", fullName: "Oliver Hansen", email: "oliver.h@cohort.edu", phone: "+1 (555) 012-3457", cohort: "Cohort 1" },
  { studentId: "ENT-2026-020", fullName: "Priya Sharma", email: "priya.s@cohort.edu", phone: "+1 (555) 123-4569", cohort: "Cohort 1" },
];

export async function seedDatabase() {
  console.log("Connecting to MongoDB for seeding...");
  await mongoose.connect(MONGODB_URI);

  console.log("Cleaning existing records...");
  await User.deleteMany({});
  await Student.deleteMany({});
  await AttendanceSession.deleteMany({});
  await AttendanceRecord.deleteMany({});

  console.log("Creating default Admin user...");
  const hashedPassword = await bcrypt.hash("Admin123!", 10);
  const admin = await User.create({
    name: "Course Representative",
    email: "admin@cohort.edu",
    password: hashedPassword,
    role: "admin",
  });

  console.log("Seeding 20 students...");
  const createdStudents = await Student.insertMany(SAMPLE_STUDENTS);

  const todayStr = new Date().toISOString().split("T")[0];
  const pastDateStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const futureDateStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  console.log("Creating 3 sample sessions...");
  const session1 = await AttendanceSession.create({
    title: "Week 1: Introduction to Entrepreneurship & Ideation",
    description: "Overview of startup fundamentals, finding product-market fit, and team formation.",
    date: pastDateStr,
    startTime: "09:00",
    endTime: "12:00",
    status: "closed",
    slug: "week-1-intro-ideation-a1b2c",
    createdBy: admin._id,
  });

  const session2 = await AttendanceSession.create({
    title: "Week 2: Customer Discovery & Business Model Canvas",
    description: "Deep dive into problem validation, customer interviews, and value proposition mapping.",
    date: todayStr,
    startTime: "09:00",
    endTime: "12:00",
    status: "open",
    slug: "week-2-customer-discovery-d3e4f",
    createdBy: admin._id,
  });

  const session3 = await AttendanceSession.create({
    title: "Week 3: Financial Modeling & Investor Pitching",
    description: "Unit economics, runway calculation, pitch deck design, and Q&A preparation.",
    date: futureDateStr,
    startTime: "09:00",
    endTime: "12:00",
    status: "upcoming",
    slug: "week-3-financial-modeling-g5h6j",
    createdBy: admin._id,
  });

  console.log("Creating realistic attendance check-in records...");
  // Session 1: 18 students attended
  const session1Records = createdStudents.slice(0, 18).map((student, idx) => ({
    sessionId: session1._id,
    studentId: student.studentId,
    studentName: student.fullName,
    checkedInAt: new Date(new Date(pastDateStr).setHours(9, 5 + idx * 2, 0)),
    status: idx > 14 ? "late" : "present",
  }));
  await AttendanceRecord.insertMany(session1Records);

  // Session 2 (today, Open): 14 students currently checked in
  const session2Records = createdStudents.slice(0, 14).map((student, idx) => ({
    sessionId: session2._id,
    studentId: student.studentId,
    studentName: student.fullName,
    checkedInAt: new Date(new Date().getTime() - (30 - idx * 2) * 60 * 1000),
    status: idx > 10 ? "late" : "present",
  }));
  await AttendanceRecord.insertMany(session2Records);

  console.log("Database seeded successfully!");
  return {
    admin: { email: admin.email, password: "Admin123!" },
    studentsCount: createdStudents.length,
    sessionsCount: 3,
    recordsCount: session1Records.length + session2Records.length,
  };
}

// Standalone execution support
if (require.main === module) {
  seedDatabase()
    .then((res) => {
      console.log("Seed complete:", res);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
