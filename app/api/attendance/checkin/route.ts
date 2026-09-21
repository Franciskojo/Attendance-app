import { NextRequest, NextResponse } from "next/server";
import { submitCheckIn } from "@/lib/data-service";
import { checkInSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validated = checkInSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: validated.error.errors[0]?.message || "Invalid check-in data",
        },
        { status: 400 }
      );
    }

    const result = await submitCheckIn({
      ...validated.data,
      deviceInfo: req.headers.get("user-agent") || "",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Attendance recorded successfully!",
        data: result,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const isDup = (error as { isDuplicate?: boolean }).isDuplicate;
    return NextResponse.json(
      {
        success: false,
        alreadyCheckedIn: isDup,
        error: (error as Error).message || "Check-in failed",
      },
      { status: isDup ? 409 : 400 }
    );
  }
}
