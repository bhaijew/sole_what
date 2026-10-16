import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";

// Comprehensive Pakistani grocery product image dictionary
const PAKISTANI_PRODUCT_IMAGES: { keywords: string[]; label: string; url: string }[] = [
    // Milk & Dairy
    {
        keywords: ["olper", "olpers", "milkpak", "nestle milkpak", "nurpur", "omung", "tetra pack", "doodh", "milk carton", "full cream milk"],
        label: "Tetra Pack Milk Carton (Olper's / Milkpak Style)",
        url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80"
    },
    {
        keywords: ["fresh milk", "bottle milk", "khula doodh", "dairy milk", "1 litre milk", "bottle"],
        label: "Fresh Whole Milk Bottle",
        url: "https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=600&q=80"
    },
    {
        keywords: ["cream", "olpers cream", "olper's cream", "dairy cream", "dayfresh cream", "malai", "heavy cream"],
        label: "Pure Dairy Table Cream (Pack / Cup)",
        url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80"
    },
    {
        keywords: ["tarang", "tea whitener", "everyday", "bunyad", "creamer", "chai doodh"],
        label: "Tarang / Tea Whitener Karak Chai Cup",
        url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80"
    },
    {
        keywords: ["yogurt", "prema yogurt", "milkpak yogurt", "dahi", "curd", "plain yogurt"],
        label: "Prema / Milkpak Plain Dahi Yogurt Tub",
        url: "https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=600&q=80"
    },
    {
        keywords: ["cheese", "mozzarella", "dairy life", "cheddar", "pizza cheese", "paneer"],
        label: "Dairy Life Mozzarella Cheese Block",
        url: "https://images.unsplash.com/photo-1618060932014-4deda4932554?auto=format&fit=crop&w=600&q=80"
    },
    {
        keywords: ["flavoured milk", "flavored milk", "dayfresh flavoured", "chocolate milk", "milo", "pakola"],
        label: "Flavoured Chocolate / Strawberry Milk Bottle",
        url: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80"
    },

    // Bakery & Breads
    {
        keywords: ["bread", "plain bread", "dawn plain bread", "sandwich bread", "white bread", "dawn bread", "large bread", "small bread"],
        label: "Dawn Plain White Sandwich Bread Slices",
        url: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=600&q=80"
    },
    {
        keywords: ["bran bread", "brown bread", "whole wheat bread", "dawn bran bread"],
        label: "Dawn Brown Bran Wheat Bread",
        url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80"
    },
    {
        keywords: ["burger buns", "buns", "dawn burger buns", "dawn special burger buns", "bun", "burger bun"],
        label: "Dawn Burger Buns (Pack of 4)",
        url: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80"
    },
    {
        keywords: ["fruit cake", "dawn fruit cake", "tea cake", "pound cake", "yellow cake", "cake loaf"],
        label: "Dawn Candied Fruit Tea Cake Loaf",
        url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80"
    },
    {
        keywords: ["rusk", "dawn rusk", "cake rusk", "tea rusk", "toasts"],
        label: "Dawn Crisp Golden Tea Rusk",
        url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80"
    },
    {
        keywords: ["eggs", "fresh eggs", "egg", "anday", "anda", "desi anday", "farm eggs"],
        label: "Farm Fresh Eggs Carton Tray (12 / 6 pcs)",
        url: "https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?auto=format&fit=crop&w=600&q=80"
    },

    // Beverages & Cold Drinks
    {
        keywords: ["coca-cola", "coca cola", "coke", "coke can", "350 ml coke"],
        label: "Coca-Cola Chilled Red Can (350ml)",
        url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80"
    },
    {
        keywords: ["coke bottle", "coca-cola 1.5", "coca cola 1.5", "1.5 litre coke", "cold drink bottle"],
        label: "Coca-Cola Family Bottle (1.5 Litre)",
        url: "https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=600&q=80"
    },
    {
        keywords: ["pepsi", "pepsi can", "pepsi bottle", "diet pepsi"],
        label: "Pepsi Cold Blue Can / Bottle",
        url: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=600&q=80"
    },
    {
        keywords: ["7up", "seven up", "sprite", "dew", "mountain dew", "lime soda"],
        label: "7UP / Sprite Green Chilled Can",
        url: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=600&q=80"
    },
    {
        keywords: ["slice", "slice mango", "mango drink", "mango juice", "fruita vitals"],
        label: "Slice Ripe Mango Juice Drink",
        url: "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80"
    },
    {
        keywords: ["tang", "tang powder", "tang instant", "instant drink powder", "orange drink"],
        label: "Tang Instant Drink Powder (Orange)",
        url: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80"
    },
    {
        keywords: ["energile", "energy powder", "glucose", "energile original", "glucon-d"],
        label: "Energile Original Instant Energy Drink",
        url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80"
    },

    // Spreads, Oil & Condiments
    {
        keywords: ["oil", "mezan", "mezan cooking oil", "dalda", "cooking oil", "ghee", "banaspati", "pouch oil"],
        label: "Mezan / Dalda Pure Cooking Oil Pouch",
        url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80"
    },
    {
        keywords: ["mayonnaise", "mayo", "young's mayonnaise", "youngs mayo", "garlic mayo"],
        label: "Young's Mayonnaise Glass Jar",
        url: "https://images.unsplash.com/photo-1528751014936-863e6e7a319c?auto=format&fit=crop&w=600&q=80"
    },
    {
        keywords: ["jam", "apple jam", "national apple jam", "national jam", "strawberry jam", "shezan jam"],
        label: "National Apple / Fruit Jam Glass Jar",
        url: "https://images.unsplash.com/photo-1568651348301-443b7156950f?auto=format&fit=crop&w=600&q=80"
    },
    {
        keywords: ["tapal", "tapal danedar", "chai", "tea", "lipton", "black tea"],
        label: "Tapal Danedar Strong Black Tea Pouch",
        url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80"
    },
    {
        keywords: ["rice", "chawal", "basmati", "guard basmati", "super kernel"],
        label: "Guard Premium Basmati Rice",
        url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80"
    },
    {
        keywords: ["sugar", "cheeni", "white sugar"],
        label: "Refined White Granulated Sugar",
        url: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=600&q=80"
    },
    {
        keywords: ["flour", "atta", "fauji atta", "chakki atta"],
        label: "Fauji Whole Wheat Chakki Atta Bag",
        url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80"
    },
    {
        keywords: ["masala", "shan", "biryani masala", "korma masala", "spices"],
        label: "Shan Special Biryani Masala Spices",
        url: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80"
    },
    {
        keywords: ["surf", "surf excel", "ariel", "detergent", "washing powder"],
        label: "Surf Excel Laundry Washing Detergent",
        url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80"
    },
    {
        keywords: ["soap", "lux", "lifebuoy", "dettol soap", "sabun"],
        label: "Lux / Lifebuoy Beauty Soap Bar",
        url: "https://images.unsplash.com/photo-1607006314352-7b196883c50f?auto=format&fit=crop&w=600&q=80"
    }
];

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const query = (searchParams.get("q") || "").toLowerCase().trim();

        if (!query) {
            return NextResponse.json({
                success: true,
                images: PAKISTANI_PRODUCT_IMAGES.slice(0, 16)
            });
        }

        const words = query.split(/\s+/).filter(w => w.length > 1);

        // Score matches
        const scored = PAKISTANI_PRODUCT_IMAGES.map(item => {
            let score = 0;
            for (const kw of item.keywords) {
                if (query.includes(kw)) score += 10;
                for (const w of words) {
                    if (kw.includes(w)) score += 3;
                }
            }
            if (item.label.toLowerCase().includes(query)) score += 8;
            return { item, score };
        });

        const sorted = scored
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(s => s.item);

        const results = sorted.length > 0 ? sorted : PAKISTANI_PRODUCT_IMAGES.slice(0, 12);

        return NextResponse.json({
            success: true,
            query,
            images: results
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
