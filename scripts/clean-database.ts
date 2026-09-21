import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User";
import Student from "../models/Student";
import AttendanceSession from "../models/AttendanceSession";
import AttendanceRecord from "../models/AttendanceRecord";
import { resetDatabase, loadDatabase } from "../lib/store";

async function cleanDatabase() {
  console.log("=========================================");
  console.log("🧹 STARTING DATABASE CLEANUP");
  console.log("=========================================\n");

  // 1. Clean MongoDB
  const uri = process.env.MONGODB_URI;
  if (uri) {
    try {
      console.log("Connecting to MongoDB Atlas...");
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
      console.log(" Connected to MongoDB Atlas.\n");

      console.log("Purging all demo sessions...");
      const deletedSessions = await AttendanceSession.deleteMany({});
      console.log(`  -> Deleted ${deletedSessions.deletedCount} sessions.`);

      console.log("Purging all attendance records...");
      const deletedRecords = await AttendanceRecord.deleteMany({});
      console.log(`  -> Deleted ${deletedRecords.deletedCount} records.`);

      console.log("Purging all students...");
      const deletedStudents = await Student.deleteMany({});
      console.log(`  -> Deleted ${deletedStudents.deletedCount} students.`);

      console.log("\nChecking Admin User in MongoDB...");
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount === 0) {
        console.log("No admin found in MongoDB. Creating default Admin user...");
        const adminEmail = process.env.ADMIN_EMAIL || "admin@cohort.edu";
        const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await User.create({
          name: "Course Representative",
          email: adminEmail.toLowerCase().trim(),
          password: hashedPassword,
          role: "admin",
        });
        console.log(`  -> Admin user created (${adminEmail})`);
      } else {
        const adminUsers = await User.find({ role: "admin" }).select("email role");
        console.log(`  -> Existing admin account(s) preserved:`, adminUsers.map(u => u.email).join(", "));
      }

      // Summary of MongoDB
      const finalSessionsCount = await AttendanceSession.countDocuments();
      const finalRecordsCount = await AttendanceRecord.countDocuments();
      const finalStudentsCount = await Student.countDocuments();
      const finalUsersCount = await User.countDocuments();

      console.log("\n MongoDB Final State:");
      console.log(`  - Users: ${finalUsersCount}`);
      console.log(`  - Students: ${finalStudentsCount}`);
      console.log(`  - Sessions: ${finalSessionsCount}`);
      console.log(`  - Records: ${finalRecordsCount}`);

      await mongoose.disconnect();
    } catch (mongoErr) {
      console.error("❌ MongoDB cleanup error:", mongoErr);
    }
  } else {
    console.log("⚠️ No MONGODB_URI found, skipping MongoDB Atlas cleanup.");
  }

  // 2. Clean Local JSON Store
  console.log("\n-----------------------------------------");
  console.log("🧹 Resetting Local JSON File (.data/attendance_db.json)...");
  resetDatabase();
  const localDb = loadDatabase();
  console.log(" Local Store Final State:");
  console.log(`  - Users: ${localDb.users.length} (${localDb.users.map(u => u.email).join(", ")})`);
  console.log(`  - Students: ${localDb.students.length}`);
  console.log(`  - Sessions: ${localDb.sessions.length}`);
  console.log(`  - Records: ${localDb.records.length}`);

  console.log("\n=========================================");
  console.log("✨ DATABASE CLEANUP COMPLETE!");
  console.log("=========================================\n");
}

cleanDatabase();
