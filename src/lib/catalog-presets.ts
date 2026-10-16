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
    linkUrl?: string;
}

export interface SliderPack {
    id: string;
    title: string;
    urduTitle: string;
    category: string;
    description: string;
    icon: string;
    badge: string;
    banners: PresetBanner[];
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
        imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
        linkUrl: "#products"
    },
    {
        id: "banner-2",
        title: "Dhamaka Free Delivery Offer! 🛵",
        subtitle: "Muft delivery hasil karein apne mohallay ki pasandeeda dukaan se.",
        badge: "Free Delivery",
        bgGradient: "from-amber-600 via-orange-700 to-slate-900",
        imageUrl: "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=1200&q=80",
        linkUrl: "#products"
    },
    {
        id: "banner-3",
        title: "Dairy, Eggs & Bakery Fresh 🥛",
        subtitle: "Rozana subah ka fresh doodh, bread aur anday bina kisi jhanjhat ke.",
        badge: "Daily Fresh",
        bgGradient: "from-blue-700 via-indigo-800 to-slate-900",
        imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=1200&q=80",
        linkUrl: "#products"
    }
];

// Pre-installed Complete Slider Theme Packs for Storefront
export const PRE_INSTALLED_SLIDER_PACKS: SliderPack[] = [
    {
        id: "pack-ration",
        title: "Super Mart & Fresh Ration",
        urduTitle: "جنرل راشن و کریانہ پیکیج",
        category: "Grocery & Mart",
        description: "Taaza daalein, ghee, aata aur rozmarrah kiryana items fori doorstep delivery ke sath.",
        icon: "🛒",
        badge: "Most Popular",
        banners: [
            {
                id: "ration-1",
                title: "Ghar Ka Ration, Foran Ghar Tak! 🛒",
                subtitle: "Taaza daalein, Mezan cooking oil aur rozmarrah ka kiryana asal market rates par.",
                badge: "Taaza & Asal",
                bgGradient: "from-emerald-800 via-teal-900 to-slate-950",
                imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
                linkUrl: "#products"
            },
            {
                id: "ration-2",
                title: "Dhamaka Free Delivery Offer! 🛵",
                subtitle: "WhatsApp par order karein aur 30 minutes mein apne darwazay par delivery payein.",
                badge: "Muft Delivery",
                bgGradient: "from-amber-700 via-orange-800 to-slate-950",
                imageUrl: "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=1200&q=80",
                linkUrl: "#products"
            },
            {
                id: "ration-3",
                title: "Chawal, Ghee & Masalay Bachat Deal 🌾",
                subtitle: "Bachat package: Mezan cooking oil aur premium basmati chawal par special discounts.",
                badge: "Bachat Offer",
                bgGradient: "from-emerald-900 via-green-950 to-slate-950",
                imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1200&q=80",
                linkUrl: "#products"
            }
        ]
    },
    {
        id: "pack-bakery",
        title: "Bakery, Dairy & Fresh Nashta",
        urduTitle: "بیکری و ڈیری ناشتہ پیکیج",
        category: "Bakery & Dairy",
        description: "Fresh Dawn plain bread, Olper's doodh, desi anday aur chai rusks rozana subah dastyab.",
        icon: "🍞",
        badge: "Breakfast Special",
        banners: [
            {
                id: "bakery-1",
                title: "Subah Ka Taaza Nashta & Bakery 🍞",
                subtitle: "Rozana fresh Dawn plain bread, burger buns, rusks aur delicious fruit cakes.",
                badge: "Daily Fresh",
                bgGradient: "from-amber-700 via-yellow-800 to-slate-950",
                imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
                linkUrl: "#products"
            },
            {
                id: "bakery-2",
                title: "Dairy, Eggs & Pure Milk Fresh 🥛",
                subtitle: "Olper's milk, Nurpur butter aur Grade-A desi & farm anday subah subah dastyab.",
                badge: "Pure Dairy",
                bgGradient: "from-blue-700 via-indigo-900 to-slate-950",
                imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=1200&q=80",
                linkUrl: "#products"
            },
            {
                id: "bakery-3",
                title: "Tea Whitener, Chai & Rusks Deal ☕",
                subtitle: "Karak chai ke sath crispy rusk aur tea whitener — sham ki chai ka behtareen sathi.",
                badge: "Chai Lovers",
                bgGradient: "from-rose-800 via-red-900 to-slate-950",
                imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&q=80",
                linkUrl: "#products"
            }
        ]
    },
    {
        id: "pack-ramadan",
        title: "Ramadan & Eid Mubarak Deals",
        urduTitle: "رمضان و عید خصوصی آفرز",
        category: "Festive & Seasonal",
        description: "Khajoor, Rooh Afza, pakora mix, besan aur Eid sweets bachat packaging.",
        icon: "🌙",
        badge: "Ramadan Mubarak",
        banners: [
            {
                id: "ramadan-1",
                title: "Mubarak Ramadan Ration Bachat Package 🌙",
                subtitle: "Khajoor, Rooh Afza, besan, chaat masala aur cooking oil par kam tareen qeematein.",
                badge: "Ramadan Kareem",
                bgGradient: "from-violet-900 via-purple-950 to-slate-950",
                imageUrl: "https://images.unsplash.com/photo-1584727638096-042c45049ebe?auto=format&fit=crop&w=1200&q=80",
                linkUrl: "#products"
            },
            {
                id: "ramadan-2",
                title: "Iftari & Sehri Fresh Essentials ✨",
                subtitle: "Dahi bhalley masalay, pakora mix aur thandi botalain foran order karein.",
                badge: "Iftar Special",
                bgGradient: "from-emerald-900 via-teal-950 to-slate-950",
                imageUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=80",
                linkUrl: "#products"
            },
            {
                id: "ramadan-3",
                title: "Eid Mubarak Sweet Delights 🎁",
                subtitle: "Mithai, sheer khurma ingredients aur dry fruits gift packs ghar pohnchein.",
                badge: "Eid Mubarak",
                bgGradient: "from-amber-800 via-rose-950 to-slate-950",
                imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80",
                linkUrl: "#products"
            }
        ]
    },
    {
        id: "pack-flash",
        title: "Weekend Dhamaka & 10% Discount",
        urduTitle: "ویک اینڈ دھماکہ سیل",
        category: "Discounts & Offers",
        description: "Mega weekend discount sale, chilled cold drinks aur flat 10% coupon promo banners.",
        icon: "⚡",
        badge: "Flash Sale",
        banners: [
            {
                id: "flash-1",
                title: "Hafta Bazaar Super Weekend Sale 💥",
                subtitle: "Promo Code WELCOME10 lagayein aur har order par Flat 10% Discount payein!",
                badge: "Flat 10% OFF",
                bgGradient: "from-red-800 via-rose-900 to-slate-950",
                imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80",
                linkUrl: "#products"
            },
            {
                id: "flash-2",
                title: "Chilled Cold Drinks & Juices 🥤",
                subtitle: "Coca-Cola, Sprite, Pepsi 1.5L aur Slice Mango Juice bilkul thandi chilled dastyab.",
                badge: "Super Chilled",
                bgGradient: "from-cyan-800 via-blue-900 to-slate-950",
                imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=1200&q=80",
                linkUrl: "#products"
            },
            {
                id: "flash-3",
                title: "Buy 2 Get 1 Free Deals 🏷️",
                subtitle: "Selected biscuits, chocolates aur snacks par shandar combo offers.",
                badge: "Limited Time",
                bgGradient: "from-purple-800 via-indigo-950 to-slate-950",
                imageUrl: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1200&q=80",
                linkUrl: "#products"
            }
        ]
    },
    {
        id: "pack-pharmacy",
        title: "Pharmacy, Baby Care & Hygiene",
        urduTitle: "میڈیکل و پرسنل کیئر",
        category: "Health & Baby",
        description: "Original medicines, baby diapers, baby milk powders aur sanitizers.",
        icon: "💊",
        badge: "Healthcare",
        banners: [
            {
                id: "pharmacy-1",
                title: "Asal Dawaiyan & Baby Care Products 💊",
                subtitle: "Pampers, baby milk powder aur essential first aid medicines ghar tak.",
                badge: "100% Genuine",
                bgGradient: "from-teal-800 via-cyan-950 to-slate-950",
                imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80",
                linkUrl: "#products"
            },
            {
                id: "pharmacy-2",
                title: "Soaps, Shampoos & Detergents 🧴",
                subtitle: "Lifebuoy, Dettol, Surf Excel aur Ariel wholesale market rates par.",
                badge: "Clean Home",
                bgGradient: "from-blue-800 via-sky-950 to-slate-950",
                imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=1200&q=80",
                linkUrl: "#products"
            },
            {
                id: "pharmacy-3",
                title: "Sanitizers & Disinfectants 🛡️",
                subtitle: "Sehat aur hifazat ke liye zaroori hygiene items fori delivery ke sath.",
                badge: "Hygiene First",
                bgGradient: "from-emerald-800 via-teal-950 to-slate-950",
                imageUrl: "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?auto=format&fit=crop&w=1200&q=80",
                linkUrl: "#products"
            }
        ]
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
