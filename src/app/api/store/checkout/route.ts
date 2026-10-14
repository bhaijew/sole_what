import { NextResponse } from "next/server";
import { createStoreOrder } from "@/lib/store-service";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const {
            storeId,
            customerName,
            customerPhone,
            customerAddress,
            customerCity,
            customerNotes,
            paymentMethod,
            items
        } = body;

        if (!storeId) {
            return NextResponse.json({ error: "Store ID is required" }, { status: 400 });
        }

        if (!customerName || !customerName.trim()) {
            return NextResponse.json({ error: "Apna naam darj karein (Name is required)" }, { status: 400 });
        }

        if (!customerPhone || !customerPhone.trim()) {
            return NextResponse.json({ error: "Apna WhatsApp phone number darj karein" }, { status: 400 });
        }

        if (!customerAddress || !customerAddress.trim()) {
            return NextResponse.json({ error: "Mukammal delivery address / mohalla darj karein" }, { status: 400 });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "Aapki cart khali hai. Kam az kam aik item select karein" }, { status: 400 });
        }

        const result = await createStoreOrder({
            storeId,
            customerName,
            customerPhone,
            customerAddress,
            customerCity,
            customerNotes,
            paymentMethod: paymentMethod || "COD",
            items
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Store Checkout Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process order" },
            { status: 500 }
        );
    }
}
