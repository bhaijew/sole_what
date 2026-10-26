import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, canAccessSession } from "@/lib/api-auth";
import { verifyPizzaShop, parseShopIdFromCode } from "@/lib/pizza-supabase";

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
            select: { id: true, config: true }
        });

        if (!session) {
            return NextResponse.json({ status: false, message: "Session not found" }, { status: 404 });
        }

        const config = (session.config as any) || {};
        const pizzaIntegration = config.pizzaIntegration || {
            enabled: false,
            shopId: null,
            shopName: null,
            shopSlug: null,
            code: ""
        };

        return NextResponse.json({
            status: true,
            data: pizzaIntegration
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
            select: { id: true, config: true }
        });

        if (!session) {
            return NextResponse.json({ status: false, message: "Session not found" }, { status: 404 });
        }

        const body = await request.json();
        const { action, code, enabled } = body;
        const currentConfig = (session.config as any) || {};

        if (action === "verify") {
            if (!code) {
                return NextResponse.json({ status: false, message: "Please enter an integration code" }, { status: 400 });
            }

            const verification = await verifyPizzaShop(code);
            if (!verification.valid || !verification.shop) {
                return NextResponse.json({ status: false, message: verification.error || "Invalid Shop Code" }, { status: 400 });
            }

            return NextResponse.json({
                status: true,
                message: `Shop verified: ${verification.shop.name}`,
                shop: verification.shop
            });
        }

        if (action === "connect") {
            if (!code) {
                return NextResponse.json({ status: false, message: "Please enter an integration code" }, { status: 400 });
            }

            const verification = await verifyPizzaShop(code);
            if (!verification.valid || !verification.shop) {
                return NextResponse.json({ status: false, message: verification.error || "Invalid Shop Code" }, { status: 400 });
            }

            const updatedConfig = {
                ...currentConfig,
                pizzaIntegration: {
                    enabled: true,
                    shopId: verification.shop.id,
                    shopName: verification.shop.name,
                    shopSlug: verification.shop.slug,
                    phone: verification.shop.phone,
                    code: code.trim(),
                    totalProducts: verification.shop.totalProducts,
                    totalDeals: verification.shop.totalDeals,
                    connectedAt: new Date().toISOString()
                }
            };

            await prisma.session.update({
                where: { id: session.id },
                data: { config: updatedConfig }
            });

            return NextResponse.json({
                status: true,
                message: `Successfully connected to ${verification.shop.name}!`,
                data: updatedConfig.pizzaIntegration
            });
        }

        if (action === "toggle") {
            const currentPizza = currentConfig.pizzaIntegration || {};
            const isEnabled = typeof enabled === "boolean" ? enabled : !currentPizza.enabled;

            const updatedConfig = {
                ...currentConfig,
                pizzaIntegration: {
                    ...currentPizza,
                    enabled: isEnabled
                }
            };

            await prisma.session.update({
                where: { id: session.id },
                data: { config: updatedConfig }
            });

            return NextResponse.json({
                status: true,
                message: isEnabled ? "Pizza Database Sync ENABLED" : "Pizza Database Sync DISABLED",
                data: updatedConfig.pizzaIntegration
            });
        }

        if (action === "disconnect") {
            const updatedConfig = {
                ...currentConfig,
                pizzaIntegration: {
                    enabled: false,
                    shopId: null,
                    shopName: null,
                    shopSlug: null,
                    code: ""
                }
            };

            await prisma.session.update({
                where: { id: session.id },
                data: { config: updatedConfig }
            });

            return NextResponse.json({
                status: true,
                message: "Disconnected from Pizza Management System",
                data: updatedConfig.pizzaIntegration
            });
        }

        return NextResponse.json({ status: false, message: "Invalid action" }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ status: false, message: e.message }, { status: 500 });
    }
}
