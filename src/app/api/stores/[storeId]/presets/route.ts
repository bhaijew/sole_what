import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { PRESET_CATALOG_PRODUCTS, PRESET_HERO_BANNERS } from "@/lib/catalog-presets";

export const dynamic = "force-dynamic";

interface RouteParams {
    params: Promise<{ storeId: string }>;
}

// GET: Returns list of preset banners and product templates for easy picking
export async function GET(request: NextRequest, { params }: RouteParams) {
    return NextResponse.json({
        banners: PRESET_HERO_BANNERS,
        products: PRESET_CATALOG_PRODUCTS
    });
}

// POST: 1-Click auto-populate store with preset categories and products
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { storeId } = await params;

        const store = await prisma.store.findFirst({
            where: user.role === "SUPERADMIN" ? { id: storeId } : { id: storeId, userId: user.id }
        });

        if (!store) {
            return NextResponse.json({ error: "Store not found or unauthorized" }, { status: 404 });
        }

        // 1. Group preset items by category
        const categoryNames = Array.from(new Set(PRESET_CATALOG_PRODUCTS.map(p => p.category)));

        const categoryMap = new Map<string, string>();

        for (const catName of categoryNames) {
            const catSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
            const existingCat = await prisma.category.findFirst({
                where: { storeId: store.id, slug: catSlug }
            });

            if (existingCat) {
                categoryMap.set(catName, existingCat.id);
            } else {
                const newCat = await prisma.category.create({
                    data: {
                        storeId: store.id,
                        name: catName,
                        slug: catSlug,
                        icon: catName.includes("Dairy") ? "🥛" : catName.includes("Ration") ? "🍚" : catName.includes("Drinks") ? "🥤" : "🍿"
                    }
                });
                categoryMap.set(catName, newCat.id);
            }
        }

        // 2. Insert preset products
        let addedCount = 0;
        for (const preset of PRESET_CATALOG_PRODUCTS) {
            const baseSlug = preset.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
            const uniqueSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

            const categoryId = categoryMap.get(preset.category) || null;

            await prisma.product.create({
                data: {
                    storeId: store.id,
                    name: preset.name,
                    slug: uniqueSlug,
                    price: preset.price,
                    compareAtPrice: preset.compareAtPrice || null,
                    unit: preset.unit,
                    description: preset.description,
                    image: preset.image,
                    categoryId: categoryId,
                    inStock: true
                }
            });
            addedCount++;
        }

        return NextResponse.json({
            success: true,
            message: `${addedCount} preset products and categories successfully added to store!`,
            addedCount
        });
    } catch (error: any) {
        console.error("Preset import error:", error);
        return NextResponse.json({ error: error.message || "Failed to import presets" }, { status: 500 });
    }
}
