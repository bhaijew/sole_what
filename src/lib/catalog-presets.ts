/**
 * High-quality preset catalog, brand photos, and hero banners
 * for Pakistani Kiryana, Mart, Grocery, and Food stores.
 */

export interface PresetBanner {
    id: string;
    title: string;
    subtitle: string;
    badge: string;
    bgGradient: string;
    imageUrl: string;
}

export interface PresetProductItem {
    name: string;
    category: string;
    price: number;
    compareAtPrice?: number;
    unit: string;
    description: string;
    image: string;
}

// Top Promotional Slider Banners for Storefront
export const PRESET_HERO_BANNERS: PresetBanner[] = [
    {
        id: "banner-1",
        title: "Ghar Ka Ration, Ghar Tak! 🛒",
        subtitle: "Taaza saman, behtareen rates aur foran delivery aapke darwazay par.",
        badge: "Taaza & Asal",
        bgGradient: "from-emerald-700 via-teal-800 to-slate-900",
        imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80"
    },
    {
        id: "banner-2",
        title: "Dhamaka Free Delivery Offer! 🛵",
        subtitle: "Muft delivery hasil karein apne mohallay ki pasandeeda dukaan se.",
        badge: "Free Delivery",
        bgGradient: "from-amber-600 via-orange-700 to-slate-900",
        imageUrl: "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=1200&q=80"
    },
    {
        id: "banner-3",
        title: "Dairy, Eggs & Bakery Fresh 🥛",
        subtitle: "Rozana subah ka fresh doodh, bread aur anday bina kisi jhanjhat ke.",
        badge: "Daily Fresh",
        bgGradient: "from-blue-700 via-indigo-800 to-slate-900",
        imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=1200&q=80"
    }
];

// Pre-loaded Essential Products with Authentic Pakistani Market Prices & HD Images
export const PRESET_CATALOG_PRODUCTS: PresetProductItem[] = [
    // Dairy & Bakery
    {
        name: "Olper's Full Cream Milk 1 Litre",
        category: "Dairy & Bakery",
        price: 295,
        compareAtPrice: 320,
        unit: "1 Litre Tetra Pack",
        description: "Pure and rich UHT treated milk, perfect for tea and breakfast.",
        image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80"
    },
    {
        name: "Dawn Plain Bread (Large)",
        category: "Dairy & Bakery",
        price: 180,
        compareAtPrice: 200,
        unit: "Large Loaf (750g)",
        description: "Fresh, soft, and nutritious daily sandwich bread.",
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80"
    },
    {
        name: "Fresh Farm Eggs (1 Dozen)",
        category: "Dairy & Bakery",
        price: 360,
        compareAtPrice: 400,
        unit: "12 Pieces (1 Dozen)",
        description: "Grade-A farm fresh white eggs.",
        image: "https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?auto=format&fit=crop&w=600&q=80"
    },
    {
        name: "Nurpur Salted Butter 200g",
        category: "Dairy & Bakery",
        price: 340,
        compareAtPrice: 370,
        unit: "200g Pack",
        description: "Creamy traditional Pakistani dairy butter.",
        image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80"
    },

    // Kiryana & Spices
    {
        name: "Shan Special Bombay Biryani Masala 50g",
        category: "Ration & Spices",
        price: 130,
        compareAtPrice: 150,
        unit: "50g Box",
        description: "Authentic spicy mix for fragrant home-made biryani.",
        image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80"
    },
    {
        name: "Dalda Banaspati Ghee / Cooking Oil 1 Litre",
        category: "Ration & Spices",
        price: 520,
        compareAtPrice: 560,
        unit: "1 Litre Pouch",
        description: "Enriched with Vitamins A & D, trusted Pakistani cooking medium.",
        image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80"
    },
    {
        name: "Super Kernel Basmati Rice (Premium)",
        category: "Ration & Spices",
        price: 380,
        compareAtPrice: 420,
        unit: "1 kg Pack",
        description: "Long grain aromatic aged basmati rice.",
        image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80"
    },
    {
        name: "Tapal Danedar Tea (Pouch 450g)",
        category: "Ration & Spices",
        price: 680,
        compareAtPrice: 730,
        unit: "450g Pouch",
        description: "Strong aromatic Pakistani black tea for perfect karak chai.",
        image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80"
    },

    // Beverages & Drinks
    {
        name: "Coca Cola / Sprite 1.5 Litre",
        category: "Cold Drinks",
        price: 170,
        compareAtPrice: 190,
        unit: "1.5 Litre Bottle",
        description: "Chilled carbonated soft drink for meals and refreshment.",
        image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80"
    },
    {
        name: "Hamdard Rooh Afza Sharbat 800ml",
        category: "Cold Drinks",
        price: 390,
        compareAtPrice: 420,
        unit: "800ml Glass Bottle",
        description: "The classic refreshing herbal syrup for milk and water.",
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80"
    },
    {
        name: "Nestle Pure Life Water 1.5L",
        category: "Cold Drinks",
        price: 90,
        compareAtPrice: 100,
        unit: "1.5 Litre",
        description: "Purified and safe mineral drinking water.",
        image: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80"
    },

    // Snacks & Munchies
    {
        name: "Lays French Cheese / Masala Large",
        category: "Snacks",
        price: 100,
        compareAtPrice: 110,
        unit: "Large Pack",
        description: "Crispy potato chips in Pakistan's favorite flavors.",
        image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80"
    },
    {
        name: "Kurkure Chutney Chaska / Red Chilli",
        category: "Snacks",
        price: 60,
        compareAtPrice: 70,
        unit: "Family Pack",
        description: "Crunchy spicy corn puffs snack.",
        image: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=600&q=80"
    },
    {
        name: "Lu Prince Chocolate Biscuits Half Roll",
        category: "Snacks",
        price: 60,
        compareAtPrice: 70,
        unit: "Half Roll",
        description: "Kids favorite chocolate cream sandwich biscuits.",
        image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80"
    }
];
