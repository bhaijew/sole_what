import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { ChatService } from "@/modules/whatsapp/chat.service";
import { normalizeJid } from "@/lib/jid-utils";
import { formatPhoneNumberToWA } from "@/lib/store-service";

export const dynamic = "force-dynamic";

interface RouteParams {
    params: Promise<{ storeId: string }>;
}

// GET: Fetch orders for store
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { storeId } = await params;
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");

        const whereClause: any = { storeId };
        if (status && status !== "ALL") {
            whereClause.status = status;
        }

        const orders = await prisma.order.findMany({
            where: whereClause,
            include: {
                items: true
            },
            orderBy: { createdAt: "desc" },
            take: 100
        });

        return NextResponse.json({ orders });
    } catch (error: any) {
        console.error("Get orders error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch orders" }, { status: 500 });
    }
}

// PATCH: Update order status (and optionally notify customer on WhatsApp)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { storeId } = await params;
        const body = await request.json();
        const { orderId, status, paymentStatus, notifyCustomer } = body;

        if (!orderId || !status) {
            return NextResponse.json({ error: "Order ID and new status are required" }, { status: 400 });
        }

        // Verify store ownership
        const store = await prisma.store.findFirst({
            where: user.role === "SUPERADMIN" ? { id: storeId } : { id: storeId, userId: user.id },
            include: { session: true }
        });

        if (!store) {
            return NextResponse.json({ error: "Store not found or unauthorized" }, { status: 404 });
        }

        const existingOrder = await prisma.order.findFirst({
            where: { id: orderId, storeId }
        });

        if (!existingOrder) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Prevent duplicate notifications if order is already in this status
        if (existingOrder.status === status && (!paymentStatus || existingOrder.paymentStatus === paymentStatus)) {
            return NextResponse.json({ order: existingOrder, alreadyUpdated: true });
        }

        const updateData: any = { status };
        if (paymentStatus) {
            updateData.paymentStatus = paymentStatus;
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: updateData,
            include: { items: true }
        });

        // Trigger WhatsApp Notification to Customer if requested
        if (notifyCustomer && existingOrder.customerPhone) {
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

            if (activeSessionId) {
                let statusMessage = "";
                const cleanPhone = formatPhoneNumberToWA(existingOrder.customerPhone);
                const customerJid = normalizeJid(`${cleanPhone}@s.whatsapp.net`);

                if (status === "CONFIRMED") {
                    statusMessage = `✅ *Order Confirmed!*
Assalam o Alaikum *${existingOrder.customerName}*!
Aapka order #${existingOrder.orderNumber} confirm ho gaya hai aur tayari shuru ho chuki hai.
🏪 *${store.name}*`;
                } else if (status === "OUT_FOR_DELIVERY") {
                    statusMessage = `🛵 *Order Raste Mein Hai (Out for Delivery)!*
Assalam o Alaikum *${existingOrder.customerName}*!
Aapka order #${existingOrder.orderNumber} dukaan se nikal chuka hai aur rider jald aapke address par pohanch raha hai.
📍 Address: ${existingOrder.customerAddress}
💵 Baraye meherbani *${store.currencySymbol || "Rs."} ${existingOrder.total}* tayar rakhein.
🏪 *${store.name}*`;
                } else if (status === "DELIVERED") {
                    statusMessage = `🎉 *Order Delivered!*
Aapka order #${existingOrder.orderNumber} kamiyabi se deliver ho chuka hai.
*${store.name}* se shopping karne ka bohot shukriya! Apka din acha guzray! ⭐`;
                } else if (status === "CANCELLED") {
                    statusMessage = `❌ *Order Cancelled*
Aapka order #${existingOrder.orderNumber} cancel kar diya gaya hai. Agar koi sawal ho to humse rabta karein.
🏪 *${store.name}*`;
                }

                if (statusMessage) {
                    try {
                        await ChatService.sendTextMessage(activeSessionId, customerJid, statusMessage);
                    } catch (waErr: any) {
                        console.error("Failed to send WhatsApp status update to customer:", waErr.message);
                    }
                }
            }
        }

        // Emit real-time order update event to Store Dashboard
        try {
            const io = (global as any).io;
            if (io) {
                io.to(`store:${storeId}`).emit("store:order_updated", {
                    storeId,
                    order: updatedOrder
                });
            }
        } catch (socketErr) {}

        return NextResponse.json({ order: updatedOrder });
    } catch (error: any) {
        console.error("Update order error:", error);
        return NextResponse.json({ error: error.message || "Failed to update order" }, { status: 500 });
    }
}
