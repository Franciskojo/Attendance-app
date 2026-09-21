import { NextRequest, NextResponse } from "next/server";
import { updateStudentData, deleteStudentData } from "@/lib/data-service";
import { studentSchema } from "@/lib/validators";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const validated = studentSchema.partial().safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: validated.error.errors[0]?.message || "Invalid input",
        },
        { status: 400 }
      );
    }

    const updated = await updateStudentData(id, validated.data);

    return NextResponse.json({
      success: true,
      message: "Student updated successfully",
      data: updated,
    });
  } catch (error: unknown) {
    console.error("PUT /api/students/[id] error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteStudentData(id);

    return NextResponse.json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error: unknown) {
    console.error("DELETE /api/students/[id] error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
