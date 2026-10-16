import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, isAdmin } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

// GET: Fetch all store users for SUPERADMIN
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user || !isAdmin(user.role)) {
            return NextResponse.json({ error: "Unauthorized. SuperAdmin privileges required." }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search")?.trim().toLowerCase() || "";
        const status = searchParams.get("status") || "all";
        const city = searchParams.get("city") || "all";

        // Query all stores with user and relation counts
        const stores = await prisma.store.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true,
                    }
                },
                session: {
                    select: {
                        id: true,
                        sessionId: true,
                        name: true,
                        status: true
                    }
                },
                _count: {
                    select: {
                        products: true,
                        orders: true,
                        categories: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        // Calculate platform aggregate stats
        let totalProducts = 0;
        let totalOrders = 0;
        let activeStoresCount = 0;
        let inactiveStoresCount = 0;

        stores.forEach(s => {
            totalProducts += s._count?.products || 0;
            totalOrders += s._count?.orders || 0;
            if (s.isActive) {
                activeStoresCount++;
            } else {
                inactiveStoresCount++;
            }
        });

        // Filter stores by search, status, and city
        let filteredStores = stores;

        if (status === "active") {
            filteredStores = filteredStores.filter(s => s.isActive === true);
        } else if (status === "inactive" || status === "banned") {
            filteredStores = filteredStores.filter(s => s.isActive === false);
        } else if (status === "open") {
            filteredStores = filteredStores.filter(s => s.isOpen === true && s.isActive === true);
        } else if (status === "closed") {
            filteredStores = filteredStores.filter(s => s.isOpen === false || s.isActive === false);
        } else if (status === "pending_approval") {
            filteredStores = filteredStores.filter(s => s.subscriptionStatus === "PENDING_APPROVAL");
        } else if (status === "expired") {
            filteredStores = filteredStores.filter(s => s.subscriptionStatus === "EXPIRED");
        }

        if (city !== "all") {
            filteredStores = filteredStores.filter(s => (s.city || "").toLowerCase().includes(city.toLowerCase()));
        }

        if (search) {
            filteredStores = filteredStores.filter(s =>
                s.name.toLowerCase().includes(search) ||
                s.slug.toLowerCase().includes(search) ||
                (s.phone && s.phone.toLowerCase().includes(search)) ||
                (s.city && s.city.toLowerCase().includes(search)) ||
                (s.user?.name && s.user.name.toLowerCase().includes(search)) ||
                (s.user?.email && s.user.email.toLowerCase().includes(search))
            );
        }

        return NextResponse.json({
            success: true,
            stores: filteredStores,
            stats: {
                totalStores: stores.length,
                activeStores: activeStoresCount,
                inactiveStores: inactiveStoresCount,
                totalProducts,
                totalOrders
            }
        });
    } catch (error: any) {
        console.error("Admin get store users error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch store users" }, { status: 500 });
    }
}

// PATCH: Ban/Unban, Activate/Deactivate, or update store details
export async function PATCH(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user || !isAdmin(user.role)) {
            return NextResponse.json({ error: "Unauthorized. SuperAdmin privileges required." }, { status: 403 });
        }

        const body = await request.json();
        const { 
            storeId, 
            isActive, 
            isOpen, 
            name, 
            phone, 
            city, 
            address, 
            tagline, 
            noticeMessage,
            action,
            subscriptionStatus,
            subscriptionExpiresAt,
            subscriptionPlan,
            subscriptionNotes
        } = body;

        if (!storeId) {
            return NextResponse.json({ error: "storeId is required" }, { status: 400 });
        }

        const existingStore = await prisma.store.findUnique({
            where: { id: storeId }
        });

        if (!existingStore) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        const updateData: any = {};
        if (isActive !== undefined) updateData.isActive = Boolean(isActive);
        if (isOpen !== undefined) updateData.isOpen = Boolean(isOpen);
        if (name !== undefined) updateData.name = name.trim();
        if (phone !== undefined) updateData.phone = phone.trim();
        if (city !== undefined) updateData.city = city.trim();
        if (address !== undefined) updateData.address = address.trim();
        if (tagline !== undefined) updateData.tagline = tagline?.trim() || null;
        if (noticeMessage !== undefined) updateData.noticeMessage = noticeMessage?.trim() || null;

        // Subscription management actions
        if (action === "approve_month") {
            const now = new Date();
            const currentExpiry = existingStore.subscriptionExpiresAt && new Date(existingStore.subscriptionExpiresAt) > now
                ? new Date(existingStore.subscriptionExpiresAt)
                : now;
            updateData.subscriptionStatus = "ACTIVE";
            updateData.subscriptionExpiresAt = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
        } else if (action === "extend_3_months") {
            const now = new Date();
            const currentExpiry = existingStore.subscriptionExpiresAt && new Date(existingStore.subscriptionExpiresAt) > now
                ? new Date(existingStore.subscriptionExpiresAt)
                : now;
            updateData.subscriptionStatus = "ACTIVE";
            updateData.subscriptionExpiresAt = new Date(currentExpiry.getTime() + 90 * 24 * 60 * 60 * 1000);
        } else if (action === "grant_lifetime") {
            updateData.subscriptionStatus = "LIFETIME";
            updateData.subscriptionExpiresAt = new Date("2099-12-31T23:59:59.000Z");
        } else if (action === "lock_expired") {
            updateData.subscriptionStatus = "EXPIRED";
            updateData.subscriptionExpiresAt = new Date();
        } else if (action === "reset_trial") {
            updateData.subscriptionStatus = "TRIAL";
            updateData.subscriptionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }

        if (subscriptionStatus !== undefined && !action) updateData.subscriptionStatus = subscriptionStatus;
        if (subscriptionExpiresAt !== undefined && !action) updateData.subscriptionExpiresAt = subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null;
        if (subscriptionPlan !== undefined) updateData.subscriptionPlan = subscriptionPlan;
        if (subscriptionNotes !== undefined) updateData.subscriptionNotes = subscriptionNotes;

        const updated = await prisma.store.update({
            where: { id: storeId },
            data: updateData,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    }
                },
                _count: {
                    select: {
                        products: true,
                        orders: true,
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: `Store ${updated.isActive ? "activated" : "banned / deactivated"} successfully.`,
            store: updated
        });
    } catch (error: any) {
        console.error("Admin update store user error:", error);
        return NextResponse.json({ error: error.message || "Failed to update store" }, { status: 500 });
    }
}

// DELETE: Permanently delete a store
export async function DELETE(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user || !isAdmin(user.role)) {
            return NextResponse.json({ error: "Unauthorized. SuperAdmin privileges required." }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get("storeId");

        if (!storeId) {
            return NextResponse.json({ error: "storeId parameter is required" }, { status: 400 });
        }

        await prisma.store.delete({
            where: { id: storeId }
        });

        return NextResponse.json({
            success: true,
            message: "Store deleted successfully."
        });
    } catch (error: any) {
        console.error("Admin delete store error:", error);
        return NextResponse.json({ error: error.message || "Failed to delete store" }, { status: 500 });
    }
}
