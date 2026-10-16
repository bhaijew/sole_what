import { NextRequest, NextResponse } from "next/server";
import { getPublicStoresDirectory } from "@/lib/store-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const city = searchParams.get("city") || undefined;
        const area = searchParams.get("area") || undefined;
        const search = searchParams.get("search") || searchParams.get("q") || undefined;
        const category = searchParams.get("category") || undefined;
        const onlyOpen = searchParams.get("onlyOpen") === "true";

        const result = await getPublicStoresDirectory({
            city,
            area,
            search,
            category,
            onlyOpen
        });

        return NextResponse.json({
            success: true,
            ...result
        });
    } catch (error: any) {
        console.error("Dukaan API error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch stores directory" },
            { status: 500 }
        );
    }
}
