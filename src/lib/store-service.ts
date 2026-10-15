import { prisma } from "@/lib/prisma";
import { logger } from "./logger";
import { ChatService } from "@/modules/whatsapp/chat.service";
import { normalizeJid } from "@/lib/jid-utils";

export interface CreateOrderItemInput {
    productId: string;
    quantity: number;
}

export interface CreateOrderInput {
    storeId: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerCity?: string;
    customerNotes?: string;
    paymentMethod?: string; // "COD" | "JAZZCASH" | "EASYPAISA" | "BANK"
    discount?: number;
    couponCode?: string;
    transactionId?: string;
    paymentProofUrl?: string;
    items: CreateOrderItemInput[];
}

/**
 * Clean phone number to WhatsApp international format (e.g. 03001234567 -> 923001234567)
 */
export function formatPhoneNumberToWA(phone: string): string {
    if (!phone) return "";
    let clean = phone.replace(/[^\d]/g, "");
    if (clean.startsWith("00")) {
        clean = clean.substring(2);
    }
    if (clean.startsWith("0")) {
        clean = "92" + clean.substring(1);
    } else if (clean.length === 10 && clean.startsWith("3")) {
        clean = "92" + clean;
    }
    return clean;
}

/**
 * Get Store by Slug or Custom Domain
 */
export async function getStoreBySlugOrDomain(identifier: string) {
    const cleanId = identifier.trim().toLowerCase().replace(/^(https?:\/\/)/, "").split("/")[0].split(":")[0];

    const store = await prisma.store.findFirst({
        where: {
            OR: [
                { slug: cleanId },
                { customDomain: cleanId },
                { customDomain: `www.${cleanId}` },
                { customDomain: cleanId.replace(/^www\./, "") }
            ],
            isActive: true
        },
        include: {
            categories: {
                where: { isActive: true },
                orderBy: { order: "asc" }
            },
            products: {
                where: { isActive: true },
                orderBy: { order: "asc" }
            }
        }
    });

    return store;
}

/**
 * Format WhatsApp Receipt in natural, polite Roman Urdu
 */
export function formatOrderWhatsAppReceipt(order: any, store: any, recipientType: "owner" | "customer"): string {
    const dateFormatted = new Date(order.createdAt).toLocaleString("en-PK", {
        timeZone: "Asia/Karachi",
        dateStyle: "medium",
        timeStyle: "short"
    });

    const itemsText = order.items
        ?.map((item: any, idx: number) => {
            const price = Number(item.unitPrice).toLocaleString("en-PK");
            const total = Number(item.totalPrice).toLocaleString("en-PK");
            return `${idx + 1}. *${item.productName}*\n   ${item.quantity}x @ ${store.currencySymbol || "Rs."} ${price} = *${store.currencySymbol || "Rs."} ${total}*`;
        })
        .join("\n\n") || "";

    const subtotal = Number(order.subtotal).toLocaleString("en-PK");
    const delivery = Number(order.deliveryFee).toLocaleString("en-PK");
    const discount = Number(order.discount || 0).toLocaleString("en-PK");
    const total = Number(order.total).toLocaleString("en-PK");

    // Extract metadata snapshot if available
    const metadata = (order.itemsSnapshot && typeof order.itemsSnapshot === "object" && !Array.isArray(order.itemsSnapshot))
        ? (order.itemsSnapshot as any).metadata || {}
        : {};
    const couponCode = metadata.couponCode || null;
    const transactionId = metadata.transactionId || null;
    const paymentProofUrl = metadata.paymentProofUrl || null;

    if (recipientType === "owner") {
        return `🚨 *NAYA ORDER AAYA HAI!* 📦
━━━━━━━━━━━━━━━━━━━━
🏪 *Dukaan:* ${store.name}
🔖 *Order ID:* #${order.orderNumber}
🕒 *Waqt:* ${dateFormatted}

👤 *Customer Details:*
• *Naam:* ${order.customerName}
• *Phone:* +${order.customerPhone}
• *Pata (Address):* ${order.customerAddress}${order.customerCity ? `, ${order.customerCity}` : ""}
${order.customerNotes ? `• *Hidayat:* _"${order.customerNotes}"_\n` : ""}
🛒 *Items Ordered:*
━━━━━━━━━━━━━━━━━━━━
${itemsText}

━━━━━━━━━━━━━━━━━━━━
💵 *Bill Breakdown:*
• Subtotal: ${store.currencySymbol || "Rs."} ${subtotal}
${Number(order.discount) > 0 ? `• Discount: -${store.currencySymbol || "Rs."} ${discount}${couponCode ? ` (Promo: *${couponCode}*)` : ""}\n` : ""}• Delivery Fee: ${Number(order.deliveryFee) === 0 ? "*FREE*" : `${store.currencySymbol || "Rs."} ${delivery}`}
💰 *TOTAL BILL:* *${store.currencySymbol || "Rs."} ${total}*
💳 *Payment:* ${order.paymentMethod || "Cash on Delivery (COD)"}${transactionId ? ` (TID: *${transactionId}*)` : ""}${paymentProofUrl ? `\n📎 *Payment Proof:* ${paymentProofUrl}` : ""}
━━━━━━━━━━━━━━━━━━━━
Dashboard se order ko confirm ya dispatch karein!`;
    } else {
        return `🎉 *Shukriya ${order.customerName}!*
Aapka order kamiyabi se receive ho gaya hai.

🏪 *${store.name}*
🔖 *Order ID:* #${order.orderNumber}
🕒 *Tareekh:* ${dateFormatted}

🛒 *Aapka Saman:*
━━━━━━━━━━━━━━━━━━━━
${itemsText}

━━━━━━━━━━━━━━━━━━━━
${Number(order.discount) > 0 ? `💵 *Discount:* -${store.currencySymbol || "Rs."} ${discount}\n` : ""}💵 *Total Bill:* *${store.currencySymbol || "Rs."} ${total}*
📍 *Delivery Address:* ${order.customerAddress}
💳 *Tareeqa:* ${order.paymentMethod || "Cash on Delivery (COD)"}${transactionId ? ` (TID: ${transactionId})` : ""}
━━━━━━━━━━━━━━━━━━━━
Hamari team jald aapka order pack karke dispatch karegi. Agar koi sawal ho to isi chat par message karein!`;
    }
}

/**
 * Create Order from Public Storefront
 */
export async function createStoreOrder(input: CreateOrderInput) {
    const store = await prisma.store.findUnique({
        where: { id: input.storeId },
        include: { session: true }
    });

    if (!store) {
        throw new Error("Store not found");
    }

    if (!store.isActive || !store.isOpen) {
        throw new Error("Yeh dukaan is waqt orders accept nahi kar rahi hai.");
    }

    if (!input.items || input.items.length === 0) {
        throw new Error("Aapki cart khali hai. Kam az kam aik item select karein.");
    }

    // Fetch products from database to ensure genuine prices
    const productIds = input.items.map(i => i.productId);
    const dbProducts = await prisma.product.findMany({
        where: {
            id: { in: productIds },
            storeId: store.id,
            isActive: true
        }
    });

    if (dbProducts.length === 0) {
        throw new Error("Selected products dukaan par dastyab nahi hain.");
    }

    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    let subtotal = 0;
    const orderItemsData: any[] = [];
    const itemsSnapshot: any[] = [];

    for (const item of input.items) {
        const prod = productMap.get(item.productId);
        if (!prod) continue;
        const qty = Math.max(1, Math.floor(item.quantity));
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
            total: lineTotal,
            image: prod.image || null
        });
    }

    if (store.minOrderAmount > 0 && subtotal < store.minOrderAmount) {
        throw new Error(`Kam az kam order amount ${store.currencySymbol || "Rs."} ${store.minOrderAmount} hona zaroori hai.`);
    }

    // Calculate delivery fee
    let deliveryFee = store.deliveryFee;
    const isFreeShipCoupon = input.couponCode?.trim().toUpperCase() === "FREESHIP";
    if (isFreeShipCoupon || (store.freeDeliveryAbove && subtotal >= store.freeDeliveryAbove)) {
        deliveryFee = 0;
    }

    const discountAmount = Math.max(0, Number(input.discount) || 0);
    const total = Math.max(0, subtotal - discountAmount + deliveryFee);

    // Generate Human-friendly Order Number e.g. ORD-10023
    const orderCount = await prisma.order.count({ where: { storeId: store.id } });
    const orderNumber = `${store.orderPrefix || "ORD-"}${1001 + orderCount}`;

    const cleanCustomerPhone = formatPhoneNumberToWA(input.customerPhone);

    // Prevent rapid duplicate order submission within 5 seconds
    const recentDuplicate = await prisma.order.findFirst({
        where: {
            storeId: store.id,
            customerPhone: cleanCustomerPhone,
            total: total,
            createdAt: {
                gte: new Date(Date.now() - 5000)
            }
        },
        orderBy: { createdAt: "desc" }
    });

    if (recentDuplicate) {
        logger.info("StoreService", `Duplicate checkout request suppressed for phone ${cleanCustomerPhone} (Order #${recentDuplicate.orderNumber})`);
        const targetPhone = store.phone ? formatPhoneNumberToWA(store.phone) : cleanCustomerPhone;
        return {
            success: true,
            orderId: recentDuplicate.id,
            orderNumber: recentDuplicate.orderNumber,
            total: recentDuplicate.total,
            whatsappRedirectUrl: `https://wa.me/${targetPhone}`
        };
    }

    const notesParts: string[] = [];
    if (input.customerNotes?.trim()) notesParts.push(input.customerNotes.trim());
    if (input.transactionId?.trim()) notesParts.push(`[TID: ${input.transactionId.trim()}]`);
    if (input.couponCode?.trim()) notesParts.push(`[Coupon: ${input.couponCode.trim().toUpperCase()}]`);
    if (input.paymentProofUrl?.trim()) notesParts.push(`[Proof: ${input.paymentProofUrl.trim()}]`);

    // Save Order to Database
    const order = await prisma.order.create({
        data: {
            storeId: store.id,
            orderNumber: orderNumber,
            customerName: input.customerName.trim(),
            customerPhone: cleanCustomerPhone,
            customerAddress: input.customerAddress.trim(),
            customerCity: input.customerCity?.trim() || store.city || "Pakistan",
            customerNotes: notesParts.join(" ") || null,
            subtotal: subtotal,
            deliveryFee: deliveryFee,
            discount: discountAmount,
            total: total,
            currency: store.currency || "PKR",
            paymentMethod: input.paymentMethod || "COD",
            paymentStatus: input.paymentMethod === "COD" ? "UNPAID" : (input.transactionId ? "PAID" : "UNPAID"),
            status: "PENDING",
            itemsSnapshot: {
                items: itemsSnapshot,
                metadata: {
                    couponCode: input.couponCode?.trim().toUpperCase() || null,
                    discount: discountAmount,
                    transactionId: input.transactionId?.trim() || null,
                    paymentProofUrl: input.paymentProofUrl?.trim() || null
                }
            },
            items: {
                create: orderItemsData
            }
        },
        include: {
            items: true
        }
    });

    // Formatted WhatsApp Receipt text
    const ownerReceipt = formatOrderWhatsAppReceipt(order, store, "owner");
    const customerReceipt = formatOrderWhatsAppReceipt(order, store, "customer");

    // Resolve active WhatsApp Session for sending notifications
    let activeBaileysSessionId: string | null = null;

    if (store.session?.sessionId) {
        activeBaileysSessionId = store.session.sessionId;
    } else if (store.sessionId) {
        const found = await prisma.session.findFirst({
            where: {
                OR: [
                    { id: store.sessionId },
                    { sessionId: store.sessionId }
                ]
            },
            select: { id: true, sessionId: true }
        });
        if (found) {
            activeBaileysSessionId = found.sessionId;
        }
    }

    // Fallback: If no session is linked to store, find the store owner's active WhatsApp session
    if (!activeBaileysSessionId) {
        const userSession = await prisma.session.findFirst({
            where: {
                userId: store.userId,
                status: "CONNECTED"
            },
            orderBy: { updatedAt: "desc" }
        }) || await prisma.session.findFirst({
            where: { userId: store.userId },
            orderBy: { updatedAt: "desc" }
        });

        if (userSession) {
            activeBaileysSessionId = userSession.sessionId;
            // Auto-link store with this session so future lookups are immediate
            await prisma.store.update({
                where: { id: store.id },
                data: { sessionId: userSession.id }
            }).catch(() => {});
        }
    }

    // Automatically send WhatsApp notification via connected Baileys Session
    if (activeBaileysSessionId) {
        const cleanOwnerPhone = store.phone ? formatPhoneNumberToWA(store.phone) : "";
        const ownerJid = cleanOwnerPhone ? normalizeJid(`${cleanOwnerPhone}@s.whatsapp.net`) : "";
        const customerJid = cleanCustomerPhone ? normalizeJid(`${cleanCustomerPhone}@s.whatsapp.net`) : "";

        // Check if store phone and customer phone are identical (e.g. store owner testing orders)
        const isSameRecipient = !!(ownerJid && customerJid && ownerJid === customerJid);

        if (isSameRecipient) {
            // Send only ONE message to avoid sending 2 duplicate receipts to the same chat
            try {
                await ChatService.sendTextMessage(activeBaileysSessionId, ownerJid, ownerReceipt);
                await prisma.order.update({
                    where: { id: order.id },
                    data: { ownerNotified: true, customerNotified: true }
                });
                logger.info("StoreService", `Single WhatsApp order alert sent to Owner/Customer (+${cleanOwnerPhone})`);
            } catch (err: any) {
                logger.error("StoreService", `Failed to send WhatsApp alert: ${err.message}`);
            }
        } else {
            // Notify Store Owner
            if (store.autoNotifyOwner !== false && ownerJid) {
                try {
                    await ChatService.sendTextMessage(activeBaileysSessionId, ownerJid, ownerReceipt);
                    await prisma.order.update({
                        where: { id: order.id },
                        data: { ownerNotified: true }
                    });
                    logger.info("StoreService", `WhatsApp order alert sent to Store Owner (+${cleanOwnerPhone})`);
                } catch (err: any) {
                    logger.error("StoreService", `Failed to send WhatsApp alert to owner: ${err.message}`);
                }
            }

            // Notify Customer
            if (store.autoNotifyCustomer !== false && customerJid) {
                try {
                    await ChatService.sendTextMessage(activeBaileysSessionId, customerJid, customerReceipt);
                    await prisma.order.update({
                        where: { id: order.id },
                        data: { customerNotified: true }
                    });
                    logger.info("StoreService", `WhatsApp order confirmation sent to Customer (+${cleanCustomerPhone})`);
                } catch (err: any) {
                    logger.error("StoreService", `Failed to send WhatsApp confirmation to customer: ${err.message}`);
                }
            }
        }
    } else {
        logger.warn("StoreService", `No WhatsApp session available to send order notifications for store "${store.name}".`);
    }

    // Direct WhatsApp Web click URL as fallback
    const targetPhoneForCustomer = store.phone ? formatPhoneNumberToWA(store.phone) : cleanCustomerPhone;
    const encodedReceipt = encodeURIComponent(
        `Assalam o Alaikum! Maine aapki dukaan se online order place kiya hai:\n\n${customerReceipt}`
    );
    const whatsappRedirectUrl = `https://wa.me/${targetPhoneForCustomer}?text=${encodedReceipt}`;

    return {
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        whatsappRedirectUrl
    };
}
