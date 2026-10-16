import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    accountType: z.enum(["store", "general"]).optional().default("store"),
    storeName: z.string().optional(),
    storePhone: z.string().optional(),
    storeCity: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, name, accountType, storeName, storePhone, storeCity } = registerSchema.parse(body);

        const isStoreRegistration = accountType === "store" || Boolean(storeName?.trim());

        // For generic system accounts, verify if public registration is enabled
        if (!isStoreRegistration) {
            const systemConfig = await prisma.systemConfig.findUnique({ where: { id: "default" } });
            // @ts-ignore
            if (!systemConfig || systemConfig.enableRegistration !== true) {
                return NextResponse.json(
                    { error: "Public gateway registration is closed. Please create a Store Account instead." },
                    { status: 403 }
                );
            }
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email already exists. Please sign in instead." },
                { status: 400 }
            );
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Store-creation accounts get a dedicated store_ apiKey to tag them for Store Creation view
        const apiKey = isStoreRegistration ? `store_${crypto.randomUUID()}` : null;

        // Create the user
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: "OWNER",
                apiKey,
            },
        });

        let createdStore = null;
        // If this is a store registration and a store name was given, provision their store immediately
        if (isStoreRegistration) {
            const finalStoreName = storeName?.trim() || `${name}'s Store`;
            let baseSlug = finalStoreName
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");
            if (!baseSlug || baseSlug.length < 2) {
                baseSlug = "store";
            }
            const uniqueSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

            createdStore = await prisma.store.create({
                data: {
                    userId: newUser.id,
                    name: finalStoreName,
                    slug: uniqueSlug,
                    phone: storePhone?.trim() || "",
                    city: storeCity?.trim() || "Lahore",
                    currency: "PKR",
                    currencySymbol: "Rs.",
                    deliveryFee: 0,
                    minOrderAmount: 0,
                    estimatedDeliveryTime: "30-45 mins",
                    openingHours: "9:00 AM - 11:00 PM",
                    isOpen: true,
                    isActive: true,
                    autoNotifyOwner: true,
                    autoNotifyCustomer: true,
                }
            });
        }

        return NextResponse.json({
            success: true,
            message: "Account created successfully for Store Creation",
            user: { id: newUser.id, name: newUser.name, email: newUser.email },
            isStoreOnly: isStoreRegistration,
            store: createdStore,
            redirect: "/store-dashboard"
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid registration data. Name, valid email, and password (min 6 chars) are required." },
                { status: 400 }
            );
        }

        console.error("Registration error:", error);
        return NextResponse.json(
            { error: error?.message || "Internal server error during registration" },
            { status: 500 }
        );
    }
}

