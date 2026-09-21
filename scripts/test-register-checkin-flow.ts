import dns from "dns";
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch {}

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { registerAndCheckIn, getStudentByStudentId, getSessionsList, deleteStudentData } from "../lib/data-service";

async function testRegistrationFlow() {
  console.log("==========================================");
  console.log("TESTING REGISTRATION & CHECK-IN FLOW");
  console.log("==========================================");

  const testId = `ZOBI-TEST-${Date.now().toString().slice(-4)}`;
  const sessions = await getSessionsList();
  const session = sessions.find((s) => s.status === "open") || sessions[0];
  if (!session) {
    console.error("No active session found.");
    process.exit(1);
  }
  console.log(`Target Session: "${session.title}" (${session.slug})`);
  console.log(`Using Test ID: ${testId}`);

  // Step 1: Register and Check-in for new student
  console.log(`\n[Step 1] Registering new student '${testId}' (Test Student) and marking attendance...`);
  const result = await registerAndCheckIn({
    sessionSlug: session.slug,
    studentId: testId,
    fullName: "Test Student",
    email: "test.student@example.com",
    phone: "+233551234567",
    cohort: "Cohort 1",
  });

  console.log("Check-in result:", result);
  if (result.studentId === testId && result.studentName === "Test Student") {
    console.log("PASS: Student was registered and checked in successfully!");
  } else {
    console.error("FAIL: Check-in result mismatch", result);
    process.exit(1);
  }

  // Step 2: Verify student exists in student directory
  console.log("\n[Step 2] Verifying student exists in directory for future sessions...");
  const student = await getStudentByStudentId(testId);
  if (student && student.fullName === "Test Student") {
    console.log("PASS: Student is officially registered in the directory:", student);
  } else {
    console.error("FAIL: Student was not found in directory", student);
    process.exit(1);
  }

  // Step 3: Test duplicate prevention for this same session
  console.log("\n[Step 3] Testing duplicate check-in prevention...");
  try {
    await registerAndCheckIn({
      sessionSlug: session.slug,
      studentId: testId,
      fullName: "Test Student",
    });
    console.error("FAIL: Duplicate attendance should have thrown an error!");
    process.exit(1);
  } catch (err: any) {
    console.log("PASS: Duplicate check-in was prevented:", err.message);
  }

  // Step 4: Cleanup test student
  await deleteStudentData(student._id);
  console.log("PASS: Test student cleaned up.");

  console.log("\n==========================================");
  console.log("ALL TESTS COMPLETED SUCCESSFULLY!");
  console.log("==========================================");
  process.exit(0);
}

testRegistrationFlow().catch((err) => {
  console.error("Test flow failed:", err);
  process.exit(1);
});
