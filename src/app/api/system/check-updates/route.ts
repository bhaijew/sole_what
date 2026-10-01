import { NextResponse } from "next/server";

export async function POST() {
    try {
        return NextResponse.json({
            status: true,
            message: "System is up to date",
            data: {
                hasUpdate: false,
                currentVersion: "1.0.0",
                latestVersion: "1.0.0"
            }
        });
    } catch (error: any) {
        return NextResponse.json(
            { status: false, message: "Failed to check updates", error: error.message },
            { status: 500 }
        );
    }
}

export async function GET() {
    return POST();
}
