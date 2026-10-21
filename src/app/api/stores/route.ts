import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

// GET: Fetch all stores for the authenticated user
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const stores = await prisma.store.findMany({
            where: user.role === "SUPERADMIN" ? {} : { userId: user.id },
            include: {
                _count: {
                    select: {
                        products: true,
                        orders: true,
                        categories: true
                    }
                },
                session: {
                    select: {
                        id: true,
                        sessionId: true,
                        name: true,
                        status: true,
                        aiConfig: {
                            select: {
                                aiRequestsCount: true,
                                enabled: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json({ stores });
    } catch (error: any) {
        console.error("Get stores error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch stores" }, { status: 500 });
    }
}

// POST: Create a new Store
export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            name,
            slug,
            tagline,
            description,
            phone,
            address,
            city,
            deliveryFee,
            minOrderAmount,
            freeDeliveryAbove,
            noticeMessage,
            sessionId,
            customDomain
        } = body;

        if (!name || !name.trim()) {
            return NextResponse.json({ error: "Store name is required" }, { status: 400 });
        }

        // Generate or clean slug
        const cleanSlug = (slug || name)
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

        // Check if slug already exists
        const existingSlug = await prisma.store.findUnique({
            where: { slug: cleanSlug }
        });

        if (existingSlug) {
            return NextResponse.json({ error: `Store URL slug "${cleanSlug}" pehle se mojood hai. Mukhtalif slug chunain.` }, { status: 400 });
        }

        // Clean custom domain if provided
        let cleanDomain: string | undefined = undefined;
        if (customDomain && customDomain.trim()) {
            cleanDomain = customDomain.trim().toLowerCase().replace(/^(https?:\/\/)/, "").split("/")[0].split(":")[0];
            const existingDomain = await prisma.store.findUnique({
                where: { customDomain: cleanDomain }
            });
            if (existingDomain) {
                return NextResponse.json({ error: `Domain "${cleanDomain}" already in use.` }, { status: 400 });
            }
        }

        const store = await prisma.store.create({
            data: {
                userId: user.id,
                name: name.trim(),
                slug: cleanSlug,
                tagline: tagline?.trim() || null,
                description: description?.trim() || null,
                phone: phone?.trim() || "",
                address: address?.trim() || null,
                city: city?.trim() || "Lahore",
                deliveryFee: Number(deliveryFee) || 0,
                minOrderAmount: Number(minOrderAmount) || 0,
                freeDeliveryAbove: freeDeliveryAbove ? Number(freeDeliveryAbove) : null,
                estimatedDeliveryTime: body.estimatedDeliveryTime?.trim() || "30-45 mins",
                openingHours: body.openingHours?.trim() || "9:00 AM - 11:00 PM",
                noticeMessage: noticeMessage?.trim() || null,
                sessionId: sessionId || null,
                customDomain: cleanDomain
            }
        });

        return NextResponse.json({ store });
    } catch (error: any) {
        console.error("Create store error:", error);
        return NextResponse.json({ error: error.message || "Failed to create store" }, { status: 500 });
    }
}
