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
    items: CreateOrderItemInput[];
}

/**
 * Clean phone number to WhatsApp international format (e.g. 03001234567 -> 923001234567)
 */
export function formatPhoneNumberToWA(phone: string): string {
    let clean = phone.replace(/[^\d]/g, "");
    if (clean.startsWith("0")) {
        clean = "92" + clean.substring(1);
    } else if (clean.startsWith("+")) {
        clean = clean.substring(1);
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
    const total = Number(order.total).toLocaleString("en-PK");

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
• Delivery Fee: ${Number(order.deliveryFee) === 0 ? "*FREE*" : `${store.currencySymbol || "Rs."} ${delivery}`}
💰 *TOTAL BILL:* *${store.currencySymbol || "Rs."} ${total}*
💳 *Payment:* ${order.paymentMethod || "Cash on Delivery (COD)"}
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
💵 *Total Bill:* *${store.currencySymbol || "Rs."} ${total}*
📍 *Delivery Address:* ${order.customerAddress}
💳 *Tareeqa:* ${order.paymentMethod || "Cash on Delivery (COD)"}
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
    if (store.freeDeliveryAbove && subtotal >= store.freeDeliveryAbove) {
        deliveryFee = 0;
    }

    const total = subtotal + deliveryFee;

    // Generate Human-friendly Order Number e.g. ORD-10023
    const orderCount = await prisma.order.count({ where: { storeId: store.id } });
    const orderNumber = `${store.orderPrefix || "ORD-"}${1001 + orderCount}`;

    const cleanCustomerPhone = formatPhoneNumberToWA(input.customerPhone);

    // Save Order to Database
    const order = await prisma.order.create({
        data: {
            storeId: store.id,
            orderNumber: orderNumber,
            customerName: input.customerName.trim(),
            customerPhone: cleanCustomerPhone,
            customerAddress: input.customerAddress.trim(),
            customerCity: input.customerCity?.trim() || store.city || "Pakistan",
            customerNotes: input.customerNotes?.trim() || null,
            subtotal: subtotal,
            deliveryFee: deliveryFee,
            total: total,
            currency: store.currency || "PKR",
            paymentMethod: input.paymentMethod || "COD",
            paymentStatus: "UNPAID",
            status: "PENDING",
            itemsSnapshot: itemsSnapshot,
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

    // Automatically send WhatsApp notification via connected Baileys Session
    if (store.sessionId) {
        // Notify Store Owner
        if (store.autoNotifyOwner && store.phone) {
            const cleanOwnerPhone = formatPhoneNumberToWA(store.phone);
            const ownerJid = normalizeJid(`${cleanOwnerPhone}@s.whatsapp.net`);
            try {
                await ChatService.sendTextMessage(store.sessionId, ownerJid, ownerReceipt);
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
        if (store.autoNotifyCustomer && cleanCustomerPhone) {
            const customerJid = normalizeJid(`${cleanCustomerPhone}@s.whatsapp.net`);
            try {
                await ChatService.sendTextMessage(store.sessionId, customerJid, customerReceipt);
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
