import { NextRequest, NextResponse } from "next/server";
import { getStudentsList } from "@/lib/data-service";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const rawStudentId = searchParams.get("studentId");

    if (!rawStudentId) {
      return NextResponse.json(
        { success: false, error: "Student ID is required" },
        { status: 400 }
      );
    }

    const studentId = rawStudentId.trim().toUpperCase();
    const students = await getStudentsList();
    const student = students.find((s) => s.studentId === studentId);

    if (!student) {
      return NextResponse.json({
        success: true,
        exists: false,
      });
    }

    return NextResponse.json({
      success: true,
      exists: true,
      student: {
        studentId: student.studentId,
        fullName: student.fullName,
        email: student.email,
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/attendance/lookup error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
