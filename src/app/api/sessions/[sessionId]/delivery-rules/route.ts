import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, canAccessSession } from "@/lib/api-auth";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
        }

        const { sessionId } = await params;
        const hasAccess = await canAccessSession(user.id, user.role, sessionId);
        if (!hasAccess) {
            return NextResponse.json({ status: false, message: "Forbidden" }, { status: 403 });
        }

        const session = await prisma.session.findFirst({
            where: { OR: [{ sessionId }, { id: sessionId }] },
            select: { id: true, sessionId: true, config: true, userId: true }
        });

        if (!session) {
            return NextResponse.json({ status: false, message: "Session not found" }, { status: 404 });
        }

        const config = (session.config as any) || {};
        let deliveryRules = config.deliveryRules;

        // Fallback to store if not set
        if (!deliveryRules) {
            const store = await prisma.store.findFirst({
                where: { OR: [{ sessionId: session.id }, { sessionId: session.sessionId }, { userId: session.userId }] },
                select: { minOrderAmount: true, deliveryFee: true, freeDeliveryAbove: true }
            });

            deliveryRules = {
                enabled: Boolean(store?.minOrderAmount && store.minOrderAmount > 0),
                minOrderAmount: store?.minOrderAmount || 0,
                freeDeliveryRadiusKm: 5,
                deliveryFeeBeyond: store?.deliveryFee || 100
            };
        }

        return NextResponse.json({
            status: true,
            data: deliveryRules
        });
    } catch (e: any) {
        return NextResponse.json({ status: false, message: e.message }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
        }

        const { sessionId } = await params;
        const hasAccess = await canAccessSession(user.id, user.role, sessionId);
        if (!hasAccess) {
            return NextResponse.json({ status: false, message: "Forbidden" }, { status: 403 });
        }

        const session = await prisma.session.findFirst({
            where: { OR: [{ sessionId }, { id: sessionId }] },
            select: { id: true, sessionId: true, config: true, userId: true }
        });

        if (!session) {
            return NextResponse.json({ status: false, message: "Session not found" }, { status: 404 });
        }

        const body = await request.json();
        const {
            enabled = true,
            minOrderAmount = 0,
            freeDeliveryRadiusKm = 0,
            deliveryFeeBeyond = 0
        } = body;

        const currentConfig = (session.config as any) || {};
        const updatedDeliveryRules = {
            enabled: Boolean(enabled),
            minOrderAmount: Math.max(0, Number(minOrderAmount) || 0),
            freeDeliveryRadiusKm: Math.max(0, Number(freeDeliveryRadiusKm) || 0),
            deliveryFeeBeyond: Math.max(0, Number(deliveryFeeBeyond) || 0),
            updatedAt: new Date().toISOString()
        };

        const updatedConfig = {
            ...currentConfig,
            deliveryRules: updatedDeliveryRules
        };

        await prisma.session.update({
            where: { id: session.id },
            data: { config: updatedConfig }
        });

        // Also sync minOrderAmount and deliveryFee to any linked Store
        try {
            await prisma.store.updateMany({
                where: {
                    OR: [
                        { sessionId: session.id },
                        { sessionId: session.sessionId }
                    ]
                },
                data: {
                    minOrderAmount: updatedDeliveryRules.minOrderAmount,
                    deliveryFee: updatedDeliveryRules.deliveryFeeBeyond
                }
            });
        } catch (_) {}

        return NextResponse.json({
            status: true,
            message: "Delivery and Minimum Order rules updated successfully!",
            data: updatedDeliveryRules
        });
    } catch (e: any) {
        return NextResponse.json({ status: false, message: e.message }, { status: 500 });
    }
}

