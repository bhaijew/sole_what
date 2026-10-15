import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatPhoneNumberToWA } from "@/lib/store-service";
import { ChatService } from "@/modules/whatsapp/chat.service";
import { normalizeJid } from "@/lib/jid-utils";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            storeId,
            customerName,
            customerPhone,
            discount,
            paymentMethod,
            items
        } = body;

        if (!storeId) {
            return NextResponse.json({ success: false, error: "Store ID is required" }, { status: 400 });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ success: false, error: "POS Bill mein kam az kam aik item hona zaroori hai." }, { status: 400 });
        }

        const store = await prisma.store.findUnique({
            where: { id: storeId },
            include: { session: true }
        });

        if (!store) {
            return NextResponse.json({ success: false, error: "Store nahi mila" }, { status: 404 });
        }

        // Fetch products
        const productIds = items.map((i: any) => i.productId);
        const dbProducts = await prisma.product.findMany({
            where: { id: { in: productIds }, storeId: store.id }
        });

        const productMap = new Map(dbProducts.map(p => [p.id, p]));
        let subtotal = 0;
        const orderItemsData: any[] = [];
        const itemsSnapshot: any[] = [];

        for (const it of items) {
            const prod = productMap.get(it.productId);
            if (!prod) continue;
            const qty = Math.max(1, Math.floor(it.quantity || 1));
            const unitPrice = prod.price;
            const lineTotal = unitPrice * qty;
            subtotal += lineTotal;

            orderItemsData.push({
                productId: prod.id,
                productName: prod.name,
                unitPrice: unitPrice,
                quantity: qty,
                totalPrice: lineTotal,
                productImage: prod.image || null
            });

            itemsSnapshot.push({
                productId: prod.id,
                name: prod.name,
                unitPrice: unitPrice,
                quantity: qty,
                total: lineTotal
            });
        }

        const discountAmount = Math.max(0, Number(discount) || 0);
        const total = Math.max(0, subtotal - discountAmount);

        // Generate POS Order Number
        const orderCount = await prisma.order.count({ where: { storeId: store.id } });
        const orderNumber = `POS-${1001 + orderCount}`;

        const cleanName = (customerName || "Walk-in Counter Customer").trim();
        const rawPhone = (customerPhone || "03000000000").trim();
        const cleanPhone = formatPhoneNumberToWA(rawPhone);

        const order = await prisma.order.create({
            data: {
                storeId: store.id,
                orderNumber: orderNumber,
                customerName: cleanName,
                customerPhone: cleanPhone,
                customerAddress: `Shop Counter POS - ${store.city || "Pakistan"}`,
                customerCity: store.city || "Pakistan",
                customerNotes: "[Sale Type: Walk-In Counter POS]",
                subtotal: subtotal,
                deliveryFee: 0,
                discount: discountAmount,
                total: total,
                currency: store.currency || "PKR",
                paymentMethod: paymentMethod || "CASH",
                paymentStatus: "PAID",
                status: "DELIVERED",
                itemsSnapshot: itemsSnapshot,
                items: {
                    create: orderItemsData
                }
            },
            include: {
                items: true
            }
        });

        // Send WhatsApp Digital Receipt if valid phone was given
        if (store.sessionId && cleanPhone && cleanPhone !== "923000000000" && cleanPhone.length >= 10) {
            const customerJid = normalizeJid(`${cleanPhone}@s.whatsapp.net`);
            const itemsList = order.items.map((x, idx) => `${idx + 1}. *${x.productName}* (${x.quantity}x) = Rs. ${x.totalPrice.toLocaleString("en-PK")}`).join("\n");
            const posReceipt = `🧾 *DIGITAL CASH MEMO / RECEIPT* 🛍️
━━━━━━━━━━━━━━━━━━━━
🏪 *${store.name}*
📍 ${store.address || store.city || "Counter Sale"}
🔖 *Invoice #:* ${order.orderNumber}
🕒 *Tareekh:* ${new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}
👤 *Customer:* ${cleanName}

🛒 *Saman:*
━━━━━━━━━━━━━━━━━━━━
${itemsList}

━━━━━━━━━━━━━━━━━━━━
💵 *Subtotal:* ${store.currencySymbol} ${subtotal.toLocaleString("en-PK")}
${discountAmount > 0 ? `🎟️ *Discount:* -${store.currencySymbol} ${discountAmount.toLocaleString("en-PK")}\n` : ""}💰 *TOTAL PAID:* *${store.currencySymbol} ${total.toLocaleString("en-PK")}*
💳 *Payment Mode:* ${paymentMethod || "CASH"}
━━━━━━━━━━━━━━━━━━━━
Shukriya hamari dukaan par aane ka! Wapis zaroor aayiye ga! 😊`;

            try {
                await ChatService.sendTextMessage(store.sessionId, customerJid, posReceipt);
                await prisma.order.update({
                    where: { id: order.id },
                    data: { customerNotified: true }
                });
            } catch (err: any) {
                console.warn("POS WhatsApp receipt send error:", err.message);
            }
        }

        return NextResponse.json({
            success: true,
            order: order,
            message: "POS Counter sale complete ho gayi hai!"
        });
    } catch (error: any) {
        console.error("POS Sale Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "POS Checkout failed" },
            { status: 500 }
        );
    }
}
