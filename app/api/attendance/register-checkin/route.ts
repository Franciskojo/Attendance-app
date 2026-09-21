import { NextRequest, NextResponse } from "next/server";
import { registerAndCheckIn } from "@/lib/data-service";
import { registerAndCheckInSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validated = registerAndCheckInSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: validated.error.errors[0]?.message || "Invalid registration data",
        },
        { status: 400 }
      );
    }

    const result = await registerAndCheckIn({
      ...validated.data,
      deviceInfo: req.headers.get("user-agent") || "",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Registration completed and attendance recorded successfully!",
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
        error: (error as Error).message || "Registration and check-in failed",
      },
      { status: isDup ? 409 : 400 }
    );
  }
}
