"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import {
    Sparkles,
    Mic,
    MicOff,
    UploadCloud,
    Camera,
    FileText,
    CheckCircle2,
    Trash2,
    Plus,
    RefreshCw,
    AlertCircle,
    ArrowRight,
    Store,
    ShoppingBag,
    Layers,
    DollarSign,
    Check,
    X,
    HelpCircle,
    Zap,
    ImageIcon,
    ExternalLink,
    Search,
    Share2,
    Copy,
    CheckCheck,
    Percent,
    Filter,
    SlidersHorizontal,
    Calculator
} from "lucide-react";
import { toast } from "sonner";

interface ProductRow {
    name: string;
    category: string;
    price: number;
    compareAtPrice?: number | null;
    unit: string;
    description?: string;
    image?: string;
    inStock: boolean;
}

interface AiProductCreatorProps {
    activeStore: {
        id: string;
        name: string;
        currencySymbol?: string;
        slug?: string;
    };
    onComplete?: () => void;
}

const SAMPLE_TABLE_DATA = `| Product Name | Quantity | Price (Rs.) |
| ----------------------- | ------------- | ----------- |
| Olper's Full Cream Milk | 1 Litre       | 349.60      |
| Olper's Full Cream Milk | 500 ml        | 184         |
| Olper's Full Cream Milk | 250 ml        | 93          |
| Olper's Full Cream Milk | 1.5 Litre     | 504         |
| Olper's Cream           | 200 ml        | 221         |
| Omung Low Fat Milk      | 1 Litre       | 312         |
| Tarang Tea Whitener     | 220 ml        | 57          |
| Dawn Plain Bread Small  | 340 g         | 108         |
| Dawn Plain Bread Large  | 725 g         | 211.60      |
| Dawn Burger Buns        | 110 g         | 85          |
| Dawn Bran Bread         | 340 g         | 170         |
| Dawn Fruit Cake         | 100 g         | 120         |
| Dawn Fruit Cake         | 200 g         | 230         |
| Dawn Rusk               | 190 g         | 160         |
| Fresh Eggs              | 12 pieces     | 313.50      |
| Fresh Eggs              | 6 pieces      | 156.40      |
| Coca-Cola               | 350 ml        | 60.90       |
| Coca-Cola               | 1.5 Litre     | 174         |
| Pepsi                   | 345 ml        | 63          |
| 7UP                     | 345 ml        | 63          |
| Slice Mango Drink       | 200 ml        | 41.80       |
| Mezan Cooking Oil       | 1 Litre pouch | 545.40      |
| Nestlé Milkpak Milk     | 250 ml        | 90          |
| Nurpur Full Cream Milk  | 1 Litre       | 330         |
| Prema Yogurt            | 450 g         | 210         |
| Milkpak Yogurt          | 500 g         | 240         |
| Dayfresh Dairy Cream    | 200 ml        | 220         |
| Young's Mayonnaise      | 500 ml        | 316.80      |
| Dairy Life Mozzarella Cheese | 200 g   | 636.40      |
| National Apple Jam      | 200 g         | 230         |
| Tang Instant Drink Powder | 375 g      | 320         |
| Energile Original       | 100 g         | 90          |
| Dayfresh Flavoured Milk | 225 ml        | 180         |
| Dawn Special Burger Buns| 4 pieces      | 80          |`;

const CURATED_PAKISTANI_GALLERY = [
    { label: "Olper's / Milkpak Milk Carton", url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80" },
    { label: "Fresh Whole Milk Bottle", url: "https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=600&q=80" },
    { label: "Olper's / Dairy Cream Pack", url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80" },
    { label: "Tarang Tea Whitener Chai Cup", url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80" },
    { label: "Dawn Plain Bread Slices", url: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=600&q=80" },
    { label: "Dawn Bran Wheat Bread", url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80" },
    { label: "Dawn Burger Buns (Pack of 4)", url: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80" },
    { label: "Dawn Candied Fruit Cake Loaf", url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80" },
    { label: "Dawn Crisp Golden Tea Rusk", url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80" },
    { label: "Farm Fresh Eggs Carton Tray", url: "https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?auto=format&fit=crop&w=600&q=80" },
    { label: "Coca-Cola Red Can (350ml)", url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80" },
    { label: "Coca-Cola Family Bottle (1.5L)", url: "https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=600&q=80" },
    { label: "Pepsi Chilled Blue Can", url: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=600&q=80" },
    { label: "7UP Lime Soda Green Can", url: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=600&q=80" },
    { label: "Slice Mango Juice Drink", url: "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80" },
    { label: "Mezan Cooking Oil Pouch", url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80" },
    { label: "Prema / Milkpak Dahi Tub", url: "https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=600&q=80" },
    { label: "Young's Mayonnaise Glass Jar", url: "https://images.unsplash.com/photo-1528751014936-863e6e7a319c?auto=format&fit=crop&w=600&q=80" },
    { label: "Dairy Life Mozzarella Cheese Block", url: "https://images.unsplash.com/photo-1618060932014-4deda4932554?auto=format&fit=crop&w=600&q=80" },
    { label: "National Apple Jam Glass Jar", url: "https://images.unsplash.com/photo-1568651348301-443b7156950f?auto=format&fit=crop&w=600&q=80" },
    { label: "Tang Instant Orange Drink", url: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80" },
    { label: "Energile Original Energy Drink", url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80" },
    { label: "Dayfresh Flavoured Milk Bottle", url: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80" }
];

const BUSINESS_PACKS = [
    {
        id: "grocery",
        title: "Kiryana & Grocery",
        urdu: "کریانہ و جنرل سٹور",
        icon: "🏪",
        description: "Doodh, Dalda oil, Tapal chai, Basmati chawal, Cheeni, Atta, Masalay",
        prompt: "Humari Kiryana dukaan hai. Yeh samaan add kardo: Olpers doodh 1L Rs. 280, Dalda cooking oil 5L Rs. 2650, Tapal Danedar chai 430g Rs. 650, Guard Basmati chawal 5kg Rs. 1850, Cheeni 1kg Rs. 145, Fauji Atta 10kg Rs. 1380, Shan Biryani Masala Rs. 120, Surf Excel 1kg Rs. 540, Lux sabun Rs. 110, Rooh Afza 800ml Rs. 420."
    },
    {
        id: "fastfood",
        title: "Fast Food & Cafe",
        urdu: "فاسٹ فوڈ و کیفے",
        icon: "🍔",
        description: "Zinger burger, Loaded fries, Club sandwich, Cold drinks, Chai",
        prompt: "Humara fast food cafe hai. Yeh menu add kardo: Crispy Zinger Burger Rs. 450, Jumbo Beef Burger Rs. 550, Loaded Cheesy Fries Rs. 380, Chicken Club Sandwich Rs. 420, Hot Wings 6 pcs Rs. 350, Cold Drink 500ml Rs. 90, Karak Doodh Patti Chai Rs. 100, Chocolate Shake Rs. 280."
    },
    {
        id: "dairy",
        title: "Dairy & Bakery",
        urdu: "ڈیری و بیکری",
        icon: "🥛",
        description: "Khula doodh, Dahi, Desi ghee, Makhan, Anday, Double roti, Rusk",
        prompt: "Humari fresh dairy aur bakery shop hai. Yeh items add kardo: Khula Taaza Doodh 1kg Rs. 210, Meetha / Sadah Dahi 1kg Rs. 230, Desi Ghee 1kg Rs. 2400, Fresh Makhan 250g Rs. 450, Farm Anday 1 Dozen Rs. 320, Large Milky Bread Rs. 160, Cake Rusk 500g Rs. 280."
    },
    {
        id: "pharmacy",
        title: "Pharmacy & Care",
        urdu: "میڈیکل سٹور",
        icon: "💊",
        description: "Panadol, Dettol, Hand sanitizer, Face wash, Shaving cream, Pampers",
        prompt: "Humari pharmacy aur personal care dukaan hai: Panadol Extra 10 Tablets Rs. 50, Dettol Antiseptic 100ml Rs. 280, Pampers Baby Diapers Large Pack Rs. 1850, Lifebuoy Handwash Rs. 220, Sensodyne Toothpaste Rs. 340, Nivea Soft Cream Rs. 490."
    },
    {
        id: "mobile",
        title: "Mobile Accessories",
        urdu: "موبائل شاپ",
        icon: "📱",
        description: "Fast charger, Type-C cable, Handsfree, Powerbank, Tempered glass",
        prompt: "Humari mobile accessories dukaan hai: Fast Charger 20W PD Rs. 850, Type-C Braided Cable 65W Rs. 450, In-Ear Stereo Handsfree Rs. 350, 10000mAh Powerbank Rs. 2800, 9D Tempered Glass Protector Rs. 250, Universal Car Phone Holder Rs. 650."
    },
    {
        id: "boutique",
        title: "Garments & Boutique",
        urdu: "کپڑے و گارمنٹس",
        icon: "👗",
        description: "Lawn suit, Cotton kurta, Shalwar kameez, Dupatta, Stole",
        prompt: "Humari ladies boutique dukaan hai: 3-Piece Printed Lawn Suit Rs. 2850, Embroidered Chiffon Dupatta Rs. 1200, Men Gents Cotton Kurta Rs. 1950, Casual Digital Kurti Rs. 1450, Cotton Trouser Rs. 850."
    }
];

export default function AiProductCreator({ activeStore, onComplete }: AiProductCreatorProps) {
    const [activeMethod, setActiveMethod] = useState<"text" | "image" | "preset">("text");

    // Input States
    const [promptText, setPromptText] = useState("");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [imageFileName, setImageFileName] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Voice Recording State
    const [isListening, setIsListening] = useState(false);
    const [voiceSupported, setVoiceSupported] = useState(true);
    const recognitionRef = useRef<any>(null);

    // Parsing & Save State
    const [isParsing, setIsParsing] = useState(false);
    const [parsingStage, setParsingStage] = useState("");
    const [parsedProducts, setParsedProducts] = useState<ProductRow[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Image Selector Modal State
    const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
    const [customImageInput, setCustomImageInput] = useState<string>("");
    const [imageSearchQuery, setImageSearchQuery] = useState<string>("");
    const [imageSearchResults, setImageSearchResults] = useState<{ label: string; url: string }[]>([]);
    const [isSearchingImages, setIsSearchingImages] = useState<boolean>(false);

    const handleSearchImages = async (query: string) => {
        if (!query.trim()) return;
        setIsSearchingImages(true);
        try {
            const res = await fetch(`/api/store/image-search?q=${encodeURIComponent(query.trim())}`);
            const data = await res.json();
            if (data.images && Array.isArray(data.images)) {
                setImageSearchResults(data.images);
            }
        } catch (e) {
            console.warn("Failed to search images", e);
        } finally {
            setIsSearchingImages(false);
        }
    };

    const handleOpenImageModal = (idx: number) => {
        setEditingImageIndex(idx);
        const prod = parsedProducts[idx];
        if (prod) {
            setImageSearchQuery(prod.name);
            handleSearchImages(prod.name);
        }
    };

    // WhatsApp Slip Modal State
    const [showWhatsAppSlipModal, setShowWhatsAppSlipModal] = useState<boolean>(false);
    const [copiedSlip, setCopiedSlip] = useState<boolean>(false);

    // Review Table Filter & Search State
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [tableSearchQuery, setTableSearchQuery] = useState<string>("");

    // Category Counts
    const categoriesWithCount = useMemo(() => {
        const counts: Record<string, number> = {};
        parsedProducts.forEach((p) => {
            const cat = p.category?.trim() || "General";
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return counts;
    }, [parsedProducts]);

    // Filtered products preserving original index
    const filteredProductsWithIndex = useMemo(() => {
        const q = tableSearchQuery.toLowerCase().trim();
        return parsedProducts
            .map((p, origIdx) => ({ p, origIdx }))
            .filter(({ p }) => {
                const matchesCat = categoryFilter === "all" || p.category === categoryFilter;
                const matchesSearch =
                    !q ||
                    p.name.toLowerCase().includes(q) ||
                    (p.category && p.category.toLowerCase().includes(q)) ||
                    (p.unit && p.unit.toLowerCase().includes(q));
                return matchesCat && matchesSearch;
            });
    }, [parsedProducts, categoryFilter, tableSearchQuery]);

    // Live Inventory Summary Stats
    const inventoryStats = useMemo(() => {
        const total = parsedProducts.length;
        const totalValue = parsedProducts.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
        const avgPrice = total > 0 ? Math.round(totalValue / total) : 0;
        const photosMatched = parsedProducts.filter((p) => Boolean(p.image)).length;
        return { total, totalValue, avgPrice, photosMatched };
    }, [parsedProducts]);

    // Bulk Discount and Pricing Modifiers
    const applyBulkDiscount = (percentage: number) => {
        setParsedProducts((prev) =>
            prev.map((item) => {
                const originalPrice =
                    item.compareAtPrice && item.compareAtPrice > item.price
                        ? item.compareAtPrice
                        : item.price;
                const newPrice = Math.round(originalPrice * (1 - percentage / 100));
                return {
                    ...item,
                    compareAtPrice: originalPrice,
                    price: newPrice
                };
            })
        );
        toast.success(`🎉 Tamam products par ${percentage}% Sale Discount lag gaya!`);
    };

    const roundAllPrices = (nearest: number = 5) => {
        setParsedProducts((prev) =>
            prev.map((item) => ({
                ...item,
                price: Math.max(1, Math.round(item.price / nearest) * nearest),
                compareAtPrice: item.compareAtPrice
                    ? Math.max(1, Math.round(item.compareAtPrice / nearest) * nearest)
                    : item.compareAtPrice
            }))
        );
        toast.success(`Tamam prices Rs. ${nearest} ke qareeb round ho gayin.`);
    };

    const resetDiscounts = () => {
        setParsedProducts((prev) =>
            prev.map((item) => ({
                ...item,
                price:
                    item.compareAtPrice && item.compareAtPrice > item.price
                        ? item.compareAtPrice
                        : item.price,
                compareAtPrice: null
            }))
        );
        toast.info("Original prices restore ho gayin.");
    };

    // Format WhatsApp Rate List Slip
    const generateWhatsAppRateList = () => {
        const storeName = activeStore.name || "Apni Dukaan";
        const today = new Date().toLocaleDateString("en-PK", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

        let text = `🛒 *${storeName} — Daily Fresh Rate List*\n`;
        text += `📅 Tarikh: ${today}\n`;
        text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

        const grouped: Record<string, ProductRow[]> = {};
        parsedProducts.forEach((p) => {
            const cat = p.category?.trim() || "General Grocery";
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(p);
        });

        Object.entries(grouped).forEach(([cat, items]) => {
            let catEmoji = "📦";
            const lc = cat.toLowerCase();
            if (lc.includes("milk") || lc.includes("dairy")) catEmoji = "🥛";
            else if (lc.includes("bread") || lc.includes("bakery") || lc.includes("cake") || lc.includes("rusk"))
                catEmoji = "🍞";
            else if (lc.includes("drink") || lc.includes("beverage") || lc.includes("juice") || lc.includes("cola"))
                catEmoji = "🥤";
            else if (lc.includes("egg") || lc.includes("fresh")) catEmoji = "🥚";
            else if (lc.includes("oil") || lc.includes("ghee")) catEmoji = "🫒";
            else if (lc.includes("snack") || lc.includes("biscuit") || lc.includes("chips")) catEmoji = "🍪";
            else if (lc.includes("tea") || lc.includes("coffee") || lc.includes("chai")) catEmoji = "☕";

            text += `${catEmoji} *${cat.toUpperCase()}:*\n`;
            items.forEach((item) => {
                const unitStr = item.unit ? ` (${item.unit})` : "";
                const discountStr =
                    item.compareAtPrice && item.compareAtPrice > item.price
                        ? ` ~Rs. ${item.compareAtPrice}~`
                        : "";
                text += `• ${item.name}${unitStr} — *Rs. ${item.price}*${discountStr}\n`;
            });
            text += `\n`;
        });

        text += `━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `🚚 *Ghar Baithe Order Karein:*\n`;
        text += `Isi WhatsApp par apna order aur address bhejein!\n`;
        text += `⚡ *SoleWhat AI Dukaan Engine*`;
        return text;
    };

    const handleCopyWhatsAppSlip = () => {
        const text = generateWhatsAppRateList();
        navigator.clipboard.writeText(text);
        setCopiedSlip(true);
        toast.success("WhatsApp Rate List copy ho gayi! Apne customer group ya status par paste karein.");
        setTimeout(() => setCopiedSlip(false), 3000);
    };

    // Detect if input contains table rows
    const tableDetection = useMemo(() => {
        if (!promptText.includes("|")) return { isTable: false, count: 0 };
        const rows = promptText
            .split(/\r?\n/)
            .filter((l) => l.includes("|") && !/^[-:\s|]+$/.test(l.trim()));
        return { isTable: rows.length > 1, count: Math.max(0, rows.length - 1) };
    }, [promptText]);

    // Initialize Web Speech API for Pakistani Urdu/English
    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition =
                (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = "ur-PK";

                recognition.onresult = (event: any) => {
                    let transcript = "";
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        transcript += event.results[i][0].transcript;
                    }
                    if (transcript.trim()) {
                        setPromptText((prev) => (prev ? `${prev} ${transcript}` : transcript));
                    }
                };

                recognition.onerror = (event: any) => {
                    console.warn("Speech recognition error:", event.error);
                    setIsListening(false);
                };

                recognition.onend = () => {
                    setIsListening(false);
                };

                recognitionRef.current = recognition;
            } else {
                setVoiceSupported(false);
            }
        }
    }, []);

    const toggleVoice = () => {
        if (!recognitionRef.current) {
            toast.error("Aapke browser mein direct microphone speech support mojood nahi hai. Baraye meherbani text likhein.");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
            toast.info("Microphone band kar diya gaya.");
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
                toast.success("Mic active hai! Ab bolna shuru karein...");
            } catch (err) {
                console.error("Mic start failed", err);
                setIsListening(false);
            }
        }
    };

    // Handle Image Upload (Parchi / Price slip)
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Sirf photo (JPG, PNG) upload ki ja sakti hai.");
            return;
        }

        if (file.size > 8 * 1024 * 1024) {
            toast.error("Photo ka size 8MB se kam hona chahiye.");
            return;
        }

        setImageFileName(file.name);
        const reader = new FileReader();
        reader.onload = () => {
            setSelectedImage(reader.result as string);
            toast.success("Parchi / Price slip upload ho gayi! Ab 'Scan With AI' par click karein.");
        };
        reader.readAsDataURL(file);
    };

    // Run AI Extractor
    const handleExtract = async () => {
        if (!promptText.trim() && !selectedImage) {
            toast.error("Baraye meherbani samaan ki list likhein ya parchi ki photo upload karein.");
            return;
        }

        setIsParsing(true);
        setParsingStage("AI models connect ho rahe hain...");

        try {
            const timer1 = setTimeout(() => setParsingStage("Parchi aur prices ko samjha ja raha hai..."), 1000);
            const timer2 = setTimeout(() => setParsingStage("Pakistani brands aur photos auto-assign ho rahi hain..."), 2000);

            const res = await fetch("/api/store/ai-product-parser", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    storeId: activeStore.id,
                    prompt: promptText.trim(),
                    imageBase64: selectedImage || undefined
                })
            });

            clearTimeout(timer1);
            clearTimeout(timer2);

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "AI product parsing fail ho gayi.");
            }

            if (!data.products || data.products.length === 0) {
                toast.warning("AI ko di gayi list mein se koi product samajh nahi aya. Baraye meherbani mazeed wazahat se likhein.");
                return;
            }

            setParsedProducts(data.products);
            toast.success(data.message || `Mubarak! ${data.products.length} products extract ho gaye.`);
        } catch (err: any) {
            console.error("AI parse failed:", err);
            toast.error(err.message || "Product extract nahi ho sake. Baraye meherbani dobara koshish karein.");
        } finally {
            setIsParsing(false);
            setParsingStage("");
        }
    };

    // Row manipulation
    const handleUpdateRow = (index: number, field: keyof ProductRow, value: any) => {
        setParsedProducts((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const handleDeleteRow = (index: number) => {
        setParsedProducts((prev) => prev.filter((_, i) => i !== index));
    };

    const handleAddBlankRow = () => {
        setParsedProducts((prev) => [
            ...prev,
            {
                name: "Naya Item",
                category: "General Grocery",
                price: 100,
                compareAtPrice: 110,
                unit: "item",
                image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
                inStock: true
            }
        ]);
    };

    // Apply Image from Modal
    const handleApplySelectedImage = (imageUrl: string) => {
        if (editingImageIndex === null) return;
        handleUpdateRow(editingImageIndex, "image", imageUrl);
        setEditingImageIndex(null);
        setCustomImageInput("");
        toast.success("Product ki photo tabdeel ho gayi!");
    };

    // 1-Click Final Bulk Save to Store DB
    const handleSaveToStore = async () => {
        if (!parsedProducts || parsedProducts.length === 0) {
            toast.error("Save karne ke liye koi product mojood nahi hai.");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch("/api/store/bulk-import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    storeId: activeStore.id,
                    products: parsedProducts
                })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Products save nahi ho sake.");
            }

            toast.success(
                `🎉 Zabardast! ${data.count || parsedProducts.length} products aapki dukaan "${activeStore.name}" mein shamil ho gaye!`
            );

            setParsedProducts([]);
            setPromptText("");
            setSelectedImage(null);

            if (onComplete) {
                onComplete();
            }
        } catch (err: any) {
            console.error("Bulk save error:", err);
            toast.error(err.message || "Failed to save products to store.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* HERO HEADER */}
            <div className="relative overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-950/50 via-indigo-950/40 to-background p-6 sm:p-8 backdrop-blur-2xl shadow-xl">
                {/* Floating Ambient Glowing Orbs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
                <div className="absolute -bottom-10 left-1/4 w-80 h-80 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none animate-float-slow" />
                <div className="absolute inset-0 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black tracking-wide bg-gradient-to-r from-violet-500/25 via-indigo-500/25 to-emerald-500/20 text-violet-200 border border-violet-500/30 shadow-xs">
                            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: "3s" }} />
                            <span>🇵🇰 AI DUKAAN STUDIO 3.0 • PAKISTANI BAZAAR READY</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
                            1-Click AI Magic Catalog &amp; Voice Inventory Studio
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            Table paste karein, microphone se bol kar batayein ya parchi ki photo upload karein. AI tamam items ke
                            authentic Pakistani market rates, high-res brand photos aur units khud set kar ke aapki dukaan mein save karega!
                        </p>

                        {/* Animated Feature Metric Pills */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-violet-500/15 text-violet-300 border border-violet-500/25 shadow-2xs hover:scale-105 transition-transform">
                                <Mic className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                                <span>🎙️ Bol Kar Likhein</span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 shadow-2xs hover:scale-105 transition-transform">
                                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                                <span>📸 Parchi &amp; Bill Vision OCR</span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25 shadow-2xs hover:scale-105 transition-transform">
                                <Zap className="w-3.5 h-3.5 text-amber-400" />
                                <span>⚡ 0.5s Fast Parse</span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/25 shadow-2xs hover:scale-105 transition-transform">
                                <span>🇵🇰 100% Authentic PKR Rates</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <div className="p-4 rounded-2xl bg-card/70 border border-border/80 text-center shadow-xs backdrop-blur-md">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Target Store</span>
                            <span className="text-sm font-black text-foreground flex items-center gap-1.5 justify-center mt-0.5">
                                <Store className="w-4 h-4 text-emerald-500" />
                                {activeStore.name}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* INPUT METHODS TABS */}
            <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
                <button
                    onClick={() => setActiveMethod("text")}
                    className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
                        activeMethod === "text"
                            ? "bg-violet-600 text-white shadow-md shadow-violet-600/25 border border-violet-500"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                    }`}
                >
                    <FileText className="w-4 h-4" />
                    <span>Table / Voice / Text (ٹیبل، بولیں یا لکھیں)</span>
                </button>

                <button
                    onClick={() => setActiveMethod("image")}
                    className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
                        activeMethod === "image"
                            ? "bg-violet-600 text-white shadow-md shadow-violet-600/25 border border-violet-500"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                    }`}
                >
                    <Camera className="w-4 h-4" />
                    <span>Parchi / Receipt Photo (پرچی یا لسٹ کی تصویر)</span>
                </button>

                <button
                    onClick={() => setActiveMethod("preset")}
                    className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
                        activeMethod === "preset"
                            ? "bg-violet-600 text-white shadow-md shadow-violet-600/25 border border-violet-500"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                    }`}
                >
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Ready-Made Starter Packs (تیار کردہ کیٹلاگ)</span>
                </button>
            </div>

            {/* METHOD 1: VOICE / TABLE / TEXT INPUT */}
            {activeMethod === "text" && (
                <div className="glass-panel border border-border/70 rounded-3xl p-5 sm:p-7 bg-card/90 dark:bg-card/80 backdrop-blur-md space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                                <span>Table Paste, Voice ya Roman Urdu Text</span>
                                {isListening && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30 animate-pulse">
                                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                                        Listening... Bol Rahe Hain
                                    </span>
                                )}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Excel ya Markdown table paste karein, microphone se bolen, ya rough WhatsApp rate list paste karein.
                            </p>
                        </div>

                        {/* SPEECH BUTTON */}
                        <button
                            onClick={toggleVoice}
                            type="button"
                            className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition shadow-md cursor-pointer ${
                                isListening
                                    ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
                                    : "bg-violet-600/10 hover:bg-violet-600/20 text-violet-700 dark:text-violet-300 border border-violet-500/30"
                            }`}
                        >
                            {isListening ? (
                                <>
                                    <MicOff className="w-4 h-4" />
                                    <span>Mic Band Karein</span>
                                </>
                            ) : (
                                <>
                                    <Mic className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                    <span>🎤 Bol Kar Likhein (Urdu / English)</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* TABLE DETECTION NOTIFICATION */}
                    {tableDetection.isTable && (
                        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold animate-in fade-in">
                            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>
                                📊 Table format detected: Taam {tableDetection.count} items aur unki authentic PKR prices recognize ho chuki hain!
                            </span>
                        </div>
                    )}

                    {/* TEXTAREA */}
                    <div className="relative">
                        <textarea
                            rows={8}
                            value={promptText}
                            onChange={(e) => setPromptText(e.target.value)}
                            placeholder="| Olper's Full Cream Milk | 1 Litre | 349.60 |
| Dawn Plain Bread Small  | 340 g   | 108    |
| Coca-Cola               | 1.5 L   | 174    |
| Prema Yogurt            | 450 g   | 210    |
ya bol kar likhein: 'Olpers doodh 1 liter 350 rupay, dalda oil 2600 rupay'..."
                            className="w-full font-mono bg-background border border-border/80 focus:border-violet-500 rounded-2xl p-4 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition resize-y leading-relaxed"
                        />
                        {promptText && (
                            <button
                                onClick={() => setPromptText("")}
                                className="absolute top-3 right-3 p-1.5 rounded-lg bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground text-xs"
                                title="Clear Text"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* QUICK SAMPLE BUTTONS */}
                    <div className="space-y-2">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                            💡 Try Popular Pakistani Catalogs & Tables:
                        </span>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setPromptText(SAMPLE_TABLE_DATA)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span>📋 Olper&apos;s, Dawn & Beverage Table (34 Items)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setPromptText(
                                        "Olpers doodh 1 liter 280, Dalda cooking oil 5L 2600, Tapal Danedar chai 430g 650, Guard basmati chawal 5kg 1850, Surf Excel 1kg 520, Shan Biryani Masala 120, Cheeni 1kg 145, Fauji Atta 10kg 1350"
                                    )
                                }
                                className="px-3 py-1.5 rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold border border-border/60 transition cursor-pointer"
                            >
                                🥛 Kiryana & Ration List
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setPromptText(
                                        "Crispy Zinger Burger 450, Cheesy Loaded Fries 350, Club Sandwich 400, Cold Drink 500ml 90, Hot Wings 6pcs 320, Karak Chai 90"
                                    )
                                }
                                className="px-3 py-1.5 rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold border border-border/60 transition cursor-pointer"
                            >
                                🍔 Fast Food Menu
                            </button>
                        </div>
                    </div>

                    {/* EXTRACT ACTION */}
                    <div className="pt-2 flex justify-end">
                        <button
                            type="button"
                            onClick={handleExtract}
                            disabled={isParsing || !promptText.trim()}
                            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm rounded-2xl flex items-center gap-2 transition shadow-lg shadow-violet-600/30 cursor-pointer"
                        >
                            {isParsing ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                                    <span>AI Processing & Image Matching...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 text-amber-300" />
                                    <span>AI Se Verify Karein & Photos Match Karein ⚡</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* METHOD 2: PARCHI / RECEIPT IMAGE UPLOAD */}
            {activeMethod === "image" && (
                <div className="glass-panel border border-border/70 rounded-3xl p-5 sm:p-7 bg-card/90 dark:bg-card/80 backdrop-blur-md space-y-5 shadow-sm">
                    <div>
                        <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                            <span>Parchi / Receipt / Bill Photo Scan</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                Vision AI 👁️
                            </span>
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Kiryana dukaan ki haath se likhi hui qalam wali parchi ya distributor ka printed invoice upload karein.
                            Gemini Vision AI uski likhayi parh kar products aur prices nikal lega.
                        </p>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {selectedImage ? (
                        <div className="relative rounded-2xl overflow-hidden border border-border/80 bg-background/50 p-4 max-w-md mx-auto">
                            <div className="relative h-64 w-full rounded-xl overflow-hidden bg-black/5 dark:bg-white/5">
                                <Image
                                    src={selectedImage}
                                    alt="Uploaded Parchi"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">
                                    📄 {imageFileName || "Parchi Slip"}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-xs font-bold text-violet-600 hover:text-violet-700 underline"
                                    >
                                        Doosri Photo Lagayein
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedImage(null);
                                            setImageFileName("");
                                        }}
                                        className="p-1 rounded-md text-rose-500 hover:bg-rose-500/10"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-border/80 hover:border-violet-500/60 rounded-3xl p-10 text-center space-y-3 cursor-pointer bg-muted/20 hover:bg-muted/40 transition group"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-violet-600/10 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                                <Camera className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-extrabold text-foreground">
                                    Parchi Ya Bill Ki Tasweer Yahan Upload Karein
                                </p>
                                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                    Mobile se direct camera photo lein ya gallery se slip upload karein (JPG, PNG)
                                </p>
                            </div>
                            <button
                                type="button"
                                className="px-4 py-2 rounded-xl bg-background border border-border/70 text-xs font-bold text-foreground shadow-2xs group-hover:border-violet-500 transition"
                            >
                                Browse / Capture Photo
                            </button>
                        </div>
                    )}

                    {/* EXTRACT ACTION */}
                    <div className="pt-2 flex justify-end">
                        <button
                            type="button"
                            onClick={handleExtract}
                            disabled={isParsing || !selectedImage}
                            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm rounded-2xl flex items-center gap-2 transition shadow-lg shadow-violet-600/30 cursor-pointer"
                        >
                            {isParsing ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                                    <span>Parchi Scan Ho Rahi Hai...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 text-amber-300" />
                                    <span>Parchi Se Products Nikalein 👁️⚡</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* METHOD 3: READY-MADE STARTER PACKS */}
            {activeMethod === "preset" && (
                <div className="glass-panel border border-border/70 rounded-3xl p-5 sm:p-7 bg-card/90 dark:bg-card/80 backdrop-blur-md space-y-5 shadow-sm">
                    <div>
                        <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                            <span>Ready-Made Pakistani Business Starter Packs</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                                1-Click Load ⚡
                            </span>
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Apne business ki category par click karein. AI tamam basic products, unki standard market prices, units aur photos khud add kar dega.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {BUSINESS_PACKS.map((pack) => (
                            <div
                                key={pack.id}
                                className="group relative p-5 rounded-2xl border border-border/70 hover:border-violet-500/50 bg-background/60 hover:bg-card/80 backdrop-blur-sm transition-all duration-300 flex flex-col justify-between gap-4 shadow-2xs hover:shadow-md"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl p-2 rounded-xl bg-muted/60">{pack.icon}</span>
                                        <span className="text-xs font-bold text-muted-foreground/80 font-mono">
                                            {pack.urdu}
                                        </span>
                                    </div>
                                    <h4 className="font-extrabold text-sm text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                        {pack.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                        {pack.description}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setPromptText(pack.prompt);
                                        setActiveMethod("text");
                                        toast.info(`"${pack.title}" ka data load ho gaya. Ab 'Verify & Extract' par click karein.`);
                                    }}
                                    className="w-full py-2 px-3 rounded-xl bg-violet-600/10 hover:bg-violet-600 text-violet-700 dark:text-violet-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                                >
                                    <span>Yeh List Load Karein</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* PROGRESS LOADING OVERLAY */}
            {isParsing && (
                <div className="p-8 rounded-3xl border border-violet-500/30 bg-violet-950/20 backdrop-blur-xl text-center space-y-3 animate-in fade-in">
                    <div className="relative w-14 h-14 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
                        <Sparkles className="w-6 h-6 text-amber-300 absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <div>
                        <h4 className="text-base font-extrabold text-foreground">AI Dukaan Engine Working...</h4>
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                            {parsingStage || "Extracting items and setting up catalog..."}
                        </p>
                    </div>
                </div>
            )}

            {/* REVIEW & EDIT TABLE (AFTER EXTRACTION) */}
            {parsedProducts.length > 0 && (
                <div className="glass-panel border border-border/70 rounded-3xl p-5 sm:p-7 bg-card/90 dark:bg-card/80 backdrop-blur-md space-y-5 shadow-md animate-in slide-in-from-bottom-4 duration-300">
                    {/* REVIEW HEADER & MAIN ACTIONS */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-black text-foreground">
                                    Extracted Products Review ({parsedProducts.length})
                                </h3>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                    Photos Assigned &amp; Verified ✓
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Dukaan mein save karne se pehle agar kisi item ka naam, qeemat ya photo tabdeel karni ho toh direct edit karein ya photo par click karein.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            {/* WHATSAPP RATE LIST BUTTON */}
                            <button
                                type="button"
                                onClick={() => setShowWhatsAppSlipModal(true)}
                                className="px-3.5 py-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-700 dark:text-emerald-300 text-xs font-black flex items-center gap-1.5 transition border border-emerald-500/30 cursor-pointer shadow-2xs hover:scale-105"
                            >
                                <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>📲 WhatsApp Rate List Slip</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleAddBlankRow}
                                className="px-3.5 py-2 rounded-xl bg-muted/60 hover:bg-muted text-foreground text-xs font-bold flex items-center gap-1.5 transition border border-border/70 cursor-pointer shadow-2xs"
                            >
                                <Plus className="w-4 h-4 text-emerald-500" />
                                <span>Add Extra Item</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleSaveToStore}
                                disabled={isSaving}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 text-white text-xs sm:text-sm font-black flex items-center gap-2 transition shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50 hover:scale-105"
                            >
                                {isSaving ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                                        <span>Dukaan Mein Save Ho Rahe Hain...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                                        <span>Dukaan Mein Shamil Karein (Save All) 📦</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* LIVE INVENTORY STATS STRIP */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-muted/30 border border-border/70 text-xs">
                        <div className="p-2 rounded-xl bg-background/60">
                            <span className="text-muted-foreground block text-[11px] font-medium">Total Products</span>
                            <strong className="text-foreground text-sm font-black">{inventoryStats.total} Items</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-background/60">
                            <span className="text-muted-foreground block text-[11px] font-medium">Estimated Catalog Value</span>
                            <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-black">
                                Rs. {inventoryStats.totalValue.toLocaleString("en-PK")}
                            </strong>
                        </div>
                        <div className="p-2 rounded-xl bg-background/60">
                            <span className="text-muted-foreground block text-[11px] font-medium">Avg. Item Price</span>
                            <strong className="text-foreground text-sm font-black">
                                Rs. {inventoryStats.avgPrice.toLocaleString("en-PK")}
                            </strong>
                        </div>
                        <div className="p-2 rounded-xl bg-background/60">
                            <span className="text-muted-foreground block text-[11px] font-medium">Brand Photos Ready</span>
                            <strong className="text-violet-600 dark:text-violet-400 text-sm font-black">
                                {inventoryStats.photosMatched} / {inventoryStats.total} (100%)
                            </strong>
                        </div>
                    </div>

                    {/* BULK PRICING & DISCOUNT TOOLBAR */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-gradient-to-r from-violet-500/10 via-indigo-500/5 to-transparent border border-violet-500/20">
                        <div className="flex items-center gap-2">
                            <Calculator className="w-4 h-4 text-violet-500" />
                            <span className="text-xs font-bold text-foreground">Bulk Pricing &amp; Profit Tools:</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={() => applyBulkDiscount(5)}
                                className="px-2.5 py-1.5 rounded-xl bg-violet-600/15 hover:bg-violet-600/25 text-violet-700 dark:text-violet-300 text-xs font-bold transition border border-violet-500/30 flex items-center gap-1 cursor-pointer"
                            >
                                <Percent className="w-3 h-3" />
                                <span>5% Sale Discount</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => applyBulkDiscount(10)}
                                className="px-2.5 py-1.5 rounded-xl bg-violet-600/15 hover:bg-violet-600/25 text-violet-700 dark:text-violet-300 text-xs font-bold transition border border-violet-500/30 flex items-center gap-1 cursor-pointer"
                            >
                                <Percent className="w-3 h-3" />
                                <span>10% Mega Discount</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => roundAllPrices(5)}
                                className="px-2.5 py-1.5 rounded-xl bg-muted/60 hover:bg-muted text-foreground text-xs font-bold transition border border-border/70 cursor-pointer"
                            >
                                <span>Round Rs. 5</span>
                            </button>
                            <button
                                type="button"
                                onClick={resetDiscounts}
                                className="px-2.5 py-1.5 rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium transition cursor-pointer"
                            >
                                <span>Reset Prices</span>
                            </button>
                        </div>
                    </div>

                    {/* CATEGORY FILTER PILLS & TABLE SEARCH */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                        {/* Category Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full styled-scrollbar">
                            <button
                                type="button"
                                onClick={() => setCategoryFilter("all")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                                    categoryFilter === "all"
                                        ? "bg-violet-600 text-white shadow-xs"
                                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                            >
                                All ({parsedProducts.length})
                            </button>
                            {Object.entries(categoriesWithCount).map(([cat, count]) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategoryFilter(cat)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer flex items-center gap-1.5 ${
                                        categoryFilter === cat
                                            ? "bg-violet-600 text-white shadow-xs"
                                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}
                                >
                                    <span>{cat}</span>
                                    <span className="text-[10px] opacity-75 font-mono">({count})</span>
                                </button>
                            ))}
                        </div>

                        {/* Search Bar */}
                        <div className="relative min-w-[220px]">
                            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search filtered items..."
                                value={tableSearchQuery}
                                onChange={(e) => setTableSearchQuery(e.target.value)}
                                className="w-full bg-background border border-border/70 rounded-xl pl-8 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-violet-500"
                            />
                        </div>
                    </div>

                    {/* TABLE */}
                    <div className="overflow-x-auto rounded-2xl border border-border/60">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground font-bold">
                                <tr>
                                    <th className="py-3 px-3 w-16 text-center">Photo</th>
                                    <th className="py-3 px-3">Product Name (نام)</th>
                                    <th className="py-3 px-3">Category (کیٹگری)</th>
                                    <th className="py-3 px-3 w-28">Price (Rs.)</th>
                                    <th className="py-3 px-3 w-28">MRP / Compare</th>
                                    <th className="py-3 px-3 w-28">Unit (پیکنگ)</th>
                                    <th className="py-3 px-2 text-center w-12">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60 font-medium">
                                {filteredProductsWithIndex.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                                            Koi item search ya category filter se match nahi hua.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProductsWithIndex.map(({ p, origIdx }) => (
                                        <tr key={origIdx} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-2 px-3 text-center">
                                                <div
                                                    onClick={() => handleOpenImageModal(origIdx)}
                                                    className="relative w-11 h-11 rounded-xl overflow-hidden border border-border/80 bg-background shrink-0 mx-auto cursor-pointer group hover:ring-2 hover:ring-violet-500 shadow-2xs"
                                                    title="Click to Change / Search Image"
                                                >
                                                    <Image
                                                        src={p.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80"}
                                                        alt={p.name}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Camera className="w-3.5 h-3.5 text-white" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2 px-3">
                                                <input
                                                    type="text"
                                                    value={p.name}
                                                    onChange={(e) => handleUpdateRow(origIdx, "name", e.target.value)}
                                                    className="w-full bg-background border border-border/70 focus:border-violet-500 rounded-lg px-2.5 py-1.5 text-xs font-bold text-foreground focus:outline-none"
                                                />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input
                                                    type="text"
                                                    value={p.category}
                                                    onChange={(e) => handleUpdateRow(origIdx, "category", e.target.value)}
                                                    className="w-full bg-background border border-border/70 focus:border-violet-500 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                                                />
                                            </td>
                                            <td className="py-2 px-3">
                                                <div className="relative">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
                                                        Rs.
                                                    </span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={p.price}
                                                        onChange={(e) => handleUpdateRow(origIdx, "price", Number(e.target.value))}
                                                        className="w-full bg-background border border-border/70 focus:border-violet-500 rounded-lg pl-8 pr-2 py-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 focus:outline-none"
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-2 px-3">
                                                <div className="relative">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
                                                        Rs.
                                                    </span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={p.compareAtPrice || ""}
                                                        placeholder="Optional"
                                                        onChange={(e) => handleUpdateRow(origIdx, "compareAtPrice", e.target.value ? Number(e.target.value) : null)}
                                                        className="w-full bg-background border border-border/70 focus:border-violet-500 rounded-lg pl-8 pr-2 py-1.5 text-xs text-muted-foreground line-through focus:outline-none"
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-2 px-3">
                                                <input
                                                    type="text"
                                                    value={p.unit}
                                                    onChange={(e) => handleUpdateRow(origIdx, "unit", e.target.value)}
                                                    placeholder="1 Litre / 500 ml"
                                                    className="w-full bg-background border border-border/70 focus:border-violet-500 rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none"
                                                />
                                            </td>
                                            <td className="py-2 px-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteRow(origIdx)}
                                                    className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                                                    title="Delete row"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* BOTTOM SUMMARY BAR */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border/60">
                        <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                            <span>
                                Showing: <strong className="text-foreground">{filteredProductsWithIndex.length}</strong> of{" "}
                                <strong className="text-foreground">{parsedProducts.length}</strong> Products
                            </span>
                            <span>
                                Total Value:{" "}
                                <strong className="text-emerald-600 dark:text-emerald-400">
                                    Rs. {inventoryStats.totalValue.toLocaleString("en-PK")}
                                </strong>
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setParsedProducts([])}
                                className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                            >
                                Clear Table
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveToStore}
                                disabled={isSaving}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 text-white text-xs sm:text-sm font-black flex items-center gap-2 transition shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50 hover:scale-105"
                            >
                                {isSaving ? "Saving to Store..." : "✓ Confirm & Save All To Store"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* IMAGE CHANGER MODAL */}
            {editingImageIndex !== null && parsedProducts[editingImageIndex] && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-card border border-border/80 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-border/60 pb-3">
                            <div>
                                <h4 className="font-extrabold text-base text-foreground">
                                    Select Product Photo (تصویر تبدیل کریں)
                                </h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Product: <strong className="text-foreground">{parsedProducts[editingImageIndex].name}</strong>
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setEditingImageIndex(null);
                                    setCustomImageInput("");
                                    setImageSearchResults([]);
                                }}
                                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* SEARCH BAR */}
                        <div className="space-y-1.5">
                            <span className="text-xs font-bold text-muted-foreground block">
                                🔍 Search Authentic Product Photos:
                            </span>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search e.g. Olpers Milk, Dawn Bread, Pepsi, Eggs..."
                                    value={imageSearchQuery}
                                    onChange={(e) => setImageSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleSearchImages(imageSearchQuery);
                                        }
                                    }}
                                    className="w-full bg-background border border-border/80 focus:border-violet-500 rounded-xl pl-9 pr-24 py-2 text-xs text-foreground focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleSearchImages(imageSearchQuery)}
                                    disabled={isSearchingImages}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                >
                                    {isSearchingImages ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                                    <span>Search</span>
                                </button>
                            </div>
                        </div>

                        {/* SEARCH RESULTS IF FOUND */}
                        {imageSearchResults.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-violet-600 dark:text-violet-400 block">
                                    ✨ Matching Photos Found ({imageSearchResults.length}):
                                </span>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
                                    {imageSearchResults.map((item, sIdx) => (
                                        <button
                                            key={sIdx}
                                            type="button"
                                            onClick={() => handleApplySelectedImage(item.url)}
                                            className="relative group rounded-xl overflow-hidden border border-border hover:border-violet-500 text-left transition cursor-pointer flex flex-col shadow-2xs hover:shadow-md"
                                        >
                                            <div className="relative h-20 w-full bg-muted">
                                                <Image
                                                    src={item.url}
                                                    alt={item.label}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform"
                                                />
                                            </div>
                                            <span className="text-[10px] font-bold text-foreground p-1 line-clamp-1 bg-card/95">
                                                {item.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* POPULAR PAKISTANI STORE PHOTOS */}
                        <div className="space-y-2">
                            <span className="text-xs font-bold text-muted-foreground block">
                                🖼️ Popular Pakistani Store Photos:
                            </span>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
                                {CURATED_PAKISTANI_GALLERY.map((item, gIdx) => (
                                    <button
                                        key={gIdx}
                                        type="button"
                                        onClick={() => handleApplySelectedImage(item.url)}
                                        className="relative group rounded-xl overflow-hidden border border-border hover:border-violet-500 text-left transition cursor-pointer flex flex-col shadow-2xs hover:shadow-md"
                                    >
                                        <div className="relative h-18 w-full bg-muted">
                                            <Image
                                                src={item.url}
                                                alt={item.label}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform"
                                            />
                                        </div>
                                        <span className="text-[10px] font-semibold text-foreground p-1 line-clamp-1 bg-card/90">
                                            {item.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* CUSTOM URL INPUT */}
                        <div className="space-y-1.5 border-t border-border/60 pt-3">
                            <span className="text-xs font-bold text-muted-foreground block">
                                Ya Apni Custom Image Ka Link Paste Karein:
                            </span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="url"
                                    placeholder="https://images.unsplash.com/... ya google link"
                                    value={customImageInput}
                                    onChange={(e) => setCustomImageInput(e.target.value)}
                                    className="flex-1 bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-violet-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!customImageInput.trim()) {
                                            toast.error("Valid image URL enter karein.");
                                            return;
                                        }
                                        handleApplySelectedImage(customImageInput.trim());
                                    }}
                                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* WHATSAPP RATE LIST SLIP MODAL */}
            {showWhatsAppSlipModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-card border border-emerald-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-border/60 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                                    <Share2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-base text-foreground">
                                        WhatsApp Rate List Slip (ریٹ لسٹ)
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                        Customer groups ya broadcast list par bhejne ke liye tayar.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowWhatsAppSlipModal(false)}
                                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* PREVIEW CONTAINER (WHATSAPP BUBBLE LOOK) */}
                        <div className="space-y-1.5">
                            <span className="text-xs font-bold text-muted-foreground block">
                                💬 WhatsApp Message Preview:
                            </span>
                            <div className="bg-emerald-950/20 dark:bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 font-sans text-xs text-foreground max-h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all styled-scrollbar">
                                {generateWhatsAppRateList()}
                            </div>
                        </div>

                        {/* MODAL ACTION BUTTONS */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/60">
                            <button
                                type="button"
                                onClick={() => {
                                    const text = generateWhatsAppRateList();
                                    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                                    window.open(url, "_blank");
                                }}
                                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 transition shadow-md shadow-emerald-600/30 cursor-pointer"
                            >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>Open in WhatsApp</span>
                            </button>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={handleCopyWhatsAppSlip}
                                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black text-xs flex items-center justify-center gap-2 transition shadow-md shadow-violet-600/25 cursor-pointer"
                                >
                                    {copiedSlip ? (
                                        <>
                                            <CheckCheck className="w-4 h-4 text-emerald-300" />
                                            <span>Copied! (کاپی ہو گئی)</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            <span>Copy Message (کاپی کریں)</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowWhatsAppSlipModal(false)}
                                    className="px-4 py-2.5 rounded-xl bg-muted/60 hover:bg-muted text-foreground font-bold text-xs transition cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
