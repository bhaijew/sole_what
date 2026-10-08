import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGoldRates, saveGoldRates, syncLiveGoldRates } from "@/lib/gold-service";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const rates = getGoldRates();
        return NextResponse.json({ success: true, data: rates });
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

        if (body.action === "sync") {
            const synced = await syncLiveGoldRates();
            return NextResponse.json({ success: true, message: "Gold rates synced successfully", data: synced });
        }

        const updated = saveGoldRates(body, "manual");
        return NextResponse.json({ success: true, message: "Gold rates updated successfully", data: updated });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
