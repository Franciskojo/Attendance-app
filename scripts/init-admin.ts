import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User";
import Student from "../models/Student";
import AttendanceSession from "../models/AttendanceSession";
import AttendanceRecord from "../models/AttendanceRecord";
import { resetDatabase } from "../lib/store";

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@cohort.edu";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin123!";

export async function initCleanAdmin() {
  console.log("Resetting local database to clean state...");
  resetDatabase();

  if (MONGODB_URI) {
    try {
      console.log("Connecting to MongoDB Atlas for clean admin initialization...");
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });

      console.log("Clearing all mock/seeded collections in MongoDB (students, sessions, records)...");
      await Student.deleteMany({});
      await AttendanceSession.deleteMany({});
      await AttendanceRecord.deleteMany({});

      console.log(`Setting up Admin user in MongoDB (${ADMIN_EMAIL})...`);
      await User.deleteMany({ email: ADMIN_EMAIL.toLowerCase().trim() });

      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await User.create({
        name: "Course Representative",
        email: ADMIN_EMAIL.toLowerCase().trim(),
        password: hashedPassword,
        role: "admin",
      });

      console.log("MongoDB Atlas clean state initialized successfully!");
    } catch (err) {
      console.warn("MongoDB Atlas connection failed, local store was reset:", (err as Error).message);
    }
  }

  console.log("\n=======================================================");
  console.log("CLEAN DATABASE INITIALIZED");
  console.log("=======================================================");
  console.log(`Admin Login Email:    ${ADMIN_EMAIL}`);
  console.log(`Admin Login Password: ${ADMIN_PASSWORD}`);
  console.log("Students Count:       0 (Clean - ready for real students)");
  console.log("Sessions Count:       0 (Clean - ready for real sessions)");
  console.log("Attendance Records:   0 (Clean)");
  console.log("=======================================================\n");

  return {
    admin: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    studentsCount: 0,
    sessionsCount: 0,
    recordsCount: 0,
  };
}

if (require.main === module) {
  initCleanAdmin()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("Initialization failed:", err);
      process.exit(1);
    });
}
