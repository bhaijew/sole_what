import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isHandoverActive, enableHandover, disableHandover, getHandoverState, listActiveHandovers } from "@/lib/handover-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get("sessionId");
        const jid = searchParams.get("jid");

        if (!sessionId) {
            return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
        }

        if (jid) {
            const active = isHandoverActive(sessionId, jid);
            const state = getHandoverState(sessionId, jid);
            return NextResponse.json({ success: true, active, state });
        }

        const activeList = listActiveHandovers(sessionId);
        return NextResponse.json({ success: true, count: activeList.length, handovers: activeList });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const { sessionId, jid, action, minutes, reason } = body;

        if (!sessionId || !jid) {
            return NextResponse.json({ error: "Missing sessionId or jid" }, { status: 400 });
        }

        if (action === "resume") {
            disableHandover(sessionId, jid);
            return NextResponse.json({ success: true, active: false, message: "AI Bot resumed for this chat." });
        }

        const record = enableHandover(sessionId, jid, minutes || 60, reason || "Manual dashboard takeover");
        return NextResponse.json({ success: true, active: true, record, message: `AI Bot paused for ${minutes || 60} minutes.` });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
