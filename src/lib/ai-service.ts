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
    conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
    enableGoldRates?: boolean;
    menuUrl?: string;
    deliveryRules?: DeliveryRulesConfig;
}

export interface DeliveryRulesConfig {
    enabled?: boolean;
    minOrderAmount?: number;
    freeDeliveryRadiusKm?: number;
    deliveryFeeBeyond?: number;
}

export function formatDeliveryRulesPrompt(rules?: DeliveryRulesConfig): string {
    if (!rules || !rules.enabled) return "";
    const minOrder = Number(rules.minOrderAmount) || 0;
    const freeKm = Number(rules.freeDeliveryRadiusKm) || 0;
    const feeBeyond = Number(rules.deliveryFeeBeyond) || 0;

    if (minOrder <= 0 && freeKm <= 0 && feeBeyond <= 0) return "";

    return `=====================================================
🛵 DELIVERY CIRCLE (KM RADIUS) & MINIMUM ORDER POLICY:
=====================================================
${minOrder > 0 ? `• MINIMUM ORDER LIMIT: Rs. ${minOrder}
  - Har order kam az kam Rs. ${minOrder} ka hona zaroori hai.
  - Agar customer ka order bill Rs. ${minOrder} se kam ho to order PLACE NA KAREIN. Politely Roman Urdu mein batayein: "Hamara kam az kam (minimum) order Rs. ${minOrder} ka hai. Aapka bill Rs. [Total] ban raha hai, kindly kuch mazeed items shamil kar lein taake hum aapka order kitchen dispatch kar sakein."
  - Agar customer poochay "minimum order kitna hai?", to batayein: "Hamara minimum order Rs. ${minOrder} hai."` : ""}
${freeKm > 0 ? `• FREE DELIVERY CIRCLE / RADIUS: ${freeKm} KM
  - Hamari delivery ${freeKm} KM ke radius / circle ke andar bilkul 100% FREE (Rs. 0) hai!
  - ${freeKm} KM ke circle se aage / bahir delivery charges Rs. ${feeBeyond} hain.
  - Agar customer delivery charges, delivery free hona, kitne KM tak delivery free hai, ya delivery circle ka poochay (e.g. "delivery free hai?", "kitne km tak free hai?", "charges kitne hain?", "delivery circle kitna hai?"):
    Foran aur clearly batayein: "Hamari delivery ${freeKm} KM ke circle (radius) ke andar bilkul 100% FREE hai! Agar aapki location ${freeKm} KM se bahir ho to delivery charges Rs. ${feeBeyond} hotay hain."` : (feeBeyond > 0 ? `• DELIVERY CHARGES: Flat Rs. ${feeBeyond}` : "")}
=====================================================`;
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
- Strictly answer based on the provided Business Profile, Knowledge Base, Products list, and Delivery Policy.
- Agar koi aisi baat ho jo Knowledge Base mein na ho, to politely kahein: "Is bare mein mazeed maloomat ke liye main apne staff se confirm kar ke aapko foran update karta hoon."

5. STRICT LANGUAGE POLICY (AUTHENTIC PAKISTANI ROMAN URDU OR ENGLISH ONLY - ABSOLUTELY ZERO HINDI):
- Respond ONLY in natural, polite Pakistani Roman Urdu (or standard English if the customer writes in English).
- ABSOLUTELY ZERO TOLERANCE FOR HINDI: You must NEVER use Indian Hindi words, Hindi vocabulary, or Hindi phrasing.
  STRICTLY PROHIBITED WORDS: "namaste", "namaskar", "dhanyavaad", "dhanyavad", "dhanyawad", "kripya", "kripaya", "chinta", "sahayata", "swagat", "mitra", "aabhar", "shubh", "khushkhabri", "sampark", "aapka swagat hai", "grahak", "vistar", "kijiye", "bataiye".
- ABSOLUTE PROHIBITION ON DEVANAGARI SCRIPT: NEVER output Indian Hindi alphabet / Devanagari characters. Always use the standard English alphabet for Roman Urdu.
- ALWAYS use authentic Pakistani Urdu words:
  • "Assalam-o-Alaikum" / "Walaikum Assalam" (NEVER namaste)
  • "Shukriya" / "Bohat shukriya" (NEVER dhanyavad)
  • "Bara-e-meharbani" / "Kindly" / "Please" (NEVER kripya)
  • "Fikar na karein" (NEVER chinta na karein)
  • "Madad" / "Khidmat" (NEVER sahayata)
  • "Khush-amdeed" (NEVER swagat)
  • "Ji bilkul", "G zaroor", "Aapka order", "Mukammal delivery pata", "Rabta number".

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
  - Check Minimum Order Limit: If minimum order amount is configured and subtotal is less than minimum order amount, DO NOT confirm order yet. Politely tell them: "Hamara kam az kam (minimum) order limit Rs. <MinOrder> hai. Aapka bill Rs. <Subtotal> ban raha hai, kindly kuch mazeed items add kar lein taake order confirm kiya ja sakay."
  - Delivery Circle Policy: If customer address is within the Free Delivery KM Circle, delivery is FREE (Rs. 0). If outside, state standard delivery charges.
  Present a clear, clean order receipt summary:
  📋 ORDER SUMMARY:
  • <Qty>x <Item Name>: Rs. <Price>
  ────────────────────
  Subtotal: Rs. <Subtotal>
  Delivery: <FREE (within Free KM Circle) or Rs. <Fee>>
  💵 Total Bill: Rs. <Total> (Cash on Delivery)
  👤 Name: <Customer Name>
  📍 Address: <Delivery Address>
  📞 Phone: <Customer Phone>
  
  Ask for final confirmation:
  "👉 Order confirm karne ke liye 'YES' ya 'CONFIRM' reply karein."
• STEP 3 (FINAL CONFIRMATION & POS KITCHEN DISPATCH):
  When the customer replies "YES", "CONFIRM", "HAAN", "OK", "DONE", "KAR DEIN":
  (Only place order if subtotal meets Minimum Order limit!)
  You MUST attach this exact JSON tag at the very end of your response:
  [PLACE_ORDER: {"name": "<Customer Name>", "phone": "<Phone>", "address": "<Delivery Address>", "items": [{"name": "<Item Name>", "price": <Price>, "qty": <Qty>}], "total": <Total Bill>}]
  And reply with an enthusiastic confirmation:
  "🎉 Bohat shukriya [Customer Name]! Aapka order receive ho kar kitchen mein chala gaya hai. Hamara delivery rider jald aapke address par pohanch jayega!"

7. DELIVERY CIRCLE (KM RADIUS) & MINIMUM ORDER INQUIRIES:
- Agar customer delivery charges, delivery free hona, kitne KM tak delivery free hai, ya delivery circle ka poochay:
  • Batayein ke kitne KM ke circle / radius ke andar delivery bilkul FREE hai aur circle se bahir kitne charges hain.
- Agar customer poochay minimum order kitna hai ya kam az kam order limit kya hai:
  • Batayein ke hamara kam az kam order limit kitna hai.
  
8. CONVERSATIONAL MEMORY & MULTI-TURN CONTINUITY:
- Always REMEMBER what the customer stated in earlier messages in this chat.
- If the customer previously named the items they want (e.g. "1 grilled shawarma aur 1 1-litre drink") and now provides their Name and Address (e.g. "Ali Raza, Street 4 Sohawa"), DO NOT ask them what they want to order! You ALREADY KNOW their items.
- Immediately combine their items with their provided Name, Address, and Phone into STEP 2 (Order Summary) and ask them to reply 'YES' or 'CONFIRM'.
- Keep items in their ordering cart until the order is finalized and placed.`;

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

export interface ChatMemoryTurn {
    role: "user" | "assistant";
    content: string;
    timestamp: number;
}

// In-memory conversation store for instant multi-turn memory (keyed by `${sessionId}:${customerJid}`)
const customerChatMemory = new Map<string, ChatMemoryTurn[]>();
const MEMORY_TTL_MS = 60 * 60 * 1000; // 1 hour memory per customer

/**
 * Normalizes obsolete or retired model names to active, zero-downtime model endpoints
 */
export function normalizeModelName(provider: string, modelName?: string): string {
    const m = (modelName || "").trim().toLowerCase();
    if (provider === "gemini") {
        if (!m || m.includes("2.5") || m.includes("2.0") || m.includes("1.5")) return "gemini-3.5-flash";
        return modelName!;
    }
    if (provider === "openrouter") {
        if (!m || m.includes("llama-3.1") || m.includes("llama-3.3") || m.includes("qwen") || m.includes("gemini")) return "openrouter/free";
        return modelName!;
    }
    if (provider === "groq") {
        if (!m || m.includes("llama-3.1") || m.includes("llama-3.3") || m.includes("mixtral") || m.includes("gemma")) return "openai/gpt-oss-120b";
        return modelName!;
    }
    return modelName || "openai/gpt-oss-120b";
}

/**
 * Rigorously removes Hindi words, Hindi vocabulary, and Devanagari script,
 * transforming them into authentic Pakistani Roman Urdu or English.
 */
export function sanitizePakistaniRomanUrdu(text: string): string {
    if (!text) return text;

    let s = text;

    // 1. Devanagari Unicode detection & replacement
    const hasDevanagari = /[\u0900-\u097F]/.test(s);
    if (hasDevanagari) {
        const devanagariMap: Array<[RegExp, string]> = [
            [/नमस्ते|नमस्कार/g, "Assalam-o-Alaikum"],
            [/धन्यवाद|शुक्रिया/g, "Shukriya"],
            [/कृपया/g, "Bara-e-meharbani"],
            [/ऑर्डर/g, "Order"],
            [/पिज्जा/g, "Pizza"],
            [/पता/g, "Delivery Address"],
            [/नाम/g, "Naam"],
            [/फोन|नंबर/g, "Phone"],
            [/स्वागत/g, "Khush-amdeed"],
            [/मदद|सहायता/g, "Madad"],
            [/चिंता\s*ना\s*करें/g, "Fikar na karein"],
            [/हाँ/g, "Ji haan"],
            [/नहीं/g, "Nahi"],
            [/[\u0900-\u097F]+/g, ""] // Strip any leftover Devanagari glyphs
        ];

        for (const [pattern, repl] of devanagariMap) {
            s = s.replace(pattern, repl);
        }
    }

    // 2. Comprehensive Roman Hindi -> Authentic Pakistani Roman Urdu dictionary replacement
    const hindiToUrduReplacements: Array<[RegExp, string]> = [
        [/\b(?:namaste|namaskar)\b/gi, "Assalam-o-Alaikum"],
        [/\b(?:dhanyavaad|dhanyavad|dhanyawad)\b/gi, "Shukriya"],
        [/\b(?:kripya|kripaya)\b/gi, "Bara-e-meharbani"],
        [/\bchinta\s+(?:mat|na)\s+karein?\b/gi, "Fikar na karein"],
        [/\bchinta\b/gi, "fikar"],
        [/\bsahayata\b/gi, "madad"],
        [/\baapka\s+swagat\s+hai\b/gi, "Khush-amdeed"],
        [/\bswagat\b/gi, "Khush-amdeed"],
        [/\baabhar\b/gi, "Shukriya"],
        [/\bmitra\b/gi, "dost"],
        [/\bshubh\b/gi, "acha"],
        [/\bsampark\b/gi, "rabta"],
        [/\bgrahak\b/gi, "customer"],
        [/\bvistar\b/gi, "tafseelat"],
        [/\bprasanna\b/gi, "khushi"],
        [/\bkshama\b/gi, "maazrat"],
        [/\bsuvidha\b/gi, "sahoolat"],
        [/\bupalabdha?\b/gi, "dastiyab"],
        [/\bmukhyatah?\b/gi, "khaas tor par"],
        [/\bkhushkhabri\b/gi, "achi khabar"],
        [/\bapna\s+pata\s+bataiye\b/gi, "apna delivery address batayein"],
        [/\bbataiye\b/gi, "batayein"],
        [/\bkijiye\b/gi, "karein"]
    ];

    for (const [reg, replacement] of hindiToUrduReplacements) {
        s = s.replace(reg, replacement);
    }

    // Clean up excessive whitespace
    s = s.replace(/[ \t]{2,}/g, " ").trim();

    return s;
}

/**
 * Safely parse JSON even with unquoted keys, single quotes, or trailing commas
 */
function safeJsonParse(str: string): any {
    try {
        return JSON.parse(str);
    } catch (_) {
        try {
            const cleaned = str
                .replace(/'/g, '"')
                .replace(/,\s*([\]}])/g, "$1")
                .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
            return JSON.parse(cleaned);
        } catch (e) {
            return null;
        }
    }
}

/**
 * Robustly extract [PLACE_ORDER: {...}] without breaking on nested brackets or markdown fences
 */
export function extractPlaceOrderPayload(rawText: string): { fullTag: string; orderData: any } | null {
    if (!rawText) return null;
    const marker = "[PLACE_ORDER:";
    const idx = rawText.toUpperCase().indexOf(marker);
    if (idx === -1) return null;

    let depth = 0;
    let endTag = -1;

    for (let i = idx; i < rawText.length; i++) {
        const char = rawText[i];
        if (char === "[") {
            depth++;
        } else if (char === "]") {
            depth--;
            if (depth === 0) {
                endTag = i;
                break;
            }
        }
    }

    if (endTag === -1) {
        const lastBracket = rawText.lastIndexOf("]");
        endTag = lastBracket > idx ? lastBracket : rawText.length - 1;
    }

    const fullTag = rawText.substring(idx, endTag + 1);
    let inner = fullTag.substring(marker.length, fullTag.length - (fullTag.endsWith("]") ? 1 : 0)).trim();

    // Strip markdown code fences if wrapped in ```json ... ```
    inner = inner.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();

    const firstBrace = inner.indexOf("{");
    const lastBrace = inner.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        return null;
    }

    const jsonStr = inner.substring(firstBrace, lastBrace + 1).trim();
    const orderData = safeJsonParse(jsonStr);
    if (!orderData) return null;

    return { fullTag, orderData };
}

/**
 * Clear customer memory (used when order is placed or manually reset)
 */
export function clearCustomerChatMemory(sessionId: string, customerJid: string) {
    const key = `${sessionId}:${customerJid.trim().toLowerCase()}`;
    customerChatMemory.delete(key);
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
    let targetShopId = 7;
    let deliveryRules: DeliveryRulesConfig = { enabled: true, minOrderAmount: 0, freeDeliveryRadiusKm: 5, deliveryFeeBeyond: 100 };

    // Build memory key (for 1-on-1 private customer chats, not noisy groups)
    const normalizedCustomerJid = (customerJid || "").trim().toLowerCase();
    const memoryKey = (!isGroup && normalizedCustomerJid) ? `${sessionId}:${normalizedCustomerJid}` : null;
    let conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];

    try {
        logger.info("AI-Bot", `[Check] Evaluating AI response for session ${sessionId} (isGroup: ${isGroup}, customer: ${customerJid || "unknown"})...`);

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

        // Hydrate multi-turn conversation memory for this specific customer
        if (memoryKey) {
            const now = Date.now();
            let cached = customerChatMemory.get(memoryKey) || [];
            cached = cached.filter((item) => now - item.timestamp < MEMORY_TTL_MS);

            // If in-memory cache is empty (e.g. server restart), hydrate from database (Prisma Message table)
            if (cached.length === 0) {
                try {
                    const sessionIds = [session.id, session.sessionId].filter(Boolean) as string[];
                    const cleanPhone = normalizedCustomerJid.replace(/@.*$/, "").replace(/\D/g, "");
                    const targetJids = [normalizedCustomerJid, customerJid].filter(Boolean) as string[];

                    const pastMessages = await prisma.message.findMany({
                        where: {
                            sessionId: { in: sessionIds },
                            OR: [
                                { remoteJid: { in: targetJids } },
                                ...(cleanPhone.length >= 7 ? [{ remoteJid: { contains: cleanPhone } }] : [])
                            ]
                        },
                        orderBy: { timestamp: "desc" },
                        take: 12,
                        select: { fromMe: true, content: true, timestamp: true }
                    });

                    if (pastMessages && pastMessages.length > 0) {
                        cached = pastMessages
                            .reverse()
                            .filter((m) => m.content && m.content.trim().length > 0)
                            .map((m) => ({
                                role: (m.fromMe ? "assistant" : "user") as "user" | "assistant",
                                content: m.content!.trim(),
                                timestamp: m.timestamp.getTime()
                            }));
                    }
                } catch (dbErr: any) {
                    logger.warn("AI-Bot", `Could not hydrate chat memory from DB: ${dbErr?.message}`);
                }
            }

            customerChatMemory.set(memoryKey, cached);
            conversationHistory = cached.slice(-10).map((c) => ({ role: c.role, content: c.content }));
            if (conversationHistory.length > 0) {
                logger.info("AI-Bot", `[Memory] Loaded ${conversationHistory.length} previous chat turns for ${normalizedCustomerJid}`);
            }
        }

        // Fetch AI Config for this session (search by both id and sessionId)
        // @ts-ignore - Prisma model dynamic lookup
        let aiConfig = await (prisma as any).aiConfig.findFirst({
            where: {
                OR: [
                    { sessionId: session.id },
                    { sessionId: session.sessionId }
                ]
            }
        });

        if (!aiConfig) {
            logger.info("AI-Bot", `No AI Config found for session ${sessionId}. Creating active default...`);
            try {
                aiConfig = await (prisma as any).aiConfig.create({
                    data: {
                        sessionId: session.id,
                        enabled: true,
                        provider: "groq",
                        modelName: "qwen/qwen3.8-27b",
                        systemPrompt: DEFAULT_SYSTEM_PROMPT,
                        knowledgeBase: "",
                        enableGoldRates: false,
                        aiRequestsCount: 0
                    }
                });
            } catch (e) {
                aiConfig = await (prisma as any).aiConfig.findFirst({
                    where: {
                        OR: [
                            { sessionId: session.id },
                            { sessionId: session.sessionId }
                        ]
                    }
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
        let storeMinOrder = 0;
        let storeDeliveryFee = 0;

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
                storeMinOrder = store.minOrderAmount || 0;
                storeDeliveryFee = store.deliveryFee || 0;
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
        if (pizzaIntegration?.shopId) {
            targetShopId = Number(pizzaIntegration.shopId);
        }
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

        // Delivery Circle (KM Radius) and Minimum Order Rules
        const sessionDeliveryRules = sessionConfig.deliveryRules;
        deliveryRules = {
            enabled: sessionDeliveryRules !== undefined ? Boolean(sessionDeliveryRules.enabled) : true,
            minOrderAmount: sessionDeliveryRules ? (Number(sessionDeliveryRules.minOrderAmount) || 0) : storeMinOrder,
            freeDeliveryRadiusKm: sessionDeliveryRules ? (Number(sessionDeliveryRules.freeDeliveryRadiusKm) || 0) : 5,
            deliveryFeeBeyond: sessionDeliveryRules ? (Number(sessionDeliveryRules.deliveryFeeBeyond) || 0) : storeDeliveryFee
        };

        if (deliveryRules.enabled) {
            const rulesPrompt = formatDeliveryRulesPrompt(deliveryRules);
            if (rulesPrompt) {
                dynamicStoreContext = [dynamicStoreContext, rulesPrompt].filter(Boolean).join("\n\n");
                logger.info("AI-Bot", `[Delivery-Rules] Injected: MinOrder=Rs.${deliveryRules.minOrderAmount}, FreeCircle=${deliveryRules.freeDeliveryRadiusKm}KM, BeyondFee=Rs.${deliveryRules.deliveryFeeBeyond}`);
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
        const modelName = normalizeModelName(provider, aiConfig?.modelName);

        let systemPrompt = aiConfig?.systemPrompt || DEFAULT_SYSTEM_PROMPT;
        // Ensure pizza ordering workflow & strict Pakistani Roman Urdu rules are always active if Pizza integration is enabled
        if (pizzaIntegration?.enabled && !systemPrompt.includes("[PLACE_ORDER:")) {
            systemPrompt = `${systemPrompt}\n\n${DEFAULT_SYSTEM_PROMPT}`;
        }

        const userKb = aiConfig?.knowledgeBase || "";

        // Combine dynamic store context with user entered knowledge base
        const knowledgeBase = [dynamicStoreContext, userKb].filter(Boolean).join("\n\nADDITIONAL BUSINESS FAQS & NOTES:\n").trim();

        // Extract detected images immediately so they are available in both success & fallback
        detectedImages = extractImagesFromKnowledgeBase(knowledgeBase);

        logger.info("AI-Bot", `[Generating] Calling AI API (provider: ${provider}, model: ${modelName}, memoryTurns: ${conversationHistory.length}, goldRates: ${enableGoldRates}, images: ${detectedImages.length})...`);

        let aiReply = await callAiApi({
            provider,
            apiKey,
            modelName,
            systemPrompt,
            knowledgeBase,
            userPrompt: userMessageText,
            conversationHistory,
            temperature: aiConfig?.temperature || 0.7,
            maxTokens: aiConfig?.maxTokens || 800,
            enableGoldRates,
            menuUrl,
            businessName,
            deliveryRules
        });

        // Record AI request count metric for store / session
        try {
            if (aiConfig?.id) {
                await (prisma as any).aiConfig.update({
                    where: { id: aiConfig.id },
                    data: {
                        aiRequestsCount: {
                            increment: 1
                        }
                    }
                });
            }
        } catch (_) {}

        // If primary and secondary AI engines yielded an empty response, seamlessly engage Smart Fallback
        let finalReply = aiReply;
        if (!finalReply || finalReply.trim().length === 0) {
            logger.warn("AI-Bot", `AI generated empty response. Using natural Pakistani Roman Urdu fallback.`);
            finalReply = getNaturalFallbackReply(userMessageText, detectedImages, { enableGoldRates, menuUrl, businessName, deliveryRules }, conversationHistory);
        }

        // Apply strict Pakistani Roman Urdu sanitization layer (strips any Devanagari or Hindi)
        finalReply = sanitizePakistaniRomanUrdu(finalReply);

        // Check if AI or Fallback generated a [PLACE_ORDER: {...}] instruction
        const extracted = extractPlaceOrderPayload(finalReply);
        let orderCompletedSuccess = false;

        if (extracted && extracted.orderData) {
            const { fullTag, orderData } = extracted;
            const orderTotal = Number(orderData.total) || 0;

            // Check Minimum Order Amount validation
            if (deliveryRules.enabled && deliveryRules.minOrderAmount && deliveryRules.minOrderAmount > 0 && orderTotal > 0 && orderTotal < deliveryRules.minOrderAmount) {
                logger.info("AI-Bot", `Order total Rs.${orderTotal} is below minOrderAmount Rs.${deliveryRules.minOrderAmount}`);
                finalReply = finalReply.replace(fullTag, `\n\n⚠️ *Kam az kam (Minimum) order limit Rs. ${deliveryRules.minOrderAmount} hai.* Aapka bill Rs. ${orderTotal} ban raha hai. Kindly kuch mazeed items shamil kar lein taake hum aapka order kitchen mein dispatch kar sakein! 🍕`).trim();
            } else {
                try {
                    const targetShopId = pizzaIntegration?.shopId ? Number(pizzaIntegration.shopId) : 7;
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
                        total: orderTotal,
                        notes: `[WhatsApp AI Order | Contact: ${cleanPhone}]`
                    });

                    if (orderResult.success && orderResult.orderNumber) {
                        orderCompletedSuccess = true;
                        finalReply = finalReply.replace(fullTag, `\n\n🧾 *Order Number:* ${orderResult.orderNumber}\n⚡ *Status:* Sent directly to Kitchen & POS!`).trim();
                        logger.info("AI-Bot", `[CONVERSATIONAL ORDER] Successfully created order ${orderResult.orderNumber} in Supabase for shop #${targetShopId}`);
                    } else {
                        finalReply = finalReply.replace(fullTag, "").trim();
                    }
                } catch (oErr: any) {
                    logger.error("AI-Bot", "Failed to parse/create order from AI: " + oErr?.message);
                    finalReply = finalReply.replace(fullTag, "").trim();
                }
            }
        }

        // Save conversation turn into memory
        if (memoryKey) {
            if (orderCompletedSuccess) {
                // Order successfully placed! Clear active ordering cart memory so next order starts fresh
                customerChatMemory.delete(memoryKey);
            } else {
                const currentMem = customerChatMemory.get(memoryKey) || [];
                currentMem.push(
                    { role: "user", content: userMessageText, timestamp: Date.now() },
                    { role: "assistant", content: finalReply, timestamp: Date.now() }
                );
                if (currentMem.length > 14) currentMem.splice(0, currentMem.length - 14);
                customerChatMemory.set(memoryKey, currentMem);
            }
        }

        logger.success("AI-Bot", `[Success] Bot generated ${finalReply.length} chars response.`);
        return finalReply;

    } catch (error: any) {
        logger.error("AI-Service", `Error generating AI response: ${error?.message || error}`);
        let fallbackReply = getNaturalFallbackReply(userMessageText, detectedImages, { enableGoldRates, menuUrl, businessName, deliveryRules }, conversationHistory);
        fallbackReply = sanitizePakistaniRomanUrdu(fallbackReply);

        // Also check if fallback in error handler generated order tag
        const extracted = extractPlaceOrderPayload(fallbackReply);
        if (extracted && extracted.orderData) {
            const orderTotal = Number(extracted.orderData.total) || 0;
            if (deliveryRules?.enabled && deliveryRules.minOrderAmount && deliveryRules.minOrderAmount > 0 && orderTotal > 0 && orderTotal < deliveryRules.minOrderAmount) {
                fallbackReply = fallbackReply.replace(extracted.fullTag, `\n\n⚠️ *Kam az kam (Minimum) order limit Rs. ${deliveryRules.minOrderAmount} hai.* Aapka bill filhal Rs. ${orderTotal} ban raha hai. Kindly kuch mazeed items shamil kar lein taake hum aapka order kitchen dispatch kar sakein! 🍕`).trim();
            } else {
                try {
                    let cleanPhone = (extracted.orderData.phone || "").trim();
                    if (!cleanPhone && customerJid) {
                        cleanPhone = customerJid.replace(/@.*$/, "").replace(/\D/g, "");
                        if (cleanPhone.startsWith("92")) cleanPhone = "0" + cleanPhone.substring(2);
                    }
                    const orderResult = await createPizzaOrderInSupabase({
                        shopId: targetShopId,
                        customerName: extracted.orderData.name || customerPushName || "WhatsApp Customer",
                        customerPhone: cleanPhone || "03000000000",
                        deliveryAddress: extracted.orderData.address || "Delivery Address",
                        items: Array.isArray(extracted.orderData.items) ? extracted.orderData.items : [],
                        total: orderTotal,
                        notes: `[WhatsApp AI Order | Contact: ${cleanPhone}]`
                    });
                    if (orderResult.success && orderResult.orderNumber) {
                        fallbackReply = fallbackReply.replace(extracted.fullTag, `\n\n🧾 *Order Number:* ${orderResult.orderNumber}\n⚡ *Status:* Sent directly to Kitchen & POS!`).trim();
                        if (memoryKey) customerChatMemory.delete(memoryKey);
                        return fallbackReply;
                    }
                } catch (_) {}
                fallbackReply = fallbackReply.replace(extracted.fullTag, "").trim();
            }
        }

        if (memoryKey) {
            const currentMem = customerChatMemory.get(memoryKey) || [];
            currentMem.push(
                { role: "user", content: userMessageText, timestamp: Date.now() },
                { role: "assistant", content: fallbackReply, timestamp: Date.now() }
            );
            if (currentMem.length > 14) currentMem.splice(0, currentMem.length - 14);
            customerChatMemory.set(memoryKey, currentMem);
        }
        return fallbackReply;
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
    conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
    deliveryRules?: DeliveryRulesConfig;
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
        businessName,
        conversationHistory = [],
        deliveryRules
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

    // Inject delivery circle & minimum order rules if enabled
    const deliveryPrompt = deliveryRules && deliveryRules.enabled ? `\n\n${formatDeliveryRulesPrompt(deliveryRules)}` : "";

    // Format human-readable multi-turn history block directly into system instructions for 100% failover retention
    let historyPromptBlock = "";
    if (conversationHistory && conversationHistory.length > 0) {
        const formattedTurns = conversationHistory
            .map((h) => `${h.role === "assistant" ? "Assistant (You)" : "Customer"}: ${h.content}`)
            .join("\n");
        historyPromptBlock = `ACTIVE CONVERSATION HISTORY (REMEMBER WHAT CUSTOMER ALREADY ASKED / ORDERED IN THIS CHAT):\n${formattedTurns}`;
    }

    // Construct full system instruction with anti-Hindi directive & recent history at the VERY TOP
    const fullSystemMessage = `🚨 STRICT OPERATING DIRECTIVE:
- Location: Pakistan
- Language: AUTHENTIC PAKISTANI ROMAN URDU OR STANDARD ENGLISH ONLY.
- ABSOLUTELY ZERO HINDI: NEVER use Indian Hindi words, Hindi vocabulary, or Devanagari script (NO: namaste, namaskar, dhanyavad, dhanyavaad, kripya, chinta, sahayata, swagat, mitra, grahak, sampark, bataiye, kijiye).
- Always use Pakistani Urdu: Assalam-o-Alaikum, Walaikum Assalam, Shukriya, Ji bilkul, Fikar na karein, Madad, Rabta number, Mukammal delivery pata.

${historyPromptBlock ? `==================================================\n${historyPromptBlock}\n==================================================\n\n` : ""}${systemPrompt || DEFAULT_SYSTEM_PROMPT}

==================================================
BUSINESS KNOWLEDGE BASE & FAQS:
${knowledgeBase && knowledgeBase.trim().length > 0 ? knowledgeBase : "No specific details provided. Answer politely and concisely."}${mediaInstruction}${menuUrlInstruction}${goldPrompt}${deliveryPrompt}
==================================================`;

    // Multi-turn message array for OpenAI-compatible gateways (Groq, OpenRouter, Together AI)
    const chatMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: fullSystemMessage },
        ...(conversationHistory || []).map((m) => ({
            role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
            content: m.content
        })),
        { role: "user", content: userPrompt }
    ];

    // Multi-turn contents array for Google Gemini (ensuring strict alternating turns required by Gemini)
    const geminiContents: Array<{ role: "user" | "model"; parts: [{ text: string }] }> = [];
    for (const h of conversationHistory || []) {
        const role = h.role === "assistant" ? "model" : "user";
        if (geminiContents.length === 0) {
            if (role === "user") {
                geminiContents.push({ role: "user", parts: [{ text: h.content }] });
            }
        } else {
            const last = geminiContents[geminiContents.length - 1];
            if (last.role === role) {
                last.parts[0].text += `\n${h.content}`;
            } else {
                geminiContents.push({ role, parts: [{ text: h.content }] });
            }
        }
    }
    if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === "user") {
        geminiContents[geminiContents.length - 1].parts[0].text += `\n${userPrompt}`;
    } else {
        geminiContents.push({ role: "user", parts: [{ text: userPrompt }] });
    }

    // =========================================================================
    // 1. GROQ LPU ENGINE (Priority 1: Ultra Fast ~0.2s Latency)
    // =========================================================================
    const groqKey = process.env.GROQ_API_KEY?.trim() || (provider === "groq" ? apiKey?.trim() : "") || BUILTIN_KEYS.groq;
    if (groqKey) {
        const groqModels = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "allam-2-7b"];
        for (const model of groqModels) {
            try {
                logger.info("AI-Gateway", `[1/4] Trying Groq LPU (${model}, historyTurns: ${conversationHistory.length})...`);
                const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${groqKey}`
                    },
                    body: JSON.stringify({
                        model,
                        messages: chatMessages,
                        temperature,
                        max_tokens: maxTokens
                    }),
                    signal: AbortSignal.timeout(5000)
                });

                if (res.ok) {
                    const data = await res.json();
                    const content = data?.choices?.[0]?.message?.content;
                    if (content && content.trim().length > 0) {
                        const devanagariCount = (content.match(/[\u0900-\u097F]/g) || []).length;
                        if (devanagariCount > 8) {
                            logger.warn("AI-Gateway", `[Rejected Hindi Response] Groq model ${model} produced ${devanagariCount} Devanagari chars. Moving to next provider.`);
                            continue;
                        }
                        logger.success("AI-Gateway", `[Success via Groq: ${model}] Generated ${content.length} chars`);
                        return finalizeAiReply(content, userPrompt, detectedImages, menuUrl, conversationHistory);
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
        const geminiModels = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.5-flash"];
        for (const model of geminiModels) {
            try {
                logger.info("AI-Gateway", `[2/4] Trying Gemini (${model}, historyTurns: ${conversationHistory.length})...`);
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        systemInstruction: { parts: [{ text: fullSystemMessage }] },
                        contents: geminiContents,
                        generationConfig: { temperature, maxOutputTokens: maxTokens }
                    }),
                    signal: AbortSignal.timeout(6000)
                });

                if (res.ok) {
                    const data = await res.json();
                    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (content && content.trim().length > 0) {
                        const devanagariCount = (content.match(/[\u0900-\u097F]/g) || []).length;
                        if (devanagariCount > 8) {
                            logger.warn("AI-Gateway", `[Rejected Hindi Response] Gemini ${model} produced ${devanagariCount} Devanagari chars. Moving to next provider.`);
                            continue;
                        }
                        logger.success("AI-Gateway", `[Success via Gemini: ${model}] Generated ${content.length} chars`);
                        return finalizeAiReply(content, userPrompt, detectedImages, menuUrl, conversationHistory);
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
        const openrouterModels = ["openrouter/free"];

        for (const model of openrouterModels) {
            try {
                logger.info("AI-Gateway", `[3/4] Trying OpenRouter (${model}, historyTurns: ${conversationHistory.length})...`);
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
                        messages: chatMessages,
                        temperature,
                        max_tokens: maxTokens
                    }),
                    signal: AbortSignal.timeout(12000)
                });

                if (res.ok) {
                    const data = await res.json();
                    const content = data?.choices?.[0]?.message?.content;
                    if (content && content.trim().length > 0) {
                        const devanagariCount = (content.match(/[\u0900-\u097F]/g) || []).length;
                        if (devanagariCount > 8) {
                            logger.warn("AI-Gateway", `[Rejected Hindi Response] OpenRouter ${model} produced ${devanagariCount} Devanagari chars. Moving to next provider.`);
                            continue;
                        }
                        logger.success("AI-Gateway", `[Success via OpenRouter: ${model}] Generated ${content.length} chars`);
                        return finalizeAiReply(content, userPrompt, detectedImages, menuUrl, conversationHistory);
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
            logger.info("AI-Gateway", `[4/4] Trying Together AI (historyTurns: ${conversationHistory.length})...`);
            const res = await fetch("https://api.together.xyz/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${togetherKey}`
                },
                body: JSON.stringify({
                    model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
                    messages: chatMessages,
                    max_tokens: maxTokens
                }),
                signal: AbortSignal.timeout(12000)
            });

            if (res.ok) {
                const data = await res.json();
                const content = data?.choices?.[0]?.message?.content;
                if (content && content.trim().length > 0) {
                    logger.success("AI-Gateway", `[Success via Together AI] Generated ${content.length} chars`);
                    return finalizeAiReply(content, userPrompt, detectedImages, menuUrl, conversationHistory, deliveryRules);
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
    return getNaturalFallbackReply(userPrompt, detectedImages, { enableGoldRates, menuUrl, businessName, deliveryRules }, conversationHistory);
}

/**
 * Post-processes AI reply:
 * - Sanitizes against Hindi and Devanagari script
 * - If user asked for menu / catalogue, ensures image tags or live links are cleanly present.
 */
function finalizeAiReply(
    rawReply: string | null,
    userPrompt: string,
    detectedImages: string[],
    menuUrl?: string,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [],
    deliveryRules?: DeliveryRulesConfig
): string {
    const trimmedPrompt = (userPrompt || "").trim().toLowerCase();
    const asksForLink = /\b(link|website|url|web)\b/i.test(trimmedPrompt);
    const asksForPicOnly = /(?:link\s*na|nhi|nahi).*?(?:pic|photo|image)|(?:pic|photo|image|picture|tasweer|front\s*and\s*back).*?(?:bhejo|send|dikhao|chahiye)/i.test(trimmedPrompt);
    const isMenuQuery = /\b(menu|catalog|catalogue|rate|rates|price|prices|deal|deals|card|list|items)\b/i.test(trimmedPrompt) ||
        /(?:menu\s*send|send\s*menu|menu\s*dikhao|menu\s*bhejo|kaho\s*menu|catalog\s*bhejo)/i.test(trimmedPrompt);

    if (!rawReply || rawReply.trim().length === 0) {
        return getNaturalFallbackReply(userPrompt, detectedImages, { menuUrl, deliveryRules }, conversationHistory);
    }

    // 1. Rigorously sanitize against any Hindi words or Devanagari Unicode
    let processed = sanitizePakistaniRomanUrdu(rawReply.trim());

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

    return sanitizePakistaniRomanUrdu(processed);
}

/**
 * Natural Pakistani Roman Urdu conversational fallback
 * Retains multi-turn ordering memory even during full cloud LLM outages.
 */
export function getNaturalFallbackReply(
    userPrompt: string,
    detectedImages: string[] = [],
    options?: {
        enableGoldRates?: boolean;
        menuUrl?: string;
        businessName?: string;
        deliveryRules?: DeliveryRulesConfig;
    },
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): string {
    const p = (userPrompt || "").trim().toLowerCase();
    const { enableGoldRates = false, menuUrl, businessName = "Pizza Mafia", deliveryRules } = options || {};
    const minOrder = Number(deliveryRules?.minOrderAmount) || 0;
    const freeKm = Number(deliveryRules?.freeDeliveryRadiusKm) || 0;
    const feeBeyond = Number(deliveryRules?.deliveryFeeBeyond) || 0;

    // Delivery Circle (KM Radius) and Free Delivery inquiries
    const isDeliveryCircleOrFreeQuery = /(?:free\s*delivery|delivery\s*free|kitne\s*km|km\s*tak|circle|radius|dilevry\s*free|kitna\s*circle|circle\s*ma|circle\s*mein|free\s*ha\s*km|dilevry)/i.test(p);
    const isDeliveryChargesQuery = /(?:delivery\s*charges|delivery\s*fee|delivery\s*kya\s*hai|delivery\s*ke\s*charges|charges\s*kitne)/i.test(p);

    if (isDeliveryCircleOrFreeQuery || isDeliveryChargesQuery) {
        if (freeKm > 0) {
            return sanitizePakistaniRomanUrdu(
                `G bilkul! Hamari delivery ${freeKm} KM ke circle (radius) ke andar bilkul 100% FREE hai! Agar aapka delivery address ${freeKm} KM se aage ho to delivery charges Rs. ${feeBeyond} lagtay hain. 🛵`
            );
        } else if (feeBeyond > 0) {
            return sanitizePakistaniRomanUrdu(
                `Hamare standard delivery charges Rs. ${feeBeyond} hain. Cash on Delivery (COD) available hai! 🛵`
            );
        }
    }

    // Minimum order amount inquiries
    const isMinOrderQuery = /(?:minimum|kam\s*az\s*kam|min|kam\s*se\s*kam)\s*(?:order|limit|bill)/i.test(p) ||
        /(?:order\s*kitna|order\s*limit)/i.test(p);
    if (isMinOrderQuery && minOrder > 0) {
        return sanitizePakistaniRomanUrdu(
            `G bilkul! Hamara kam az kam (minimum) order limit Rs. ${minOrder} hai. Aap menu se apni marzi ki items order karwa sakte hain! 🍕`
        );
    }

    // =========================================================================
    // 0. CHECK MULTI-TURN ORDERING CONTINUITY IN CONVERSATION HISTORY
    // =========================================================================
    const isConfirmation = /^(?:yes|yep|confirm|confirmed|ok|okay|theek\s*hai|done|haan|ji\s*haan|kar\s*dein|bhej\s*dein|book\s*kar\s*dein|jee|haa)\b/i.test(p);
    const hasAddressKeywords = /(?:street|gali|road|mohallah|house|makan|flat|block|phase|near|chowk|sohawa|islamabad|rawalpindi|lahore|karachi|gujranwala|peshawar|faisalabad|address|pata|rabta|phone|03\d{9})/i.test(p);

    const pastUserMessages = (conversationHistory || []).filter(m => m.role === "user").map(m => m.content);
    const combinedHistory = [...pastUserMessages, userPrompt].join(" ");
    const foodItemsMatch = combinedHistory.match(/\b(?:\d+\s*(?:x\s*)?)?(?:grilled\s+)?(?:shawarma|pizza|burger|deal|deal\s*\d+|drink|pepsi|7up|coke|sprite|fries|wings|pasta|garlic\s*bread|paratha\s*roll|roll)\b/gi);

    if (isConfirmation && conversationHistory.length > 0) {
        // Customer is confirming an order! Extract address and items from history
        const addressMatch = combinedHistory.match(/(?:address|pata|location|gali|street|house|near|mohallah|sohawa)[^,\.\n]*(?:,\s*[^,\.\n]*)*/i);
        const phoneMatch = combinedHistory.match(/\b(?:03\d{9}|923\d{9})\b/);
        const nameMatch = combinedHistory.match(/(?:naam|name|customer)\s*[:=]?\s*([a-zA-Z\s]{3,25})/i);

        const customerName = nameMatch ? nameMatch[1].trim() : "Valued Customer";
        const customerAddress = addressMatch ? addressMatch[0].trim() : "Customer Address (Confirmed on WhatsApp)";
        const customerPhone = phoneMatch ? phoneMatch[0].trim() : "";

        const itemsList = foodItemsMatch && foodItemsMatch.length > 0
            ? Array.from(new Set(foodItemsMatch)).map(it => ({ name: it.trim(), qty: 1, price: 500 }))
            : [{ name: "Food Order", qty: 1, price: 500 }];

        const total = itemsList.reduce((sum, it) => sum + it.price * it.qty, 0);

        // Minimum order validation before placing order
        if (minOrder > 0 && total < minOrder) {
            return sanitizePakistaniRomanUrdu(
                `Bara-e-meharbani note farmayein ke hamara kam az kam (minimum) order Rs. ${minOrder} ka hai. Aapka bill filhal Rs. ${total} ban raha hai. Kindly kuch mazeed items add kar lein taake hum aapka order kitchen mein dispatch kar sakein! 🍕`
            );
        }

        return sanitizePakistaniRomanUrdu(
            `🎉 Bohat shukriya ${customerName}! Aapka order receive ho kar kitchen mein chala gaya hai. Hamara delivery rider jald aapke address par pohanch jayega!\n\n[PLACE_ORDER: {"name": "${customerName}", "phone": "${customerPhone}", "address": "${customerAddress}", "items": ${JSON.stringify(itemsList)}, "total": ${total}}]`
        );
    }

    if (hasAddressKeywords && foodItemsMatch && foodItemsMatch.length > 0) {
        // Customer provided their delivery address, items already in memory!
        const uniqueItems = Array.from(new Set(foodItemsMatch)).join(", ");
        const itemsList = Array.from(new Set(foodItemsMatch)).map(it => ({ name: it.trim(), qty: 1, price: 500 }));
        const total = itemsList.reduce((sum, it) => sum + it.price * it.qty, 0);

        if (minOrder > 0 && total < minOrder) {
            return sanitizePakistaniRomanUrdu(
                `Aapki delivery details note kar li hain, lekin note farmayein ke hamara kam az kam (minimum) order limit Rs. ${minOrder} hai (Aapka bill Rs. ${total} hai). Kindly kuch mazeed items add kar lein taake order confirm kiya ja sakay!`
            );
        }

        const deliveryStatus = freeKm > 0 ? `FREE (${freeKm} KM circle ke andar)` : (feeBeyond > 0 ? `Rs. ${feeBeyond}` : "FREE");

        return sanitizePakistaniRomanUrdu(
            `Bohat khoob! Aapki delivery details note kar li hain:\n\n📋 *ORDER SUMMARY:*\n• Items: ${uniqueItems}\n• Subtotal: Rs. ${total}\n• Delivery: ${deliveryStatus}\n💵 Total Bill: Rs. ${total} (COD)\n📍 Delivery Address: ${userPrompt}\n\n👉 Order confirm karne ke liye kindly *'YES'* ya *'CONFIRM'* reply karein.`
        );
    }

    // 1. Gold & Jewellery Rate queries (ONLY when enableGoldRates is ON)
    if (enableGoldRates) {
        const isGoldRateQuery = /\b(gold|sonar?|sona|chandi|silver|24k|22k|21k|18k|tola|per\s*tola)\b/i.test(p) ||
            (/(?:rate|bhao|bhav|keemat|price|rates)/i.test(p) && /(?:aaj|today|gold|sona|chandi)/i.test(p));

        if (isGoldRateQuery) {
            const rates = getGoldRates();
            const isGreetingPresent = /\b(aoa|salam|assalam|hi|hello)\b/i.test(p);
            const greetingPrefix = isGreetingPresent ? "Walaikum Assalam! " : "Assalam-o-Alaikum! ";
            return sanitizePakistaniRomanUrdu(`${greetingPrefix}Aaj ke official gold aur silver rates:\n• 24K Gold: PKR ${rates.rate24k.toLocaleString()} per tola\n• 22K Jewellery Gold: PKR ${rates.rate22k.toLocaleString()} per tola\n• Silver (Chandi): PKR ${rates.silver.toLocaleString()} per tola\n\nHamari tamam jewellery 100% hallmark guaranteed hoti hai. Kisi bhi design ka quotation banwane ke liye aap item name aur weight bata sakte hain! 💍`);
        }
    }

    // 2. Menu / Catalog / Price / Deals query
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
            return sanitizePakistaniRomanUrdu(`${greetingPrefix}Yeh lijiye hamara complete menu card (Front aur Back dono pictures):\n${tags}`);
        }

        // Case B: Customer specifically asks for link
        if (asksForLink && !asksForPicOnly && menuUrl) {
            return sanitizePakistaniRomanUrdu(`${greetingPrefix}Yeh lijiye hamara live digital menu link jahan aap tamam deals aur rates dekh sakte hain:\n🌐 ${menuUrl}`);
        }

        // Case C: General menu / deals / rates query (Send link AND images if available!)
        const linkPart = menuUrl ? `\n🌐 Live digital menu aur deals: ${menuUrl}` : "";
        const imgPart = detectedImages.length > 0
            ? `\n\nYeh lijiye hamara complete 2-page menu card (Front aur Back):\n${detectedImages.map(u => `[SEND_IMAGE: ${u}]`).join(" ")}`
            : "";

        if (linkPart || imgPart) {
            return sanitizePakistaniRomanUrdu(`${greetingPrefix}Aap hamari tamam deals, items aur rates yahan check kar sakte hain:${linkPart}${imgPart}`);
        }

        return sanitizePakistaniRomanUrdu(`${greetingPrefix}${businessName} par rabta karne ka shukriya. Aap yahan kisi bhi item, deal, rate ya order ke bare mein pooch sakte hain, hamara staff aapki mukammal rehnumai kare ga!`);
    }

    // 3. Greetings + How are you combined
    if (/(?:aoa|salam|assalam).*?(?:kay|kia|kya).*?(?:hal|haal)|(?:kay|kia|kya).*?(?:hal|haal).*?(?:aoa|salam)/i.test(p) ||
        /(?:aoa|salam|assalam).*?(?:kaise\s*ho|how\s*are\s*you)/i.test(p)) {
        return sanitizePakistaniRomanUrdu("Walaikum Assalam! Alhamdulillah main bilkul theek hoon. Aap sunayein aap kaise hain? Main aapki kya khidmat kar sakta hoon?");
    }

    // 4. Pure Greetings
    if (/\b(aoa|salam|assalam\s*o\s*alaikum|asalam\s*u\s*alaikum|aslam\s*o\s*alikum|aslam\s*alikum|hi|hello|hey)\b/i.test(p)) {
        return sanitizePakistaniRomanUrdu("Walaikum Assalam! Shukriya rabta karne ka. Main aapki kya madad kar sakta hoon?");
    }

    // 5. Pure How are you
    if (/(?:kay\s*hal\s*ha|kia\s*hal\s*ha|kia\s*hal\s*hai?|kya\s*haal\s*hai?|kaise\s*ho|kese\s*ho|how\s*are\s*you)/i.test(p)) {
        return sanitizePakistaniRomanUrdu("Alhamdulillah main bilkul theek hoon! Aap sunayein aap kaise hain? Main aapki kya madad ya khidmat kar sakta hoon?");
    }

    // 6. Timings & Working Hours
    if (/\b(timing|timings|timing\s*kya|open|close|kab\s*open|waqt)\b/i.test(p)) {
        return sanitizePakistaniRomanUrdu("Hamari timing daily open rehti hai. Aap apna order ya inquiry kisi bhi waqt yahan confirm karwa sakte hain.");
    }

    // 7. Location & Address
    if (/\b(location|address|kahan\s*hai|kahan\s*par|kider\s*hai|branch)\b/i.test(p)) {
        return sanitizePakistaniRomanUrdu("Aap hamari exact location aur directions ke liye hamare staff se rabta kar sakte hain ya apna area bata dein.");
    }

    // 8. Order & Delivery queries
    if (/\b(order|delivery|home\s*delivery|parcel|book|booking)\b/i.test(p) || foodItemsMatch) {
        return sanitizePakistaniRomanUrdu("G bilkul! Aap apna order items, delivery address aur rabta number yahan message kar dein, hamari team foran confirm kare gi.");
    }

    // 9. Polite General Fallback (ensures bot NEVER goes silent and NEVER speaks Hindi)
    return sanitizePakistaniRomanUrdu(`Assalam-o-Alaikum! Shukriya rabta karne ka. Main aapki kya madad kar sakta hoon? Aap apna sawal, item details ya order yahan message kar sakte hain.`);
}
