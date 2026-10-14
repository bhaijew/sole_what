import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

interface RouteParams {
    params: Promise<{ storeId: string }>;
}

// GET: Fetch products for store
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { storeId } = await params;
        const products = await prisma.product.findMany({
            where: { storeId },
            include: { category: true },
            orderBy: { createdAt: "desc" }
        });
        return NextResponse.json({ products });
    } catch (error: any) {
        console.error("Get products error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch products" }, { status: 500 });
    }
}

// POST: Add new product to store
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { storeId } = await params;

        // Verify store ownership
        const store = await prisma.store.findFirst({
            where: user.role === "SUPERADMIN" ? { id: storeId } : { id: storeId, userId: user.id }
        });

        if (!store) {
            return NextResponse.json({ error: "Store not found or unauthorized" }, { status: 404 });
        }

        const body = await request.json();
        const {
            name,
            price,
            compareAtPrice,
            unit,
            categoryId,
            description,
            image,
            inStock
        } = body;

        if (!name || !name.trim()) {
            return NextResponse.json({ error: "Product name is required" }, { status: 400 });
        }

        if (price === undefined || isNaN(Number(price))) {
            return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
        }

        // Generate product slug
        const baseSlug = name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

        const product = await prisma.product.create({
            data: {
                storeId,
                name: name.trim(),
                slug: uniqueSlug,
                description: description?.trim() || null,
                price: Number(price),
                compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
                unit: unit?.trim() || "item",
                categoryId: categoryId || null,
                image: image?.trim() || null,
                inStock: inStock !== undefined ? Boolean(inStock) : true
            }
        });

        return NextResponse.json({ product });
    } catch (error: any) {
        console.error("Create product error:", error);
        return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
    }
}
