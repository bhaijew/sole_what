"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Package,
    Sparkles,
    UploadCloud,
    Link as LinkIcon,
    DollarSign,
    Tag,
    Check,
    Store,
    Layers,
    Image as ImageIcon,
    Plus,
    X,
    Eye,
    CheckCircle2,
    AlertCircle,
    Info,
    ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { PRESET_CATALOG_PRODUCTS, PresetProductItem } from "@/lib/catalog-presets";

interface StoreItem {
    id: string;
    name: string;
    slug: string;
    currency?: string;
    customDomain?: string | null;
}

const COMMON_CATEGORIES = [
    { label: "Dairy & Bakery", icon: "🥛" },
    { label: "Ration & Kiryana", icon: "🍚" },
    { label: "Spices & Masalay", icon: "🌶️" },
    { label: "Cold Drinks & Sharbat", icon: "🥤" },
    { label: "Snacks & Munchies", icon: "🍿" },
    { label: "Fruits & Sabziyan", icon: "🍎" },
    { label: "Meat & Chicken", icon: "🍗" },
    { label: "Safai & Household", icon: "🧼" },
    { label: "Personal Care", icon: "🧴" }
];

const COMMON_UNITS = [
    "1 Litre",
    "1 kg",
    "500g",
    "250g",
    "Pouch",
    "Packet",
    "Bottle",
    "Piece",
    "1 Dozen",
    "Box"
];

function AddProductForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Store state
    const [stores, setStores] = useState<StoreItem[]>([]);
    const [selectedStoreId, setSelectedStoreId] = useState<string>("");
    const [isLoadingStores, setIsLoadingStores] = useState<boolean>(true);

    // Product fields
    const [name, setName] = useState<string>("");
    const [category, setCategory] = useState<string>("Dairy & Bakery");
    const [customCategory, setCustomCategory] = useState<string>("");
    const [price, setPrice] = useState<string>("");
    const [compareAtPrice, setCompareAtPrice] = useState<string>("");
    const [unit, setUnit] = useState<string>("1 Litre");
    const [customUnit, setCustomUnit] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [imageUrl, setImageUrl] = useState<string>("");
    const [inStock, setInStock] = useState<boolean>(true);

    // UI state
    const [imageTab, setImageTab] = useState<"upload" | "url" | "presets">("upload");
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [saveType, setSaveType] = useState<"save" | "saveAndNew">("save");
    const [isDragging, setIsDragging] = useState<boolean>(false);

    // Fetch user stores
    useEffect(() => {
        const fetchStores = async () => {
            setIsLoadingStores(true);
            try {
                const res = await fetch("/api/stores");
                const data = await res.json();
                if (res.ok && data.stores && data.stores.length > 0) {
                    setStores(data.stores);
                    const paramStoreId = searchParams.get("storeId");
                    if (paramStoreId && data.stores.some((s: StoreItem) => s.id === paramStoreId)) {
                        setSelectedStoreId(paramStoreId);
                    } else {
                        setSelectedStoreId(data.stores[0].id);
                    }
                }
            } catch (e) {
                console.error("Error fetching stores:", e);
                toast.error("Dukaan load karne mein masla aya");
            } finally {
                setIsLoadingStores(false);
            }
        };
        fetchStores();
    }, [searchParams]);

    const activeStore = stores.find(s => s.id === selectedStoreId);

    // Discount percentage calculation
    const numPrice = Number(price) || 0;
    const numCompare = Number(compareAtPrice) || 0;
    const discountPercent = numCompare > numPrice && numCompare > 0
        ? Math.round(((numCompare - numPrice) / numCompare) * 100)
        : 0;

    // Apply preset template
    const handleApplyPreset = (preset: PresetProductItem) => {
        setName(preset.name);
        setPrice(preset.price.toString());
        setCompareAtPrice(preset.compareAtPrice ? preset.compareAtPrice.toString() : "");
        setUnit(preset.unit);
        setDescription(preset.description || "");
        setImageUrl(preset.image);
        setCategory(preset.category || "Dairy & Bakery");
        toast.info(`"${preset.name}" ka data auto-fill ho gaya! ✨`);
    };

    // Handle Direct Image File Upload via /api/upload
    const handleUploadFile = async (file: File) => {
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Sirf image files (JPG, PNG, WEBP) upload ki ja sakti hain");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error("Image ka size 10MB se chota hona chahiye");
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            if (!res.ok || !data.status) {
                throw new Error(data.message || "Upload fail ho gaya");
            }

            const finalUrl = data.data?.fullUrl || data.data?.url || "";
            setImageUrl(finalUrl);
            toast.success("Tasveer upload ho gayi! 📸");
        } catch (err: any) {
            console.error("Upload error:", err);
            toast.error(err.message || "Tasveer upload nahi ho saki");
        } finally {
            setIsUploading(false);
        }
    };

    // Submit product
    const handleSubmit = async (andNew: boolean) => {
        if (!selectedStoreId) {
            toast.error("Pehle dukaan select karein");
            return;
        }

        if (!name.trim()) {
            toast.error("Product ka naam likhna lazmi hai");
            return;
        }

        if (!price || isNaN(Number(price)) || Number(price) <= 0) {
            toast.error("Sahi qeemat (Price) darj karein");
            return;
        }

        setIsSaving(true);
        setSaveType(andNew ? "saveAndNew" : "save");

        const finalUnit = customUnit.trim() ? customUnit.trim() : unit;
        const finalCategory = customCategory.trim() ? customCategory.trim() : category;

        try {
            const res = await fetch(`/api/stores/${selectedStoreId}/products`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    price: Number(price),
                    compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
                    unit: finalUnit || "item",
                    description: description.trim() || null,
                    image: imageUrl.trim() || null,
                    inStock: inStock
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create product");

            toast.success(`"${name}" dukaan par kamiyabi se add ho gaya! 🎉`);

            if (andNew) {
                // Clear form for next product
                setName("");
                setPrice("");
                setCompareAtPrice("");
                setDescription("");
                setImageUrl("");
                setCustomUnit("");
                setCustomCategory("");
                setInStock(true);
                // Keep store and unit ready
                window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
                router.push(`/dashboard/store?tab=products&storeId=${selectedStoreId}`);
            }
        } catch (err: any) {
            console.error("Submit error:", err);
            toast.error(err.message || "Product save nahi ho saka");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoadingStores) {
        return (
            <div className="max-w-6xl mx-auto py-12 px-4 space-y-6 animate-pulse">
                <div className="h-10 bg-slate-200 rounded-xl w-48" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-96 bg-slate-200 rounded-3xl" />
                    <div className="h-96 bg-slate-200 rounded-3xl" />
                </div>
            </div>
        );
    }

    if (stores.length === 0) {
        return (
            <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
                <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <Store className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Koi Dukaan Nahi Mili</h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Product add karne se pehle aapko apni dukaan create karni hogi.
                </p>
                <Link
                    href="/dashboard/store"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                    <Plus className="w-4 h-4" />
                    <span>Dukaan Banayein</span>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-4 sm:py-6 px-3 sm:px-6 space-y-6 pb-20">
            {/* TOP NAVIGATION & HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-3">
                    <Link
                        href={`/dashboard/store?tab=products${selectedStoreId ? `&storeId=${selectedStoreId}` : ""}`}
                        className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center justify-center cursor-pointer shadow-2xs group"
                        title="Wapis Dukaan Dashboard"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wide border border-emerald-200">
                                Product Manager
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs text-slate-500 font-medium">Standalone Page</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <span>Naya Product Shamil Karein</span>
                            <Sparkles className="w-5 h-5 text-emerald-600" />
                        </h1>
                    </div>
                </div>

                {/* Store Selector & Live Link */}
                <div className="flex items-center gap-2.5">
                    <div className="relative">
                        <select
                            value={selectedStoreId}
                            onChange={(e) => setSelectedStoreId(e.target.value)}
                            className="bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-900 font-bold text-xs rounded-xl pl-3 pr-8 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer shadow-2xs"
                        >
                            {stores.map(s => (
                                <option key={s.id} value={s.id}>
                                    🏪 {s.name}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500">
                            ▼
                        </div>
                    </div>

                    {activeStore && (
                        <a
                            href={`/s/${activeStore.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-xs font-semibold border border-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Live Storefront Dekhein"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Storefront</span>
                        </a>
                    )}
                </div>
            </div>

            {/* 1-CLICK PAKISTANI ESSENTIAL PRODUCTS CAROUSEL */}
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-4 sm:p-5 text-white shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-sm text-white">
                                Foran Auto-Fill Karein (Popular Pakistani Items)
                            </h3>
                            <p className="text-[11px] text-slate-300">
                                Kisi bhi item par click karein taake naam, qeemat aur real image khud-ba-khud fill ho jaye:
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
                    {PRESET_CATALOG_PRODUCTS.map((preset, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => handleApplyPreset(preset)}
                            className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 hover:border-emerald-400/80 px-3 py-2 rounded-2xl shrink-0 text-left transition duration-150 cursor-pointer backdrop-blur-xs group shadow-sm"
                        >
                            <img
                                src={preset.image}
                                alt={preset.name}
                                className="w-9 h-9 rounded-xl object-cover border border-white/20 group-hover:scale-105 transition"
                            />
                            <div>
                                <p className="text-xs font-bold text-white group-hover:text-emerald-300 truncate max-w-[130px]">
                                    {preset.name}
                                </p>
                                <p className="text-[10px] text-emerald-300 font-semibold">
                                    Rs. {preset.price} <span className="text-slate-400 line-through text-[9px]">{preset.compareAtPrice ? `Rs. ${preset.compareAtPrice}` : ""}</span>
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* MAIN 2-COLUMN LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* LEFT 2-COLUMNS: PRODUCT FORM */}
                <div className="lg:col-span-2 space-y-5">
                    {/* SECTION 1: BASIC INFORMATION */}
                    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                                <Package className="w-5 h-5 text-emerald-600" />
                                <span>Bunyadi Maloomat (Basic Info)</span>
                            </h2>
                            <span className="text-[11px] font-semibold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                * Zaroori
                            </span>
                        </div>

                        {/* Product Title */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                Product Ka Naam <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Olper's Full Cream Milk 1 Litre, Shan Bombay Biryani, Dalda Ghee..."
                                className="w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition"
                            />
                        </div>

                        {/* Category Selection */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700">
                                Category (Dukaan Ka Section)
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {COMMON_CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.label}
                                        type="button"
                                        onClick={() => {
                                            setCategory(cat.label);
                                            setCustomCategory("");
                                        }}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                                            category === cat.label && !customCategory
                                                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                        }`}
                                    >
                                        <span>{cat.icon}</span>
                                        <span>{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                            <input
                                type="text"
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                                placeholder="Ya apni nayi category likhein (e.g. Dry Fruits, Frozen Foods)..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                Product Ki Tafseel / Description (Optional)
                            </label>
                            <textarea
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Product ke bare mein thori tafseel, brand ka naam, ya expiry waghaira likhein..."
                                className="w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-2xl p-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition resize-none"
                            />
                        </div>
                    </div>

                    {/* SECTION 2: PRICING & DISCOUNTS */}
                    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-emerald-600" />
                                <span>Qeemat & Bachat (Pricing & Offers)</span>
                            </h2>
                            {discountPercent > 0 && (
                                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full animate-pulse border border-emerald-300">
                                    🔥 {discountPercent}% Bachat (Discount)
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Farokht Qeemat (Sale Price in PKR) <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                        Rs.
                                    </span>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="any"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="295"
                                        className="w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1">Customer ko ye qeemat charge hogi.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Asal Qeemat / MRP (Compare At Price)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                        Rs.
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={compareAtPrice}
                                        onChange={(e) => setCompareAtPrice(e.target.value)}
                                        placeholder="320"
                                        className="w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Storefront par line lagi hui kate gi (Strikethrough).
                                </p>
                            </div>
                        </div>

                        {numCompare > numPrice && numPrice > 0 && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between text-xs text-emerald-800">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>
                                        Customer ko har item par <strong>Rs. {numCompare - numPrice}</strong> ki bachat show hogi!
                                    </span>
                                </div>
                                <span className="font-extrabold text-emerald-700 bg-white px-2.5 py-1 rounded-xl shadow-2xs">
                                    {discountPercent}% OFF
                                </span>
                            </div>
                        )}
                    </div>

                    {/* SECTION 3: IMAGE / MEDIA UPLOAD */}
                    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-indigo-600" />
                                <span>Product Ki Tasveer (Photo)</span>
                            </h2>
                            {imageUrl && (
                                <button
                                    type="button"
                                    onClick={() => setImageUrl("")}
                                    className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Tasveer Hatayein</span>
                                </button>
                            )}
                        </div>

                        {/* Tabs for Image Input */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                            <button
                                type="button"
                                onClick={() => setImageTab("upload")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                    imageTab === "upload" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <UploadCloud className="w-3.5 h-3.5" />
                                <span>Device Se Upload</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setImageTab("url")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                    imageTab === "url" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <LinkIcon className="w-3.5 h-3.5" />
                                <span>Image Link / URL</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setImageTab("presets")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                    imageTab === "presets" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Presets Gallery</span>
                            </button>
                        </div>

                        {/* TAB 1: FILE UPLOAD */}
                        {imageTab === "upload" && (
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                        handleUploadFile(e.dataTransfer.files[0]);
                                    }
                                }}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 ${
                                    isDragging
                                        ? "border-emerald-500 bg-emerald-50/50"
                                        : "border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-slate-50"
                                }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            handleUploadFile(e.target.files[0]);
                                        }
                                    }}
                                />
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                                    {isUploading ? (
                                        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <UploadCloud className="w-6 h-6" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">
                                        {isUploading ? "Tasveer Upload Ho Rahi Hai..." : "Mobile / Computer Se Tasveer Chunein"}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Drag & drop karein ya click karke camera / gallery se select karein (Max 10MB)
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: IMAGE URL */}
                        {imageTab === "url" && (
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-700">
                                    Direct Web Image URL Paste Karein
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        placeholder="https://images.unsplash.com/... ya google image link"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                    />
                                    {imageUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setImageUrl("")}
                                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-bold transition cursor-pointer"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB 3: PRESETS GALLERY */}
                        {imageTab === "presets" && (
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-slate-600">
                                    Neeche diye gaye Pakistani items mein se kisi tasveer par click karein:
                                </p>
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-2xl styled-scrollbar">
                                    {PRESET_CATALOG_PRODUCTS.map((p, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => {
                                                setImageUrl(p.image);
                                                toast.info(`"${p.name}" ki tasveer lag gayi! 📸`);
                                            }}
                                            className={`relative group rounded-xl overflow-hidden aspect-square border-2 transition cursor-pointer ${
                                                imageUrl === p.image ? "border-emerald-600 ring-2 ring-emerald-500/30" : "border-slate-200 hover:border-slate-400"
                                            }`}
                                        >
                                            <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-200" />
                                            {imageUrl === p.image && (
                                                <div className="absolute inset-0 bg-emerald-600/30 flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white drop-shadow" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Thumbnail Preview If Image Exists */}
                        {imageUrl && (
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                                <img
                                    src={imageUrl}
                                    alt="Product Preview"
                                    className="w-14 h-14 rounded-xl object-cover border border-slate-300 shadow-2xs"
                                    onError={() => toast.error("Image link sahi nahi hai ya load nahi ho saka")}
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-800">Tasveer Successfully Attached</p>
                                    <p className="text-[11px] text-slate-500 truncate">{imageUrl}</p>
                                </div>
                                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                                    Ready
                                </span>
                            </div>
                        )}
                    </div>

                    {/* SECTION 4: PACKING & STOCK AVAILABILITY */}
                    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                                <Layers className="w-5 h-5 text-amber-600" />
                                <span>Packing & Stock Status</span>
                            </h2>
                        </div>

                        {/* Packing Unit Selection */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700">
                                Packing / Unit (Measurement)
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {COMMON_UNITS.map((u) => (
                                    <button
                                        key={u}
                                        type="button"
                                        onClick={() => {
                                            setUnit(u);
                                            setCustomUnit("");
                                        }}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                            unit === u && !customUnit
                                                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                        }`}
                                    >
                                        {u}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="text"
                                value={customUnit}
                                onChange={(e) => setCustomUnit(e.target.value)}
                                placeholder="Ya custom packing likhein (e.g. 2.5 kg Tub, 330ml Can, 1 Box 24 Pcs)..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            />
                        </div>

                        {/* Stock Availability Toggle */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                            <div>
                                <p className="text-xs font-bold text-slate-900">Stock Availability</p>
                                <p className="text-[11px] text-slate-500">
                                    {inStock
                                        ? "🟢 In Stock: Customer dukaan se order kar sakta hai."
                                        : "🔴 Out of Stock: Saman khatam ho chuka hai, order band rahega."}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setInStock(!inStock)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                                    inStock
                                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                        : "bg-rose-600 text-white hover:bg-rose-700"
                                }`}
                            >
                                {inStock ? "In Stock 🟢" : "Out of Stock 🔴"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT 1-COLUMN: REAL-TIME STOREFRONT PREVIEW & ACTIONS (STICKY) */}
                <div className="space-y-5 lg:sticky lg:top-4">
                    {/* STOREFRONT LIVE CARD PREVIEW */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-md space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                            <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                                <Eye className="w-4 h-4 text-emerald-600" />
                                <span>Customer Ko Kaisa Dikhega:</span>
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                Live Preview
                            </span>
                        </div>

                        {/* Simulated Mobile Product Card */}
                        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-3 shadow-inner">
                            <div className="relative bg-white rounded-xl overflow-hidden aspect-square border border-slate-200/80 flex items-center justify-center">
                                {imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt={name || "Product"}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-slate-300 space-y-1">
                                        <Package className="w-12 h-12 stroke-1" />
                                        <span className="text-[10px] text-slate-400 font-medium">Tasveer Nahi Hai</span>
                                    </div>
                                )}

                                {/* Discount Badge */}
                                {discountPercent > 0 && (
                                    <span className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-md uppercase">
                                        -{discountPercent}% OFF
                                    </span>
                                )}

                                {/* Stock Badge */}
                                {!inStock && (
                                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center">
                                        <span className="bg-rose-600 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                            Out of Stock
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Card Content */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                                    <span>{customCategory.trim() || category}</span>
                                    <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                                        {customUnit.trim() || unit}
                                    </span>
                                </div>
                                <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                                    {name.trim() || "Product Ka Naam Yahan Aayega"}
                                </h4>
                                {description && (
                                    <p className="text-[11px] text-slate-500 line-clamp-1">
                                        {description}
                                    </p>
                                )}

                                <div className="flex items-baseline gap-2 pt-1">
                                    <span className="text-base font-black text-emerald-700">
                                        Rs. {numPrice > 0 ? numPrice.toLocaleString() : "0"}
                                    </span>
                                    {numCompare > numPrice && (
                                        <span className="text-xs text-slate-400 line-through">
                                            Rs. {numCompare.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Simulated Add Button */}
                            <button
                                type="button"
                                disabled
                                className="w-full py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm opacity-90 cursor-not-allowed"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Cart Mein Shamil Karein</span>
                            </button>
                        </div>

                        <p className="text-[11px] text-slate-400 text-center leading-tight">
                            Yeh card aapke WhatsApp online store per customer ko isi tarah nazar aayega.
                        </p>
                    </div>

                    {/* SAVE & ACTION BUTTONS */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-md space-y-3">
                        <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleSubmit(false)}
                            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-sm rounded-2xl transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                        >
                            {isSaving && saveType === "save" ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Product Save Ho Raha Hai...</span>
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    <span>Product Dukaan Par Save Karein</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleSubmit(true)}
                            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                        >
                            {isSaving && saveType === "saveAndNew" ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
                                    <span>Save Ho Raha Hai...</span>
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 text-emerald-600" />
                                    <span>Save & Agla Product Add Karein</span>
                                </>
                            )}
                        </button>

                        <Link
                            href={`/dashboard/store?tab=products${selectedStoreId ? `&storeId=${selectedStoreId}` : ""}`}
                            className="block w-full py-2.5 text-center text-slate-500 hover:text-slate-800 font-bold text-xs transition cursor-pointer"
                        >
                            Cancel / Wapis Jayein
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function NewProductPage() {
    return (
        <Suspense
            fallback={
                <div className="max-w-6xl mx-auto py-12 px-4 text-center">
                    <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-500 mt-3 font-semibold">Loading Add Product Page...</p>
                </div>
            }
        >
            <AddProductForm />
        </Suspense>
    );
}
