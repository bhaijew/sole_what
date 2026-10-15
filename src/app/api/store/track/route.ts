import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get("slug");
        const query = searchParams.get("query"); // Order Number (e.g. ORD-1001) or phone number

        if (!slug || !query) {
            return NextResponse.json(
                { success: false, error: "Store slug aur Order ID / Phone number darj karein." },
                { status: 400 }
            );
        }

        const store = await prisma.store.findFirst({
            where: {
                OR: [
                    { slug: slug.toLowerCase() },
                    { customDomain: slug.toLowerCase() }
                ],
                isActive: true
            },
            select: {
                id: true,
                name: true,
                phone: true,
                city: true,
                address: true,
                currencySymbol: true,
                estimatedDeliveryTime: true
            }
        });

        if (!store) {
            return NextResponse.json(
                { success: false, error: "Dukaan dastyab nahi hai." },
                { status: 404 }
            );
        }

        const cleanQuery = query.trim();
        const cleanPhone = cleanQuery.replace(/[^\d]/g, "");

        // Search for matching order in this store
        const order = await prisma.order.findFirst({
            where: {
                storeId: store.id,
                OR: [
                    { orderNumber: { equals: cleanQuery } },
                    { orderNumber: { equals: cleanQuery.toUpperCase() } },
                    { orderNumber: { contains: cleanQuery } },
                    ...(cleanPhone.length >= 7 ? [
                        { customerPhone: { contains: cleanPhone } }
                    ] : [])
                ]
            },
            include: {
                items: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        if (!order) {
            return NextResponse.json(
                { success: false, error: `Order #${cleanQuery} nahi mila. Baraye meherbani Order ID ya Phone check karein.` },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                orderNumber: order.orderNumber,
                status: order.status,
                customerName: order.customerName,
                customerAddress: order.customerAddress,
                subtotal: order.subtotal,
                deliveryFee: order.deliveryFee,
                discount: order.discount,
                total: order.total,
                paymentMethod: order.paymentMethod,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                items: order.items.map(it => ({
                    productName: it.productName,
                    quantity: it.quantity,
                    unitPrice: it.unitPrice,
                    totalPrice: it.totalPrice,
                    productImage: it.productImage
                }))
            },
            store: store
        });
    } catch (error: any) {
        console.error("Order Tracking Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to track order" },
            { status: 500 }
        );
    }
}
