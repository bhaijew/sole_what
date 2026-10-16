"use client";

import { useState, useRef, useEffect } from "react";
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
    Zap
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

    // Initialize Web Speech API for Pakistani Urdu/English
    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition =
                (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = "ur-PK"; // Pakistani Urdu + Roman Urdu support

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
                toast.success("Mic active hai! Ab bolna shuru karein (e.g. 'Olpers doodh do sau assi rupay, dalda oil...')...");
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
            // Stage animations for a delightful experience
            const timer1 = setTimeout(() => setParsingStage("Parchi aur prices ko samjha ja raha hai..."), 1200);
            const timer2 = setTimeout(() => setParsingStage("Categories aur photos auto-assign ho rahi hain..."), 2600);

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
                category: "General",
                price: 100,
                compareAtPrice: 120,
                unit: "item",
                image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80",
                inStock: true
            }
        ]);
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

            // Clean state & invoke complete
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
            <div className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 via-indigo-950/30 to-background p-6 sm:p-8 backdrop-blur-xl shadow-lg">
                <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 left-1/3 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black tracking-wide bg-gradient-to-r from-violet-500/20 to-indigo-500/20 text-violet-300 border border-violet-500/30 shadow-xs">
                            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: "3s" }} />
                            <span>AI DUKAAN KAREEM ⚡ SPECIAL FOR PAKISTANI SHOPS</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                            1-Click AI Magic Product Adder
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Ab dukaan dar ko aik aik cheez manually add karne ki zaroorat nahi. Bol kar batayein,
                            parchi ya bill ki tasweer upload karein, ya 1-click pakistani category chun kar apni poori dukaan foran tayyar karein!
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <div className="p-4 rounded-2xl bg-card/60 border border-border/80 text-center shadow-xs">
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
                    <Mic className="w-4 h-4" />
                    <span>Bol Kar Ya Roman Urdu Mein Likhein (بولیں یا لکھیں)</span>
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
                    <span>Parchi / Receipt Ki Photo (پرچی یا لسٹ کی تصویر)</span>
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

            {/* METHOD 1: VOICE / TEXT INPUT */}
            {activeMethod === "text" && (
                <div className="glass-panel border border-border/70 rounded-3xl p-5 sm:p-7 bg-card/90 dark:bg-card/80 backdrop-blur-md space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                                <span>Voice & Roman Urdu Text Input</span>
                                {isListening && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30 animate-pulse">
                                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                                        Listening... Bol Rahe Hain
                                    </span>
                                )}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Microphone daba kar bolte jayein ya neeche rough text/WhatsApp message paste karein. AI khud name, qeemat aur units alag kar lega.
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

                    {/* TEXTAREA */}
                    <div className="relative">
                        <textarea
                            rows={6}
                            value={promptText}
                            onChange={(e) => setPromptText(e.target.value)}
                            placeholder="Misaal: Olpers doodh 1L 280, Dalda oil 5L 2600, Tapal chai 430g 650, Guard chawal 5kg 1800, Surf Excel 1kg 520, Shan Biryani Masala 120, Cheeni 1kg 145..."
                            className="w-full bg-background border border-border/80 focus:border-violet-500 rounded-2xl p-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition resize-y leading-relaxed"
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

                    {/* QUICK SAMPLES */}
                    <div className="space-y-2">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                            💡 Try Quick Sample Formats:
                        </span>
                        <div className="flex flex-wrap gap-2">
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
                            <button
                                type="button"
                                onClick={() =>
                                    setPromptText(
                                        "Fast Charger 20W 850, Type-C Cable 65W 400, Handsfree Bass 350, 10000mAh Powerbank 2800, Tempered Glass 250"
                                    )
                                }
                                className="px-3 py-1.5 rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold border border-border/60 transition cursor-pointer"
                            >
                                📱 Mobile Accessories
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
                                    <span>AI Processing Kar Raha Hai...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 text-amber-300" />
                                    <span>AI Se Products Extract Karein ⚡</span>
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
                                        toast.info(`"${pack.title}" ka data load ho gaya. Ab 'Extract' par click karein.`);
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-black text-foreground">
                                    Extracted Products Review ({parsedProducts.length})
                                </h3>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                    Ready To Save
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Dukaan mein save karne se pehle agar kisi item ka naam ya qeemat tabdeel karni ho toh yahan direct edit kar sakte hain.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
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
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 text-white text-xs sm:text-sm font-black flex items-center gap-2 transition shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
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

                    {/* TABLE */}
                    <div className="overflow-x-auto rounded-2xl border border-border/60">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground font-bold">
                                <tr>
                                    <th className="py-3 px-3 w-16">Image</th>
                                    <th className="py-3 px-3">Product Name (نام)</th>
                                    <th className="py-3 px-3">Category (کیٹگری)</th>
                                    <th className="py-3 px-3 w-28">Price (Rs.)</th>
                                    <th className="py-3 px-3 w-28">MRP / Compare</th>
                                    <th className="py-3 px-3 w-24">Unit (پیکنگ)</th>
                                    <th className="py-3 px-2 text-center w-12">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60 font-medium">
                                {parsedProducts.map((p, idx) => (
                                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-2 px-3">
                                            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-border/80 bg-background shrink-0">
                                                <Image
                                                    src={p.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80"}
                                                    alt={p.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        </td>
                                        <td className="py-2 px-3">
                                            <input
                                                type="text"
                                                value={p.name}
                                                onChange={(e) => handleUpdateRow(idx, "name", e.target.value)}
                                                className="w-full bg-background border border-border/70 focus:border-violet-500 rounded-lg px-2.5 py-1.5 text-xs font-bold text-foreground focus:outline-none"
                                            />
                                        </td>
                                        <td className="py-2 px-3">
                                            <input
                                                type="text"
                                                value={p.category}
                                                onChange={(e) => handleUpdateRow(idx, "category", e.target.value)}
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
                                                    value={p.price}
                                                    onChange={(e) => handleUpdateRow(idx, "price", Number(e.target.value))}
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
                                                    value={p.compareAtPrice || ""}
                                                    placeholder="Optional"
                                                    onChange={(e) => handleUpdateRow(idx, "compareAtPrice", e.target.value ? Number(e.target.value) : null)}
                                                    className="w-full bg-background border border-border/70 focus:border-violet-500 rounded-lg pl-8 pr-2 py-1.5 text-xs text-muted-foreground line-through focus:outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="py-2 px-3">
                                            <input
                                                type="text"
                                                value={p.unit}
                                                onChange={(e) => handleUpdateRow(idx, "unit", e.target.value)}
                                                placeholder="item / kg / L"
                                                className="w-full bg-background border border-border/70 focus:border-violet-500 rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none"
                                            />
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteRow(idx)}
                                                className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                                                title="Delete row"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* BOTTOM SUMMARY BAR */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border/60">
                        <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                            <span>
                                Total Extracted Items: <strong className="text-foreground">{parsedProducts.length}</strong>
                            </span>
                            <span>
                                Estimated Catalog Value:{" "}
                                <strong className="text-emerald-600 dark:text-emerald-400">
                                    Rs. {parsedProducts.reduce((sum, p) => sum + (p.price || 0), 0).toLocaleString("en-PK")}
                                </strong>
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setParsedProducts([])}
                                className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition"
                            >
                                Clear Table
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveToStore}
                                disabled={isSaving}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 text-white text-xs sm:text-sm font-black flex items-center gap-2 transition shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
                            >
                                {isSaving ? "Saving to Store..." : "✓ Confirm & Save All To Store"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
