import { NextResponse, NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { callAiApi, extractPlaceOrderPayload, formatDeliveryRulesPrompt } from "@/lib/ai-service";
import { getPizzaShopCatalogForAi, createPizzaOrderInSupabase } from "@/lib/pizza-supabase";

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
        }

        if (user.role !== "SUPERADMIN" && user.role !== "OWNER") {
            return NextResponse.json({ status: false, message: "Forbidden - AI testing is only available for Admins and Superadmins" }, { status: 403 });
        }

        const body = await request.json();
        const { provider, apiKey, modelName, systemPrompt, knowledgeBase, userPrompt, conversationHistory, menuUrl, enableGoldRates, pizzaShopId, deliveryRules } = body;

        if (!userPrompt) {
            return NextResponse.json({ status: false, message: "userPrompt is required" }, { status: 400 });
        }

        let combinedKb = knowledgeBase || "";
        const targetShopId = pizzaShopId ? Number(pizzaShopId) : 7;

        if (targetShopId) {
            try {
                const pizzaCatalog = await getPizzaShopCatalogForAi(targetShopId);
                if (pizzaCatalog) {
                    combinedKb = [combinedKb, pizzaCatalog].filter(Boolean).join("\n\n");
                }
            } catch (_) {}
        }

        if (deliveryRules && deliveryRules.enabled) {
            const rulesPrompt = formatDeliveryRulesPrompt(deliveryRules);
            if (rulesPrompt) {
                combinedKb = [combinedKb, rulesPrompt].filter(Boolean).join("\n\n");
            }
        }

        let replyText = await callAiApi({
            provider: provider || "openrouter",
            apiKey: apiKey || "",
            modelName: modelName || "meta-llama/llama-3.1-8b-instruct:free",
            systemPrompt,
            knowledgeBase: combinedKb,
            userPrompt,
            conversationHistory: Array.isArray(conversationHistory) ? conversationHistory : undefined,
            menuUrl,
            enableGoldRates: Boolean(enableGoldRates)
        });

        if (!replyText) {
            return NextResponse.json({ status: false, message: "No response generated from AI" }, { status: 500 });
        }

        // Check if an order tag was produced
        const extracted = extractPlaceOrderPayload(replyText);
        if (extracted && extracted.orderData) {
            try {
                const orderData = extracted.orderData;
                const orderRes = await createPizzaOrderInSupabase({
                    shopId: targetShopId,
                    customerName: orderData.name || "Playground Test Customer",
                    customerPhone: orderData.phone || "03001234567",
                    deliveryAddress: orderData.address || "Street 4 Sohawa",
                    items: Array.isArray(orderData.items) ? orderData.items : [],
                    total: Number(orderData.total) || 0,
                    notes: `[Dashboard Playground Test | Contact: ${orderData.phone || "03001234567"}]`
                });

                if (orderRes.success && orderRes.orderNumber) {
                    replyText = replyText.replace(extracted.fullTag, `\n\n🧾 *Order Number:* ${orderRes.orderNumber}\n⚡ *Status:* Sent directly to Kitchen & POS!`).trim();
                } else {
                    replyText = replyText.replace(extracted.fullTag, `\n\n⚠️ (Order creation warning: ${orderRes.error || "failed to save"})\n`).trim();
                }
            } catch (err: any) {
                replyText = replyText.replace(extracted.fullTag, "").trim();
            }
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
