import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, canAccessSession } from "@/lib/api-auth";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
        }

        const { sessionId } = await params;

        if (user.role !== "SUPERADMIN" && user.role !== "OWNER") {
            return NextResponse.json({ status: false, message: "Forbidden - AI Auto-Responder is only available for Admins and Superadmins" }, { status: 403 });
        }

        const hasAccess = await canAccessSession(user.id, user.role, sessionId);
        if (!hasAccess) {
            return NextResponse.json({ status: false, message: "Forbidden" }, { status: 403 });
        }

        const session = await prisma.session.findFirst({
            where: {
                OR: [
                    { sessionId },
                    { id: sessionId }
                ]
            },
            select: { id: true }
        });

        if (!session) {
            return NextResponse.json({ status: false, message: "Session not found" }, { status: 404 });
        }

        // @ts-ignore
        let aiConfig = await (prisma as any).aiConfig.findUnique({
            where: { sessionId: session.id }
        });

        // If no menuUrl is set yet, check if there is an associated store for this session
        let defaultMenuUrl = "";
        try {
            const store = await prisma.store.findFirst({
                where: { OR: [{ sessionId: session.id }, { sessionId }] },
                select: { slug: true, customDomain: true }
            });
            if (store) {
                defaultMenuUrl = store.customDomain ? `https://${store.customDomain}` : `/s/${store.slug}`;
            }
        } catch (_) {}

        return NextResponse.json({
            status: true,
            data: aiConfig ? {
                ...aiConfig,
                menuUrl: aiConfig.menuUrl || defaultMenuUrl,
                enableGoldRates: Boolean(aiConfig.enableGoldRates),
                aiRequestsCount: aiConfig.aiRequestsCount || 0
            } : {
                enabled: true,
                provider: "openrouter",
                apiKey: "",
                modelName: "meta-llama/llama-3.1-8b-instruct:free",
                systemPrompt: `You are a polite, natural, and helpful WhatsApp customer service assistant for this business.
Speak naturally in polite Roman Urdu (or English if the customer speaks English).

COMMUNICATION RULES:
1. Be concise, direct, and human. Answer EXACTLY what the customer asked without robotic filler.
2. If greeting (salam, kay hal ha), reply warmly and politely as a real human representative.
3. Answer questions strictly based on the provided Business Knowledge Base, products, and prices.
4. If asked about the menu or catalog, provide the live menu link or images as specified.
5. If something is not known, politely tell them our team will assist them shortly.`,
                knowledgeBase: "",
                menuUrl: defaultMenuUrl,
                enableGoldRates: false,
                aiRequestsCount: 0,
                temperature: 0.7,
                maxTokens: 800,
                triggerInGroups: false,
                fallbackOnly: true
            }
        });
    } catch (error: any) {
        console.error("Fetch AI Config Error:", error);
        return NextResponse.json({ status: false, message: "Failed to fetch AI Config" }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
        }

        const { sessionId } = await params;

        if (user.role !== "SUPERADMIN" && user.role !== "OWNER") {
            return NextResponse.json({ status: false, message: "Forbidden - AI Auto-Responder is only available for Admins and Superadmins" }, { status: 403 });
        }

        const hasAccess = await canAccessSession(user.id, user.role, sessionId);
        if (!hasAccess) {
            return NextResponse.json({ status: false, message: "Forbidden" }, { status: 403 });
        }

        const session = await prisma.session.findFirst({
            where: {
                OR: [
                    { sessionId },
                    { id: sessionId }
                ]
            },
            select: { id: true }
        });

        if (!session) {
            return NextResponse.json({ status: false, message: "Session not found" }, { status: 404 });
        }

        const body = await request.json();
        const {
            enabled,
            provider,
            apiKey,
            modelName,
            systemPrompt,
            knowledgeBase,
            menuUrl,
            enableGoldRates,
            temperature,
            maxTokens,
            triggerInGroups,
            fallbackOnly
        } = body;

        // Upsert AI Config
        // @ts-ignore
        const updatedConfig = await (prisma as any).aiConfig.upsert({
            where: { sessionId: session.id },
            update: {
                enabled: Boolean(enabled),
                provider: provider || "openrouter",
                apiKey: apiKey || null,
                modelName: modelName || "meta-llama/llama-3.1-8b-instruct:free",
                systemPrompt: systemPrompt || null,
                knowledgeBase: knowledgeBase || null,
                menuUrl: menuUrl || null,
                enableGoldRates: Boolean(enableGoldRates),
                temperature: typeof temperature === "number" ? temperature : 0.7,
                maxTokens: typeof maxTokens === "number" ? maxTokens : 800,
                triggerInGroups: Boolean(triggerInGroups),
                fallbackOnly: fallbackOnly !== undefined ? Boolean(fallbackOnly) : true
            },
            create: {
                sessionId: session.id,
                enabled: Boolean(enabled),
                provider: provider || "openrouter",
                apiKey: apiKey || null,
                modelName: modelName || "meta-llama/llama-3.1-8b-instruct:free",
                systemPrompt: systemPrompt || null,
                knowledgeBase: knowledgeBase || null,
                menuUrl: menuUrl || null,
                enableGoldRates: Boolean(enableGoldRates),
                aiRequestsCount: 0,
                temperature: typeof temperature === "number" ? temperature : 0.7,
                maxTokens: typeof maxTokens === "number" ? maxTokens : 800,
                triggerInGroups: Boolean(triggerInGroups),
                fallbackOnly: fallbackOnly !== undefined ? Boolean(fallbackOnly) : true
            }
        });

        return NextResponse.json({
            status: true,
            message: "AI Configuration updated successfully",
            data: updatedConfig
        });
    } catch (error: any) {
        console.error("Update AI Config Error:", error);
        return NextResponse.json({ status: false, message: "Failed to update AI Config", error: error.message }, { status: 500 });
    }
}
