import { NextResponse } from "next/server";
import { getAnalyticsMetrics } from "@/lib/data-service";

export async function GET() {
  try {
    const data = await getAnalyticsMetrics();
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
