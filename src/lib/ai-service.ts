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
        const apiKey = aiConfig.apiKey?.trim() || process.env.OPENROUTER_API_KEY || "";
        const modelName = aiConfig.modelName || DEFAULT_OPENROUTER_MODEL;
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

    } catch (error) {
        logger.error("AI-Service", "Error generating AI response:", error);
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

    // 1. OPENROUTER (Default & Free Models)
    if (provider === "openrouter") {
        const url = "https://openrouter.ai/api/v1/chat/completions";
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "HTTP-Referer": "https://sole-what.com",
            "X-Title": "sole-what WA Engine"
        };

        const finalApiKey = apiKey?.trim() || process.env.OPENROUTER_API_KEY || "";
        if (finalApiKey) {
            headers["Authorization"] = `Bearer ${finalApiKey}`;
        }

        // Always use openrouter/free dynamic model router for OpenRouter provider
        const targetModel = "openrouter/free";

        const response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify({
                model: targetModel,
                messages: [
                    { role: "system", content: fullSystemMessage },
                    { role: "user", content: userPrompt }
                ],
                temperature,
                max_tokens: maxTokens
            }),
            signal: AbortSignal.timeout(20000)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`OpenRouter returned HTTP ${response.status}: ${errText.substring(0, 200)}`);
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        return content ? content.trim() : null;
    }

    // 2. OPENAI (ChatGPT Direct API)
    if (provider === "openai") {
        if (!apiKey) {
            throw new Error("OpenAI API Key is required for OpenAI provider.");
        }

        const url = "https://api.openai.com/v1/chat/completions";
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
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
            signal: AbortSignal.timeout(20000)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`OpenAI returned HTTP ${response.status}: ${errText.substring(0, 200)}`);
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        return content ? content.trim() : null;
    }

    // 3. GOOGLE GEMINI API
    if (provider === "gemini") {
        if (!apiKey) {
            throw new Error("Google Gemini API Key is required.");
        }

        const geminiModel = modelName || "gemini-1.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;

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
            signal: AbortSignal.timeout(20000)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API returned HTTP ${response.status}: ${errText.substring(0, 200)}`);
        }

        const data = await response.json();
        const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return content ? content.trim() : null;
    }

    throw new Error(`Unsupported AI provider: ${provider}`);
}
