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

        const hasAccess = await canAccessSession(user.id, user.role, sessionId);
        if (!hasAccess) {
            return NextResponse.json({ status: false, message: "Forbidden" }, { status: 403 });
        }

        const session = await prisma.session.findUnique({
            where: { sessionId },
            select: { id: true }
        });

        if (!session) {
            return NextResponse.json({ status: false, message: "Session not found" }, { status: 404 });
        }

        // @ts-ignore
        const aiConfig = await (prisma as any).aiConfig.findUnique({
            where: { sessionId: session.id }
        });

        return NextResponse.json({
            status: true,
            data: aiConfig || {
                enabled: false,
                provider: "openrouter",
                apiKey: "",
                modelName: "meta-llama/llama-3.1-8b-instruct:free",
                systemPrompt: `You are a polite, helpful customer support assistant for a business. Answer customer questions accurately based ONLY on the provided Knowledge Base. Keep responses concise, friendly, and easy to read on WhatsApp.`,
                knowledgeBase: "",
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

        const hasAccess = await canAccessSession(user.id, user.role, sessionId);
        if (!hasAccess) {
            return NextResponse.json({ status: false, message: "Forbidden" }, { status: 403 });
        }

        const session = await prisma.session.findUnique({
            where: { sessionId },
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
