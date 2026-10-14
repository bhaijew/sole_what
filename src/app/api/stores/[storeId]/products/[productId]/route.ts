import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

interface RouteParams {
    params: Promise<{ storeId: string; productId: string }>;
}

// PATCH: Update product (e.g. toggle inStock, change price, name, etc.)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { storeId, productId } = await params;

        // Verify store ownership
        const store = await prisma.store.findFirst({
            where: user.role === "SUPERADMIN" ? { id: storeId } : { id: storeId, userId: user.id }
        });

        if (!store) {
            return NextResponse.json({ error: "Store not found or unauthorized" }, { status: 404 });
        }

        const body = await request.json();
        const updateData: any = {};

        if (body.name !== undefined) updateData.name = body.name.trim();
        if (body.price !== undefined) updateData.price = Number(body.price);
        if (body.compareAtPrice !== undefined) {
            updateData.compareAtPrice = body.compareAtPrice ? Number(body.compareAtPrice) : null;
        }
        if (body.unit !== undefined) updateData.unit = body.unit.trim();
        if (body.inStock !== undefined) updateData.inStock = Boolean(body.inStock);
        if (body.image !== undefined) updateData.image = body.image?.trim() || null;
        if (body.description !== undefined) updateData.description = body.description?.trim() || null;

        const updatedProduct = await prisma.product.update({
            where: { id: productId, storeId },
            data: updateData
        });

        return NextResponse.json({ product: updatedProduct });
    } catch (error: any) {
        console.error("Update product error:", error);
        return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 500 });
    }
}

// DELETE: Remove product from store
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { storeId, productId } = await params;

        // Verify store ownership
        const store = await prisma.store.findFirst({
            where: user.role === "SUPERADMIN" ? { id: storeId } : { id: storeId, userId: user.id }
        });

        if (!store) {
            return NextResponse.json({ error: "Store not found or unauthorized" }, { status: 404 });
        }

        await prisma.product.delete({
            where: { id: productId, storeId }
        });

        return NextResponse.json({ success: true, message: "Product deleted successfully" });
    } catch (error: any) {
        console.error("Delete product error:", error);
        return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
    }
}
