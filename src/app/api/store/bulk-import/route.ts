import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { storeId, products } = body;

        if (!storeId) {
            return NextResponse.json({ success: false, error: "Store ID is required" }, { status: 400 });
        }

        if (!Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ success: false, error: "Baraye meherbani kam az kam aik product data shamil karein." }, { status: 400 });
        }

        const store = await prisma.store.findUnique({
            where: { id: storeId }
        });

        if (!store) {
            return NextResponse.json({ success: false, error: "Store nahi mila." }, { status: 404 });
        }

        let importedCount = 0;
        const categoryCache = new Map<string, string>();

        // Preload store categories
        const existingCategories = await prisma.category.findMany({
            where: { storeId: store.id }
        });
        existingCategories.forEach(c => categoryCache.set(c.name.trim().toLowerCase(), c.id));

        for (const raw of products) {
            const name = (raw.name || "").trim();
            const price = parseFloat(raw.price);

            if (!name || isNaN(price) || price < 0) continue;

            const categoryName = (raw.categoryName || raw.category || "").trim();
            let categoryId: string | null = null;

            if (categoryName) {
                const catKey = categoryName.toLowerCase();
                if (categoryCache.has(catKey)) {
                    categoryId = categoryCache.get(catKey)!;
                } else {
                    const catSlug = catKey.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `cat-${Date.now()}`;
                    const newCat = await prisma.category.create({
                        data: {
                            storeId: store.id,
                            name: categoryName,
                            slug: `${catSlug}-${Math.floor(Math.random() * 1000)}`
                        }
                    });
                    categoryId = newCat.id;
                    categoryCache.set(catKey, categoryId);
                }
            }

            const baseSlug = name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "") || "item";
            const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-5)}-${Math.floor(Math.random() * 900 + 100)}`;

            const compareAtPrice = raw.compareAtPrice ? parseFloat(raw.compareAtPrice) : null;
            const inStock = raw.inStock === undefined || raw.inStock === null ? true : (raw.inStock === true || String(raw.inStock).toLowerCase() === "true" || String(raw.inStock) === "1");

            await prisma.product.create({
                data: {
                    storeId: store.id,
                    categoryId: categoryId,
                    name: name,
                    slug: uniqueSlug,
                    price: price,
                    compareAtPrice: isNaN(compareAtPrice as any) ? null : compareAtPrice,
                    unit: (raw.unit || "item").trim(),
                    image: (raw.image || raw.imageUrl || "").trim() || null,
                    description: (raw.description || "").trim() || null,
                    inStock: inStock
                }
            });

            importedCount++;
        }

        return NextResponse.json({
            success: true,
            count: importedCount,
            message: `${importedCount} products kamiyabi se dukaan mein import ho gaye hain!`
        });
    } catch (error: any) {
        console.error("Bulk Import Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Bulk import fail ho gaya." },
            { status: 500 }
        );
    }
}
