import dns from "dns";
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch {}

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { submitCheckIn, getStudentByStudentId, getSessionsList } from "../lib/data-service";

async function runTests() {
  console.log("==========================================");
  console.log("TESTING REGISTRATION ENFORCEMENT & FIX");
  console.log("==========================================");

  // 1. Get an active session
  const sessions = await getSessionsList();
  const openSession = sessions.find((s) => s.status === "open") || sessions[0];
  if (!openSession) {
    console.error("No session found for test.");
    process.exit(1);
  }
  console.log(`Using Session: "${openSession.title}" (${openSession.slug})`);

  // 2. Test unregistered student lookup
  console.log("\n[Test 1] Checking lookup for unregistered student ID 'ZOBI-2026-002'...");
  const unregStudent = await getStudentByStudentId("ZOBI-2026-002");
  console.log("Lookup result:", unregStudent);
  if (unregStudent === null) {
    console.log("PASS: Student is not registered.");
  } else {
    console.error("FAIL: Expected null, but found student:", unregStudent);
  }

  // 3. Test submitting attendance with unregistered student ID 'ZOBI-2026-002'
  console.log("\n[Test 2] Attempting to submit attendance for unregistered ID 'ZOBI-2026-002'...");
  try {
    await submitCheckIn({
      sessionSlug: openSession.slug,
      studentId: "ZOBI-2026-002",
      fullName: "Kojo John",
    });
    console.error("FAIL: Check-in succeeded when it should have been rejected!");
    process.exit(1);
  } catch (err: any) {
    console.log("PASS: Check-in was correctly rejected with message:");
    console.log("  ->", err.message);
  }

  // 4. Verify that ZOBI-2026-002 was NOT created as a student
  console.log("\n[Test 3] Verifying no phantom student was auto-created...");
  const recheck = await getStudentByStudentId("ZOBI-2026-002");
  if (recheck === null) {
    console.log("PASS: No auto-created student was found in the database.");
  } else {
    console.error("FAIL: Phantom student was created:", recheck);
    process.exit(1);
  }

  console.log("\n==========================================");
  console.log("ALL REGISTRATION ENFORCEMENT TESTS PASSED!");
  console.log("==========================================");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
