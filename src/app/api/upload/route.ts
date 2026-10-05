import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

// Allowed image MIME types
const ALLOWED_MIME_TYPES: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif"
};

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ status: false, message: "Unauthorized", error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ status: false, message: "No file uploaded", error: "No file uploaded" }, { status: 400 });
        }

        const mimeType = file.type?.toLowerCase() || "";
        const ext = ALLOWED_MIME_TYPES[mimeType] || path.extname(file.name).toLowerCase();

        if (![".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
            return NextResponse.json({
                status: false,
                message: "Only image files (JPG, PNG, WEBP, GIF) are allowed.",
                error: "Invalid file type"
            }, { status: 400 });
        }

        // Limit file size to 10MB
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({
                status: false,
                message: "Image file size exceeds 10MB limit.",
                error: "File too large"
            }, { status: 400 });
        }

        // Ensure directory exists
        await mkdir(UPLOAD_DIR, { recursive: true });

        // Generate unique safe filename
        const safeExt = ext === ".jpeg" ? ".jpg" : ext;
        const randomId = crypto.randomBytes(8).toString("hex");
        const filename = `menu-${Date.now()}-${randomId}${safeExt}`;
        const filePath = path.join(UPLOAD_DIR, filename);

        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);

        // Derive base URL for WhatsApp & client access
        const origin = request.nextUrl.origin || process.env.NEXTAUTH_URL || process.env.BASE_URL || "http://localhost:3000";
        const relativeUrl = `/api/uploads/${filename}`;
        const fullUrl = `${origin}${relativeUrl}`;

        return NextResponse.json({
            status: true,
            message: "Image uploaded successfully",
            data: {
                filename,
                url: relativeUrl,
                fullUrl
            }
        });

    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json({
            status: false,
            message: error.message || "Failed to upload image",
            error: error.message
        }, { status: 500 });
    }
}
