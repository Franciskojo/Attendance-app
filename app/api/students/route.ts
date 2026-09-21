import { NextRequest, NextResponse } from "next/server";
import { getStudentsList, createStudentData } from "@/lib/data-service";
import { studentSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const cohort = searchParams.get("cohort") || "";

    const students = await getStudentsList(search, cohort);

    return NextResponse.json({
      success: true,
      data: students,
    });
  } catch (error: unknown) {
    console.error("GET /api/students error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validated = studentSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: validated.error.errors[0]?.message || "Invalid student data",
        },
        { status: 400 }
      );
    }

    const student = await createStudentData(validated.data);

    return NextResponse.json(
      {
        success: true,
        message: "Student created successfully",
        data: student,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/students error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
