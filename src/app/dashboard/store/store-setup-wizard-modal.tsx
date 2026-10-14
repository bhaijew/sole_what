"use client";

import { useState, useEffect } from "react";
import {
    Store,
    ShoppingBag,
    Truck,
    Clock,
    Phone,
    MapPin,
    Sparkles,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    X,
    ExternalLink,
    Copy,
    Check,
    Printer,
    Share2,
    PackageCheck
} from "lucide-react";
import { toast } from "sonner";
import { PRESET_CATALOG_PRODUCTS } from "@/lib/catalog-presets";

interface WhatsAppSessionItem {
    id: string;
    sessionId: string;
    name: string;
    status: string;
}

interface StoreSetupWizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStoreCreated: (newStore: any) => void;
    onOpenCounterQr?: (store: any) => void;
}

const STORE_CATEGORIES = [
    { label: "Kiryana & Grocery", icon: "🛒", slugHint: "kiryana", defaultDelivery: "15-20 mins" },
    { label: "Fast Food & Cafe", icon: "🍔", slugHint: "cafe", defaultDelivery: "25-35 mins" },
    { label: "Milk & Dairy", icon: "🥛", slugHint: "dairy", defaultDelivery: "15-20 mins" },
    { label: "Pharmacy & Medical", icon: "💊", slugHint: "pharmacy", defaultDelivery: "20-30 mins" },
    { label: "Fruits & Sabzi", icon: "🍎", slugHint: "fresh", defaultDelivery: "20-30 mins" },
    { label: "Fashion & Boutique", icon: "👗", slugHint: "fashion", defaultDelivery: "Same Day" }
];

export default function StoreSetupWizardModal({
    isOpen,
    onClose,
    onStoreCreated,
    onOpenCounterQr
}: StoreSetupWizardModalProps) {
    const [step, setStep] = useState<number>(1);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Form State
    const [name, setName] = useState<string>("");
    const [slug, setSlug] = useState<string>("");
    const [phone, setPhone] = useState<string>("");
    const [city, setCity] = useState<string>("Lahore");
    const [tagline, setTagline] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<string>("Kiryana & Grocery");

    // Step 2 State
    const [deliveryFee, setDeliveryFee] = useState<string>("0");
    const [freeDeliveryAbove, setFreeDeliveryAbove] = useState<string>("1000");
    const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState<string>("15-20 mins");
    const [openingHours, setOpeningHours] = useState<string>("9:00 AM - 11:00 PM");

    // Step 3 State
    const [autoLoadProducts, setAutoLoadProducts] = useState<boolean>(true);
    const [sessions, setSessions] = useState<WhatsAppSessionItem[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string>("");

    // Step 4 Created Store Details
    const [createdStore, setCreatedStore] = useState<any>(null);
    const [copied, setCopied] = useState<boolean>(false);

    // Load available WhatsApp sessions on mount
    useEffect(() => {
        if (isOpen) {
            fetchSessions();
        }
    }, [isOpen]);

    const fetchSessions = async () => {
        try {
            const res = await fetch("/api/sessions");
            const data = await res.json();
            if (res.ok && data.data && Array.isArray(data.data)) {
                setSessions(data.data);
                if (data.data.length > 0) {
                    setSelectedSessionId(data.data[0].id);
                }
            }
        } catch (e) {
            console.error("Error fetching sessions:", e);
        }
    };

    if (!isOpen) return null;

    // Auto-generate slug when name changes if user hasn't typed custom slug
    const handleNameChange = (val: string) => {
        setName(val);
        const autoSlug = val
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        setSlug(autoSlug);
    };

    const handleSelectCategory = (cat: typeof STORE_CATEGORIES[0]) => {
        setSelectedCategory(cat.label);
        setEstimatedDeliveryTime(cat.defaultDelivery);
        if (!tagline) {
            setTagline(`${cat.label} ki behtareen ashya, direct ghar tak.`);
        }
    };

    const handleFinishSetup = async () => {
        if (!name.trim()) {
            toast.error("Dukaan ka naam likhna lazmi hai");
            setStep(1);
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Create the store
            const res = await fetch("/api/stores", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    slug: slug.trim() || undefined,
                    phone: phone.trim(),
                    city: city.trim(),
                    tagline: tagline.trim() || null,
                    deliveryFee: Number(deliveryFee) || 0,
                    freeDeliveryAbove: freeDeliveryAbove ? Number(freeDeliveryAbove) : null,
                    estimatedDeliveryTime: estimatedDeliveryTime.trim() || "30-45 mins",
                    openingHours: openingHours.trim() || "9:00 AM - 11:00 PM",
                    sessionId: selectedSessionId || null
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            const newStore = data.store;

            // 2. If auto-load items is enabled, auto import preset products
            if (autoLoadProducts && newStore.id) {
                try {
                    await fetch(`/api/stores/${newStore.id}/presets`, {
                        method: "POST"
                    });
                } catch (e) {
                    console.error("Auto import presets failed silently:", e);
                }
            }

            setCreatedStore(newStore);
            onStoreCreated(newStore);
            setStep(4);
            toast.success("Mubarak ho! Aapki Digital Dukaan live ho chuki hai! 🎉");
        } catch (err: any) {
            toast.error(err.message || "Store setup failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const liveStoreUrl = createdStore ? `${origin}/s/${createdStore.slug}` : "";

    const handleCopyStoreLink = () => {
        if (!liveStoreUrl) return;
        navigator.clipboard.writeText(liveStoreUrl);
        setCopied(true);
        toast.success("Store link copy ho gaya hai!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShareWhatsApp = () => {
        if (!createdStore) return;
        const msg = encodeURIComponent(
            `Salam! Hamari nayi online dukaan "${createdStore.name}" live ho chuki hai. Ghar bethay WhatsApp par foran order karein: ${liveStoreUrl}`
        );
        window.open(`https://wa.me/?text=${msg}`, "_blank");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-xl w-full shadow-2xl space-y-6 my-6 border border-slate-100">
                {/* Header & Step Tracker */}
                <div className="border-b border-slate-100 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                                <Sparkles className="w-5 h-5" />
                            </span>
                            <div>
                                <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                                    Digital Dukaan Setup Wizard
                                </h3>
                                <p className="text-xs text-slate-500">
                                    3 aasan steps mein apni WhatsApp dukaan shuru karein
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Progress Bar & Steps Indicator */}
                    <div className="grid grid-cols-3 gap-2 mt-4">
                        <div
                            className={`h-1.5 rounded-full transition-all ${
                                step >= 1 ? "bg-emerald-600" : "bg-slate-200"
                            }`}
                        />
                        <div
                            className={`h-1.5 rounded-full transition-all ${
                                step >= 2 ? "bg-emerald-600" : "bg-slate-200"
                            }`}
                        />
                        <div
                            className={`h-1.5 rounded-full transition-all ${
                                step >= 3 ? "bg-emerald-600" : "bg-slate-200"
                            }`}
                        />
                    </div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-500 mt-1.5 px-0.5">
                        <span className={step === 1 ? "text-emerald-700 font-bold" : ""}>1. Bunyadi Info</span>
                        <span className={step === 2 ? "text-emerald-700 font-bold" : ""}>2. Delivery & Auqaat</span>
                        <span className={step >= 3 ? "text-emerald-700 font-bold" : ""}>3. Saman & Launch</span>
                    </div>
                </div>

                {/* STEP 1: STORE IDENTITY */}
                {step === 1 && (
                    <div className="space-y-4 text-xs">
                        {/* Category Selector Chips */}
                        <div>
                            <label className="block font-bold text-slate-800 mb-1.5">
                                Dukaan Ki Qisam (Category) Chuniye:
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {STORE_CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.label}
                                        type="button"
                                        onClick={() => handleSelectCategory(cat)}
                                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                                            selectedCategory === cat.label
                                                ? "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-2xs"
                                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                        }`}
                                    >
                                        <span className="text-base">{cat.icon}</span>
                                        <span className="truncate">{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block font-bold text-slate-800 mb-1">
                                Dukaan Ka Naam *
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Al-Madina Super Store ya Bismillah Kiryana"
                                value={name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            />
                        </div>

                        {/* URL Slug Preview */}
                        <div>
                            <label className="block font-bold text-slate-800 mb-1">
                                Online Web Link (URL Slug)
                            </label>
                            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 font-mono">
                                <span className="text-slate-400">/s/</span>
                                <input
                                    type="text"
                                    placeholder="al-madina-store"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                                    className="bg-transparent text-emerald-800 font-bold focus:outline-none flex-1 ml-1"
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">
                                Customer is link se bina kisi app ke order kar sakega.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block font-bold text-slate-800 mb-1">
                                    WhatsApp Contact Number *
                                </label>
                                <div className="relative">
                                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="tel"
                                        required
                                        placeholder="0300 1234567"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-800 mb-1">
                                    Shehar / City
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Lahore, Karachi, Islamabad..."
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-bold text-slate-800 mb-1">
                                Slogan ya Tagline (Optional)
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Mohallay ki apni dukaan - Ghar tak foran delivery"
                                value={tagline}
                                onChange={(e) => setTagline(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            />
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                type="button"
                                disabled={!name.trim()}
                                onClick={() => setStep(2)}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                            >
                                <span>Agla Step: Delivery & Auqaat</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: DELIVERY & TIMINGS */}
                {step === 2 && (
                    <div className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block font-bold text-slate-800 mb-1">
                                    Base Delivery Charges (PKR)
                                </label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={deliveryFee}
                                    onChange={(e) => setDeliveryFee(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                />
                                <p className="text-[10px] text-slate-400 mt-0.5">Muft delivery ke liye 0 likhein.</p>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-800 mb-1">
                                    Free Delivery Ka Hadaf (Threshold in PKR)
                                </label>
                                <input
                                    type="number"
                                    placeholder="1000"
                                    value={freeDeliveryAbove}
                                    onChange={(e) => setFreeDeliveryAbove(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                />
                                <p className="text-[10px] text-slate-400 mt-0.5">Is se zyada order par delivery free hogi.</p>
                            </div>
                        </div>

                        {/* Estimated Delivery Time with Presets */}
                        <div className="space-y-1.5 pt-1">
                            <label className="block font-bold text-slate-800">
                                Estimated Delivery Time (Customer Ko Store Par Show Hoga) *
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. 15-20 mins"
                                value={estimatedDeliveryTime}
                                onChange={(e) => setEstimatedDeliveryTime(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            />
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {[
                                    "⚡ 15-20 mins",
                                    "🛵 30-45 mins",
                                    "⏱️ 1-2 Hours",
                                    "📦 Same Day Delivery"
                                ].map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => setEstimatedDeliveryTime(preset)}
                                        className={`px-2.5 py-1 rounded-lg border text-[11px] cursor-pointer transition ${
                                            estimatedDeliveryTime === preset
                                                ? "bg-emerald-100 border-emerald-400 text-emerald-900 font-bold"
                                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                        }`}
                                    >
                                        {preset}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Store Opening Hours with Presets */}
                        <div className="space-y-1.5 pt-1">
                            <label className="block font-bold text-slate-800">
                                Dukaan Ke Auqaat (Store Opening Hours) *
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. 9:00 AM - 11:00 PM"
                                value={openingHours}
                                onChange={(e) => setOpeningHours(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            />
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {[
                                    "☀️ 9:00 AM - 11:00 PM",
                                    "🏪 24/7 Khuli Hai",
                                    "🌙 12:00 PM - 12:00 AM",
                                    "🌅 8:00 AM - 10:00 PM"
                                ].map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => setOpeningHours(preset)}
                                        className={`px-2.5 py-1 rounded-lg border text-[11px] cursor-pointer transition ${
                                            openingHours === preset
                                                ? "bg-indigo-100 border-indigo-400 text-indigo-900 font-bold"
                                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                        }`}
                                    >
                                        {preset}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-3 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Pichla Step</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep(3)}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                            >
                                <span>Agla Step: Saman & WhatsApp</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: PRODUCTS & WHATSAPP AUTOMATION */}
                {step === 3 && (
                    <div className="space-y-4 text-xs">
                        {/* Auto-Load Pakistani Grocery Items Option */}
                        <div
                            onClick={() => setAutoLoadProducts(!autoLoadProducts)}
                            className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3 ${
                                autoLoadProducts
                                    ? "bg-emerald-50/70 border-emerald-500 shadow-xs"
                                    : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={autoLoadProducts}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-emerald-600 mt-1 accent-emerald-600"
                            />
                            <div className="space-y-1">
                                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                                    <PackageCheck className="w-4 h-4 text-emerald-600" />
                                    <span>Pakistani Grocery Essentials (14 Items) Auto-Load Karein</span>
                                </h4>
                                <p className="text-slate-600 leading-relaxed text-[11px]">
                                    Olper's Milk, Dalda Ghee, Shan Masala, Tapal Tea, Dawn Bread, Desi Eggs, aur cold drinks pehle se HD images aur market rate ke sath add ho jayenge.
                                </p>
                                <div className="flex gap-1.5 overflow-x-auto pt-1 no-scrollbar">
                                    {PRESET_CATALOG_PRODUCTS.slice(0, 5).map((p, i) => (
                                        <img
                                            key={i}
                                            src={p.image}
                                            alt={p.name}
                                            className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                                        />
                                    ))}
                                    <span className="text-[10px] text-emerald-800 font-bold self-center bg-white px-2 py-1 rounded-md border border-slate-200">
                                        +9 mazeed
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* WhatsApp Session Selector */}
                        <div className="space-y-2 pt-1">
                            <label className="block font-bold text-slate-800">
                                WhatsApp Auto-Order Alert Session
                            </label>
                            {sessions.length > 0 ? (
                                <select
                                    value={selectedSessionId}
                                    onChange={(e) => setSelectedSessionId(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                >
                                    {sessions.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            🟢 {s.name} ({s.sessionId})
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 space-y-1">
                                    <p className="font-bold flex items-center gap-1">
                                        <span>Direct WhatsApp Mode Active:</span>
                                    </p>
                                    <p className="text-[11px]">
                                        Abhi koi Baileys session connected nahi hai. Customer ke order direct aapke WhatsApp number <strong>({phone || "Store Phone"})</strong> par 1-click se send honge. Aap baad mein session connect kar sakte hain.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Summary pill */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px] space-y-1">
                            <div className="flex justify-between">
                                <span>Dukaan:</span>
                                <strong className="text-slate-900">{name} ({city})</strong>
                            </div>
                            <div className="flex justify-between">
                                <span>Delivery Waqt:</span>
                                <strong className="text-slate-900">{estimatedDeliveryTime}</strong>
                            </div>
                            <div className="flex justify-between">
                                <span>Auqaat:</span>
                                <strong className="text-slate-900">{openingHours}</strong>
                            </div>
                        </div>

                        <div className="pt-3 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Pichla Step</span>
                            </button>

                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={handleFinishSetup}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
                            >
                                <Sparkles className="w-4 h-4" />
                                <span>{isSubmitting ? "Dukaan Live Ho Rahi Hai..." : "Launch Digital Dukaan! 🎉"}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 4: LAUNCH CELEBRATION */}
                {step === 4 && createdStore && (
                    <div className="space-y-5 text-center py-2 animate-fade-in">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                            <CheckCircle2 className="w-9 h-9" />
                        </div>

                        <div>
                            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                                Mubarak Ho! Aapki Dukaan Live Hai! 🚀
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                <strong>{createdStore.name}</strong> kamiyabi se ban chuki hai aur online orders ke liye ready hai.
                            </p>
                        </div>

                        {/* Store Link Box */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-2 max-w-md mx-auto text-xs">
                            <span className="font-mono text-emerald-800 font-bold truncate">
                                {liveStoreUrl}
                            </span>
                            <button
                                onClick={handleCopyStoreLink}
                                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-emerald-50 text-slate-700 font-bold rounded-xl transition flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copied ? "Copied!" : "Copy"}</span>
                            </button>
                        </div>

                        {/* Next Action Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-left">
                            <a
                                href={liveStoreUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50 transition cursor-pointer flex flex-col justify-between"
                            >
                                <ExternalLink className="w-5 h-5 text-emerald-600 mb-2" />
                                <div>
                                    <strong className="block text-xs text-slate-900">Live Store Kholain</strong>
                                    <span className="text-[10px] text-slate-500">Customer view dekhein</span>
                                </div>
                            </a>

                            <button
                                onClick={() => {
                                    onClose();
                                    if (onOpenCounterQr) onOpenCounterQr(createdStore);
                                }}
                                className="p-3 rounded-2xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/50 transition cursor-pointer flex flex-col justify-between text-left"
                            >
                                <Printer className="w-5 h-5 text-indigo-600 mb-2" />
                                <div>
                                    <strong className="block text-xs text-slate-900">Counter QR Stand</strong>
                                    <span className="text-[10px] text-slate-500">Dukaan ke liye print karein</span>
                                </div>
                            </button>

                            <button
                                onClick={handleShareWhatsApp}
                                className="p-3 rounded-2xl border border-green-200 bg-green-50/50 hover:bg-green-100/50 transition cursor-pointer flex flex-col justify-between text-left"
                            >
                                <Share2 className="w-5 h-5 text-green-600 mb-2" />
                                <div>
                                    <strong className="block text-xs text-slate-900">WhatsApp Share</strong>
                                    <span className="text-[10px] text-slate-500">Status par lagayein</span>
                                </div>
                            </button>
                        </div>

                        <div className="pt-3">
                            <button
                                onClick={onClose}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition cursor-pointer text-xs"
                            >
                                Dukaan Dashboard Kholain ➔
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
