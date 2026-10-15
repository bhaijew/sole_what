import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { ChatService } from "@/modules/whatsapp/chat.service";
import { normalizeJid } from "@/lib/jid-utils";
import { formatPhoneNumberToWA, formatOrderWhatsAppReceipt } from "@/lib/store-service";

export const dynamic = "force-dynamic";

interface RouteParams {
    params: Promise<{ storeId: string }>;
}

// POST: Send order receipt to customer on WhatsApp
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { storeId } = await params;
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
        }

        // Verify store ownership
        const store = await prisma.store.findFirst({
            where: user.role === "SUPERADMIN" ? { id: storeId } : { id: storeId, userId: user.id },
            include: { session: true }
        });

        if (!store) {
            return NextResponse.json({ error: "Store not found or unauthorized" }, { status: 404 });
        }

        const order = await prisma.order.findFirst({
            where: { id: orderId, storeId },
            include: { items: true }
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const receiptMessage = formatOrderWhatsAppReceipt(order, store, "customer");
        const cleanPhone = formatPhoneNumberToWA(order.customerPhone);
        const waDirectLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(receiptMessage)}`;

        // Locate active Baileys WhatsApp Session
        let activeSessionId = store.session?.sessionId || store.sessionId;
        if (!activeSessionId) {
            const userSession = await prisma.session.findFirst({
                where: { userId: store.userId, status: "CONNECTED" },
                orderBy: { updatedAt: "desc" }
            });
            if (userSession) {
                activeSessionId = userSession.sessionId;
            }
        }

        if (activeSessionId && cleanPhone) {
            try {
                const customerJid = normalizeJid(`${cleanPhone}@s.whatsapp.net`);
                await ChatService.sendTextMessage(activeSessionId, customerJid, receiptMessage);
                await prisma.order.update({
                    where: { id: order.id },
                    data: { customerNotified: true }
                });
                return NextResponse.json({
                    success: true,
                    message: `Customer (+${cleanPhone}) ko digital receipt WhatsApp par send ho gayi! 📲`,
                    waLink: waDirectLink
                });
            } catch (sendErr: any) {
                console.error("Failed to send WhatsApp message via session:", sendErr.message);
                return NextResponse.json({
                    success: false,
                    error: `WhatsApp session send error: ${sendErr.message}`,
                    waLink: waDirectLink
                });
            }
        } else {
            return NextResponse.json({
                success: false,
                error: "Koi active WhatsApp session connected nahi hai.",
                waLink: waDirectLink
            });
        }
    } catch (error: any) {
        console.error("Receipt API error:", error);
        return NextResponse.json({ error: error.message || "Failed to process receipt" }, { status: 500 });
    }
}
