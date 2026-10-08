import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateQuotationPdf, sendQuotationViaWhatsApp } from "@/lib/quotation-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const { sessionId, jid, itemName, weight, weightUnit, purity, customRatePerTola, makingCharges, customerName } = body;

        if (!itemName || !weight) {
            return NextResponse.json({ error: "Missing required fields: itemName and weight" }, { status: 400 });
        }

        const input = {
            customerName,
            itemName,
            weight: Number(weight),
            weightUnit: (weightUnit || "tola") as "tola" | "gram",
            purity: (purity || "22k") as "24k" | "22k" | "21k" | "18k",
            customRatePerTola: customRatePerTola ? Number(customRatePerTola) : undefined,
            makingCharges: makingCharges !== undefined ? Number(makingCharges) : undefined
        };

        if (sessionId && jid) {
            const result = await sendQuotationViaWhatsApp(sessionId, jid, input);
            return NextResponse.json({ success: true, dispatched: true, data: result });
        }

        const result = await generateQuotationPdf(input);
        return NextResponse.json({ success: true, dispatched: false, data: result });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
