import { NextRequest, NextResponse } from "next/server";
import { getSessionsList, createSessionData } from "@/lib/data-service";
import { sessionSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";

    const sessions = await getSessionsList(status, search);

    return NextResponse.json({
      success: true,
      data: sessions,
    });
  } catch (error: unknown) {
    console.error("GET /api/sessions error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validated = sessionSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: validated.error.errors[0]?.message || "Invalid session data",
        },
        { status: 400 }
      );
    }

    const session = await createSessionData(validated.data);

    return NextResponse.json(
      {
        success: true,
        message: "Attendance session created successfully",
        data: session,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/sessions error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
