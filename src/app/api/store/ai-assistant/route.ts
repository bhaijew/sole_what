import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { storeId, message, history } = body;

        if (!storeId) {
            return NextResponse.json({ success: false, error: "Store ID is required" }, { status: 400 });
        }

        if (!message || !message.trim()) {
            return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 });
        }

        const store = await prisma.store.findUnique({
            where: { id: storeId },
            include: {
                categories: {
                    where: { isActive: true },
                    select: { id: true, name: true }
                },
                products: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        compareAtPrice: true,
                        unit: true,
                        inStock: true
                    },
                    take: 60
                }
            }
        });

        if (!store) {
            return NextResponse.json({ success: false, error: "Store not found" }, { status: 404 });
        }

        const availableProductsSummary = store.products
            .map(p => `• ${p.name}: ${store.currencySymbol || "Rs."} ${p.price}${p.unit ? ` (${p.unit})` : ""}${p.compareAtPrice ? ` [Discounted from ${p.compareAtPrice}]` : ""}${!p.inStock ? " (Out of Stock)" : ""}`)
            .join("\n");

        const categoryList = store.categories.map(c => c.name).join(", ");

        const systemPrompt = `You are "AI Dukandar", the official, friendly, and super helpful AI shopping assistant for "${store.name}".
Communicate naturally in polite Pakistani Roman Urdu (or polite English if the user writes in English).

🏪 STORE INFORMATION:
• Store Name: ${store.name}
• Tagline: ${store.tagline || "Apki Apni Digital Dukaan"}
• City & Address: ${store.city || "Pakistan"}${store.address ? `, ${store.address}` : ""}
• WhatsApp Contact: +${store.phone}
• Delivery Fee: ${Number(store.deliveryFee) === 0 ? "FREE Delivery" : `${store.currencySymbol || "Rs."} ${store.deliveryFee}`}
• Free Delivery Threshold: ${store.freeDeliveryAbove ? `Orders above ${store.currencySymbol || "Rs."} ${store.freeDeliveryAbove} get 100% FREE delivery` : "Standard delivery applies"}
• Estimated Delivery Time: ${store.estimatedDeliveryTime || "30-45 mins"}
• Store Timings: ${store.openingHours || "9:00 AM - 11:00 PM"}
• Categories: ${categoryList || "General Essentials"}

🎟️ ACTIVE PROMO COUPONS:
• WELCOME10 : 10% OFF on total order
• FREESHIP  : Free delivery on any order
• BACHAT50  : Rs. 50 OFF on orders above Rs. 300

📦 CURRENT AVAILABLE PRODUCTS IN STORE:
${availableProductsSummary || "Various daily essentials and catalog products available."}

GUIDELINES FOR ANSWERS:
1. Greet warmly in natural Roman Urdu (e.g. "Walaikum Assalam! Khush Aamdeed, main ${store.name} ka shopping guide hoon.").
2. Keep answers concise, clear, and mobile-friendly with nice emojis.
3. Recommend specific products with prices from the list above.
4. If customer asks about discounts, recommend 'WELCOME10' or 'FREESHIP' promo codes.
5. If customer wants to order, explain they can tap "Add" on any product card, or use the green "WhatsApp Order" button for 1-click ordering!
6. Never make up imaginary items not in this store. If an item isn't in the list, politely tell them it is not in stock currently.`;

        let reply: string | null = null;

        // Prepare messages payload
        const messages: any[] = [
            { role: "system", content: systemPrompt }
        ];

        if (Array.isArray(history) && history.length > 0) {
            for (const h of history.slice(-4)) {
                messages.push({
                    role: h.role === "assistant" ? "assistant" : "user",
                    content: h.content
                });
            }
        }

        messages.push({ role: "user", content: message });

        // Try Groq first for blazing fast replies (under 500ms)
        const groqKey = process.env.GROQ_API_KEY;
        if (groqKey) {
            try {
                const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${groqKey}`
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: messages,
                        max_tokens: 450,
                        temperature: 0.6
                    }),
                    signal: AbortSignal.timeout(6000)
                });

                if (groqRes.ok) {
                    const groqData = await groqRes.json();
                    reply = groqData.choices?.[0]?.message?.content || null;
                }
            } catch (err: any) {
                console.warn("AI Dukandar Groq Error:", err.message);
            }
        }

        // Fallback to OpenRouter if Groq didn't respond
        if (!reply && process.env.OPENROUTER_API_KEY) {
            try {
                const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "meta-llama/llama-3.3-70b-instruct:free",
                        messages: messages,
                        max_tokens: 450,
                        temperature: 0.6
                    }),
                    signal: AbortSignal.timeout(7000)
                });

                if (openRouterRes.ok) {
                    const orData = await openRouterRes.json();
                    reply = orData.choices?.[0]?.message?.content || null;
                }
            } catch (err: any) {
                console.warn("AI Dukandar OpenRouter Error:", err.message);
            }
        }

        // Guaranteed Natural Fallback if external APIs are unreachable
        if (!reply) {
            const p = message.toLowerCase();
            if (p.includes("salam") || p.includes("aoa") || p.includes("hello") || p.includes("hi")) {
                reply = `Walaikum Assalam! Khush aamdeed *${store.name}* mein! 🏪 Main aapka AI shopping assistant hoon. Aap koi bhi item dhoondne, keemat maloom karne ya delivery timing ke bare mein pooch sakte hain. Aaj aapko kya chahiye?`;
            } else if (p.includes("discount") || p.includes("coupon") || p.includes("code") || p.includes("offer") || p.includes("bachat")) {
                reply = `🎉 Aaj hamare paas special discount coupons hain:\n• *WELCOME10* : Cart mein lagayein aur 10% discount payein!\n• *FREESHIP* : Free delivery ke liye use karein.\nCart open karke promo code box mein enter karein!`;
            } else if (p.includes("delivery") || p.includes("timing") || p.includes("kahan") || p.includes("time")) {
                reply = `⏱️ Delivery Info:\n• Estimated Delivery: *${store.estimatedDeliveryTime || "30-45 mins"}*\n• Delivery Fee: *${Number(store.deliveryFee) === 0 ? "FREE" : `${store.currencySymbol || "Rs."} ${store.deliveryFee}`}*\n${store.freeDeliveryAbove ? `• Free delivery over *${store.currencySymbol || "Rs."} ${store.freeDeliveryAbove}*` : ""}\n• Timings: *${store.openingHours || "9:00 AM - 11:00 PM"}*`;
            } else if (p.includes("order") || p.includes("kaise") || p.includes("how")) {
                reply = `🛍️ Order karna nihayat aasan hai!\n1. Kisi bhi product par *'+ Add'* par click karein.\n2. Screen par niche *'View Cart'* par tap karke apna address likhein.\n3. Ya seedha product par *'WhatsApp Order'* click karke foran chat par order karein!`;
            } else {
                const sampleProducts = store.products.slice(0, 3).map(x => `${x.name} (${store.currencySymbol} ${x.price})`).join(", ");
                reply = `G bilkul! Hamari dukaan *${store.name}* par taza tareen saman dastyab hai, jese ke: ${sampleProducts || "daily essentials"}. Aap search bar se bhi koi bhi item talash kar sakte hain ya foran cart mein add kar sakte hain! 🛒`;
            }
        }

        return NextResponse.json({
            success: true,
            reply: reply
        });
    } catch (error: any) {
        console.error("AI Assistant API Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to generate AI response" },
            { status: 500 }
        );
    }
}
