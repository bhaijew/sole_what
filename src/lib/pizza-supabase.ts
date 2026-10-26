import { logger } from "./logger";

// Supabase credentials for Pizza Management System
const SUPABASE_URL = process.env.PIZZA_SUPABASE_URL || "https://uadrrjrlhfttithjmdye.supabase.co";
const SUPABASE_KEY = process.env.PIZZA_SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZHJyanJsaGZ0dGl0aGptZHllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYwNTg2OCwiZXhwIjoyMTA2MTgxODY4fQ.NuC74GhFlUEiaRR2BXPooYj7iahzrXXKCxMQYDUnfIg";

interface ShopInfo {
    id: number;
    name: string;
    slug: string;
    phone?: string;
    totalProducts: number;
    totalDeals: number;
    totalCategories: number;
}

interface DealItem {
    id: number;
    title: string;
    deal_price: number;
    original_price?: number;
    description?: string;
    items_included?: string[] | string | any;
    badge?: string;
}

interface ProductItem {
    id: number;
    name: string;
    price: number;
    category_id?: number;
    description?: string;
    is_available?: boolean;
    unit?: string;
}

interface CategoryItem {
    id: number;
    name: string;
    slug?: string;
}

/**
 * Extracts numeric shop ID from pairing code (e.g., 'PZ-7', 'PIZZA-SHOP-7', 'SHOP-7', '7')
 */
export function parseShopIdFromCode(input: string | number): number | null {
    if (typeof input === "number") return input;
    if (!input || typeof input !== "string") return null;

    const trimmed = input.trim();
    // Match any sequence of digits in strings like PZ-7, PIZZA-7, SHOP-7 or just 7
    const match = trimmed.match(/(\d+)/);
    if (match && match[1]) {
        const id = parseInt(match[1], 10);
        return isNaN(id) ? null : id;
    }
    return null;
}

/**
 * Common REST fetcher for Supabase
 */
async function fetchSupabase(endpoint: string) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const res = await fetch(url, {
        method: "GET",
        headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json"
        },
        cache: "no-store"
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Supabase REST error (${res.status}): ${errText}`);
    }

    return await res.json();
}

/**
 * Verify shop ID from code and fetch summary stats
 */
export async function verifyPizzaShop(codeOrId: string | number): Promise<{
    valid: boolean;
    shop?: ShopInfo;
    error?: string;
}> {
    const shopId = parseShopIdFromCode(codeOrId);
    if (!shopId) {
        return { valid: false, error: "Invalid Shop Pairing Code format. Example: PZ-7 or 7" };
    }

    try {
        // 1. Fetch shop
        const shops = await fetchSupabase(`shops?id=eq.${shopId}&select=id,name,slug,owner_phone,branch_address`);
        if (!shops || shops.length === 0) {
            return { valid: false, error: `Shop with ID #${shopId} not found in Pizza Management Database.` };
        }
        const shop = shops[0];

        // 2. Fetch active deals count
        let totalDeals = 0;
        try {
            const deals = await fetchSupabase(`deals?shop_id=eq.${shopId}&is_active=eq.true&select=id`);
            totalDeals = deals?.length || 0;
        } catch (_) {}

        // 3. Fetch active products count
        let totalProducts = 0;
        try {
            const products = await fetchSupabase(`products?shop_id=eq.${shopId}&is_active=eq.true&select=id`);
            totalProducts = products?.length || 0;
        } catch (_) {}

        // 4. Fetch categories count
        let totalCategories = 0;
        try {
            const categories = await fetchSupabase(`categories?shop_id=eq.${shopId}&select=id`);
            totalCategories = categories?.length || 0;
        } catch (_) {}

        return {
            valid: true,
            shop: {
                id: shop.id,
                name: shop.name,
                slug: shop.slug,
                phone: shop.owner_phone || "",
                totalProducts,
                totalDeals,
                totalCategories
            }
        };
    } catch (e: any) {
        logger.error("Pizza-Supabase", "Failed to verify shop: " + (e?.message || e));
        return { valid: false, error: e?.message || "Failed to connect to Supabase database" };
    }
}

/**
 * Fetch full live catalog (deals, categories, products) formatted for AI Context injection
 */
export async function getPizzaShopCatalogForAi(shopId: number): Promise<string> {
    try {
        // Fetch in parallel
        const [shops, categoriesData, dealsData, productsData] = await Promise.all([
            fetchSupabase(`shops?id=eq.${shopId}&select=id,name,slug,owner_phone,branch_address`),
            fetchSupabase(`categories?shop_id=eq.${shopId}&select=id,name&order=sort_order.asc`),
            fetchSupabase(`deals?shop_id=eq.${shopId}&is_active=eq.true&is_available=eq.true&select=id,title,deal_price,original_price,description,items_included,badge&order=sort_order.asc`),
            fetchSupabase(`products?shop_id=eq.${shopId}&is_active=eq.true&select=id,name,price,category_id,description,is_available,variations&order=sort_order.asc`)
        ]);

        const shop = shops?.[0];
        const shopName = shop?.name || `Shop #${shopId}`;

        const categoryMap = new Map<number, string>();
        if (Array.isArray(categoriesData)) {
            categoriesData.forEach((c: CategoryItem) => categoryMap.set(c.id, c.name));
        }

        // 1. Format Deals
        const deals = Array.isArray(dealsData) ? (dealsData as DealItem[]) : [];
        let dealsText = "";
        if (deals.length > 0) {
            dealsText = `🔥 SPECIAL DEALS & COMBOS (${deals.length} Active Deals for ${shopName}):\n` +
                deals.map((d, index) => {
                    let itemsStr = "";
                    if (d.items_included) {
                        if (Array.isArray(d.items_included)) {
                            itemsStr = d.items_included.join(", ");
                        } else if (typeof d.items_included === "object") {
                            itemsStr = Object.values(d.items_included).join(", ");
                        } else {
                            itemsStr = String(d.items_included);
                        }
                    }
                    const discount = d.original_price ? ` (Original: Rs. ${d.original_price})` : "";
                    const desc = d.description ? ` - ${d.description}` : "";
                    const itemsIncluded = itemsStr ? ` | Contains: [${itemsStr}]` : "";
                    return `${index + 1}. ${d.title}: Rs. ${d.deal_price}${discount}${itemsIncluded}${desc}`;
                }).join("\n");
        }

        // 2. Format Products grouped by category
        const products = Array.isArray(productsData) ? (productsData as any[]) : [];
        const productsByCategory: { [catName: string]: any[] } = {};

        for (const p of products) {
            const catName = p.category_id && categoryMap.has(p.category_id)
                ? categoryMap.get(p.category_id)!
                : "General Menu";
            if (!productsByCategory[catName]) {
                productsByCategory[catName] = [];
            }
            productsByCategory[catName].push(p);
        }

        let menuText = "";
        for (const [catName, items] of Object.entries(productsByCategory)) {
            const itemsList = items
                .map(i => {
                    let priceDisplay = `Rs. ${i.price}`;
                    if (Array.isArray(i.variations) && i.variations.length > 0) {
                        const vList = i.variations.map((v: any) => `${v.name}: Rs. ${v.price}`).join(", ");
                        priceDisplay = `${vList} (Base: Rs. ${i.price})`;
                    }
                    return `  • ${i.name}: ${priceDisplay}${i.is_available === false ? " (Out of stock)" : ""}${i.description ? ` - ${i.description}` : ""}`;
                })
                .join("\n");
            menuText += `\n[Category: ${catName}]\n${itemsList}\n`;
        }

        return `=====================================================
🍕 PIZZA MANAGEMENT DATABASE (LIVE SUPABASE SYNC - SHOP #${shopId} - ${shopName})
=====================================================
Shop: ${shopName}
Status: Online & Live Synced

${dealsText || "No active deals configured at the moment."}

📋 REGULAR MENU PRODUCTS & PRICES:
${menuText || "No menu products found."}
=====================================================`;
    } catch (e: any) {
        logger.error("Pizza-Supabase", `Error building catalog for shop ${shopId}: ` + (e?.message || e));
        return "";
    }
}
