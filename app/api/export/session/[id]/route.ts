import { NextRequest, NextResponse } from "next/server";
import { getSessionDetails } from "@/lib/data-service";
import { generateAttendanceExcel } from "@/lib/excel";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionDetails(id);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    const formattedRecords = session.records.map((r) => ({
      studentId: r.studentId,
      studentName: r.studentName,
      checkedInAt: r.checkedInAt,
      status: r.status,
    }));

    const excelBuffer = generateAttendanceExcel(
      session.title,
      session.date,
      formattedRecords
    );

    const safeTitle = session.title.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `${safeTitle}_Attendance.xlsx`;

    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/export/session/[id] error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
