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
                enabled: true,
                freeDeliveryMinOrder: store?.freeDeliveryAbove || store?.minOrderAmount || 700,
                freeDeliveryRadiusKm: 5,
                standardDeliveryFee: store?.deliveryFee || 100,
                deliveryFeeBeyond: 150,
                minOrderAmount: store?.freeDeliveryAbove || store?.minOrderAmount || 700
            };
        } else {
            // Ensure fields are normalized
            deliveryRules = {
                enabled: deliveryRules.enabled !== undefined ? Boolean(deliveryRules.enabled) : true,
                freeDeliveryMinOrder: Math.max(0, Number(deliveryRules.freeDeliveryMinOrder || deliveryRules.minOrderAmount) || 700),
                freeDeliveryRadiusKm: Math.max(0, Number(deliveryRules.freeDeliveryRadiusKm) || 5),
                standardDeliveryFee: Math.max(0, Number(deliveryRules.standardDeliveryFee) || 100),
                deliveryFeeBeyond: Math.max(0, Number(deliveryRules.deliveryFeeBeyond) || 150),
                minOrderAmount: Math.max(0, Number(deliveryRules.freeDeliveryMinOrder || deliveryRules.minOrderAmount) || 700)
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
            freeDeliveryMinOrder,
            minOrderAmount,
            freeDeliveryRadiusKm = 5,
            standardDeliveryFee = 100,
            deliveryFeeBeyond = 150
        } = body;

        const effectiveFreeMin = Math.max(0, Number(freeDeliveryMinOrder ?? minOrderAmount) || 700);
        const effectiveKm = Math.max(0, Number(freeDeliveryRadiusKm) || 5);
        const effectiveStandardFee = Math.max(0, Number(standardDeliveryFee) || 100);
        const effectiveBeyondFee = Math.max(0, Number(deliveryFeeBeyond) || 150);

        const currentConfig = (session.config as any) || {};
        const updatedDeliveryRules = {
            enabled: Boolean(enabled),
            freeDeliveryMinOrder: effectiveFreeMin,
            minOrderAmount: effectiveFreeMin,
            freeDeliveryRadiusKm: effectiveKm,
            standardDeliveryFee: effectiveStandardFee,
            deliveryFeeBeyond: effectiveBeyondFee,
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

        // Also sync freeDeliveryAbove and deliveryFee to any linked Store
        try {
            await prisma.store.updateMany({
                where: {
                    OR: [
                        { sessionId: session.id },
                        { sessionId: session.sessionId }
                    ]
                },
                data: {
                    freeDeliveryAbove: effectiveFreeMin,
                    deliveryFee: effectiveStandardFee
                }
            });
        } catch (_) {}

        return NextResponse.json({
            status: true,
            message: "Delivery and Free Delivery rules updated successfully!",
            data: updatedDeliveryRules
        });
    } catch (e: any) {
        return NextResponse.json({ status: false, message: e.message }, { status: 500 });
    }
}
