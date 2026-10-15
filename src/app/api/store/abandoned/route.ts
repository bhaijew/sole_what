import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { ChatService } from "@/modules/whatsapp/chat.service";
import { formatPhoneNumberToWA } from "@/lib/store-service";
import { normalizeJid } from "@/lib/jid-utils";

const DATA_DIR = path.join(process.cwd(), "data", "abandoned");

interface AbandonedCartItem {
    id: string;
    storeId: string;
    customerName: string;
    customerPhone: string;
    customerAddress?: string;
    itemsCount: number;
    subtotal: number;
    itemsSummary: string;
    createdAt: string;
    recovered: boolean;
    recoverySentAt?: string;
}

async function getAbandonedCarts(storeId: string): Promise<AbandonedCartItem[]> {
    try {
        await mkdir(DATA_DIR, { recursive: true });
        const filePath = path.join(DATA_DIR, `${storeId}.json`);
        const content = await readFile(filePath, "utf-8");
        return JSON.parse(content);
    } catch {
        return [];
    }
}

async function saveAbandonedCarts(storeId: string, carts: AbandonedCartItem[]): Promise<void> {
    await mkdir(DATA_DIR, { recursive: true });
    const filePath = path.join(DATA_DIR, `${storeId}.json`);
    await writeFile(filePath, JSON.stringify(carts.slice(-100), null, 2), "utf-8");
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get("storeId");
        if (!storeId) {
            return NextResponse.json({ success: false, error: "Store ID is required" }, { status: 400 });
        }
        const carts = await getAbandonedCarts(storeId);
        return NextResponse.json({ success: true, carts });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, storeId, customerName, customerPhone, customerAddress, subtotal, items, cartId } = body;

        if (!storeId) {
            return NextResponse.json({ success: false, error: "Store ID is required" }, { status: 400 });
        }

        // Action 1: Record Abandoned Cart (called from storefront when customer fills contact details)
        if (action === "record") {
            if (!customerPhone || customerPhone.trim().length < 8) {
                return NextResponse.json({ success: false, error: "Phone number is required" });
            }

            const cleanPhone = formatPhoneNumberToWA(customerPhone);
            const carts = await getAbandonedCarts(storeId);

            // Avoid duplicate within last 2 hours
            const existing = carts.find(c => c.customerPhone === cleanPhone && !c.recovered);
            if (!existing) {
                const newCart: AbandonedCartItem = {
                    id: `ac-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    storeId,
                    customerName: customerName || "Customer",
                    customerPhone: cleanPhone,
                    customerAddress: customerAddress || "",
                    itemsCount: Array.isArray(items) ? items.reduce((acc: number, i: any) => acc + (i.quantity || 1), 0) : 1,
                    subtotal: Number(subtotal) || 0,
                    itemsSummary: Array.isArray(items) ? items.map((i: any) => `${i.productName || i.name} (${i.quantity || 1}x)`).join(", ") : "Cart Items",
                    createdAt: new Date().toISOString(),
                    recovered: false
                };
                carts.unshift(newCart);
                await saveAbandonedCarts(storeId, carts);
            }
            return NextResponse.json({ success: true });
        }

        // Action 2: Send WhatsApp Recovery Alert directly from Dashboard
        if (action === "recover") {
            const carts = await getAbandonedCarts(storeId);
            const target = carts.find(c => c.id === cartId);
            if (!target) {
                return NextResponse.json({ success: false, error: "Cart record not found" }, { status: 404 });
            }

            const store = await prisma.store.findUnique({
                where: { id: storeId },
                include: { session: true }
            });

            if (!store) {
                return NextResponse.json({ success: false, error: "Store not found" }, { status: 404 });
            }

            const storeUrl = store.customDomain ? `https://${store.customDomain}` : `${process.env.BASE_URL || "http://localhost:3000"}/s/${store.slug}`;
            const recoveryMessage = `Assalam-o-Alaikum ${target.customerName}! 🛒✨

Aapka saman *${store.name}* ki cart mein aapka intezar kar raha hai:
📦 *Items:* ${target.itemsSummary}
💵 *Subtotal:* ${store.currencySymbol || "Rs."} ${target.subtotal.toLocaleString("en-PK")}

🔥 *Special Offer:* Abhi apna order complete karein aur promo code *WELCOME10* lagane par *10% EXTRA DISCOUNT* payein!

👉 Yahan click karke order mukammal karein:
${storeUrl}

Shukriya! Agar koi madad chahiye ho toh isi chat par reply karein.`;

            const activeSessionId = store.session?.sessionId || store.sessionId;
            if (activeSessionId && target.customerPhone) {
                const customerJid = normalizeJid(`${target.customerPhone}@s.whatsapp.net`);
                try {
                    await ChatService.sendTextMessage(activeSessionId, customerJid, recoveryMessage);
                    target.recoverySentAt = new Date().toISOString();
                    await saveAbandonedCarts(storeId, carts);
                } catch (err: any) {
                    console.warn("Recovery message send failed:", err.message);
                }
            }

            return NextResponse.json({
                success: true,
                whatsappDirectUrl: `https://wa.me/${target.customerPhone}?text=${encodeURIComponent(recoveryMessage)}`
            });
        }

        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        console.error("Abandoned Cart Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
