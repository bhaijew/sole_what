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

const DEFAULT_SYSTEM_PROMPT = `You are a polite, helpful customer support assistant for a business. 
Your goal is to answer customer questions accurately based ONLY on the provided Knowledge Base.
If you don't know the answer or if it is not in the knowledge base, politely inform the customer and offer to connect them with a human team member.
Keep responses concise, friendly, and easy to read on WhatsApp.`;

const DEFAULT_OPENROUTER_MODEL = "openrouter/free";

/**
 * Generate AI response for incoming WhatsApp message
 */
export async function generateAiResponse(
    sessionId: string,
    userMessageText: string,
    isGroup: boolean = false
): Promise<string | null> {
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
        const aiConfig = await (prisma as any).aiConfig.findUnique({
            where: { sessionId: session.id }
        });

        if (!aiConfig) {
            logger.info("AI-Bot", `No AI Config found for session ${sessionId}.`);
            return null;
        }

        if (!aiConfig.enabled) {
            logger.info("AI-Bot", `AI Auto-Responder is DISABLED for session ${sessionId}.`);
            return null;
        }

        if (isGroup && !aiConfig.triggerInGroups) {
            logger.info("AI-Bot", `Skipping AI response for group message (triggerInGroups is false).`);
            return null;
        }

        const provider = aiConfig.provider || "openrouter";
        // Check session apiKey first, then fall back to environment variables
        const envApiKey = 
            provider === "gemini" ? (process.env.GEMINI_API_KEY || "") :
            provider === "openai" ? (process.env.OPENAI_API_KEY || "") :
            (process.env.OPENROUTER_API_KEY || "");
        const apiKey = aiConfig.apiKey?.trim() || envApiKey;
        const modelName = aiConfig.modelName || (
            provider === "gemini" ? "gemini-1.5-flash" :
            provider === "openai" ? "gpt-4o-mini" :
            "openrouter/free"
        );
        const systemPrompt = aiConfig.systemPrompt || DEFAULT_SYSTEM_PROMPT;
        const knowledgeBase = aiConfig.knowledgeBase || "";

        logger.info("AI-Bot", `[Generating] Calling AI API (provider: ${provider}, model: ${modelName})...`);

        const aiReply = await callAiApi({
            provider,
            apiKey,
            modelName,
            systemPrompt,
            knowledgeBase,
            userPrompt: userMessageText,
            temperature: aiConfig.temperature || 0.7,
            maxTokens: aiConfig.maxTokens || 800
        });

        if (aiReply) {
            logger.success("AI-Bot", `[Success] AI generated ${aiReply.length} chars response.`);
        } else {
            logger.warn("AI-Bot", `AI generated empty response.`);
        }

        return aiReply;

    } catch (error: any) {
        logger.error("AI-Service", `Error generating AI response: ${error?.message || error}`);
        return null;
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

    // Construct full system instruction
    const fullSystemMessage = `${systemPrompt || DEFAULT_SYSTEM_PROMPT}

==================================================
BUSINESS KNOWLEDGE BASE & FAQS:
${knowledgeBase && knowledgeBase.trim().length > 0 ? knowledgeBase : "No specific knowledge base provided. Answer standard customer service queries politely."}
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
                    return content.trim();
                }
            } catch (err: any) {
                lastErrorMsg = err?.message || String(err);
                logger.warn("AI-Bot", `OpenRouter model "${currentModel}" encountered error: ${lastErrorMsg}. Falling back to next free model...`);
            }
        }

        throw new Error(`All OpenRouter free models failed. Last error: ${lastErrorMsg}`);
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
        return content ? content.trim() : null;
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
        return content ? content.trim() : null;
    }

    throw new Error(`Unsupported AI provider: ${provider}`);
}
