import { NextResponse, NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { sendPitchToLead } from "@/lib/lead-hunter/outreach";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ status: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { leadId, customPitch, sessionId } = body;

    if (!leadId) {
      return NextResponse.json({ status: false, error: "Lead ID required" }, { status: 400 });
    }

    const result = await sendPitchToLead({ leadId, customPitch, sessionId });

    if (!result.success) {
      return NextResponse.json({ status: false, error: result.error || "Failed to send message" }, { status: 400 });
    }

    return NextResponse.json({ status: true, message: "WhatsApp pitch sent successfully!" });
  } catch (error: any) {
    console.error("Send pitch error:", error);
    return NextResponse.json({ status: false, error: error.message || "Failed to send pitch" }, { status: 500 });
  }
}
