import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const PUBLIC_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// Allowed image MIME types for payment receipts
const ALLOWED_MIME_TYPES: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/heic": ".jpg"
};

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, error: "Baraye meherbani payment slip photo select karein." },
                { status: 400 }
            );
        }

        const mimeType = file.type?.toLowerCase() || "";
        const ext = ALLOWED_MIME_TYPES[mimeType] || path.extname(file.name).toLowerCase() || ".jpg";

        if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
            return NextResponse.json(
                { success: false, error: "Sirf image files (JPG, PNG, WEBP) upload ki ja sakti hain." },
                { status: 400 }
            );
        }

        // Limit receipt file size to 6MB
        if (file.size > 6 * 1024 * 1024) {
            return NextResponse.json(
                { success: false, error: "Image size 6MB se ziada nahi hona chahiye." },
                { status: 400 }
            );
        }

        // Ensure target directories exist
        await mkdir(UPLOAD_DIR, { recursive: true });
        await mkdir(PUBLIC_UPLOAD_DIR, { recursive: true });

        // Generate safe unique filename
        const safeExt = ext === ".jpeg" ? ".jpg" : ext;
        const randomId = crypto.randomBytes(6).toString("hex");
        const filename = `receipt-${Date.now()}-${randomId}${safeExt}`;

        const buffer = Buffer.from(await file.arrayBuffer());

        // Save to public uploads for immediate HTTP access
        await writeFile(path.join(PUBLIC_UPLOAD_DIR, filename), buffer);

        // Save backup to data/uploads
        await writeFile(path.join(UPLOAD_DIR, filename), buffer).catch(() => {});

        const publicUrl = `/uploads/${filename}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            filename: filename,
            message: "Payment receipt kamiyabi se upload ho gayi hai!"
        });
    } catch (error: any) {
        console.error("Receipt Upload Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to upload payment receipt" },
            { status: 500 }
        );
    }
}
