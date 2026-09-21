import { NextRequest, NextResponse } from "next/server";
import {
  getSessionDetails,
  updateSessionData,
  deleteSessionData,
} from "@/lib/data-service";

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

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error: unknown) {
    console.error("GET /api/sessions/[id] error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await updateSessionData(id, body);

    return NextResponse.json({
      success: true,
      message: "Session updated successfully",
      data: updated,
    });
  } catch (error: unknown) {
    console.error("PUT /api/sessions/[id] error:", error);
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
    await deleteSessionData(id);

    return NextResponse.json({
      success: true,
      message: "Session deleted successfully",
    });
  } catch (error: unknown) {
    console.error("DELETE /api/sessions/[id] error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
