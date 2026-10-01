import { NextResponse, NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { callAiApi } from "@/lib/ai-service";

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { provider, apiKey, modelName, systemPrompt, knowledgeBase, userPrompt } = body;

        if (!userPrompt) {
            return NextResponse.json({ status: false, message: "userPrompt is required" }, { status: 400 });
        }

        const replyText = await callAiApi({
            provider: provider || "openrouter",
            apiKey: apiKey || "",
            modelName: modelName || "meta-llama/llama-3.1-8b-instruct:free",
            systemPrompt,
            knowledgeBase,
            userPrompt
        });

        if (!replyText) {
            return NextResponse.json({ status: false, message: "No response generated from AI" }, { status: 500 });
        }

        return NextResponse.json({
            status: true,
            data: {
                reply: replyText
            }
        });
    } catch (error: any) {
        console.error("AI Playground Test Error:", error);
        return NextResponse.json({
            status: false,
            message: error.message || "Failed to generate AI response",
            error: error.message
        }, { status: 500 });
    }
}
