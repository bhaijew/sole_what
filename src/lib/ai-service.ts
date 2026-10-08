import { prisma } from "./prisma";
import { logger } from "./logger";
import { getGoldRates, formatGoldRatePrompt } from "./gold-service";

export interface AiTestRequest {
    provider: string; // "openrouter" | "openai" | "gemini"
    apiKey?: string;
    modelName: string;
    systemPrompt?: string;
    knowledgeBase?: string;
    userPrompt: string;
}

const DEFAULT_SYSTEM_PROMPT = `You are a polite, natural, and friendly customer support assistant for this business on WhatsApp.
Communicate naturally in polite Pakistani Roman Urdu (or English if the customer speaks English).

COMMUNICATION GUIDELINES:
1. GREETINGS & CASUAL CHAT (Natural Roman Urdu):
- Agar customer "aoa", "AOA", "salam", "assalam o alaikum", "hi", "hello" likhay:
  Pyaar aur adab se jawab dein: "Walaikum Assalam! Shukriya rabta karne ka. Main aapki kya madad kar sakta hoon?"
- Agar customer "kay hal ha", "kia hal ha", "kya haal hai", "kaise ho", "how are you" likhay:
  Natural aur dostana jawab dein: "Alhamdulillah, main bilkul theek hoon! Aap sunayein aap kaise hain? Main aapki kya madad ya khidmat kar sakta hoon?"
- Agar customer dono poochay (e.g. "aoa kay hal ha" ya "salam kia hal ha"):
  "Walaikum Assalam! Alhamdulillah main theek hoon. Aap sunayein kaise hain? Main aapki kya khidmat kar sakta hoon?"

2. MENU & FOOD REQUESTS (Even for single-word queries):
- Agar customer sirf aik lafz "menu", "Menu", "MENU", "khana", "deals", "rates", "rate list" bhi likhay ya maangay:
  Foran polite jawab dein (e.g. "G zaroor! Yeh lijiye hamara complete menu aur special deals:") aur message ke end mein image tags zaroor attach karein.
- Agar customer "aoa menu" ya "salam menu dikhao" likhay to pehle salam ka jawab dein phr menu aur image tags attach karein.

3. ACCURACY & KNOWLEDGE BASE:
- Har sawal ka jawab strictly neeche di gayi Business Knowledge Base ke mutabiq dein.
- Jawab mukhtasar, clear aur WhatsApp ke liye easy-to-read rakhein.
- Agar koi aisi baat ho jo Knowledge Base mein na ho, to politely kahein: "Is bare mein mazeed maloomat ke liye hamare staff se rabta karein."`;

const DEFAULT_OPENROUTER_MODEL = "openrouter/free";

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
            select: { id: true, sessionId: true }
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
                        knowledgeBase: ""
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

        const provider = aiConfig?.provider || "openrouter";
        // Check session apiKey first, then fall back to environment variables
        const envApiKey = 
            provider === "gemini" ? (process.env.GEMINI_API_KEY || "") :
            provider === "openai" ? (process.env.OPENAI_API_KEY || "") :
            (process.env.OPENROUTER_API_KEY || "");
        const apiKey = aiConfig?.apiKey?.trim() || envApiKey;
        const modelName = aiConfig?.modelName || (
            provider === "gemini" ? "gemini-1.5-flash" :
            provider === "openai" ? "gpt-4o-mini" :
            "openrouter/free"
        );
        const systemPrompt = aiConfig?.systemPrompt || DEFAULT_SYSTEM_PROMPT;
        const knowledgeBase = aiConfig?.knowledgeBase || "";

        // Extract detected images immediately so they are available in both success & fallback
        detectedImages = extractImagesFromKnowledgeBase(knowledgeBase);

        logger.info("AI-Bot", `[Generating] Calling AI API (provider: ${provider}, model: ${modelName}, images: ${detectedImages.length})...`);

        const aiReply = await callAiApi({
            provider,
            apiKey,
            modelName,
            systemPrompt,
            knowledgeBase,
            userPrompt: userMessageText,
            temperature: aiConfig?.temperature || 0.7,
            maxTokens: aiConfig?.maxTokens || 800
        });

        if (aiReply) {
            logger.success("AI-Bot", `[Success] AI generated ${aiReply.length} chars response.`);
            return aiReply;
        } else {
            logger.warn("AI-Bot", `AI generated empty response. Using natural fallback.`);
            return getNaturalFallbackReply(userMessageText, detectedImages);
        }

    } catch (error: any) {
        logger.error("AI-Service", `Error generating AI response: ${error?.message || error}`);
        return getNaturalFallbackReply(userMessageText, detectedImages);
    }
}

/**
 * Execute API call with Multi-Provider Automatic Failover:
 * Groq LPU -> OpenRouter Multi-Model -> Google Gemini -> Together AI -> Smart Natural Fallback
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
}): Promise<string> {
    const { systemPrompt, knowledgeBase, userPrompt, temperature = 0.7, maxTokens = 800, provider, apiKey } = params;

    // Detect image URLs in Knowledge Base (Menu Image 1 & 2, Catalog, etc.)
    const detectedImages: string[] = extractImagesFromKnowledgeBase(knowledgeBase);

    let mediaInstruction = "";
    if (detectedImages.length >= 2) {
        mediaInstruction = `\n\nAVAILABLE MEDIA / IMAGES TO SEND (2 IMAGES READY):
- Menu Image 1 (Front / Page 1): ${detectedImages[0]}
- Menu Image 2 (Back / Page 2 / Deals): ${detectedImages[1]}
CRITICAL INSTRUCTION: Jab bhi customer menu, khana, deals, items list, catalogue, rates ya prices maangay, unko polite text answer ke end mein DONO images zaroor attach karein: [SEND_IMAGE: ${detectedImages[0]}] [SEND_IMAGE: ${detectedImages[1]}]`;
    } else if (detectedImages.length === 1) {
        mediaInstruction = `\n\nAVAILABLE MEDIA / IMAGES TO SEND:
- Menu Image 1: ${detectedImages[0]}
CRITICAL INSTRUCTION: Jab bhi customer menu, khana, deals, items list, catalogue, rates ya prices maangay, unko polite text answer ke end mein image zaroor attach karein: [SEND_IMAGE: ${detectedImages[0]}]`;
    }

    const goldPrompt = formatGoldRatePrompt();

    // Construct full system instruction
    const fullSystemMessage = `${systemPrompt || DEFAULT_SYSTEM_PROMPT}

==================================================
BUSINESS KNOWLEDGE BASE & FAQS:
${knowledgeBase && knowledgeBase.trim().length > 0 ? knowledgeBase : "No specific knowledge base provided. Answer standard customer service queries politely."}${mediaInstruction}
${goldPrompt}
==================================================`;

    // =========================================================================
    // 1. GROQ LPU ENGINE (Priority 1: Ultra Fast ~0.3s Latency)
    // =========================================================================
    const groqKey = process.env.GROQ_API_KEY?.trim() || (provider === "groq" ? apiKey?.trim() : "") || "";
    if (groqKey) {
        const groqModels = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"];
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
                        return finalizeAiReply(content, userPrompt, detectedImages);
                    }
                } else {
                    const err = await res.text();
                    logger.warn("AI-Gateway", `Groq (${model}) returned status ${res.status}: ${err.substring(0, 100)}. Switching to next engine...`);
                }
            } catch (err: any) {
                logger.warn("AI-Gateway", `Groq (${model}) error: ${err.message}. Switching to next engine...`);
            }
        }
    }

    // =========================================================================
    // 2. OPENROUTER CLOUD ENGINE (Priority 2: Multi-Model Free Cloud Router)
    // =========================================================================
    const openrouterKey = process.env.OPENROUTER_API_KEY?.trim() || (provider === "openrouter" ? apiKey?.trim() : "") || "";
    const openrouterFallbackKey = process.env.OPENROUTER_FALLBACK_KEY?.trim() || "";
    const openrouterKeys = [openrouterKey, openrouterFallbackKey].filter(Boolean);

    const openrouterModels = [
        "meta-llama/llama-3.1-8b-instruct:free",
        "openrouter/free",
        "deepseek/deepseek-r1:free",
        "google/gemma-2-9b-it:free",
        "qwen/qwen-2.5-7b-instruct:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "mistralai/mistral-7b-instruct:free"
    ];

    for (const key of openrouterKeys) {
        let keyExhausted = false;
        for (const model of openrouterModels) {
            if (keyExhausted) break;
            try {
                logger.info("AI-Gateway", `[2/4] Trying OpenRouter (${model})...`);
                const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${key}`,
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
                    signal: AbortSignal.timeout(15000)
                });

                if (res.ok) {
                    const data = await res.json();
                    const content = data?.choices?.[0]?.message?.content;
                    if (content && content.trim().length > 0) {
                        logger.success("AI-Gateway", `[Success via OpenRouter: ${model}] Generated ${content.length} chars`);
                        return finalizeAiReply(content, userPrompt, detectedImages);
                    }
                } else {
                    const err = await res.text();
                    logger.warn("AI-Gateway", `OpenRouter (${model}) returned status ${res.status}: ${err.substring(0, 100)}`);
                    if (res.status === 429 || res.status === 402) {
                        keyExhausted = true;
                        break;
                    }
                }
            } catch (err: any) {
                logger.warn("AI-Gateway", `OpenRouter (${model}) error: ${err.message}`);
            }
        }
    }

    // =========================================================================
    // 3. GOOGLE GEMINI ENGINE (Priority 3: Gemini 3.8 / Flash)
    // =========================================================================
    const geminiKey = process.env.GEMINI_API_KEY?.trim() || (provider === "gemini" ? apiKey?.trim() : "") || "";
    if (geminiKey) {
        const geminiModels = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-2.5-flash-lite", "gemini-3.1-flash-lite"];
        for (const model of geminiModels) {
            try {
                logger.info("AI-Gateway", `[3/4] Trying Gemini (${model})...`);
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        systemInstruction: { parts: [{ text: fullSystemMessage }] },
                        contents: [{ parts: [{ text: userPrompt }] }],
                        generationConfig: { temperature, maxOutputTokens: maxTokens }
                    }),
                    signal: AbortSignal.timeout(15000)
                });

                if (res.ok) {
                    const data = await res.json();
                    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (content && content.trim().length > 0) {
                        logger.success("AI-Gateway", `[Success via Gemini: ${model}] Generated ${content.length} chars`);
                        return finalizeAiReply(content, userPrompt, detectedImages);
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
    // 4. TOGETHER AI ENGINE (Priority 4)
    // =========================================================================
    const togetherKey = process.env.TOGETHER_API_KEY?.trim() || (provider === "together" ? apiKey?.trim() : "") || "";
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
                    return finalizeAiReply(content, userPrompt, detectedImages);
                }
            }
        } catch (err: any) {
            logger.warn("AI-Gateway", `Together AI error: ${err.message}`);
        }
    }

    // =========================================================================
    // 5. NATURAL ROMAN URDU FALLBACK ENGINE (Priority 5: 100% Guaranteed Always-On)
    // =========================================================================
    logger.info("AI-Gateway", `[5/5] Using Smart Natural Fallback for: "${userPrompt}"`);
    return getNaturalFallbackReply(userPrompt, detectedImages);
}

/**
 * Post-processes AI reply:
 * - If user asked for menu / khana / deals / rates, guarantees image tags are attached.
 * - If user asked natural greetings (aoa, kay hal ha), keeps conversational tone clean.
 */
function finalizeAiReply(
    rawReply: string | null,
    userPrompt: string,
    detectedImages: string[]
): string {
    const trimmedPrompt = (userPrompt || "").trim().toLowerCase();
    const isMenuQuery = /\b(menu|khana|deals?|rate|rates|price|prices|food|catalog|catalogue|card|list)\b/i.test(trimmedPrompt) ||
        /(?:menu\s*send|send\s*menu|menu\s*dikhao|menu\s*bhejo|kaho\s*menu)/i.test(trimmedPrompt);

    if (!rawReply || rawReply.trim().length === 0) {
        return getNaturalFallbackReply(userPrompt, detectedImages);
    }

    let processed = rawReply.trim();

    // If customer asked for menu / khana / deals / rates, ensure image tags are attached
    if (detectedImages.length > 0 && isMenuQuery) {
        const hasImageTag = /\[(?:SEND_IMAGE|IMAGE|SEND_MEDIA|MEDIA):\s*[^\]]+\]/i.test(processed);
        if (!hasImageTag) {
            const tags = detectedImages.map((u) => `[SEND_IMAGE: ${u}]`).join(" ");
            processed = `${processed}\n\n${tags}`;
        }
    }

    return processed;
}

/**
 * Natural Pakistani Roman Urdu conversational fallback
 * Never returns null, guaranteeing that the bot always responds politely!
 */
export function getNaturalFallbackReply(userPrompt: string, detectedImages: string[]): string {
    const p = (userPrompt || "").trim().toLowerCase();

    // 0. Check for Gold / Jewellery / Silver Rate queries (Bhai Jewellers)
    const isGoldRateQuery = /\b(gold|sonar?|sona|chandi|silver|24k|22k|21k|18k|tola|per\s*tola)\b/i.test(p) ||
        (/(?:rate|bhao|bhav|keemat|price|rates)/i.test(p) && /(?:aaj|today|gold|sona|chandi)/i.test(p));

    if (isGoldRateQuery) {
        const rates = getGoldRates();
        const isGreetingPresent = /\b(aoa|salam|assalam|hi|hello)\b/i.test(p);
        const greetingPrefix = isGreetingPresent ? "Walaikum Assalam! " : "Assalam-o-Alaikum! ";
        return `${greetingPrefix}Aaj ke official gold aur silver rates:\n• 24K Gold: PKR ${rates.rate24k.toLocaleString()} per tola\n• 22K Jewellery Gold: PKR ${rates.rate22k.toLocaleString()} per tola\n• Silver (Chandi): PKR ${rates.silver.toLocaleString()} per tola\n\nHamari tamam jewellery 100% hallmark guaranteed hoti hai. Kisi bhi design ka quotation banwane ke liye aap item name aur weight bata sakte hain! 💍`;
    }

    // 1. Check for Menu / Food / Deals / Rates / Catalog queries FIRST (Highest priority)
    // Matches "menu send karo", "kaho menu send karo", "menu dikhao", "menu bhejo", "bhai menu", "rates", "deals", etc.
    const isMenuQuery = /\b(menu|khana|deal|deals|food|dish|dishes)\b/i.test(p) ||
        /(?:menu\s*send|send\s*menu|menu\s*dikhao|menu\s*bhejo|kaho\s*menu|menu\s*chahiye|rate\s*list)/i.test(p);

    if (isMenuQuery) {
        const isGreetingPresent = /\b(aoa|salam|assalam|hi|hello)\b/i.test(p);
        const greetingPrefix = isGreetingPresent ? "Walaikum Assalam! " : "G bilkul! ";

        if (detectedImages.length >= 2) {
            return `${greetingPrefix}Yeh lijiye hamara complete menu aur special deals:\n[SEND_IMAGE: ${detectedImages[0]}] [SEND_IMAGE: ${detectedImages[1]}]`;
        } else if (detectedImages.length === 1) {
            return `${greetingPrefix}Yeh lijiye hamara complete menu aur special deals:\n[SEND_IMAGE: ${detectedImages[0]}]`;
        } else {
            return `${greetingPrefix}Hamare cafe / restaurant ka menu aur special deals dekhne ke liye shukriya. Aap yahan kisi bhi item, deals ya order ke bare mein pooch sakte hain, hamara staff aapki mukammal rehnumai kare ga!`;
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
        return "Hamare restaurant / cafe ki timing daily open rehti hai. Aap apna order ya booking kisi bhi waqt yahan confirm karwa sakte hain.";
    }

    // 6. Location & Address
    if (/\b(location|address|kahan\s*hai|kahan\s*par|kider\s*hai|branch)\b/i.test(p)) {
        return "Aap hamari exact branch location aur directions ke liye hamare staff se rabta kar sakte hain ya apna area bata dein.";
    }

    // 7. Order & Delivery queries
    if (/\b(order|delivery|home\s*delivery|parcel|book|booking)\b/i.test(p)) {
        return "G bilkul! Aap apna order items aur delivery address yahan message kar dein, hamari team foran confirm kare gi.";
    }

    // 8. Polite General Fallback (ensures bot NEVER goes silent)
    return "Assalam-o-Alaikum! Shukriya rabta karne ka. Main aapki kya madad kar sakta hoon? Aap apna sawal, menu request ya order yahan message kar sakte hain.";
}
