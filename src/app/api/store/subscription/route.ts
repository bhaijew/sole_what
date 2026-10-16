import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

// GET: Fetch store subscription status and payment configuration
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch system configuration
        // @ts-ignore
        const config = await prisma.systemConfig.findUnique({
            where: { id: "default" }
        });

        const isEnabled = config?.enableSubscriptionSystem || false;

        // Get query storeId or default to user's first store (or any store if superadmin)
        const { searchParams } = new URL(request.url);
        const queryStoreId = searchParams.get("storeId");

        const store = queryStoreId
            ? await prisma.store.findFirst({
                where: user.role === "SUPERADMIN" ? { id: queryStoreId } : { id: queryStoreId, userId: user.id }
            })
            : await prisma.store.findFirst({
                where: user.role === "SUPERADMIN" ? {} : { userId: user.id },
                orderBy: { createdAt: "asc" }
            });

        if (!store) {
            return NextResponse.json({
                success: true,
                enabled: isEnabled,
                isSuperAdmin: user.role === "SUPERADMIN",
                isLocked: false,
                store: null
            });
        }

        // Check if locked
        let isLocked = false;
        const now = new Date();

        if (store.subscriptionStatus === "EXPIRED" || !store.isActive) {
            isLocked = true;
        } else if (store.subscriptionStatus === "PENDING_APPROVAL") {
            isLocked = true;
        } else if (isEnabled) {
            if (store.subscriptionStatus === "LIFETIME") {
                isLocked = false;
            } else if (store.subscriptionExpiresAt && new Date(store.subscriptionExpiresAt) < now) {
                isLocked = true;
            }
        }

        return NextResponse.json({
            success: true,
            enabled: isEnabled,
            isSuperAdmin: user.role === "SUPERADMIN",
            isLocked,
            config: {
                price: config?.subscriptionPriceMonthly || 1500,
                trialDays: config?.subscriptionTrialDays || 7,
                jazzcash: config?.subscriptionJazzcashNumber || "",
                easypaisa: config?.subscriptionEasypaisaNumber || "",
                bankDetails: config?.subscriptionBankDetails || "",
                supportPhone: config?.subscriptionSupportPhone || "",
            },
            store: {
                id: store.id,
                name: store.name,
                slug: store.slug,
                isActive: store.isActive,
                subscriptionStatus: store.subscriptionStatus,
                subscriptionExpiresAt: store.subscriptionExpiresAt,
                subscriptionPlan: store.subscriptionPlan,
                subscriptionTransactionId: store.subscriptionTransactionId,
                subscriptionPaymentProof: store.subscriptionPaymentProof,
                subscriptionNotes: store.subscriptionNotes
            }
        });
    } catch (error: any) {
        console.error("Store subscription check error:", error);
        return NextResponse.json({ error: error.message || "Failed to check subscription" }, { status: 500 });
    }
}

// POST: Store owner submits payment transaction ID / proof
export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { storeId, transactionId, paymentProofUrl, notes } = body;

        if (!transactionId && !paymentProofUrl) {
            return NextResponse.json({ error: "Transaction ID ya Payment Receipt laazmi hai" }, { status: 400 });
        }

        const store = storeId
            ? await prisma.store.findFirst({
                where: user.role === "SUPERADMIN" ? { id: storeId } : { id: storeId, userId: user.id }
            })
            : await prisma.store.findFirst({
                where: user.role === "SUPERADMIN" ? {} : { userId: user.id }
            });

        if (!store) {
            return NextResponse.json({ error: "Dukaan nahi mili" }, { status: 404 });
        }

        const updated = await prisma.store.update({
            where: { id: store.id },
            data: {
                subscriptionStatus: "PENDING_APPROVAL",
                subscriptionTransactionId: transactionId?.trim() || null,
                subscriptionPaymentProof: paymentProofUrl?.trim() || null,
                subscriptionNotes: notes?.trim() || null
            }
        });

        return NextResponse.json({
            success: true,
            message: "Payment proof submit ho gaya hai! Admin jald verify karke dashboard unlock kar dega.",
            store: {
                id: updated.id,
                subscriptionStatus: updated.subscriptionStatus,
                subscriptionTransactionId: updated.subscriptionTransactionId
            }
        });
    } catch (error: any) {
        console.error("Store submit subscription proof error:", error);
        return NextResponse.json({ error: error.message || "Submission failed" }, { status: 500 });
    }
}
