import dns from "dns";
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch {}

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import mongoose from "mongoose";
import Student from "../models/Student";
import AttendanceRecord from "../models/AttendanceRecord";

async function cleanup() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("No MONGODB_URI found");
    process.exit(0);
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB for cleanup");

    const delStudent = await Student.deleteMany({ studentId: "ZOBI-2026-002" });
    console.log(`Deleted ${delStudent.deletedCount} unregistered student(s) with ID ZOBI-2026-002 from MongoDB`);

    const delRecord = await AttendanceRecord.deleteMany({ studentId: "ZOBI-2026-002" });
    console.log(`Deleted ${delRecord.deletedCount} attendance record(s) with ID ZOBI-2026-002 from MongoDB`);

    await mongoose.disconnect();
    console.log("Cleanup complete");
    process.exit(0);
  } catch (err) {
    console.log("Mongo cleanup error:", (err as Error).message);
    process.exit(1);
  }
}

cleanup();
