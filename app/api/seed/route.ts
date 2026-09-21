import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { reseedDatabaseStore } from "@/lib/data-service";
import connectToDatabase from "@/lib/mongodb";
import { seedDatabase } from "@/scripts/seed";

export async function POST(request: NextRequest) {
  try {
    // In production, require either an active Admin session or matching SEED_SECRET
    if (process.env.NODE_ENV === "production") {
      const secretParam = request.nextUrl.searchParams.get("secret");
      const secretHeader = request.headers.get("x-seed-secret");
      const configuredSecret = process.env.SEED_SECRET;

      const session = await getServerSession(authOptions);
      const isAuthorizedAdmin = session?.user?.email;
      const isSecretValid =
        configuredSecret &&
        (secretParam === configuredSecret || secretHeader === configuredSecret);

      if (!isAuthorizedAdmin && !isSecretValid) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Unauthorized: Seeding in production requires an admin session or valid SEED_SECRET.",
          },
          { status: 401 }
        );
      }
    }

    // Check if MongoDB is connected or configured
    const hasMongoUri = !!process.env.MONGODB_URI;
    let result;

    if (hasMongoUri) {
      try {
        await connectToDatabase();
        result = await seedDatabase();
      } catch (mongoErr) {
        console.warn("MongoDB seed failed, falling back to local store:", mongoErr);
        const storeResult = reseedDatabaseStore();
        result = {
          admin: { email: "admin@cohort.edu", password: "Admin123!" },
          studentsCount: storeResult.students.length,
          sessionsCount: storeResult.sessions.length,
          recordsCount: storeResult.records.length,
        };
      }
    } else {
      const storeResult = reseedDatabaseStore();
      result = {
        admin: { email: "admin@cohort.edu", password: "Admin123!" },
        studentsCount: storeResult.students.length,
        sessionsCount: storeResult.sessions.length,
        recordsCount: storeResult.records.length,
      };
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully!",
      data: result,
    });
  } catch (error: unknown) {
    console.error("Seed API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Failed to seed database",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
