import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

interface RouteParams {
    params: Promise<{ storeId: string }>;
}

// GET: Store details with counts
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { storeId } = await params;

        const store = await prisma.store.findFirst({
            where: user.role === "SUPERADMIN" ? { id: storeId } : { id: storeId, userId: user.id },
            include: {
                categories: { orderBy: { order: "asc" } },
                products: { orderBy: { createdAt: "desc" } },
                _count: { select: { orders: true } },
                session: { select: { id: true, sessionId: true, name: true, status: true } }
            }
        });

        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        return NextResponse.json({ store });
    } catch (error: any) {
        console.error("Get store error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch store" }, { status: 500 });
    }
}

// PATCH: Update store settings (name, slug, customDomain, fees, isOpen, etc.)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { storeId } = await params;
        const body = await request.json();

        // Verify store ownership
        const existingStore = await prisma.store.findFirst({
            where: user.role === "SUPERADMIN" ? { id: storeId } : { id: storeId, userId: user.id }
        });

        if (!existingStore) {
            return NextResponse.json({ error: "Store not found or unauthorized" }, { status: 404 });
        }

        const updateData: any = {};

        if (body.name !== undefined) updateData.name = body.name.trim();
        if (body.tagline !== undefined) updateData.tagline = body.tagline?.trim() || null;
        if (body.description !== undefined) updateData.description = body.description?.trim() || null;
        if (body.phone !== undefined) updateData.phone = body.phone.trim();
        if (body.address !== undefined) updateData.address = body.address?.trim() || null;
        if (body.city !== undefined) updateData.city = body.city?.trim() || null;
        if (body.deliveryFee !== undefined) updateData.deliveryFee = Number(body.deliveryFee);
        if (body.minOrderAmount !== undefined) updateData.minOrderAmount = Number(body.minOrderAmount);
        if (body.freeDeliveryAbove !== undefined) {
            updateData.freeDeliveryAbove = body.freeDeliveryAbove ? Number(body.freeDeliveryAbove) : null;
        }
        if (body.noticeMessage !== undefined) updateData.noticeMessage = body.noticeMessage?.trim() || null;
        if (body.estimatedDeliveryTime !== undefined) updateData.estimatedDeliveryTime = body.estimatedDeliveryTime?.trim() || null;
        if (body.openingHours !== undefined) updateData.openingHours = body.openingHours?.trim() || null;
        if (body.isOpen !== undefined) updateData.isOpen = Boolean(body.isOpen);
        if (body.autoNotifyOwner !== undefined) updateData.autoNotifyOwner = Boolean(body.autoNotifyOwner);
        if (body.autoNotifyCustomer !== undefined) updateData.autoNotifyCustomer = Boolean(body.autoNotifyCustomer);
        if (body.sessionId !== undefined) updateData.sessionId = body.sessionId || null;
        if (body.logoUrl !== undefined) updateData.logoUrl = body.logoUrl || null;

        // Custom domain update
        if (body.customDomain !== undefined) {
            if (!body.customDomain || !body.customDomain.trim()) {
                updateData.customDomain = null;
                updateData.domainVerified = false;
                updateData.domainStatus = "INACTIVE";
            } else {
                const cleanDomain = body.customDomain.trim().toLowerCase().replace(/^(https?:\/\/)/, "").split("/")[0].split(":")[0];
                // Check uniqueness if changed
                if (cleanDomain !== existingStore.customDomain) {
                    const domainExists = await prisma.store.findFirst({
                        where: { customDomain: cleanDomain, id: { not: storeId } }
                    });
                    if (domainExists) {
                        return NextResponse.json({ error: `Domain "${cleanDomain}" already assigned to another store.` }, { status: 400 });
                    }
                    updateData.customDomain = cleanDomain;
                    updateData.domainVerified = false;
                    updateData.domainStatus = "PENDING";
                }
            }
        }

        const updatedStore = await prisma.store.update({
            where: { id: storeId },
            data: updateData
        });

        return NextResponse.json({ store: updatedStore });
    } catch (error: any) {
        console.error("Update store error:", error);
        return NextResponse.json({ error: error.message || "Failed to update store" }, { status: 500 });
    }
}

// DELETE: Delete store
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

        await prisma.store.delete({
            where: { id: storeId }
        });

        return NextResponse.json({ success: true, message: "Store deleted successfully" });
    } catch (error: any) {
        console.error("Delete store error:", error);
        return NextResponse.json({ error: error.message || "Failed to delete store" }, { status: 500 });
    }
}
