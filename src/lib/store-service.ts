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
 * Looks up active store from database by slug or custom domain
 */
export async function getStoreBySlugOrDomain(identifier: string) {
    const cleanId = identifier.trim().toLowerCase().replace(/^(https?:\/\/)/, "").split("/")[0].split(":")[0];

    try {
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
    } catch (err: any) {
        logger.error("StoreService", `Database store fetch failed for "${cleanId}": ${err.message}`);
        return null;
    }
}

export interface PublicStoresFilter {
    city?: string;
    area?: string;
    category?: string;
    search?: string;
    onlyOpen?: boolean;
}

/**
 * Fetch all public active stores for Directory Listing (solewhat.site/dukaan)
 * Returns ONLY real stores from the database with counts, available cities, and popular mohallas.
 */
export async function getPublicStoresDirectory(filter: PublicStoresFilter = {}) {
    let stores: any[] = [];

    try {
        const whereClause: any = {
            isActive: true
        };

        if (filter.onlyOpen) {
            whereClause.isOpen = true;
        }

        if (filter.city && filter.city.toLowerCase() !== "all") {
            whereClause.city = {
                equals: filter.city,
                mode: "insensitive"
            };
        }

        const storesFromDb = await prisma.store.findMany({
            where: whereClause,
            include: {
                categories: {
                    where: { isActive: true },
                    select: { name: true, slug: true, icon: true }
                },
                products: {
                    where: { isActive: true },
                    select: { id: true, name: true, price: true, image: true, inStock: true },
                    take: 6
                },
                _count: {
                    select: { products: true, orders: true }
                }
            },
            orderBy: [
                { isOpen: "desc" },
                { createdAt: "desc" }
            ]
        });

        if (storesFromDb && storesFromDb.length > 0) {
            stores = storesFromDb.map(s => ({
                id: s.id,
                name: s.name,
                slug: s.slug,
                tagline: s.tagline,
                description: s.description,
                logoUrl: s.logoUrl,
                bannerUrl: s.bannerUrl,
                phone: s.phone,
                address: s.address,
                city: s.city || "Lahore",
                area: s.address ? s.address.split(",")[0].trim() : s.city,
                isOpen: s.isOpen,
                deliveryFee: s.deliveryFee,
                freeDeliveryAbove: s.freeDeliveryAbove,
                estimatedDeliveryTime: s.estimatedDeliveryTime || "30-45 mins",
                openingHours: s.openingHours || "9:00 AM - 11:00 PM",
                minOrderAmount: s.minOrderAmount,
                noticeMessage: s.noticeMessage,
                categories: s.categories.map((c: any) => c.name),
                productCount: s._count?.products || s.products.length,
                totalOrders: s._count?.orders || 0,
                sampleProducts: s.products.map((p: any) => ({
                    name: p.name,
                    price: p.price,
                    image: p.image
                }))
            }));
        }
    } catch (err: any) {
        logger.error("StoreService", `Database store list fetch error: ${err.message}`);
    }

    // Apply filtering (area/search, category, onlyOpen)
    let filtered = stores;

    if (filter.area && filter.area.trim()) {
        const a = filter.area.trim().toLowerCase();
        filtered = filtered.filter(s =>
            (s.area || "").toLowerCase().includes(a) ||
            (s.address || "").toLowerCase().includes(a) ||
            (s.name || "").toLowerCase().includes(a)
        );
    }

    if (filter.search && filter.search.trim()) {
        const q = filter.search.trim().toLowerCase();
        filtered = filtered.filter(s =>
            (s.name || "").toLowerCase().includes(q) ||
            (s.tagline || "").toLowerCase().includes(q) ||
            (s.description || "").toLowerCase().includes(q) ||
            (s.address || "").toLowerCase().includes(q) ||
            (s.categories || []).some((c: string) => c.toLowerCase().includes(q))
        );
    }

    if (filter.category && filter.category.toLowerCase() !== "all") {
        const cat = filter.category.trim().toLowerCase();
        filtered = filtered.filter(s =>
            (s.categories || []).some((c: string) => c.toLowerCase().includes(cat))
        );
    }

    if (filter.onlyOpen) {
        filtered = filtered.filter(s => s.isOpen === true);
    }

    // Extract all unique cities from real stores
    const citiesSet = new Set<string>();
    stores.forEach(s => {
        if (s.city) citiesSet.add(s.city);
    });
    const cities = Array.from(citiesSet);

    // Extract all unique areas from real stores
    const areasSet = new Set<string>();
    filtered.forEach(s => {
        if (s.area) areasSet.add(s.area);
    });
    const areas = Array.from(areasSet);

    return {
        stores: filtered,
        totalCount: filtered.length,
        allStoresCount: stores.length,
        cities,
        areas
    };
}



/**
 * Generate 80mm Digital Thermal Cash Memo / Slip for WhatsApp
 * Formatted with fixed width (32 chars) so inside monospace code block (```)
 * it looks identical to the printed receipt slip.
 */
export function buildThermalReceiptText(order: any, store: any): string {
    const W = 32;
    const center = (text: string) => {
        const s = (text || "").trim();
        if (s.length >= W) return s.slice(0, W);
        const pad = Math.floor((W - s.length) / 2);
        return " ".repeat(pad) + s;
    };

    const row = (left: string, right: string) => {
        const l = (left || "").trim();
        const r = (right || "").trim();
        const spaceCount = Math.max(1, W - l.length - r.length);
        return l + " ".repeat(spaceCount) + r;
    };

    const dateFormatted = new Date(order.createdAt).toLocaleDateString("en-PK", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

    const lines: string[] = [];

    // Header matching 80mm slip
    lines.push(center((store.name || "DUKAAN").toUpperCase()));
    const address = store.city || store.address || "Pakistan";
    if (address) {
        lines.push(center(address));
    }
    if (store.phone) {
        lines.push(center(`Ph: ${store.phone}`));
    }
    lines.push(center(`Invoice #${order.orderNumber}`));
    lines.push(center(`Date: ${dateFormatted}`));
    lines.push("-".repeat(W));

    // Customer section
    lines.push(`Customer: ${order.customerName || "Customer"}`);
    lines.push(`Phone: ${order.customerPhone || ""}`);
    lines.push("-".repeat(W));

    // Items table header
    lines.push(row("Item", "Total"));
    if (Array.isArray(order.items)) {
        order.items.forEach((it: any) => {
            const itemLabel = `${it.quantity}x ${it.productName}`;
            const itemPrice = `${store.currencySymbol || "Rs."} ${Number(it.totalPrice).toLocaleString("en-PK")}`;
            if (itemLabel.length + itemPrice.length + 1 <= W) {
                lines.push(row(itemLabel, itemPrice));
            } else {
                lines.push(itemLabel);
                lines.push(row("", itemPrice));
            }
        });
    }
    lines.push("-".repeat(W));

    // Financial totals
    const subtotal = Number(order.subtotal || order.total);
    lines.push(row("Subtotal:", `${store.currencySymbol || "Rs."} ${subtotal.toLocaleString("en-PK")}`));

    if (Number(order.discount) > 0) {
        lines.push(row("Discount:", `-${store.currencySymbol || "Rs."} ${Number(order.discount).toLocaleString("en-PK")}`));
    }

    const deliveryFee = Number(order.deliveryFee || 0);
    lines.push(row("Delivery:", deliveryFee === 0 ? "FREE" : `${store.currencySymbol || "Rs."} ${deliveryFee.toLocaleString("en-PK")}`));

    lines.push("-".repeat(W));
    const total = Number(order.total);
    lines.push(row("NET PAYABLE:", `${store.currencySymbol || "Rs."} ${total.toLocaleString("en-PK")}`));
    lines.push(row("Mode:", String(order.paymentMethod || "COD")));
    lines.push("-".repeat(W));

    // Footer
    lines.push(center("*** SHUKRIYA VISIT KARNE KA ***"));
    lines.push(center("Powered by Sole-What Digital Dukaan"));

    return lines.join("\n");
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
${order.customerNotes ? `• *Hidayat:* _"${order.customerNotes}"_\n` : ""}🛒 *Items Ordered:*
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
        const slipText = buildThermalReceiptText(order, store);
        const origin = process.env.NEXTAUTH_URL || "";
        const trackingLink = store.slug ? `${origin ? origin : ""}/s/${store.slug}/track?q=${order.orderNumber}` : "";

        return `\`\`\`
${slipText}
\`\`\`

📍 *Delivery Address:* ${order.customerAddress}${order.customerCity ? `, ${order.customerCity}` : ""}
${order.customerNotes ? `📝 *Special Instructions:* _${order.customerNotes}_\n` : ""}🛵 *Estimated Delivery:* ${store.estimatedDeliveryTime || "30-45 mins"}
${trackingLink ? `📲 *Track Order Live:* ${trackingLink}` : ""}`;
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
            // When store owner is testing their own store, send the customer thermal receipt slip
            // so they immediately see the exact receipt invoice!
            try {
                await ChatService.sendTextMessage(activeBaileysSessionId, ownerJid, customerReceipt);
                await prisma.order.update({
                    where: { id: order.id },
                    data: { ownerNotified: true, customerNotified: true }
                });
                logger.info("StoreService", `Single WhatsApp order receipt sent to Owner/Customer (+${cleanOwnerPhone})`);
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

    // Real-time live order dispatch to Store Dashboard
    try {
        const io = (global as any).io;
        if (io) {
            io.to(`store:${store.id}`).emit("store:new_order", {
                storeId: store.id,
                order: order
            });
            io.to(`user:${store.userId}`).emit("store:new_order", {
                storeId: store.id,
                order: order
            });
        }
    } catch (socketErr) {
        // non-blocking
    }

    return {
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        whatsappRedirectUrl
    };
}
