import { prisma } from "./prisma";
import { logger } from "./logger";

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
 * Execute API call to OpenRouter, OpenAI, or Gemini
 */
export async function callAiApi(params: {
    provider: string;
    apiKey: string;
    modelName: string;
    systemPrompt?: string;
    knowledgeBase?: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
}): Promise<string | null> {
    const { provider, apiKey, modelName, systemPrompt, knowledgeBase, userPrompt, temperature = 0.7, maxTokens = 800 } = params;

    // Detect image URLs in Knowledge Base (Menu Image 1 & 2, Catalog, etc.)
    const detectedImages: string[] = [];
    if (knowledgeBase) {
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
    }

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

    // Construct full system instruction
    const fullSystemMessage = `${systemPrompt || DEFAULT_SYSTEM_PROMPT}

==================================================
BUSINESS KNOWLEDGE BASE & FAQS:
${knowledgeBase && knowledgeBase.trim().length > 0 ? knowledgeBase : "No specific knowledge base provided. Answer standard customer service queries politely."}${mediaInstruction}
==================================================`;

    // 1. OPENROUTER (Default & Free Models with Automatic Fallback Chain)
    if (provider === "openrouter") {
        const url = "https://openrouter.ai/api/v1/chat/completions";
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "HTTP-Referer": "https://sole-what.com",
            "X-Title": "sole-what WA Engine"
        };

        const finalApiKey = apiKey?.trim() || process.env.OPENROUTER_API_KEY || "";
        if (!finalApiKey) {
            throw new Error("OpenRouter API Key is required. Please enter your OpenRouter key in AI Bot settings or set OPENROUTER_API_KEY in Railway Variables.");
        }
        headers["Authorization"] = `Bearer ${finalApiKey}`;

        // Top reliable free models on OpenRouter
        const freeFallbackModels = [
            "openrouter/free",
            "deepseek/deepseek-r1:free",
            "google/gemma-2-9b-it:free",
            "qwen/qwen-2.5-7b-instruct:free",
            "meta-llama/llama-3.3-70b-instruct:free",
            "mistralai/mistral-7b-instruct:free",
            "meta-llama/llama-3.1-8b-instruct:free"
        ];

        const requestedModel = modelName?.trim() || "openrouter/free";
        // Build sequence: try requested model first, then remaining free models
        const modelsToTry = [
            requestedModel,
            ...freeFallbackModels.filter((m) => m !== requestedModel)
        ];

        let lastErrorMsg = "";

        for (const currentModel of modelsToTry) {
            try {
                logger.info("AI-Bot", `Calling OpenRouter with model: ${currentModel}...`);

                const response = await fetch(url, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        model: currentModel,
                        messages: [
                            { role: "system", content: fullSystemMessage },
                            { role: "user", content: userPrompt }
                        ],
                        temperature,
                        max_tokens: maxTokens
                    }),
                    signal: AbortSignal.timeout(25000)
                });

                if (!response.ok) {
                    const errText = await response.text();
                    lastErrorMsg = `HTTP ${response.status}: ${errText.substring(0, 300)}`;
                    logger.warn("AI-Bot", `OpenRouter model "${currentModel}" failed (${response.status}): ${errText.substring(0, 150)}. Falling back to next free model...`);
                    continue; // Try next model in chain
                }

                const data = await response.json();
                const content = data?.choices?.[0]?.message?.content;
                if (content && content.trim().length > 0) {
                    logger.success("AI-Bot", `OpenRouter successfully generated response using: ${currentModel}`);
                    return finalizeAiReply(content, userPrompt, detectedImages);
                }
            } catch (err: any) {
                lastErrorMsg = err?.message || String(err);
                logger.warn("AI-Bot", `OpenRouter model "${currentModel}" encountered error: ${lastErrorMsg}. Falling back to next free model...`);
            }
        }

        const fallback = getNaturalFallbackReply(userPrompt, detectedImages);
        logger.info("AI-Bot", `Used natural conversational fallback for: "${userPrompt}"`);
        return fallback;
    }

    // 2. OPENAI (ChatGPT Direct API)
    if (provider === "openai") {
        const finalApiKey = apiKey?.trim() || process.env.OPENAI_API_KEY || "";
        if (!finalApiKey) {
            throw new Error("OpenAI API Key is required. Please enter your OpenAI key in AI Bot settings or set OPENAI_API_KEY in Railway Variables.");
        }

        const url = "https://api.openai.com/v1/chat/completions";
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${finalApiKey}`
            },
            body: JSON.stringify({
                model: modelName || "gpt-4o-mini",
                messages: [
                    { role: "system", content: fullSystemMessage },
                    { role: "user", content: userPrompt }
                ],
                temperature,
                max_tokens: maxTokens
            }),
            signal: AbortSignal.timeout(25000)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`OpenAI returned HTTP ${response.status}: ${errText.substring(0, 300)}`);
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        return finalizeAiReply(content, userPrompt, detectedImages);
    }

    // 3. GOOGLE GEMINI API
    if (provider === "gemini") {
        const finalApiKey = apiKey?.trim() || process.env.GEMINI_API_KEY || "";
        if (!finalApiKey) {
            throw new Error("Google Gemini API Key is required. Please enter your Gemini key in AI Bot settings or set GEMINI_API_KEY in Railway Variables.");
        }

        // Clean model name: remove "google/" or "models/" prefix if present
        const geminiModel = (modelName || "gemini-1.5-flash")
            .replace(/^google\//, "")
            .replace(/^models\//, "");
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${finalApiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: fullSystemMessage }]
                },
                contents: [
                    {
                        parts: [{ text: userPrompt }]
                    }
                ],
                generationConfig: {
                    temperature,
                    maxOutputTokens: maxTokens
                }
            }),
            signal: AbortSignal.timeout(25000)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API returned HTTP ${response.status}: ${errText.substring(0, 300)}`);
        }

        const data = await response.json();
        const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return finalizeAiReply(content, userPrompt, detectedImages);
    }

    const fallback = getNaturalFallbackReply(userPrompt, detectedImages);
    return fallback;
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

    // 1. Check for Menu / Food / Deals / Rates / Catalog queries FIRST (Highest priority)
    // Matches "menu send karo", "kaho menu send karo", "menu dikhao", "menu bhejo", "bhai menu", "rates", "deals", etc.
    const isMenuQuery = /\b(menu|khana|deal|deals|rate|rates|price|prices|food|catalog|catalogue|card|list|items?|dish|dishes)\b/i.test(p) ||
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
