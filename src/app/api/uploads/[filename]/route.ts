import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

const MIME_MAP: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif"
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    try {
        const { filename } = await params;

        // Path traversal protection
        if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
            return NextResponse.json({ status: false, message: "Invalid filename" }, { status: 400 });
        }

        const filePath = path.join(UPLOAD_DIR, filename);

        if (!existsSync(filePath)) {
            return NextResponse.json({ status: false, message: "File not found" }, { status: 404 });
        }

        const ext = path.extname(filename).toLowerCase();
        const contentType = MIME_MAP[ext] || "application/octet-stream";

        const fileBuffer = await readFile(filePath);

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
            }
        });

    } catch (error: any) {
        console.error("Serve uploaded file error:", error);
        return NextResponse.json({ status: false, message: "Failed to load file" }, { status: 500 });
    }
}
