import { prisma } from "@/lib/prisma";
import { logger } from "./logger";
import { ChatService } from "@/modules/whatsapp/chat.service";
import { normalizeJid } from "@/lib/jid-utils";

export interface CreateOrderItemInput {
    productId: string;
    quantity: number;
}

export interface CreateOrderInput {
    storeId: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerCity?: string;
    customerNotes?: string;
    paymentMethod?: string; // "COD" | "JAZZCASH" | "EASYPAISA" | "BANK"
    discount?: number;
    couponCode?: string;
    transactionId?: string;
    paymentProofUrl?: string;
    items: CreateOrderItemInput[];
}

/**
 * Clean phone number to WhatsApp international format (e.g. 03001234567 -> 923001234567)
 */
export function formatPhoneNumberToWA(phone: string): string {
    if (!phone) return "";
    let clean = phone.replace(/[^\d]/g, "");
    if (clean.startsWith("00")) {
        clean = clean.substring(2);
    }
    if (clean.startsWith("0")) {
        clean = "92" + clean.substring(1);
    } else if (clean.length === 10 && clean.startsWith("3")) {
        clean = "92" + clean;
    }
    return clean;
}

/**
 * Sample Pre-configured Pakistani Mohalla Stores for Local Directory & Instant Demo
 */
export const SAMPLE_PUBLIC_STORES: any[] = [
    {
        id: "sample-bismillah-store",
        userId: "sample-user-1",
        name: "Bismillah Super Store & Cash n Carry",
        slug: "bismillah-store",
        tagline: "Apke Mohallay Ki Apni Dukaan - Ration, Grocery & Cold Drinks",
        description: "Fresh daily ration, wheat flour (atta), pulses, cooking oil, dairy, snacks, and beverages delivered to your doorstep in 30-45 minutes.",
        logoUrl: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=300&auto=format&fit=crop&q=80",
        bannerUrl: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&auto=format&fit=crop&q=80",
        phone: "923001234567",
        email: "bismillah@solewhat.store",
        address: "Main Boulevard, Phase 1, Johar Town, Lahore",
        city: "Lahore",
        area: "Johar Town",
        currency: "PKR",
        currencySymbol: "Rs.",
        deliveryFee: 0,
        minOrderAmount: 500,
        freeDeliveryAbove: 1500,
        estimatedDeliveryTime: "30-45 mins",
        openingHours: "8:00 AM - 12:00 AM",
        noticeMessage: "🎉 Free delivery on all orders above Rs. 1500! Fresh stock arrived today.",
        isActive: true,
        isOpen: true,
        categories: [
            { id: "c-gro", name: "Grocery & Kirana", slug: "grocery", icon: "🛒", order: 1, isActive: true },
            { id: "c-dai", name: "Dairy & Eggs", slug: "dairy", icon: "🥛", order: 2, isActive: true },
            { id: "c-bev", name: "Beverages & Drinks", slug: "beverages", icon: "🥤", order: 3, isActive: true },
            { id: "c-sna", name: "Snacks & Biscuits", slug: "snacks", icon: "🍪", order: 4, isActive: true }
        ],
        products: [
            { id: "p-1", categoryId: "c-dai", name: "Olper's Full Cream Milk 1L", slug: "olpers-milk-1l", description: "100% pure homogenized UHT treated milk.", price: 290, compareAtPrice: 310, unit: "liter", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80", inStock: true, isFeatured: true, order: 1 },
            { id: "p-2", categoryId: "c-gro", name: "Dalda Cooking Oil 5L Can", slug: "dalda-oil-5l", description: "Premium refined vegetable cooking oil with Vitamin A & D.", price: 2650, compareAtPrice: 2800, unit: "can", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80", inStock: true, isFeatured: true, order: 2 },
            { id: "p-3", categoryId: "c-gro", name: "Sunridge Chakki Atta 10kg", slug: "sunridge-atta-10kg", description: "100% whole wheat chakki ground nutritious atta.", price: 1420, compareAtPrice: 1500, unit: "bag", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80", inStock: true, isFeatured: true, order: 3 },
            { id: "p-4", categoryId: "c-bev", name: "Tapal Danedar Tea 430g Poly Pack", slug: "tapal-tea-430g", description: "The authentic strong taste and rich aroma of Pakistan's favorite tea.", price: 740, compareAtPrice: 780, unit: "pack", image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80", inStock: true, isFeatured: true, order: 4 },
            { id: "p-5", categoryId: "c-sna", name: "Lays Masala Wave 65g", slug: "lays-masala-65g", description: "Crispy crinkle potato chips with spicy Pakistani masala.", price: 100, compareAtPrice: 100, unit: "pack", image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=80", inStock: true, isFeatured: false, order: 5 }
        ]
    },
    {
        id: "sample-madina-bakery",
        userId: "sample-user-2",
        name: "Madina Milk & Fresh Bakery",
        slug: "madina-bakery",
        tagline: "Khalis Bhains Ka Doodh, Fresh Bread, Rusk, Patties & Sweets",
        description: "Fresh morning bakery items, crispy rusks, milk bread, hot chicken patties, fresh yogurt (dahi) and khalis buffalo milk.",
        logoUrl: "https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=300&auto=format&fit=crop&q=80",
        bannerUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=80",
        phone: "923007654321",
        email: "madina.bakery@solewhat.store",
        address: "Main Market, Gulberg III, Lahore",
        city: "Lahore",
        area: "Gulberg III",
        currency: "PKR",
        currencySymbol: "Rs.",
        deliveryFee: 50,
        minOrderAmount: 300,
        freeDeliveryAbove: 800,
        estimatedDeliveryTime: "20-30 mins",
        openingHours: "6:30 AM - 11:30 PM",
        noticeMessage: "Fresh Morning Bake ready! Warm chicken patties and khalis doodh available.",
        isActive: true,
        isOpen: true,
        categories: [
            { id: "c-bak", name: "Fresh Bakery", slug: "bakery", icon: "🥐", order: 1, isActive: true },
            { id: "c-dai-2", name: "Fresh Milk & Dairy", slug: "dairy", icon: "🥛", order: 2, isActive: true },
            { id: "c-sw", name: "Traditional Sweets", slug: "sweets", icon: "🍬", order: 3, isActive: true }
        ],
        products: [
            { id: "p-b1", categoryId: "c-bak", name: "Dawn Special Large Milky Bread", slug: "dawn-milky-bread", description: "Freshly baked soft large sliced bread.", price: 210, compareAtPrice: 220, unit: "pack", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80", inStock: true, isFeatured: true, order: 1 },
            { id: "p-b2", categoryId: "c-bak", name: "Crispy Sugar-Free Rusk 400g", slug: "crispy-rusk-400g", description: "Crunchy double-baked breakfast rusks.", price: 260, compareAtPrice: 280, unit: "pack", image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=80", inStock: true, isFeatured: true, order: 2 },
            { id: "p-b3", categoryId: "c-bak", name: "Chicken Patties (Pack of 4)", slug: "chicken-patties-4", description: "Flaky golden puff pastry stuffed with spicy chicken mince.", price: 380, compareAtPrice: 420, unit: "pack", image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80", inStock: true, isFeatured: true, order: 3 },
            { id: "p-b4", categoryId: "c-dai-2", name: "Khalis Bhains Ka Doodh 1KG", slug: "khalis-doodh-1kg", description: "Pure fresh thick unadulterated milk.", price: 220, compareAtPrice: 240, unit: "kg", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80", inStock: true, isFeatured: true, order: 4 }
        ]
    },
    {
        id: "sample-alfateh-express",
        userId: "sample-user-3",
        name: "Al-Fateh Neighborhood Mart",
        slug: "alfateh-express",
        tagline: "Premium Organic Produce, Imported Snacks & Daily Essentials",
        description: "Full spectrum grocery, fresh imported fruits, gourmet pantry, organic vegetables, and household cleaning supplies.",
        logoUrl: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=300&auto=format&fit=crop&q=80",
        bannerUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80",
        phone: "923214567890",
        email: "alfateh.express@solewhat.store",
        address: "Sector C Commercial Area, DHA Phase 5, Lahore",
        city: "Lahore",
        area: "DHA Phase 5",
        currency: "PKR",
        currencySymbol: "Rs.",
        deliveryFee: 80,
        minOrderAmount: 800,
        freeDeliveryAbove: 2500,
        estimatedDeliveryTime: "25-35 mins",
        openingHours: "9:00 AM - 1:00 AM",
        noticeMessage: "Express 30 mins delivery across DHA Phase 1 to 6.",
        isActive: true,
        isOpen: true,
        categories: [
            { id: "c-imp", name: "Imported & Gourmet", slug: "imported", icon: "🍫", order: 1, isActive: true },
            { id: "c-gro-2", name: "Pantry & Staples", slug: "pantry", icon: "🌾", order: 2, isActive: true },
            { id: "c-fru", name: "Fresh Fruits & Veg", slug: "fruits", icon: "🍎", order: 3, isActive: true }
        ],
        products: [
            { id: "p-af1", categoryId: "c-imp", name: "Nutella Hazelnut Spread 750g", slug: "nutella-750g", description: "Delicious cocoa hazelnut spread made with select roasted hazelnuts.", price: 2150, compareAtPrice: 2300, unit: "jar", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80", inStock: true, isFeatured: true, order: 1 },
            { id: "p-af2", categoryId: "c-fru", name: "Imported Gala Apples 1KG", slug: "gala-apples-1kg", description: "Crisp, sweet, and juicy hand-picked gala apples.", price: 680, compareAtPrice: 750, unit: "kg", image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=80", inStock: true, isFeatured: true, order: 2 }
        ]
    },
    {
        id: "sample-subhanallah-mart",
        userId: "sample-user-4",
        name: "Subhan Allah Super Store & Meat Corner",
        slug: "subhanallah-mart",
        tagline: "Taza Gosht, Murghi, Atta, Daalein aur Ration Munasib Damoon",
        description: "Karachi's trusted neighborhood store for fresh chicken, mutton, beef cuts, lentils, rice, spices, and complete monthly grocery ration.",
        logoUrl: "https://images.unsplash.com/photo-1579113800032-c38bd7635818?w=300&auto=format&fit=crop&q=80",
        bannerUrl: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=1200&auto=format&fit=crop&q=80",
        phone: "923019876543",
        email: "subhanallah@solewhat.store",
        address: "Block 13-D, University Road, Gulshan-e-Iqbal, Karachi",
        city: "Karachi",
        area: "Gulshan-e-Iqbal",
        currency: "PKR",
        currencySymbol: "Rs.",
        deliveryFee: 50,
        minOrderAmount: 500,
        freeDeliveryAbove: 1500,
        estimatedDeliveryTime: "30-45 mins",
        openingHours: "8:00 AM - 11:45 PM",
        noticeMessage: "🥩 Fresh Chicken & Mutton cuts prepared cleanly upon order.",
        isActive: true,
        isOpen: true,
        categories: [
            { id: "c-meat", name: "Fresh Meat & Poultry", slug: "meat", icon: "🥩", order: 1, isActive: true },
            { id: "c-gro-k", name: "Grocery & Ration", slug: "grocery", icon: "🛒", order: 2, isActive: true }
        ],
        products: [
            { id: "p-m1", categoryId: "c-meat", name: "Fresh Chicken Breast Boneless 1KG", slug: "chicken-boneless-1kg", description: "Hygienically washed, clean-cut boneless breast fillets.", price: 980, compareAtPrice: 1050, unit: "kg", image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&auto=format&fit=crop&q=80", inStock: true, isFeatured: true, order: 1 },
            { id: "p-m2", categoryId: "c-gro-k", name: "Guard Supreme Basmati Rice 5KG", slug: "guard-rice-5kg", description: "Aged long grain aromatic Pakistani basmati rice.", price: 2100, compareAtPrice: 2250, unit: "bag", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80", inStock: true, isFeatured: true, order: 2 }
        ]
    },
    {
        id: "sample-clifton-mart",
        userId: "sample-user-5",
        name: "Clifton Gourmet & Pharmacy Mart",
        slug: "clifton-mart",
        tagline: "24/7 OTC Medicines, Baby Care, Fresh Organic Produce & Snacks",
        description: "Emergency medical supplies, baby diapers, formulas, organic health foods, imported chocolates, and daily necessities delivered in Clifton & DHA.",
        logoUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80",
        bannerUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200&auto=format&fit=crop&q=80",
        phone: "923023344556",
        email: "clifton.mart@solewhat.store",
        address: "Khayaban-e-Shamsheer, Phase 5 DHA, Karachi",
        city: "Karachi",
        area: "DHA Phase 5 / Clifton",
        currency: "PKR",
        currencySymbol: "Rs.",
        deliveryFee: 70,
        minOrderAmount: 600,
        freeDeliveryAbove: 2000,
        estimatedDeliveryTime: "20-35 mins",
        openingHours: "Open 24 Hours",
        noticeMessage: "⚡ 24/7 Night Delivery Available in DHA & Clifton.",
        isActive: true,
        isOpen: true,
        categories: [
            { id: "c-ph", name: "Pharmacy & Wellness", slug: "pharmacy", icon: "💊", order: 1, isActive: true },
            { id: "c-bb", name: "Baby Care & Diapers", slug: "baby-care", icon: "🍼", order: 2, isActive: true },
            { id: "c-sn", name: "Snacks & Drinks", slug: "snacks", icon: "🍫", order: 3, isActive: true }
        ],
        products: [
            { id: "p-ph1", categoryId: "c-bb", name: "Pampers Pants Large (Size 4) 48 Pcs", slug: "pampers-pants-large", description: "Ultra-absorbent soft baby pull-up pants.", price: 2950, compareAtPrice: 3200, unit: "pack", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80", inStock: true, isFeatured: true, order: 1 }
        ]
    },
    {
        id: "sample-kohsar-supermarket",
        userId: "sample-user-6",
        name: "Kohsar Supermarket & Fresh Butchery",
        slug: "kohsar-supermarket",
        tagline: "Islamabad ka No.1 Family Supermarket - Fresh Meats & Groceries",
        description: "Full departmental grocery, imported seasonings, dairy, fresh farm eggs, premium butcher cuts, and prompt home delivery in Islamabad sectors.",
        logoUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80",
        bannerUrl: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&auto=format&fit=crop&q=80",
        phone: "923335566778",
        email: "kohsar@solewhat.store",
        address: "F-10 Markaz, Islamabad",
        city: "Islamabad",
        area: "F-10 Markaz",
        currency: "PKR",
        currencySymbol: "Rs.",
        deliveryFee: 0,
        minOrderAmount: 700,
        freeDeliveryAbove: 2000,
        estimatedDeliveryTime: "25-40 mins",
        openingHours: "8:30 AM - 12:00 AM",
        noticeMessage: "Fast delivery to F-6, F-7, F-8, F-10, F-11 and G sectors.",
        isActive: true,
        isOpen: true,
        categories: [
            { id: "c-isb-gro", name: "Grocery & Ration", slug: "grocery", icon: "🛒", order: 1, isActive: true },
            { id: "c-isb-mea", name: "Fresh Meats", slug: "meats", icon: "🥩", order: 2, isActive: true }
        ],
        products: [
            { id: "p-isb-1", categoryId: "c-isb-gro", name: "National Chat Masala 100g", slug: "national-chat-masala", description: "Tangy and spicy chat seasoning.", price: 130, compareAtPrice: 140, unit: "pack", image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop&q=80", inStock: true, isFeatured: true, order: 1 }
        ]
    },
    {
        id: "sample-green-valley-mart",
        userId: "sample-user-7",
        name: "Green Valley Neighborhood Store",
        slug: "green-valley-mart",
        tagline: "Premium Dairy, Frozen Foods, Imported Pantry & Fresh Bakery",
        description: "Bahria Town's favorite quick mart for ready-to-cook K&N's chicken, frozen items, fresh dairy, and grocery items.",
        logoUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&auto=format&fit=crop&q=80",
        bannerUrl: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=1200&auto=format&fit=crop&q=80",
        phone: "923129988776",
        email: "greenvalley@solewhat.store",
        address: "Civic Center, Bahria Town Phase 4, Rawalpindi",
        city: "Rawalpindi",
        area: "Bahria Town Phase 4",
        currency: "PKR",
        currencySymbol: "Rs.",
        deliveryFee: 60,
        minOrderAmount: 500,
        freeDeliveryAbove: 1800,
        estimatedDeliveryTime: "30-45 mins",
        openingHours: "9:00 AM - 11:30 PM",
        noticeMessage: "Express deliveries across all Bahria Town & DHA Islamabad phases.",
        isActive: true,
        isOpen: true,
        categories: [
            { id: "c-fro", name: "Frozen Foods", slug: "frozen", icon: "🧊", order: 1, isActive: true },
            { id: "c-rwp-gro", name: "Grocery & Mart", slug: "grocery", icon: "🛒", order: 2, isActive: true }
        ],
        products: [
            { id: "p-gv-1", categoryId: "c-fro", name: "K&N's Harissa Bites 800g", slug: "kns-harissa-bites", description: "Spicy and tender ready-to-fry chicken bites.", price: 1450, compareAtPrice: 1550, unit: "pack", image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=500&auto=format&fit=crop&q=80", inStock: true, isFeatured: true, order: 1 }
        ]
    },
    {
        id: "sample-chenab-mart",
        userId: "sample-user-8",
        name: "Chenab Cash & Carry",
        slug: "chenab-mart",
        tagline: "Wholesale Price Par Daily Grocery & Fresh Household Items",
        description: "Faisalabad's premier community store with best wholesale discounts on all bulk groceries and daily consumables.",
        logoUrl: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=300&auto=format&fit=crop&q=80",
        bannerUrl: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&auto=format&fit=crop&q=80",
        phone: "923451234567",
        email: "chenab@solewhat.store",
        address: "D Ground, People's Colony No. 1, Faisalabad",
        city: "Faisalabad",
        area: "D Ground / People's Colony",
        currency: "PKR",
        currencySymbol: "Rs.",
        deliveryFee: 50,
        minOrderAmount: 500,
        freeDeliveryAbove: 1500,
        estimatedDeliveryTime: "30-45 mins",
        openingHours: "9:00 AM - 11:00 PM",
        noticeMessage: "Wholesale discounted prices for home ration.",
        isActive: true,
        isOpen: true,
        categories: [
            { id: "c-fsd-gro", name: "Grocery & Ration", slug: "grocery", icon: "🛒", order: 1, isActive: true }
        ],
        products: [
            { id: "p-ch-1", categoryId: "c-fsd-gro", name: "Mezan Canola Oil 5L Bottle", slug: "mezan-oil-5l", description: "Healthy cholesterol-free canola cooking oil.", price: 2550, compareAtPrice: 2700, unit: "bottle", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80", inStock: true, isFeatured: true, order: 1 }
        ]
    }
];

/**
 * Get Store by Slug or Custom Domain
 * Safely looks in database first, and gracefully falls back to sample stores if needed.
 */
export async function getStoreBySlugOrDomain(identifier: string) {
    const cleanId = identifier.trim().toLowerCase().replace(/^(https?:\/\/)/, "").split("/")[0].split(":")[0];

    try {
        const store = await prisma.store.findFirst({
            where: {
                OR: [
                    { slug: cleanId },
                    { customDomain: cleanId },
                    { customDomain: `www.${cleanId}` },
                    { customDomain: cleanId.replace(/^www\./, "") }
                ],
                isActive: true
            },
            include: {
                categories: {
                    where: { isActive: true },
                    orderBy: { order: "asc" }
                },
                products: {
                    where: { isActive: true },
                    orderBy: { order: "asc" }
                }
            }
        });

        if (store) {
            return store;
        }
    } catch (err: any) {
        logger.warn("StoreService", `Database store fetch skipped or failed for "${cleanId}": ${err.message}`);
    }

    // Fallback to sample presets for demo/preview
    const sample = SAMPLE_PUBLIC_STORES.find(s => s.slug === cleanId);
    if (sample) {
        return sample;
    }

    return null;
}

export interface PublicStoresFilter {
    city?: string;
    area?: string;
    category?: string;
    search?: string;
    onlyOpen?: boolean;
}

/**
 * Fetch all public active stores for Directory Listing (solewhat.site/dukaan)
 * Returns formatted stores with counts, available cities, and popular mohallas.
 */
export async function getPublicStoresDirectory(filter: PublicStoresFilter = {}) {
    let dbStores: any[] = [];

    try {
        const whereClause: any = {
            isActive: true
        };

        if (filter.onlyOpen) {
            whereClause.isOpen = true;
        }

        if (filter.city && filter.city.toLowerCase() !== "all") {
            whereClause.city = {
                equals: filter.city,
                mode: "insensitive"
            };
        }

        const storesFromDb = await prisma.store.findMany({
            where: whereClause,
            include: {
                categories: {
                    where: { isActive: true },
                    select: { name: true, slug: true, icon: true }
                },
                products: {
                    where: { isActive: true },
                    select: { id: true, name: true, price: true, image: true, inStock: true },
                    take: 6
                },
                _count: {
                    select: { products: true, orders: true }
                }
            },
            orderBy: [
                { isOpen: "desc" },
                { createdAt: "desc" }
            ]
        });

        if (storesFromDb && storesFromDb.length > 0) {
            dbStores = storesFromDb.map(s => ({
                id: s.id,
                name: s.name,
                slug: s.slug,
                tagline: s.tagline,
                description: s.description,
                logoUrl: s.logoUrl,
                bannerUrl: s.bannerUrl,
                phone: s.phone,
                address: s.address,
                city: s.city || "Lahore",
                area: s.address ? s.address.split(",")[0] : s.city,
                isOpen: s.isOpen,
                deliveryFee: s.deliveryFee,
                freeDeliveryAbove: s.freeDeliveryAbove,
                estimatedDeliveryTime: s.estimatedDeliveryTime || "30-45 mins",
                openingHours: s.openingHours || "9:00 AM - 11:00 PM",
                minOrderAmount: s.minOrderAmount,
                noticeMessage: s.noticeMessage,
                categories: s.categories.map((c: any) => c.name),
                productCount: s._count?.products || s.products.length,
                totalOrders: s._count?.orders || 0,
                sampleProducts: s.products.map((p: any) => ({
                    name: p.name,
                    price: p.price,
                    image: p.image
                }))
            }));
        }
    } catch (err: any) {
        logger.warn("StoreService", `Database store list fetch skipped or failed: ${err.message}`);
    }

    // Always ensure sample presets are combined if DB has few/no stores
    const sampleFormatted = SAMPLE_PUBLIC_STORES.map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        tagline: s.tagline,
        description: s.description,
        logoUrl: s.logoUrl,
        bannerUrl: s.bannerUrl,
        phone: s.phone,
        address: s.address,
        city: s.city,
        area: s.area,
        isOpen: s.isOpen,
        deliveryFee: s.deliveryFee,
        freeDeliveryAbove: s.freeDeliveryAbove,
        estimatedDeliveryTime: s.estimatedDeliveryTime,
        openingHours: s.openingHours,
        minOrderAmount: s.minOrderAmount,
        noticeMessage: s.noticeMessage,
        categories: s.categories.map((c: any) => c.name),
        productCount: s.products.length,
        totalOrders: 18 + Math.floor(Math.random() * 40),
        sampleProducts: s.products.map((p: any) => ({
            name: p.name,
            price: p.price,
            image: p.image
        }))
    }));

    // Merge DB stores and Sample stores without duplicating slugs
    const existingSlugs = new Set(dbStores.map(s => s.slug));
    const mergedStores = [
        ...dbStores,
        ...sampleFormatted.filter(s => !existingSlugs.has(s.slug))
    ];

    // Apply filtering (city, area/search, category, onlyOpen)
    let filtered = mergedStores;

    if (filter.city && filter.city.toLowerCase() !== "all") {
        const c = filter.city.trim().toLowerCase();
        filtered = filtered.filter(s => (s.city || "").toLowerCase().includes(c));
    }

    if (filter.area && filter.area.trim()) {
        const a = filter.area.trim().toLowerCase();
        filtered = filtered.filter(s =>
            (s.area || "").toLowerCase().includes(a) ||
            (s.address || "").toLowerCase().includes(a) ||
            (s.name || "").toLowerCase().includes(a)
        );
    }

    if (filter.search && filter.search.trim()) {
        const q = filter.search.trim().toLowerCase();
        filtered = filtered.filter(s =>
            (s.name || "").toLowerCase().includes(q) ||
            (s.tagline || "").toLowerCase().includes(q) ||
            (s.description || "").toLowerCase().includes(q) ||
            (s.address || "").toLowerCase().includes(q) ||
            (s.categories || []).some((c: string) => c.toLowerCase().includes(q))
        );
    }

    if (filter.category && filter.category.toLowerCase() !== "all") {
        const cat = filter.category.trim().toLowerCase();
        filtered = filtered.filter(s =>
            (s.categories || []).some((c: string) => c.toLowerCase().includes(cat))
        );
    }

    if (filter.onlyOpen) {
        filtered = filtered.filter(s => s.isOpen === true);
    }

    // Extract all unique cities
    const citiesSet = new Set<string>();
    mergedStores.forEach(s => {
        if (s.city) citiesSet.add(s.city);
    });
    const cities = Array.from(citiesSet);

    // Extract all unique areas/neighborhoods for the current city
    const areasSet = new Set<string>();
    filtered.forEach(s => {
        if (s.area) areasSet.add(s.area);
    });
    const areas = Array.from(areasSet);

    return {
        stores: filtered,
        totalCount: filtered.length,
        allStoresCount: mergedStores.length,
        cities,
        areas
    };
}


/**
 * Generate 80mm Digital Thermal Cash Memo / Slip for WhatsApp
 * Formatted with fixed width (32 chars) so inside monospace code block (```)
 * it looks identical to the printed receipt slip.
 */
export function buildThermalReceiptText(order: any, store: any): string {
    const W = 32;
    const center = (text: string) => {
        const s = (text || "").trim();
        if (s.length >= W) return s.slice(0, W);
        const pad = Math.floor((W - s.length) / 2);
        return " ".repeat(pad) + s;
    };

    const row = (left: string, right: string) => {
        const l = (left || "").trim();
        const r = (right || "").trim();
        const spaceCount = Math.max(1, W - l.length - r.length);
        return l + " ".repeat(spaceCount) + r;
    };

    const dateFormatted = new Date(order.createdAt).toLocaleDateString("en-PK", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

    const lines: string[] = [];

    // Header matching 80mm slip
    lines.push(center((store.name || "DUKAAN").toUpperCase()));
    const address = store.city || store.address || "Pakistan";
    if (address) {
        lines.push(center(address));
    }
    if (store.phone) {
        lines.push(center(`Ph: ${store.phone}`));
    }
    lines.push(center(`Invoice #${order.orderNumber}`));
    lines.push(center(`Date: ${dateFormatted}`));
    lines.push("-".repeat(W));

    // Customer section
    lines.push(`Customer: ${order.customerName || "Customer"}`);
    lines.push(`Phone: ${order.customerPhone || ""}`);
    lines.push("-".repeat(W));

    // Items table header
    lines.push(row("Item", "Total"));
    if (Array.isArray(order.items)) {
        order.items.forEach((it: any) => {
            const itemLabel = `${it.quantity}x ${it.productName}`;
            const itemPrice = `${store.currencySymbol || "Rs."} ${Number(it.totalPrice).toLocaleString("en-PK")}`;
            if (itemLabel.length + itemPrice.length + 1 <= W) {
                lines.push(row(itemLabel, itemPrice));
            } else {
                lines.push(itemLabel);
                lines.push(row("", itemPrice));
            }
        });
    }
    lines.push("-".repeat(W));

    // Financial totals
    const subtotal = Number(order.subtotal || order.total);
    lines.push(row("Subtotal:", `${store.currencySymbol || "Rs."} ${subtotal.toLocaleString("en-PK")}`));

    if (Number(order.discount) > 0) {
        lines.push(row("Discount:", `-${store.currencySymbol || "Rs."} ${Number(order.discount).toLocaleString("en-PK")}`));
    }

    const deliveryFee = Number(order.deliveryFee || 0);
    lines.push(row("Delivery:", deliveryFee === 0 ? "FREE" : `${store.currencySymbol || "Rs."} ${deliveryFee.toLocaleString("en-PK")}`));

    lines.push("-".repeat(W));
    const total = Number(order.total);
    lines.push(row("NET PAYABLE:", `${store.currencySymbol || "Rs."} ${total.toLocaleString("en-PK")}`));
    lines.push(row("Mode:", String(order.paymentMethod || "COD")));
    lines.push("-".repeat(W));

    // Footer
    lines.push(center("*** SHUKRIYA VISIT KARNE KA ***"));
    lines.push(center("Powered by Sole-What Digital Dukaan"));

    return lines.join("\n");
}

/**
 * Format WhatsApp Receipt in natural, polite Roman Urdu
 */
export function formatOrderWhatsAppReceipt(order: any, store: any, recipientType: "owner" | "customer"): string {
    const dateFormatted = new Date(order.createdAt).toLocaleString("en-PK", {
        timeZone: "Asia/Karachi",
        dateStyle: "medium",
        timeStyle: "short"
    });

    const itemsText = order.items
        ?.map((item: any, idx: number) => {
            const price = Number(item.unitPrice).toLocaleString("en-PK");
            const total = Number(item.totalPrice).toLocaleString("en-PK");
            return `${idx + 1}. *${item.productName}*\n   ${item.quantity}x @ ${store.currencySymbol || "Rs."} ${price} = *${store.currencySymbol || "Rs."} ${total}*`;
        })
        .join("\n\n") || "";

    const subtotal = Number(order.subtotal).toLocaleString("en-PK");
    const delivery = Number(order.deliveryFee).toLocaleString("en-PK");
    const discount = Number(order.discount || 0).toLocaleString("en-PK");
    const total = Number(order.total).toLocaleString("en-PK");

    // Extract metadata snapshot if available
    const metadata = (order.itemsSnapshot && typeof order.itemsSnapshot === "object" && !Array.isArray(order.itemsSnapshot))
        ? (order.itemsSnapshot as any).metadata || {}
        : {};
    const couponCode = metadata.couponCode || null;
    const transactionId = metadata.transactionId || null;
    const paymentProofUrl = metadata.paymentProofUrl || null;

    if (recipientType === "owner") {
        return `🚨 *NAYA ORDER AAYA HAI!* 📦
━━━━━━━━━━━━━━━━━━━━
🏪 *Dukaan:* ${store.name}
🔖 *Order ID:* #${order.orderNumber}
🕒 *Waqt:* ${dateFormatted}

👤 *Customer Details:*
• *Naam:* ${order.customerName}
• *Phone:* +${order.customerPhone}
• *Pata (Address):* ${order.customerAddress}${order.customerCity ? `, ${order.customerCity}` : ""}
${order.customerNotes ? `• *Hidayat:* _"${order.customerNotes}"_\n` : ""}🛒 *Items Ordered:*
━━━━━━━━━━━━━━━━━━━━
${itemsText}

━━━━━━━━━━━━━━━━━━━━
💵 *Bill Breakdown:*
• Subtotal: ${store.currencySymbol || "Rs."} ${subtotal}
${Number(order.discount) > 0 ? `• Discount: -${store.currencySymbol || "Rs."} ${discount}${couponCode ? ` (Promo: *${couponCode}*)` : ""}\n` : ""}• Delivery Fee: ${Number(order.deliveryFee) === 0 ? "*FREE*" : `${store.currencySymbol || "Rs."} ${delivery}`}
💰 *TOTAL BILL:* *${store.currencySymbol || "Rs."} ${total}*
💳 *Payment:* ${order.paymentMethod || "Cash on Delivery (COD)"}${transactionId ? ` (TID: *${transactionId}*)` : ""}${paymentProofUrl ? `\n📎 *Payment Proof:* ${paymentProofUrl}` : ""}
━━━━━━━━━━━━━━━━━━━━
Dashboard se order ko confirm ya dispatch karein!`;
    } else {
        const slipText = buildThermalReceiptText(order, store);
        const origin = process.env.NEXTAUTH_URL || "";
        const trackingLink = store.slug ? `${origin ? origin : ""}/s/${store.slug}/track?q=${order.orderNumber}` : "";

        return `\`\`\`
${slipText}
\`\`\`

📍 *Delivery Address:* ${order.customerAddress}${order.customerCity ? `, ${order.customerCity}` : ""}
${order.customerNotes ? `📝 *Special Instructions:* _${order.customerNotes}_\n` : ""}🛵 *Estimated Delivery:* ${store.estimatedDeliveryTime || "30-45 mins"}
${trackingLink ? `📲 *Track Order Live:* ${trackingLink}` : ""}`;
    }
}

/**
 * Create Order from Public Storefront
 */
export async function createStoreOrder(input: CreateOrderInput) {
    const store = await prisma.store.findUnique({
        where: { id: input.storeId },
        include: { session: true }
    });

    if (!store) {
        throw new Error("Store not found");
    }

    if (!store.isActive || !store.isOpen) {
        throw new Error("Yeh dukaan is waqt orders accept nahi kar rahi hai.");
    }

    if (!input.items || input.items.length === 0) {
        throw new Error("Aapki cart khali hai. Kam az kam aik item select karein.");
    }

    // Fetch products from database to ensure genuine prices
    const productIds = input.items.map(i => i.productId);
    const dbProducts = await prisma.product.findMany({
        where: {
            id: { in: productIds },
            storeId: store.id,
            isActive: true
        }
    });

    if (dbProducts.length === 0) {
        throw new Error("Selected products dukaan par dastyab nahi hain.");
    }

    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    let subtotal = 0;
    const orderItemsData: any[] = [];
    const itemsSnapshot: any[] = [];

    for (const item of input.items) {
        const prod = productMap.get(item.productId);
        if (!prod) continue;
        const qty = Math.max(1, Math.floor(item.quantity));
        const unitPrice = prod.price;
        const lineTotal = unitPrice * qty;
        subtotal += lineTotal;

        orderItemsData.push({
            productId: prod.id,
            productName: prod.name,
            unitPrice: unitPrice,
            quantity: qty,
            totalPrice: lineTotal,
            productImage: prod.image || null
        });

        itemsSnapshot.push({
            productId: prod.id,
            name: prod.name,
            unitPrice: unitPrice,
            quantity: qty,
            total: lineTotal,
            image: prod.image || null
        });
    }

    if (store.minOrderAmount > 0 && subtotal < store.minOrderAmount) {
        throw new Error(`Kam az kam order amount ${store.currencySymbol || "Rs."} ${store.minOrderAmount} hona zaroori hai.`);
    }

    // Calculate delivery fee
    let deliveryFee = store.deliveryFee;
    const isFreeShipCoupon = input.couponCode?.trim().toUpperCase() === "FREESHIP";
    if (isFreeShipCoupon || (store.freeDeliveryAbove && subtotal >= store.freeDeliveryAbove)) {
        deliveryFee = 0;
    }

    const discountAmount = Math.max(0, Number(input.discount) || 0);
    const total = Math.max(0, subtotal - discountAmount + deliveryFee);

    // Generate Human-friendly Order Number e.g. ORD-10023
    const orderCount = await prisma.order.count({ where: { storeId: store.id } });
    const orderNumber = `${store.orderPrefix || "ORD-"}${1001 + orderCount}`;

    const cleanCustomerPhone = formatPhoneNumberToWA(input.customerPhone);

    // Prevent rapid duplicate order submission within 5 seconds
    const recentDuplicate = await prisma.order.findFirst({
        where: {
            storeId: store.id,
            customerPhone: cleanCustomerPhone,
            total: total,
            createdAt: {
                gte: new Date(Date.now() - 5000)
            }
        },
        orderBy: { createdAt: "desc" }
    });

    if (recentDuplicate) {
        logger.info("StoreService", `Duplicate checkout request suppressed for phone ${cleanCustomerPhone} (Order #${recentDuplicate.orderNumber})`);
        const targetPhone = store.phone ? formatPhoneNumberToWA(store.phone) : cleanCustomerPhone;
        return {
            success: true,
            orderId: recentDuplicate.id,
            orderNumber: recentDuplicate.orderNumber,
            total: recentDuplicate.total,
            whatsappRedirectUrl: `https://wa.me/${targetPhone}`
        };
    }

    const notesParts: string[] = [];
    if (input.customerNotes?.trim()) notesParts.push(input.customerNotes.trim());
    if (input.transactionId?.trim()) notesParts.push(`[TID: ${input.transactionId.trim()}]`);
    if (input.couponCode?.trim()) notesParts.push(`[Coupon: ${input.couponCode.trim().toUpperCase()}]`);
    if (input.paymentProofUrl?.trim()) notesParts.push(`[Proof: ${input.paymentProofUrl.trim()}]`);

    // Save Order to Database
    const order = await prisma.order.create({
        data: {
            storeId: store.id,
            orderNumber: orderNumber,
            customerName: input.customerName.trim(),
            customerPhone: cleanCustomerPhone,
            customerAddress: input.customerAddress.trim(),
            customerCity: input.customerCity?.trim() || store.city || "Pakistan",
            customerNotes: notesParts.join(" ") || null,
            subtotal: subtotal,
            deliveryFee: deliveryFee,
            discount: discountAmount,
            total: total,
            currency: store.currency || "PKR",
            paymentMethod: input.paymentMethod || "COD",
            paymentStatus: input.paymentMethod === "COD" ? "UNPAID" : (input.transactionId ? "PAID" : "UNPAID"),
            status: "PENDING",
            itemsSnapshot: {
                items: itemsSnapshot,
                metadata: {
                    couponCode: input.couponCode?.trim().toUpperCase() || null,
                    discount: discountAmount,
                    transactionId: input.transactionId?.trim() || null,
                    paymentProofUrl: input.paymentProofUrl?.trim() || null
                }
            },
            items: {
                create: orderItemsData
            }
        },
        include: {
            items: true
        }
    });

    // Formatted WhatsApp Receipt text
    const ownerReceipt = formatOrderWhatsAppReceipt(order, store, "owner");
    const customerReceipt = formatOrderWhatsAppReceipt(order, store, "customer");

    // Resolve active WhatsApp Session for sending notifications
    let activeBaileysSessionId: string | null = null;

    if (store.session?.sessionId) {
        activeBaileysSessionId = store.session.sessionId;
    } else if (store.sessionId) {
        const found = await prisma.session.findFirst({
            where: {
                OR: [
                    { id: store.sessionId },
                    { sessionId: store.sessionId }
                ]
            },
            select: { id: true, sessionId: true }
        });
        if (found) {
            activeBaileysSessionId = found.sessionId;
        }
    }

    // Fallback: If no session is linked to store, find the store owner's active WhatsApp session
    if (!activeBaileysSessionId) {
        const userSession = await prisma.session.findFirst({
            where: {
                userId: store.userId,
                status: "CONNECTED"
            },
            orderBy: { updatedAt: "desc" }
        }) || await prisma.session.findFirst({
            where: { userId: store.userId },
            orderBy: { updatedAt: "desc" }
        });

        if (userSession) {
            activeBaileysSessionId = userSession.sessionId;
            // Auto-link store with this session so future lookups are immediate
            await prisma.store.update({
                where: { id: store.id },
                data: { sessionId: userSession.id }
            }).catch(() => {});
        }
    }

    // Automatically send WhatsApp notification via connected Baileys Session
    if (activeBaileysSessionId) {
        const cleanOwnerPhone = store.phone ? formatPhoneNumberToWA(store.phone) : "";
        const ownerJid = cleanOwnerPhone ? normalizeJid(`${cleanOwnerPhone}@s.whatsapp.net`) : "";
        const customerJid = cleanCustomerPhone ? normalizeJid(`${cleanCustomerPhone}@s.whatsapp.net`) : "";

        // Check if store phone and customer phone are identical (e.g. store owner testing orders)
        const isSameRecipient = !!(ownerJid && customerJid && ownerJid === customerJid);

        if (isSameRecipient) {
            // When store owner is testing their own store, send the customer thermal receipt slip
            // so they immediately see the exact receipt invoice!
            try {
                await ChatService.sendTextMessage(activeBaileysSessionId, ownerJid, customerReceipt);
                await prisma.order.update({
                    where: { id: order.id },
                    data: { ownerNotified: true, customerNotified: true }
                });
                logger.info("StoreService", `Single WhatsApp order receipt sent to Owner/Customer (+${cleanOwnerPhone})`);
            } catch (err: any) {
                logger.error("StoreService", `Failed to send WhatsApp alert: ${err.message}`);
            }
        } else {
            // Notify Store Owner
            if (store.autoNotifyOwner !== false && ownerJid) {
                try {
                    await ChatService.sendTextMessage(activeBaileysSessionId, ownerJid, ownerReceipt);
                    await prisma.order.update({
                        where: { id: order.id },
                        data: { ownerNotified: true }
                    });
                    logger.info("StoreService", `WhatsApp order alert sent to Store Owner (+${cleanOwnerPhone})`);
                } catch (err: any) {
                    logger.error("StoreService", `Failed to send WhatsApp alert to owner: ${err.message}`);
                }
            }

            // Notify Customer
            if (store.autoNotifyCustomer !== false && customerJid) {
                try {
                    await ChatService.sendTextMessage(activeBaileysSessionId, customerJid, customerReceipt);
                    await prisma.order.update({
                        where: { id: order.id },
                        data: { customerNotified: true }
                    });
                    logger.info("StoreService", `WhatsApp order confirmation sent to Customer (+${cleanCustomerPhone})`);
                } catch (err: any) {
                    logger.error("StoreService", `Failed to send WhatsApp confirmation to customer: ${err.message}`);
                }
            }
        }
    } else {
        logger.warn("StoreService", `No WhatsApp session available to send order notifications for store "${store.name}".`);
    }

    // Direct WhatsApp Web click URL as fallback
    const targetPhoneForCustomer = store.phone ? formatPhoneNumberToWA(store.phone) : cleanCustomerPhone;
    const encodedReceipt = encodeURIComponent(
        `Assalam o Alaikum! Maine aapki dukaan se online order place kiya hai:\n\n${customerReceipt}`
    );
    const whatsappRedirectUrl = `https://wa.me/${targetPhoneForCustomer}?text=${encodedReceipt}`;

    // Real-time live order dispatch to Store Dashboard
    try {
        const io = (global as any).io;
        if (io) {
            io.to(`store:${store.id}`).emit("store:new_order", {
                storeId: store.id,
                order: order
            });
            io.to(`user:${store.userId}`).emit("store:new_order", {
                storeId: store.id,
                order: order
            });
        }
    } catch (socketErr) {
        // non-blocking
    }

    return {
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        whatsappRedirectUrl
    };
}
