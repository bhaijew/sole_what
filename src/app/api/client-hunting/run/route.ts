import { NextResponse, NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { runHuntingForUser } from "@/lib/lead-hunter/cron";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ status: false, error: "Unauthorized" }, { status: 401 });
    }

    const result = await runHuntingForUser(user.id);

    if (!result.success) {
      return NextResponse.json({ status: false, error: result.error || "Hunting failed" }, { status: 500 });
    }

    return NextResponse.json({
      status: true,
      message: `Hunt completed! Found ${result.foundCount} businesses without website (${result.newLeadsSaved} new saved).`,
      data: result,
    });
  } catch (error: any) {
    console.error("Run hunt error:", error);
    return NextResponse.json({ status: false, error: error.message || "Failed to execute hunt" }, { status: 500 });
  }
}
