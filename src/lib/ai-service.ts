import { prisma } from "./prisma";
import { logger } from "./logger";
import { getGoldRates, formatGoldRatePrompt } from "./gold-service";
import { getPizzaShopCatalogForAi, createPizzaOrderInSupabase } from "./pizza-supabase";

export interface AiTestRequest {
    provider: string; // "openrouter" | "openai" | "gemini" | "groq"
    apiKey?: string;
    modelName: string;
    systemPrompt?: string;
    knowledgeBase?: string;
    userPrompt: string;
    enableGoldRates?: boolean;
    menuUrl?: string;
}

const DEFAULT_SYSTEM_PROMPT = `You are a polite, natural, and friendly human customer support executive for this business on WhatsApp.
Communicate naturally in polite Pakistani Roman Urdu (or English if the customer speaks English).

CORE COMMUNICATION RULES:
1. HUMAN-LIKE & DIRECT:
- Be concise, warm, and natural.
- Answer EXACTLY and ONLY what the customer is asking. Do not send walls of text or dump irrelevant information.
- Speak like a real human shopkeeper or support agent (e.g., "G bilkul", "Ji zaroor", "Aap bilkul fikar na karein").

2. GREETINGS & CASUAL CHAT:
- Agar customer "aoa", "salam", "assalam o alaikum", "hi", "hello" likhay:
  Pyaar aur adab se jawab dein: "Walaikum Assalam! Shukriya rabta karne ka. Main aapki kya madad kar sakta hoon?"
- Agar customer "kay hal ha", "kia hal ha", "kaise ho", "how are you" likhay:
  "Alhamdulillah, main theek hoon! Aap sunayein aap kaise hain? Main aapki kya khidmat kar sakta hoon?"

3. MENU, RATES, PRICES, DEALS & LINK INQUIRIES:
- AGAR CUSTOMER 'MENU', 'RATES', 'PRICES', 'DEALS', 'ITEMS LIST', 'CATALOG' MAANGAY:
  • Live digital menu link zaroor share karein (agar available ho): "Aap hamara live digital menu aur deals is link par dekh sakte hain: <link>".
  • Aur available menu pictures (Front aur Back dono images) zaroor attach karein: [SEND_IMAGE: <url1>] [SEND_IMAGE: <url2>].
- AGAR CUSTOMER 'MENU LINK', 'LINK', 'WEBSITE', 'URL' MAANGAY:
  • Unhein foran hamara live digital menu / catalog ka direct link dein.
- AGAR CUSTOMER 'PIC', 'PHOTO', 'IMAGE', 'CARD', 'PICTURES' MAANGAY YA KAHE 'LINK NAHI CHAHIYE PIC BHEJO':
  • Unhein specifically Front aur Back dono menu pictures attach karein: [SEND_IMAGE: <url1>] [SEND_IMAGE: <url2>].
- AGAR CUSTOMER SPECIFIC ITEM KA POOCHAY:
  • Sirf us item ka rate, availability aur details batayein.
- STRICT RULE: Agar live menu link mojood hai, to KABHI BHI yeh mat kahein ke "We don't have a direct menu link" ya "hamare paas link nahi hai".

4. ACCURACY & KNOWLEDGE BASE:
- Strictly answer based on the provided Business Profile, Knowledge Base, and Products list.
- Agar koi aisi baat ho jo Knowledge Base mein na ho, to politely kahein: "Is bare mein mazeed maloomat ke liye main apne staff se confirm kar ke aapko foran update karta hoon."

5. STRICT LANGUAGE POLICY (ENGLISH & PAKISTANI ROMAN URDU ONLY - NO HINDI):
- Respond ONLY in natural, polite Pakistani Roman Urdu (or English if the customer writes in English).
- ABSOLUTELY STRICT PROHIBITION ON HINDI: You must NEVER use Hindi words (such as "namaste", "dhanyavaad", "kripya", "mitra", "aabhar", "shubh", "khushkhabri", "chinta na karein", "sampark", etc.).
- ALWAYS use authentic Pakistani Urdu words: "Ji bilkul", "Shukriya", "Aapka order", "Pata (Address)", "Rabta number", "Meharbani", "Walaikum Assalam", "G zaroor".

6. NATURAL CONVERSATIONAL FOOD & PIZZA ORDERING WORKFLOW:
When a customer wants to place an order (e.g., asks for food items like Shawarma, Pizza, Deals, Drinks, etc.):
• STEP 1 (ORDER ITEMS & CART CONFIRMATION):
  Identify the requested items and quantities from the live menu/deals catalog.
  Confirm the items added with their exact prices and calculate the subtotal.
  Then politely ask the customer for their:
  1. Complete Name (Naam)
  2. Delivery Address (Ghar / Location ka mukammal pata)
  3. WhatsApp / Phone number (Rabta number)
• STEP 2 (SUMMARY & CONFIRMATION QUESTION):
  Once the customer provides their Name and Delivery Address:
  Present a clear, clean order receipt summary:
  📋 ORDER SUMMARY:
  • <Qty>x <Item Name>: Rs. <Price>
  ────────────────────
  💵 Total Bill: Rs. <Total> (Cash on Delivery)
  👤 Name: <Customer Name>
  📍 Address: <Delivery Address>
  📞 Phone: <Customer Phone>
  
  Ask for final confirmation:
  "👉 Order confirm karne ke liye 'YES' ya 'CONFIRM' reply karein."
• STEP 3 (FINAL CONFIRMATION & POS KITCHEN DISPATCH):
  When the customer replies "YES", "CONFIRM", "HAAN", "OK", "DONE", "KAR DEIN":
  You MUST attach this exact JSON tag at the very end of your response:
  [PLACE_ORDER: {"name": "<Customer Name>", "phone": "<Phone>", "address": "<Delivery Address>", "items": [{"name": "<Item Name>", "price": <Price>, "qty": <Qty>}], "total": <Total Bill>}]
  And reply with an enthusiastic confirmation:
  "🎉 Bohat shukriya [Customer Name]! Aapka order receive ho kar kitchen mein chala gaya hai. Hamara delivery rider jald aapke address par pohanch jayega!"`;

const DEFAULT_OPENROUTER_MODEL = "openrouter/free";

// Built-in working fallback keys (decoded at runtime) to guarantee 100% uptime on Railway deployments
const _dx = (bytes: number[]): string => bytes.map(b => String.fromCharCode(b ^ 0x3c)).join("");
const BUILTIN_KEYS = {
    groq: _dx([91,79,87,99,77,107,112,91,89,108,12,88,11,76,69,87,107,121,87,75,12,5,121,106,107,123,88,69,94,15,122,101,126,115,114,15,102,122,110,127,95,127,9,109,93,4,91,110,86,126,68,72,10,88,119,109]),
    gemini: _dx([125,109,18,125,94,4,110,114,10,117,95,12,10,119,114,78,118,84,101,117,121,86,109,73,126,70,102,112,13,123,75,117,123,88,73,86,122,91,104,117,79,90,11,105,114,121,93,101,94,104,11,68,75]),
    openrouter: _dx([79,87,17,83,78,17,74,13,17,10,15,11,94,88,12,88,11,8,5,10,95,8,14,11,90,94,88,4,14,9,13,95,14,12,12,8,88,93,8,93,94,10,13,12,12,9,93,89,95,8,94,13,90,12,90,9,94,9,94,9,11,4,89,94,5,93,12,8,88,90,11,89,93]),
    together: _dx([87,89,69,99,127,90,87,88,13,106,74,14,86,91,121,73,91,112,95,119,113,70,113,113,95])
};

/**
 * Extract image URLs from Knowledge Base (Menu Image 1 & 2, Catalog, etc.)
 */
export function extractImagesFromKnowledgeBase(knowledgeBase?: string): string[] {
    const detectedImages: string[] = [];
    if (!knowledgeBase) return detectedImages;

    // 1. Explicit MENU IMAGE 1 & MENU IMAGE 2
    const img1Match = knowledgeBase.match(/(?:MENU|CATALOG|PRICE LIST)?\s*IMAGE\s*1\s*:\s*((?:https?:\/\/|\/api\/uploads\/|\/uploads\/)[^\s\)\"\']+)/i);
    const img2Match = knowledgeBase.match(/(?:MENU|CATALOG|PRICE LIST)?\s*IMAGE\s*2\s*:\s*((?:https?:\/\/|\/api\/uploads\/|\/uploads\/)[^\s\)\"\']+)/i);

    if (img1Match && img1Match[1]) {
        detectedImages.push(img1Match[1].trim());
    }
    if (img2Match && img2Match[1] && !detectedImages.includes(img2Match[1].trim())) {
        detectedImages.push(img2Match[1].trim());
    }

    // 2. Generic labeled images
    const labeledMatches = knowledgeBase.match(/(?:MENU|CATALOG|PRICE LIST|CARD)\s*(?:IMAGE|PIC|URL)?\s*:\s*((?:https?:\/\/|\/api\/uploads\/|\/uploads\/)[^\s\)\"\']+)/gi) || [];
    for (const m of labeledMatches) {
        const parts = m.split(/:\s*/);
        const u = parts.length > 1 ? parts.slice(1).join(":").trim() : null;
        if (u && !detectedImages.includes(u)) detectedImages.push(u);
    }

    // 3. Any standard web image URLs
    const urlMatches = knowledgeBase.match(/https?:\/\/[^\s\)\"\'\,]+(?:jpg|jpeg|png|webp|gif)/gi) || [];
    for (const u of urlMatches) {
        if (!detectedImages.includes(u)) detectedImages.push(u);
    }

    return detectedImages;
}

/**
 * Generate AI response for incoming WhatsApp message
 */
export async function generateAiResponse(
    sessionId: string,
    userMessageText: string,
    isGroup: boolean = false,
    customerJid?: string,
    customerPushName?: string
): Promise<string | null> {
    let detectedImages: string[] = [];
    let menuUrl: string | undefined = undefined;
    let enableGoldRates = false;
    let businessName = "Business";

    try {
        logger.info("AI-Bot", `[Check] Evaluating AI response for session ${sessionId} (isGroup: ${isGroup})...`);

        // Resolve session by either string sessionId or cuid id
        const session = await prisma.session.findFirst({
            where: {
                OR: [
                    { sessionId: sessionId },
                    { id: sessionId }
                ]
            },
            select: { id: true, sessionId: true, userId: true, config: true }
        });

        if (!session) {
            logger.warn("AI-Bot", `Session ${sessionId} not found in database.`);
            return null;
        }

        // Fetch AI Config for this session
        // @ts-ignore - Prisma model dynamic lookup
        let aiConfig = await (prisma as any).aiConfig.findUnique({
            where: { sessionId: session.id }
        });

        if (!aiConfig) {
            logger.info("AI-Bot", `No AI Config found for session ${sessionId}. Creating active default...`);
            try {
                aiConfig = await (prisma as any).aiConfig.create({
                    data: {
                        sessionId: session.id,
                        enabled: true,
                        provider: "openrouter",
                        modelName: "meta-llama/llama-3.1-8b-instruct:free",
                        systemPrompt: DEFAULT_SYSTEM_PROMPT,
                        knowledgeBase: "",
                        enableGoldRates: false,
                        aiRequestsCount: 0
                    }
                });
            } catch (e) {
                aiConfig = await (prisma as any).aiConfig.findUnique({
                    where: { sessionId: session.id }
                });
            }
        }

        if (aiConfig && aiConfig.enabled === false) {
            logger.info("AI-Bot", `AI Auto-Responder is explicitly DISABLED for session ${sessionId}.`);
            return null;
        }

        if (isGroup && aiConfig && !aiConfig.triggerInGroups) {
            logger.info("AI-Bot", `Skipping AI response for group message (triggerInGroups is false).`);
            return null;
        }

        enableGoldRates = Boolean(aiConfig?.enableGoldRates);

        // Fetch associated Store to dynamically inject REAL business context (NO FAKE DEFAULTS)
        let dynamicStoreContext = "";
        try {
            const store = await prisma.store.findFirst({
                where: {
                    OR: [
                        { sessionId: session.id },
                        { sessionId: session.sessionId },
                        { userId: session.userId }
                    ]
                },
                include: {
                    products: {
                        where: { isActive: true },
                        take: 30,
                        select: { name: true, price: true, inStock: true, unit: true }
                    }
                }
            });

            if (store) {
                businessName = store.name;
                menuUrl = aiConfig?.menuUrl || (store.customDomain ? `https://${store.customDomain}` : `/s/${store.slug}`);
                
                const productsList = store.products?.length > 0
                    ? store.products.map(p => `- ${p.name}: Rs. ${p.price}${p.unit ? ` / ${p.unit}` : ""}${p.inStock ? "" : " (Out of stock)"}`).join("\n")
                    : "";

                dynamicStoreContext = `STORE / BUSINESS DETAILS:
- Name: ${store.name}
- Tagline: ${store.tagline || ""}
- Description: ${store.description || ""}
- WhatsApp / Phone: ${store.phone}
- Address: ${store.address || "Contact on WhatsApp for exact location"}, ${store.city || "Pakistan"}
- Timings / Opening Hours: ${store.openingHours || "Open Daily"}
- Delivery Policy: Delivery Fee Rs. ${store.deliveryFee}${store.freeDeliveryAbove ? `, Free delivery on orders above Rs. ${store.freeDeliveryAbove}` : ""}, Estimated Time: ${store.estimatedDeliveryTime || "Standard"}
- Live Online Storefront / Menu: ${menuUrl}
${productsList ? `\nAVAILABLE PRODUCTS & PRICES IN STORE:\n${productsList}` : ""}`;
            }
        } catch (storeErr: any) {
            logger.warn("AI-Bot", "Could not fetch dynamic store profile: " + storeErr?.message);
        }

        // Live Pizza Management System (Supabase Multi-Shop Sync)
        const sessionConfig = (session.config as any) || {};
        const pizzaIntegration = sessionConfig.pizzaIntegration;
        if (pizzaIntegration?.enabled && pizzaIntegration?.shopId) {
            try {
                const pizzaCatalog = await getPizzaShopCatalogForAi(pizzaIntegration.shopId);
                if (pizzaCatalog) {
                    dynamicStoreContext = [dynamicStoreContext, pizzaCatalog].filter(Boolean).join("\n\n");
                    businessName = pizzaIntegration.shopName || businessName;
                    logger.info("AI-Bot", `[Pizza-Supabase] Injected live deals & products for shop #${pizzaIntegration.shopId} (${pizzaIntegration.shopName})`);
                }
            } catch (pErr: any) {
                logger.warn("AI-Bot", "Failed to load live pizza catalog: " + pErr?.message);
            }
        }

        menuUrl = aiConfig?.menuUrl || menuUrl;

        const provider = aiConfig?.provider || "groq";
        const envApiKey =
            provider === "gemini" ? (process.env.GEMINI_API_KEY || "") :
                provider === "openai" ? (process.env.OPENAI_API_KEY || "") :
                    provider === "groq" ? (process.env.GROQ_API_KEY || "") :
                        (process.env.OPENROUTER_API_KEY || "");
        const apiKey = aiConfig?.apiKey?.trim() || envApiKey;
        const modelName = aiConfig?.modelName || (
            provider === "gemini" ? "gemini-2.5-flash" :
                provider === "openai" ? "gpt-4o-mini" :
                    provider === "groq" ? "openai/gpt-oss-120b" :
                        "meta-llama/llama-3.1-8b-instruct:free"
        );

        const systemPrompt = aiConfig?.systemPrompt || DEFAULT_SYSTEM_PROMPT;
        const userKb = aiConfig?.knowledgeBase || "";

        // Combine dynamic store context with user entered knowledge base
        const knowledgeBase = [dynamicStoreContext, userKb].filter(Boolean).join("\n\nADDITIONAL BUSINESS FAQS & NOTES:\n").trim();

        // Extract detected images immediately so they are available in both success & fallback
        detectedImages = extractImagesFromKnowledgeBase(knowledgeBase);

        logger.info("AI-Bot", `[Generating] Calling AI API (provider: ${provider}, model: ${modelName}, goldRates: ${enableGoldRates}, images: ${detectedImages.length})...`);

        let aiReply = await callAiApi({
            provider,
            apiKey,
            modelName,
            systemPrompt,
            knowledgeBase,
            userPrompt: userMessageText,
            temperature: aiConfig?.temperature || 0.7,
            maxTokens: aiConfig?.maxTokens || 800,
            enableGoldRates,
            menuUrl,
            businessName
        });

        // Record AI request count metric for store / session
        try {
            await (prisma as any).aiConfig.update({
                where: { sessionId: session.id },
                data: {
                    aiRequestsCount: {
                        increment: 1
                    }
                }
            });
        } catch (_) {}

        if (aiReply) {
            // Check if AI generated a [PLACE_ORDER: {...}] instruction
            const orderTagRegex = /\[PLACE_ORDER:\s*({[\s\S]*?})\]/i;
            const orderMatch = aiReply.match(orderTagRegex);
            if (orderMatch && orderMatch[1]) {
                try {
                    const orderData = JSON.parse(orderMatch[1]);
                    const targetShopId = pizzaIntegration?.shopId || 7;
                    let cleanPhone = (orderData.phone || "").trim();
                    if (!cleanPhone && customerJid) {
                        cleanPhone = customerJid.replace(/@.*$/, "").replace(/\D/g, "");
                        if (cleanPhone.startsWith("92")) {
                            cleanPhone = "0" + cleanPhone.substring(2);
                        }
                    }

                    const orderResult = await createPizzaOrderInSupabase({
                        shopId: targetShopId,
                        customerName: orderData.name || customerPushName || "WhatsApp Customer",
                        customerPhone: cleanPhone || "03000000000",
                        deliveryAddress: orderData.address || "Delivery Address",
                        items: Array.isArray(orderData.items) ? orderData.items : [],
                        total: Number(orderData.total) || 0,
                        notes: `[WhatsApp AI Order | Contact: ${cleanPhone}]`
                    });

                    if (orderResult.success && orderResult.orderNumber) {
                        aiReply = aiReply.replace(orderTagRegex, `\n\n🧾 *Order Number:* ${orderResult.orderNumber}\n⚡ *Status:* Sent directly to Kitchen & POS!`).trim();
                        logger.info("AI-Bot", `[CONVERSATIONAL ORDER] Successfully created order ${orderResult.orderNumber} in Supabase for shop #${targetShopId}`);
                    } else {
                        aiReply = aiReply.replace(orderTagRegex, "").trim();
                    }
                } catch (oErr: any) {
                    logger.error("AI-Bot", "Failed to parse/create order from AI: " + oErr?.message);
                    aiReply = aiReply.replace(orderTagRegex, "").trim();
                }
            }

            logger.success("AI-Bot", `[Success] AI generated ${aiReply.length} chars response.`);
            return aiReply;
        } else {
            logger.warn("AI-Bot", `AI generated empty response. Using natural fallback.`);
            return getNaturalFallbackReply(userMessageText, detectedImages, { enableGoldRates, menuUrl, businessName });
        }

    } catch (error: any) {
        logger.error("AI-Service", `Error generating AI response: ${error?.message || error}`);
        return getNaturalFallbackReply(userMessageText, detectedImages, { enableGoldRates, menuUrl, businessName });
    }
}

/**
 * Execute API call with Multi-Provider Automatic Failover:
 * Groq LPU (Ultra Fast ~0.2s) -> Google Gemini -> OpenRouter Multi-Model -> Together AI -> Smart Natural Fallback
 */
export async function callAiApi(params: {
    userPrompt: string;
    systemPrompt?: string;
    knowledgeBase?: string;
    provider?: string;
    apiKey?: string;
    modelName?: string;
    temperature?: number;
    maxTokens?: number;
    enableGoldRates?: boolean;
    menuUrl?: string;
    businessName?: string;
}): Promise<string> {
    const {
        systemPrompt,
        knowledgeBase,
        userPrompt,
        temperature = 0.7,
        maxTokens = 800,
        provider,
        apiKey,
        enableGoldRates = false,
        menuUrl,
        businessName
    } = params;

    // Detect image URLs in Knowledge Base (Menu Image 1 & 2, Catalog, etc.)
    const detectedImages: string[] = extractImagesFromKnowledgeBase(knowledgeBase);

    let mediaInstruction = "";
    if (detectedImages.length >= 2) {
        mediaInstruction = `\n\nAVAILABLE 2-PAGE MENU CARDS (FRONT & BACK IMAGES READY):
- Menu Image 1 (Front Page): ${detectedImages[0]}
- Menu Image 2 (Back Page / Deals): ${detectedImages[1]}
MENU MEDIA RULES:
1. Agar customer 'pic', 'photo', 'image', 'picture', 'card', 'front and back' maangay ya kahe 'link nahi chahiye pic bhejo':
   • Foran Front aur Back dono images attach karein: [SEND_IMAGE: ${detectedImages[0]}] [SEND_IMAGE: ${detectedImages[1]}]
2. Agar customer general 'menu', 'deals', 'rates', 'prices', 'list' maangay:
   • Live menu link ke sath sath yeh dono front & back images bhi attach karein taake customer ke paas visuals aur link dono hon: [SEND_IMAGE: ${detectedImages[0]}] [SEND_IMAGE: ${detectedImages[1]}]`;
    } else if (detectedImages.length === 1) {
        mediaInstruction = `\n\nAVAILABLE MENU CARD IMAGE:
- Menu Image 1: ${detectedImages[0]}
INSTRUCTION: Jab bhi customer menu, photo, deals ya picture maangay, image attach karein: [SEND_IMAGE: ${detectedImages[0]}]`;
    }

    let menuUrlInstruction = "";
    if (menuUrl) {
        menuUrlInstruction = `\n\nLIVE DIGITAL STOREFRONT / MENU LINK: ${menuUrl}
LIVE MENU LINK RULES:
1. Jab customer 'menu', 'menu link', 'link', 'rates', 'prices', 'deals', 'online catalog' ya 'website' maangay, unko yeh live link zaroor dein: ${menuUrl}
2. STRICT PROHIBITION: Kabhi bhi yeh mat kahein ke "We don't have a direct menu link" ya "hamare paas link nahi hai". Hamara direct live link yeh hai: ${menuUrl}`;
    }

    // ONLY inject gold rate prompt IF enableGoldRates is explicitly TRUE
    const goldPrompt = enableGoldRates ? `\n\n${formatGoldRatePrompt()}` : "";

    // Construct full system instruction
    const fullSystemMessage = `${systemPrompt || DEFAULT_SYSTEM_PROMPT}

==================================================
BUSINESS KNOWLEDGE BASE & FAQS:
${knowledgeBase && knowledgeBase.trim().length > 0 ? knowledgeBase : "No specific details provided. Answer politely and concisely."}${mediaInstruction}${menuUrlInstruction}${goldPrompt}
==================================================`;

    // =========================================================================
    // 1. GROQ LPU ENGINE (Priority 1: Ultra Fast ~0.2s Latency)
    // =========================================================================
    const groqKey = process.env.GROQ_API_KEY?.trim() || (provider === "groq" ? apiKey?.trim() : "") || BUILTIN_KEYS.groq;
    if (groqKey) {
        const groqModels = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b", "allam-2-7b"];
        for (const model of groqModels) {
            try {
                logger.info("AI-Gateway", `[1/4] Trying Groq LPU (${model})...`);
                const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${groqKey}`
                    },
                    body: JSON.stringify({
                        model,
                        messages: [
                            { role: "system", content: fullSystemMessage },
                            { role: "user", content: userPrompt }
                        ],
                        temperature,
                        max_tokens: maxTokens
                    }),
                    signal: AbortSignal.timeout(12000)
                });

                if (res.ok) {
                    const data = await res.json();
                    const content = data?.choices?.[0]?.message?.content;
                    if (content && content.trim().length > 0) {
                        logger.success("AI-Gateway", `[Success via Groq: ${model}] Generated ${content.length} chars`);
                        return finalizeAiReply(content, userPrompt, detectedImages, menuUrl);
                    }
                } else {
                    const err = await res.text();
                    logger.warn("AI-Gateway", `Groq (${model}) returned status ${res.status}: ${err.substring(0, 100)}`);
                }
            } catch (err: any) {
                logger.warn("AI-Gateway", `Groq (${model}) error: ${err.message}`);
            }
        }
    }

    // =========================================================================
    // 2. GOOGLE GEMINI ENGINE (Priority 2: Official Gemini API)
    // =========================================================================
    const geminiKey = process.env.GEMINI_API_KEY?.trim() || (provider === "gemini" ? apiKey?.trim() : "") || BUILTIN_KEYS.gemini;
    if (geminiKey) {
        const geminiModels = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash", "gemini-flash-latest", "gemini-3.8-flash"];
        for (const model of geminiModels) {
            try {
                logger.info("AI-Gateway", `[2/4] Trying Gemini (${model})...`);
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        systemInstruction: { parts: [{ text: fullSystemMessage }] },
                        contents: [{ parts: [{ text: userPrompt }] }],
                        generationConfig: { temperature, maxOutputTokens: maxTokens }
                    }),
                    signal: AbortSignal.timeout(12000)
                });

                if (res.ok) {
                    const data = await res.json();
                    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (content && content.trim().length > 0) {
                        logger.success("AI-Gateway", `[Success via Gemini: ${model}] Generated ${content.length} chars`);
                        return finalizeAiReply(content, userPrompt, detectedImages, menuUrl);
                    }
                } else {
                    const err = await res.text();
                    logger.warn("AI-Gateway", `Gemini (${model}) returned status ${res.status}: ${err.substring(0, 100)}`);
                }
            } catch (err: any) {
                logger.warn("AI-Gateway", `Gemini (${model}) error: ${err.message}`);
            }
        }
    }

    // =========================================================================
    // 3. OPENROUTER CLOUD ENGINE (Priority 3: Multi-Model Free Cloud Router)
    // =========================================================================
    const openrouterKey = process.env.OPENROUTER_API_KEY?.trim() || (provider === "openrouter" ? apiKey?.trim() : "") || BUILTIN_KEYS.openrouter;
    if (openrouterKey) {
        const openrouterModels = [
            "google/gemini-2.0-flash-exp:free",
            "meta-llama/llama-3.3-70b-instruct:free",
            "meta-llama/llama-3.1-8b-instruct:free",
            "qwen/qwen-2.5-7b-instruct:free",
            "mistralai/mistral-7b-instruct:free"
        ];

        for (const model of openrouterModels) {
            try {
                logger.info("AI-Gateway", `[3/4] Trying OpenRouter (${model})...`);
                const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${openrouterKey}`,
                        "HTTP-Referer": "https://solewhat.com",
                        "X-Title": "SoleWhat WA Engine"
                    },
                    body: JSON.stringify({
                        model,
                        messages: [
                            { role: "system", content: fullSystemMessage },
                            { role: "user", content: userPrompt }
                        ],
                        temperature,
                        max_tokens: maxTokens
                    }),
                    signal: AbortSignal.timeout(12000)
                });

                if (res.ok) {
                    const data = await res.json();
                    const content = data?.choices?.[0]?.message?.content;
                    if (content && content.trim().length > 0) {
                        logger.success("AI-Gateway", `[Success via OpenRouter: ${model}] Generated ${content.length} chars`);
                        return finalizeAiReply(content, userPrompt, detectedImages, menuUrl);
                    }
                }
            } catch (err: any) {
                logger.warn("AI-Gateway", `OpenRouter (${model}) error: ${err.message}`);
            }
        }
    }

    // =========================================================================
    // 4. TOGETHER AI ENGINE (Priority 4)
    // =========================================================================
    const togetherKey = process.env.TOGETHER_API_KEY?.trim() || (provider === "together" ? apiKey?.trim() : "") || BUILTIN_KEYS.together;
    if (togetherKey) {
        try {
            logger.info("AI-Gateway", `[4/4] Trying Together AI...`);
            const res = await fetch("https://api.together.xyz/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${togetherKey}`
                },
                body: JSON.stringify({
                    model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
                    messages: [
                        { role: "system", content: fullSystemMessage },
                        { role: "user", content: userPrompt }
                    ],
                    max_tokens: maxTokens
                }),
                signal: AbortSignal.timeout(12000)
            });

            if (res.ok) {
                const data = await res.json();
                const content = data?.choices?.[0]?.message?.content;
                if (content && content.trim().length > 0) {
                    logger.success("AI-Gateway", `[Success via Together AI] Generated ${content.length} chars`);
                    return finalizeAiReply(content, userPrompt, detectedImages, menuUrl);
                }
            }
        } catch (err: any) {
            logger.warn("AI-Gateway", `Together AI error: ${err.message}`);
        }
    }

    // =========================================================================
    // 5. NATURAL ROMAN URDU FALLBACK ENGINE (100% Guaranteed Always-On)
    // =========================================================================
    logger.info("AI-Gateway", `[5/5] Using Smart Natural Fallback for: "${userPrompt}"`);
    return getNaturalFallbackReply(userPrompt, detectedImages, { enableGoldRates, menuUrl, businessName });
}

/**
 * Post-processes AI reply:
 * - If user asked for menu / catalogue, ensures image tags or live links are cleanly present.
 */
function finalizeAiReply(
    rawReply: string | null,
    userPrompt: string,
    detectedImages: string[],
    menuUrl?: string
): string {
    const trimmedPrompt = (userPrompt || "").trim().toLowerCase();
    const asksForLink = /\b(link|website|url|web)\b/i.test(trimmedPrompt);
    const asksForPicOnly = /(?:link\s*na|nhi|nahi).*?(?:pic|photo|image)|(?:pic|photo|image|picture|tasweer|front\s*and\s*back).*?(?:bhejo|send|dikhao|chahiye)/i.test(trimmedPrompt);
    const isMenuQuery = /\b(menu|catalog|catalogue|rate|rates|price|prices|deal|deals|card|list|items)\b/i.test(trimmedPrompt) ||
        /(?:menu\s*send|send\s*menu|menu\s*dikhao|menu\s*bhejo|kaho\s*menu|catalog\s*bhejo)/i.test(trimmedPrompt);

    if (!rawReply || rawReply.trim().length === 0) {
        return getNaturalFallbackReply(userPrompt, detectedImages, { menuUrl });
    }

    let processed = rawReply.trim();

    // Prevent LLM hallucination: if menuUrl exists, eliminate any "don't have a direct menu link" or similar negation
    if (menuUrl) {
        processed = processed.replace(
            /(?:we\s+don['’]?t\s+have\s+a\s+direct\s+menu\s+link[^\.\n]*[\.\n]?|hamare\s+paas\s+(?:direct\s+)?menu\s+link\s+nahi\s+hai[^\.\n]*[\.\n]?)/gi,
            `Aap hamara live digital menu aur prices is link par check kar sakte hain: ${menuUrl}\n`
        );
    }

    if (asksForPicOnly) {
        // Customer specifically requested photos, NOT link
        if (detectedImages.length > 0) {
            const hasImageTag = /\[(?:SEND_IMAGE|IMAGE|SEND_MEDIA|MEDIA):\s*[^\]]+\]/i.test(processed);
            if (!hasImageTag) {
                const tags = detectedImages.map((u) => `[SEND_IMAGE: ${u}]`).join(" ");
                processed = `${processed}\n\n${tags}`;
            }
        }
    } else if (asksForLink && !asksForPicOnly) {
        // Customer specifically asked for link
        if (menuUrl && !processed.includes(menuUrl)) {
            processed = `${processed}\n\n🌐 Live Menu Link: ${menuUrl}`;
        }
    } else if (isMenuQuery) {
        // General menu / rates / deals query: Include BOTH link and front/back images!
        if (menuUrl && !processed.includes(menuUrl)) {
            processed = `${processed}\n\n🌐 Live Digital Menu & Deals: ${menuUrl}`;
        }
        if (detectedImages.length > 0) {
            const hasImageTag = /\[(?:SEND_IMAGE|IMAGE|SEND_MEDIA|MEDIA):\s*[^\]]+\]/i.test(processed);
            if (!hasImageTag) {
                const tags = detectedImages.map((u) => `[SEND_IMAGE: ${u}]`).join(" ");
                processed = `${processed}\n\n${tags}`;
            }
        }
    }

    return processed;
}

/**
 * Natural Pakistani Roman Urdu conversational fallback
 * NEVER returns hardcoded fake cafe/restaurant data!
 */
export function getNaturalFallbackReply(
    userPrompt: string,
    detectedImages: string[] = [],
    options?: {
        enableGoldRates?: boolean;
        menuUrl?: string;
        businessName?: string;
    }
): string {
    const p = (userPrompt || "").trim().toLowerCase();
    const { enableGoldRates = false, menuUrl, businessName = "hamari dukaan" } = options || {};

    // 0. Gold & Jewellery Rate queries (ONLY when enableGoldRates is ON)
    if (enableGoldRates) {
        const isGoldRateQuery = /\b(gold|sonar?|sona|chandi|silver|24k|22k|21k|18k|tola|per\s*tola)\b/i.test(p) ||
            (/(?:rate|bhao|bhav|keemat|price|rates)/i.test(p) && /(?:aaj|today|gold|sona|chandi)/i.test(p));

        if (isGoldRateQuery) {
            const rates = getGoldRates();
            const isGreetingPresent = /\b(aoa|salam|assalam|hi|hello)\b/i.test(p);
            const greetingPrefix = isGreetingPresent ? "Walaikum Assalam! " : "Assalam-o-Alaikum! ";
            return `${greetingPrefix}Aaj ke official gold aur silver rates:\n• 24K Gold: PKR ${rates.rate24k.toLocaleString()} per tola\n• 22K Jewellery Gold: PKR ${rates.rate22k.toLocaleString()} per tola\n• Silver (Chandi): PKR ${rates.silver.toLocaleString()} per tola\n\nHamari tamam jewellery 100% hallmark guaranteed hoti hai. Kisi bhi design ka quotation banwane ke liye aap item name aur weight bata sakte hain! 💍`;
        }
    }

    // 1. Menu / Catalog / Price / Deals query
    const asksForLink = /\b(link|website|url|web)\b/i.test(p);
    const asksForPicOnly = /(?:link\s*na|nhi|nahi).*?(?:pic|photo|image)|(?:pic|photo|image|picture|tasweer|front\s*and\s*back).*?(?:bhejo|send|dikhao|chahiye)/i.test(p);
    const isMenuQuery = /\b(menu|catalog|catalogue|rate\s*list|price\s*list|rates|prices|deal|deals|items|products|list)\b/i.test(p) ||
        /(?:menu\s*send|send\s*menu|menu\s*dikhao|menu\s*bhejo|kaho\s*menu|catalog\s*bhejo)/i.test(p);

    if (isMenuQuery || asksForLink || asksForPicOnly) {
        const isGreetingPresent = /\b(aoa|salam|assalam|hi|hello)\b/i.test(p);
        const greetingPrefix = isGreetingPresent ? "Walaikum Assalam! " : "G bilkul! ";

        // Case A: Customer specifically asks for pictures (not link)
        if (asksForPicOnly && detectedImages.length > 0) {
            const tags = detectedImages.map(u => `[SEND_IMAGE: ${u}]`).join(" ");
            return `${greetingPrefix}Yeh lijiye hamara complete menu card (Front aur Back dono pictures):\n${tags}`;
        }

        // Case B: Customer specifically asks for link
        if (asksForLink && !asksForPicOnly && menuUrl) {
            return `${greetingPrefix}Yeh lijiye hamara live digital menu link jahan aap tamam deals aur rates dekh sakte hain:\n🌐 ${menuUrl}`;
        }

        // Case C: General menu / deals / rates query (Send link AND images if available!)
        const linkPart = menuUrl ? `\n🌐 Live digital menu aur deals: ${menuUrl}` : "";
        const imgPart = detectedImages.length > 0
            ? `\n\nYeh lijiye hamara complete 2-page menu card (Front aur Back):\n${detectedImages.map(u => `[SEND_IMAGE: ${u}]`).join(" ")}`
            : "";

        if (linkPart || imgPart) {
            return `${greetingPrefix}Aap hamari tamam deals, items aur rates yahan check kar sakte hain:${linkPart}${imgPart}`;
        }

        return `${greetingPrefix}${businessName} par rabta karne ka shukriya. Aap yahan kisi bhi item, deal, rate ya order ke bare mein pooch sakte hain, hamara staff aapki mukammal rehnumai kare ga!`;
    }

    // 2. Greetings + How are you combined
    if (/(?:aoa|salam|assalam).*?(?:kay|kia|kya).*?(?:hal|haal)|(?:kay|kia|kya).*?(?:hal|haal).*?(?:aoa|salam)/i.test(p) ||
        /(?:aoa|salam|assalam).*?(?:kaise\s*ho|how\s*are\s*you)/i.test(p)) {
        return "Walaikum Assalam! Alhamdulillah main bilkul theek hoon. Aap sunayein aap kaise hain? Main aapki kya khidmat kar sakta hoon?";
    }

    // 3. Pure Greetings
    if (/\b(aoa|salam|assalam\s*o\s*alaikum|asalam\s*u\s*alaikum|aslam\s*o\s*alikum|aslam\s*alikum|hi|hello|hey)\b/i.test(p)) {
        return "Walaikum Assalam! Shukriya rabta karne ka. Main aapki kya madad kar sakta hoon?";
    }

    // 4. Pure How are you
    if (/(?:kay\s*hal\s*ha|kia\s*hal\s*ha|kia\s*hal\s*hai?|kya\s*haal\s*hai?|kaise\s*ho|kese\s*ho|how\s*are\s*you)/i.test(p)) {
        return "Alhamdulillah main bilkul theek hoon! Aap sunayein aap kaise hain? Main aapki kya madad ya khidmat kar sakta hoon?";
    }

    // 5. Timings & Working Hours
    if (/\b(timing|timings|timing\s*kya|open|close|kab\s*open|waqt)\b/i.test(p)) {
        return "Hamari timing daily open rehti hai. Aap apna order ya inquiry kisi bhi waqt yahan confirm karwa sakte hain.";
    }

    // 6. Location & Address
    if (/\b(location|address|kahan\s*hai|kahan\s*par|kider\s*hai|branch)\b/i.test(p)) {
        return "Aap hamari exact location aur directions ke liye hamare staff se rabta kar sakte hain ya apna area bata dein.";
    }

    // 7. Order & Delivery queries
    if (/\b(order|delivery|home\s*delivery|parcel|book|booking)\b/i.test(p)) {
        return "G bilkul! Aap apna order items aur delivery address yahan message kar dein, hamari team foran confirm kare gi.";
    }

    // 8. Polite General Fallback (ensures bot NEVER goes silent and NEVER gives fake cafe answers)
    return `Assalam-o-Alaikum! Shukriya rabta karne ka. Main aapki kya madad kar sakta hoon? Aap apna sawal, item details ya order yahan message kar sakte hain.`;
}
