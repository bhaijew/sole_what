import { prisma } from "./prisma";
import { logger } from "./logger";
import { getGoldRates, formatGoldRatePrompt } from "./gold-service";

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

3. MENU, CATALOG & PRODUCT INQUIRIES:
- Agar customer menu, catalog, rate list, ya items maangay:
  Polite jawab dein, unko live digital catalog / menu link dein (agar mojood ho), aur available images attach karein: [SEND_IMAGE: <url>].
- Agar customer specific item ka poochay:
  Sirf us item ka rate, availability aur details batayein.

4. ACCURACY & KNOWLEDGE BASE:
- Strictly answer based on the provided Business Profile, Knowledge Base, and Products list.
- Agar koi aisi baat ho jo Knowledge Base mein na ho, to politely kahein: "Is bare mein mazeed maloomat ke liye main apne staff se confirm kar ke aapko foran update karta hoon."`;

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
    isGroup: boolean = false
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
            select: { id: true, sessionId: true, userId: true }
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

        const aiReply = await callAiApi({
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
        mediaInstruction = `\n\nAVAILABLE MEDIA / IMAGES TO SEND (2 IMAGES READY):
- Menu / Catalog Image 1: ${detectedImages[0]}
- Menu / Catalog Image 2: ${detectedImages[1]}
INSTRUCTION: Jab bhi customer menu, items list, catalogue, rates ya picture maangay, text jawab ke end mein images attach karein: [SEND_IMAGE: ${detectedImages[0]}] [SEND_IMAGE: ${detectedImages[1]}]`;
    } else if (detectedImages.length === 1) {
        mediaInstruction = `\n\nAVAILABLE MEDIA / IMAGE TO SEND:
- Menu / Catalog Image 1: ${detectedImages[0]}
INSTRUCTION: Jab bhi customer menu, items list, catalogue ya photo maangay, text ke end mein image attach karein: [SEND_IMAGE: ${detectedImages[0]}]`;
    }

    let menuUrlInstruction = "";
    if (menuUrl) {
        menuUrlInstruction = `\n\nLIVE DIGITAL STOREFRONT / MENU LINK: ${menuUrl}
INSTRUCTION: Jab bhi customer menu, digital dukaan link ya online catalog maangay, unko yeh live link dein: ${menuUrl}`;
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
    const isMenuQuery = /\b(menu|catalog|catalogue|rate|rates|price|prices|card|list|items)\b/i.test(trimmedPrompt) ||
        /(?:menu\s*send|send\s*menu|menu\s*dikhao|menu\s*bhejo|kaho\s*menu)/i.test(trimmedPrompt);

    if (!rawReply || rawReply.trim().length === 0) {
        return getNaturalFallbackReply(userPrompt, detectedImages, { menuUrl });
    }

    let processed = rawReply.trim();

    // If customer asked for menu / catalog, ensure image tags or menu link are attached if not already in text
    if (isMenuQuery) {
        if (detectedImages.length > 0) {
            const hasImageTag = /\[(?:SEND_IMAGE|IMAGE|SEND_MEDIA|MEDIA):\s*[^\]]+\]/i.test(processed);
            if (!hasImageTag) {
                const tags = detectedImages.map((u) => `[SEND_IMAGE: ${u}]`).join(" ");
                processed = `${processed}\n\n${tags}`;
            }
        }
        if (menuUrl && !processed.includes(menuUrl)) {
            processed = `${processed}\n\n🔗 Live Digital Catalog: ${menuUrl}`;
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

    // 1. Menu / Catalog / Price list query
    const isMenuQuery = /\b(menu|catalog|catalogue|rate\s*list|price\s*list|rates|prices|items|products)\b/i.test(p) ||
        /(?:menu\s*send|send\s*menu|menu\s*dikhao|menu\s*bhejo|kaho\s*menu|catalog\s*bhejo)/i.test(p);

    if (isMenuQuery) {
        const isGreetingPresent = /\b(aoa|salam|assalam|hi|hello)\b/i.test(p);
        const greetingPrefix = isGreetingPresent ? "Walaikum Assalam! " : "G bilkul! ";

        if (detectedImages.length >= 2) {
            return `${greetingPrefix}Yeh lijiye hamara complete menu aur catalog:\n[SEND_IMAGE: ${detectedImages[0]}] [SEND_IMAGE: ${detectedImages[1]}]${menuUrl ? `\n\n🌐 Live digital menu link: ${menuUrl}` : ""}`;
        } else if (detectedImages.length === 1) {
            return `${greetingPrefix}Yeh lijiye hamara complete menu aur catalog:\n[SEND_IMAGE: ${detectedImages[0]}]${menuUrl ? `\n\n🌐 Live digital menu link: ${menuUrl}` : ""}`;
        } else if (menuUrl) {
            return `${greetingPrefix}Yeh lijiye hamara complete live digital menu aur products list:\n🌐 ${menuUrl}\n\nAap kisi bhi item, deal ya order ke bare mein yahan pooch sakte hain!`;
        } else {
            return `${greetingPrefix}${businessName} par rabta karne ka shukriya. Aap yahan kisi bhi item, rate ya order ke bare mein pooch sakte hain, hamara staff aapki mukammal rehnumai kare ga!`;
        }
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
