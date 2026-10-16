import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { PRESET_CATALOG_PRODUCTS } from "@/lib/catalog-presets";

export const maxDuration = 60; // Allow 60 seconds for AI processing

// Curated stock photos for Pakistani store categories
const CATEGORY_IMAGE_MAP: Record<string, string> = {
    milk: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80",
    doodh: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80",
    tea: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=500&q=80",
    chai: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=500&q=80",
    oil: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80",
    ghee: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80",
    rice: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80",
    chawal: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80",
    sugar: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=500&q=80",
    cheeni: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=500&q=80",
    flour: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80",
    atta: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80",
    bread: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80",
    egg: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=500&q=80",
    anday: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=500&q=80",
    soap: "https://images.unsplash.com/photo-1607006314352-7b196883c50f?auto=format&fit=crop&w=500&q=80",
    sabun: "https://images.unsplash.com/photo-1607006314352-7b196883c50f?auto=format&fit=crop&w=500&q=80",
    surf: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=500&q=80",
    burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80",
    pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80",
    fries: "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=500&q=80",
    drink: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=80",
    cold: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=80",
    biscuit: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=500&q=80",
    juice: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=500&q=80",
    spices: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=500&q=80",
    masala: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=500&q=80",
    charger: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=500&q=80",
    handsfree: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80",
    medicine: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=500&q=80",
    grocery: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80"
};

function assignProductPhoto(name: string, category: string): string {
    const text = `${name.toLowerCase()} ${category.toLowerCase()}`;
    for (const [key, url] of Object.entries(CATEGORY_IMAGE_MAP)) {
        if (text.includes(key)) return url;
    }
    return "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80";
}

export async function POST(req: NextRequest) {
    try {
        const user = await getAuthenticatedUser(req);
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { storeId, prompt, businessType, imageBase64 } = body;

        if (!storeId) {
            return NextResponse.json({ success: false, error: "Store ID is required" }, { status: 400 });
        }

        // Verify store access
        const store = await prisma.store.findFirst({
            where: user.role === "SUPERADMIN" ? { id: storeId } : { id: storeId, userId: user.id }
        });

        if (!store) {
            return NextResponse.json({ success: false, error: "Store not found or unauthorized" }, { status: 404 });
        }

        const storeCategoryContext = businessType || store.tagline || "Kiryana & Grocery";

        const systemPrompt = `You are an expert Pakistani Store Inventory Assistant ("AI Dukaan Catalog Creator").
Your job is to read the shopkeeper's (dukaan dar) rough input (voice transcript, Roman Urdu message, WhatsApp text list, handwritten paper slip/parchi, or business prompt) and extract ALL individual products into structured JSON.

PAKISTANI MARKET RULES:
1. Prices MUST be in Pakistani Rupees (PKR / Rs.) based on authentic Pakistani grocery/market rates if not explicitly stated.
2. Product names should be clean, readable, with brand and weight/size if mentioned (e.g. "Olper's Milk 1 Litre", "Dalda Cooking Oil 5 Litre", "Tapal Danedar Tea 430g").
3. Assign appropriate Categories (e.g. "Dairy & Eggs", "Cooking Essentials", "Beverages & Tea", "Snacks & Biscuits", "Personal Care", "Household & Cleaning", "Fast Food", "Mobile Accessories").
4. Assign clean Units (e.g. "kg", "litre", "pack", "piece", "bottle", "box", "dozen").
5. compareAtPrice should be slightly higher (e.g. 5-10% higher) than sale price for discount strike-through effect.
6. Write a short 1-line description in Roman Urdu or English.

OUTPUT FORMAT:
You MUST return ONLY a valid JSON array of objects. Do NOT include markdown code blocks (\`\`\`json), do NOT include commentary or conversational text. Return strictly the raw JSON array:
[
  {
    "name": "Olper's Full Cream Milk 1L",
    "category": "Dairy & Milk",
    "price": 280,
    "compareAtPrice": 300,
    "unit": "litre",
    "description": "Taaza aur pure UHT doodh for daily chai and consumption",
    "inStock": true
  }
]`;

        const userPrompt = `Store Type: ${storeCategoryContext}
Shopkeeper Input:
${prompt || "Generate a complete starter catalog of popular fast-selling products for this type of store with authentic Pakistani prices in PKR."}`;

        let parsedProducts: any[] = [];
        let aiUsed = "groq";

        // 1. Try Gemini Vision if an image of a handwritten slip / invoice was provided
        if (imageBase64) {
            const geminiKey = process.env.GEMINI_API_KEY?.trim();
            if (geminiKey) {
                try {
                    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
                    const mimeType = imageBase64.match(/^data:(image\/[a-z]+);base64,/)?.[1] || "image/jpeg";

                    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
                    const geminiRes = await fetch(geminiUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{
                                parts: [
                                    { text: `${systemPrompt}\n\nTask: Read this handwritten parchi / price list / receipt photo and extract all items into the JSON array format.` },
                                    {
                                        inline_data: {
                                            mime_type: mimeType,
                                            data: cleanBase64
                                        }
                                    }
                                ]
                            }],
                            generationConfig: {
                                temperature: 0.2,
                                maxOutputTokens: 2500,
                                responseMimeType: "application/json"
                            }
                        })
                    });

                    if (geminiRes.ok) {
                        const gData = await geminiRes.json();
                        const rawText = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (rawText) {
                            parsedProducts = JSON.parse(rawText.replace(/```json/g, "").replace(/```/g, "").trim());
                            aiUsed = "gemini-vision";
                        }
                    }
                } catch (imgErr) {
                    console.error("Gemini Vision Error:", imgErr);
                }
            }
        }

        // 2. If no image or image failed, try Groq LPU (blazing fast ~0.5s)
        if (parsedProducts.length === 0) {
            const groqKey = process.env.GROQ_API_KEY?.trim();
            if (groqKey) {
                try {
                    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${groqKey}`
                        },
                        body: JSON.stringify({
                            model: "openai/gpt-oss-120b",
                            messages: [
                                { role: "system", content: systemPrompt },
                                { role: "user", content: userPrompt }
                            ],
                            temperature: 0.3,
                            max_tokens: 3000,
                            response_format: { type: "json_object" }
                        }),
                        signal: AbortSignal.timeout(15000)
                    });

                    if (groqRes.ok) {
                        const groqData = await groqRes.json();
                        const content = groqData?.choices?.[0]?.message?.content;
                        if (content) {
                            const parsed = JSON.parse(content);
                            if (Array.isArray(parsed)) {
                                parsedProducts = parsed;
                            } else if (Array.isArray(parsed.products)) {
                                parsedProducts = parsed.products;
                            } else if (Array.isArray(parsed.items)) {
                                parsedProducts = parsed.items;
                            }
                            aiUsed = "groq-fast";
                        }
                    }
                } catch (groqErr) {
                    console.error("Groq LPU Error:", groqErr);
                }
            }
        }

        // 3. Try OpenRouter as fallback
        if (parsedProducts.length === 0) {
            const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
            if (openRouterKey) {
                try {
                    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${openRouterKey}`
                        },
                        body: JSON.stringify({
                            model: "openrouter/free",
                            messages: [
                                { role: "system", content: systemPrompt },
                                { role: "user", content: userPrompt }
                            ],
                            temperature: 0.3
                        }),
                        signal: AbortSignal.timeout(15000)
                    });

                    if (orRes.ok) {
                        const orData = await orRes.json();
                        const raw = orData?.choices?.[0]?.message?.content || "";
                        const jsonMatch = raw.match(/\[[\s\S]*\]/);
                        if (jsonMatch) {
                            parsedProducts = JSON.parse(jsonMatch[0]);
                            aiUsed = "openrouter";
                        }
                    }
                } catch (orErr) {
                    console.error("OpenRouter Error:", orErr);
                }
            }
        }

        // 4. Safe offline fallback: If AI keys fail or limit exceeded, use smart catalog matcher
        if (!Array.isArray(parsedProducts) || parsedProducts.length === 0) {
            // Filter from PRESET_CATALOG_PRODUCTS based on prompt keywords or return standard starter catalog
            const lowerPrompt = (prompt || "").toLowerCase();
            let matched = PRESET_CATALOG_PRODUCTS.filter(p =>
                lowerPrompt.includes(p.name.toLowerCase().split(" ")[0]) ||
                lowerPrompt.includes(p.category.toLowerCase())
            );

            if (matched.length === 0) {
                matched = PRESET_CATALOG_PRODUCTS.slice(0, 12);
            }

            parsedProducts = matched.map(p => ({
                name: p.name,
                category: p.category,
                price: p.price,
                compareAtPrice: p.compareAtPrice || Math.round(p.price * 1.1),
                unit: p.unit,
                description: p.description,
                image: p.image,
                inStock: true
            }));
            aiUsed = "preset-smart-catalog";
        }

        // Clean & enhance each product with authentic imagery and verified defaults
        const sanitizedProducts = parsedProducts.map((item: any) => {
            const name = String(item.name || "Item").trim();
            const category = String(item.category || "General Essentials").trim();
            const price = Math.max(1, Math.round(Number(item.price) || 100));
            const compareAt = item.compareAtPrice ? Math.round(Number(item.compareAtPrice)) : Math.round(price * 1.08);

            return {
                name,
                category,
                price,
                compareAtPrice: compareAt > price ? compareAt : null,
                unit: String(item.unit || "item").toLowerCase().trim(),
                description: String(item.description || `${name} taaza aur high quality`).trim(),
                image: item.image && item.image.startsWith("http") ? item.image : assignProductPhoto(name, category),
                inStock: item.inStock !== false
            };
        });

        return NextResponse.json({
            success: true,
            products: sanitizedProducts,
            count: sanitizedProducts.length,
            engine: aiUsed,
            message: `AI ne ${sanitizedProducts.length} products safai se extract kar liye hain!`
        });
    } catch (error: any) {
        console.error("AI Product Parser Error:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Failed to parse products with AI"
        }, { status: 500 });
    }
}
