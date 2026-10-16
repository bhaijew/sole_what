"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
    Sparkles,
    ImageIcon,
    Eye,
    EyeOff,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Plus,
    Trash2,
    ArrowUpRight,
    ExternalLink,
    Store,
    Layers,
    SlidersHorizontal,
    Check,
    Zap,
    Tag,
    Edit3,
    ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import {
    PRE_INSTALLED_SLIDER_PACKS,
    PRESET_HERO_BANNERS,
    PresetBanner,
    SliderPack
} from "@/lib/catalog-presets";

interface SliderManagerProps {
    activeStore: {
        id: string;
        name: string;
        slug: string;
        bannerUrl?: string | null;
    };
    onUpdated?: () => void;
}

export default function SliderManager({ activeStore, onUpdated }: SliderManagerProps) {
    const [isSliderEnabled, setIsSliderEnabled] = useState<boolean>(true);
    const [banners, setBanners] = useState<PresetBanner[]>(PRESET_HERO_BANNERS);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [previewIndex, setPreviewIndex] = useState<number>(0);
    const [isAutoplayPaused, setIsAutoplayPaused] = useState<boolean>(false);
    const [editingSlideId, setEditingSlideId] = useState<string | null>(null);

    // Initialize from activeStore.bannerUrl
    useEffect(() => {
        if (!activeStore.bannerUrl) {
            setIsSliderEnabled(true);
            setBanners(PRESET_HERO_BANNERS);
            return;
        }

        if (activeStore.bannerUrl === "OFF" || activeStore.bannerUrl === "DISABLED") {
            setIsSliderEnabled(false);
            setBanners(PRESET_HERO_BANNERS);
            return;
        }

        try {
            const parsed = JSON.parse(activeStore.bannerUrl);
            if (parsed && typeof parsed === "object") {
                setIsSliderEnabled(parsed.enabled !== false);
                if (Array.isArray(parsed.banners) && parsed.banners.length > 0) {
                    setBanners(parsed.banners);
                } else {
                    setBanners(PRESET_HERO_BANNERS);
                }
            }
        } catch {
            if (activeStore.bannerUrl.startsWith("http")) {
                setIsSliderEnabled(true);
                setBanners([
                    {
                        id: "custom-1",
                        title: `Welcome to ${activeStore.name}`,
                        subtitle: "Ghar bethey online order karein direct WhatsApp par.",
                        badge: "Taaza & Asal",
                        bgGradient: "from-emerald-700 via-teal-800 to-slate-900",
                        imageUrl: activeStore.bannerUrl,
                        linkUrl: "#products"
                    }
                ]);
            } else {
                setIsSliderEnabled(true);
                setBanners(PRESET_HERO_BANNERS);
            }
        }
    }, [activeStore.id, activeStore.bannerUrl, activeStore.name]);

    // Live Slider Autoplay preview
    useEffect(() => {
        if (!isSliderEnabled || banners.length <= 1 || isAutoplayPaused) return;

        const timer = setInterval(() => {
            setPreviewIndex((prev) => (prev + 1) % banners.length);
        }, 4000);

        return () => clearInterval(timer);
    }, [isSliderEnabled, banners.length, isAutoplayPaused]);

    // Save Banners to Store API
    const saveBannersToDb = async (enabled: boolean, newBanners: PresetBanner[], successMsg?: string) => {
        setIsSaving(true);
        try {
            const payload = !enabled
                ? "DISABLED"
                : JSON.stringify({ enabled: true, banners: newBanners });

            const res = await fetch(`/api/stores/${activeStore.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bannerUrl: payload })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update slider settings.");

            toast.success(successMsg || "Slider settings kamyabi se save ho gayin! 🖼️");
            if (onUpdated) onUpdated();
        } catch (err: any) {
            console.error("Save slider error:", err);
            toast.error(err.message || "Slider save karne mein masla pesh aya.");
        } finally {
            setIsSaving(false);
        }
    };

    // 1-Click Activate Pre-Installed Slider Pack
    const handleApplyPack = async (pack: SliderPack) => {
        setIsSliderEnabled(true);
        setBanners(pack.banners);
        setPreviewIndex(0);
        await saveBannersToDb(
            true,
            pack.banners,
            `🎉 "${pack.title}" (${pack.urduTitle}) aapke storefront par active ho gaya!`
        );
    };

    // Toggle Slider Status
    const handleToggleSlider = async () => {
        const nextState = !isSliderEnabled;
        setIsSliderEnabled(nextState);
        await saveBannersToDb(
            nextState,
            banners,
            nextState ? "Slider active kar diya gaya hai! 🟢" : "Slider storefront par band kar diya gaya! 🔴"
        );
    };

    // Slide manipulations
    const handleUpdateSlide = (id: string, field: keyof PresetBanner, value: string) => {
        setBanners((prev) =>
            prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
        );
    };

    const handleDeleteSlide = (id: string) => {
        if (banners.length <= 1) {
            toast.warning("Slider mein kam az kam 1 slide ka hona zaroori hai.");
            return;
        }
        setBanners((prev) => prev.filter((b) => b.id !== id));
        setPreviewIndex(0);
        toast.info("Slide delete ho gayi. 'Save Slider Changes' par click karein.");
    };

    const handleAddBlankSlide = () => {
        const newSlide: PresetBanner = {
            id: `slide-${Date.now()}`,
            title: "Naya Special Offer 🏷️",
            subtitle: "Yahan apni deal ya promo ki detail likhein.",
            badge: "Special Deal",
            bgGradient: "from-emerald-800 via-teal-900 to-slate-950",
            imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
            linkUrl: "#products"
        };
        setBanners((prev) => [...prev, newSlide]);
        setPreviewIndex(banners.length);
        setEditingSlideId(newSlide.id);
        toast.success("Naya slide shamil ho gaya. Nechay details edit karein.");
    };

    const activeSlide = banners[previewIndex] || banners[0];
    const liveStoreUrl = `/s/${activeStore.slug}`;

    return (
        <div className="space-y-8 animate-in fade-in duration-200">
            {/* HERO BAR */}
            <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card/90 via-card/70 to-background p-6 sm:p-7 backdrop-blur-xl shadow-md">
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide bg-primary/15 text-primary border border-primary/25">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>STOREFRONT SLIDER &amp; BANNERS MANAGER</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                            Storefront Hero Slider &amp; Pre-Installed Themes
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Pre-installed Pakistani slider packs 1-click mein active karein ya apni pasandeeda deals customize karein.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                        {/* TOGGLE SLIDER BUTTON */}
                        <button
                            type="button"
                            onClick={handleToggleSlider}
                            disabled={isSaving}
                            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition shadow-md cursor-pointer ${
                                isSliderEnabled
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25"
                                    : "bg-rose-600/15 hover:bg-rose-600/25 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                            }`}
                        >
                            {isSliderEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            <span>{isSliderEnabled ? "Slider Active Hai 🟢" : "Slider Band Hai 🔴"}</span>
                        </button>

                        {/* LIVE STOREFRONT LINK */}
                        <a
                            href={liveStoreUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2.5 rounded-2xl bg-muted/60 hover:bg-muted text-foreground text-xs font-bold flex items-center gap-1.5 transition border border-border/80 shadow-2xs hover:scale-105"
                        >
                            <span>Live Storefront</span>
                            <ExternalLink className="w-3.5 h-3.5 text-primary" />
                        </a>
                    </div>
                </div>
            </div>

            {/* LIVE SLIDER PREVIEW */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-black tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-primary" />
                        Live Storefront Slider Preview ({banners.length} Slides)
                    </span>
                    {!isSliderEnabled && (
                        <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                            Status: Storefront par hidden hai
                        </span>
                    )}
                </div>

                {activeSlide ? (
                    <div
                        onMouseEnter={() => setIsAutoplayPaused(true)}
                        onMouseLeave={() => setIsAutoplayPaused(false)}
                        className="relative rounded-3xl overflow-hidden border border-border/80 shadow-xl group select-none"
                    >
                        {/* Background Slide with Gradient & Image */}
                        <div className={`relative min-h-[220px] sm:min-h-[260px] md:min-h-[280px] bg-gradient-to-r ${activeSlide.bgGradient || "from-slate-900 to-slate-950"} text-white p-6 sm:p-8 md:p-10 flex flex-col justify-between overflow-hidden transition-all duration-700`}>
                            {/* Ambient Glows */}
                            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

                            {/* Slide Image Background on Right */}
                            {activeSlide.imageUrl && (
                                <div className="absolute right-0 top-0 bottom-0 w-1/2 sm:w-2/5 overflow-hidden opacity-30 sm:opacity-40 group-hover:scale-105 transition-transform duration-700 pointer-events-none">
                                    <Image
                                        src={activeSlide.imageUrl}
                                        alt={activeSlide.title}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-transparent" />
                                </div>
                            )}

                            {/* Top Badge */}
                            <div className="relative z-10 flex items-center justify-between">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-xs">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                    <span>{activeSlide.badge || "Dhamaka Deal"}</span>
                                </span>

                                <span className="text-xs font-mono text-white/70 bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                                    Slide {previewIndex + 1} of {banners.length}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="relative z-10 max-w-lg space-y-2 py-2">
                                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white drop-shadow-md">
                                    {activeSlide.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-white/90 leading-relaxed drop-shadow-xs line-clamp-2">
                                    {activeSlide.subtitle}
                                </p>
                            </div>

                            {/* Action Button & Navigation Dots */}
                            <div className="relative z-10 flex items-center justify-between pt-2">
                                <button
                                    type="button"
                                    className="px-5 py-2.5 rounded-full bg-white text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-black/20 hover:scale-105 transition cursor-pointer"
                                >
                                    <span>Kharidari Karein</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>

                                {/* Navigation Dots */}
                                <div className="flex items-center gap-1.5">
                                    {banners.map((_, dotIdx) => (
                                        <button
                                            key={dotIdx}
                                            type="button"
                                            onClick={() => setPreviewIndex(dotIdx)}
                                            className={`h-2 rounded-full transition-all cursor-pointer ${
                                                previewIndex === dotIdx ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Left / Right Carousel Controls */}
                            {banners.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewIndex((prev) => (prev - 1 + banners.length) % banners.length)}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/15 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewIndex((prev) => (prev + 1) % banners.length)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/15 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-8 rounded-3xl border border-dashed border-border/80 text-center text-muted-foreground text-xs">
                        Koi slide maujood nahi hai. Nechay pre-installed pack active karein ya naya slide shamil karein.
                    </div>
                )}
            </div>

            {/* PRE-INSTALLED PAKISTANI SLIDER THEME PACKS */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                    <div>
                        <h3 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                            <span>Pre-Installed Pakistani Slider Packs (تیار شدہ سلائیڈرز)</span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-primary/15 text-primary border border-primary/25">
                                1-Click Activate ⚡
                            </span>
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Apne business ki category ke mutabiq tayar slider select karein. Tamam slides, images aur deals khud set ho jayengi.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {PRE_INSTALLED_SLIDER_PACKS.map((pack) => {
                        const isCurrentlyActive =
                            banners.length === pack.banners.length &&
                            banners[0]?.title === pack.banners[0]?.title;

                        return (
                            <div
                                key={pack.id}
                                className={`rounded-3xl border p-5 flex flex-col justify-between gap-4 transition-all duration-300 relative overflow-hidden backdrop-blur-md shadow-2xs hover:shadow-md ${
                                    isCurrentlyActive
                                        ? "border-emerald-500 bg-emerald-950/15 dark:bg-emerald-950/25 ring-2 ring-emerald-500/20"
                                        : "border-border/80 bg-card/80 hover:border-primary/50"
                                }`}
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl p-2 rounded-2xl bg-muted/70">{pack.icon}</span>
                                            <div>
                                                <h4 className="font-extrabold text-sm text-foreground">
                                                    {pack.title}
                                                </h4>
                                                <span className="text-xs font-bold text-muted-foreground font-sans">
                                                    {pack.urduTitle}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                            {pack.badge}
                                        </span>
                                    </div>

                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                        {pack.description}
                                    </p>

                                    {/* Slides mini preview thumbnail strip */}
                                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                                        {pack.banners.map((b, bIdx) => (
                                            <div
                                                key={bIdx}
                                                className={`relative h-14 rounded-xl overflow-hidden border border-border/70 bg-gradient-to-r ${b.bgGradient} p-1 text-[9px] text-white flex flex-col justify-between`}
                                            >
                                                <span className="font-bold line-clamp-1 opacity-90">{b.badge}</span>
                                                <span className="font-extrabold line-clamp-1">{b.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleApplyPack(pack)}
                                    disabled={isSaving}
                                    className={`w-full py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs ${
                                        isCurrentlyActive
                                            ? "bg-emerald-600 text-white"
                                            : "bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20"
                                    }`}
                                >
                                    {isCurrentlyActive ? (
                                        <>
                                            <Check className="w-4 h-4 text-white" />
                                            <span>Active On Storefront ✓</span>
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-4 h-4" />
                                            <span>Yeh Slider Pack Active Karein ➔</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* CUSTOM SLIDES EDITOR & REORDER */}
            <div className="glass-panel border border-border/70 rounded-3xl p-5 sm:p-7 bg-card/90 dark:bg-card/80 backdrop-blur-md space-y-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                    <div>
                        <h3 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                            <span>Individual Slides Editor ({banners.length})</span>
                            <span className="text-xs font-semibold text-muted-foreground">
                                (Title, Badge, Photos &amp; Links)
                            </span>
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Kisi slide ki text, tasweer ya link tabdeel karni ho toh direct edit karein.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={handleAddBlankSlide}
                            className="px-3.5 py-2 rounded-xl bg-muted/60 hover:bg-muted text-foreground text-xs font-bold flex items-center gap-1.5 transition border border-border/70 cursor-pointer shadow-2xs"
                        >
                            <Plus className="w-4 h-4 text-primary" />
                            <span>+ Naya Slide Add Karein</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => saveBannersToDb(isSliderEnabled, banners)}
                            disabled={isSaving}
                            className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black flex items-center gap-1.5 transition shadow-md shadow-primary/25 cursor-pointer disabled:opacity-50"
                        >
                            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            <span>Save Slider Changes</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {banners.map((b, idx) => (
                        <div
                            key={b.id || idx}
                            className="p-4 rounded-2xl border border-border/70 bg-background/60 hover:bg-card transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                            {/* Slide Thumbnail Preview */}
                            <div className="flex items-center gap-3">
                                <div className={`relative w-20 h-16 rounded-xl overflow-hidden border border-border/80 bg-gradient-to-r ${b.bgGradient} shrink-0 p-1 flex items-center justify-center text-center`}>
                                    {b.imageUrl ? (
                                        <Image
                                            src={b.imageUrl}
                                            alt={b.title}
                                            fill
                                            className="object-cover opacity-60"
                                        />
                                    ) : null}
                                    <span className="relative z-10 text-[10px] font-black text-white line-clamp-2 px-1">
                                        #{idx + 1}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary/10 text-primary border border-primary/20">
                                            {b.badge}
                                        </span>
                                        <h5 className="font-extrabold text-sm text-foreground">
                                            {b.title}
                                        </h5>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                        {b.subtitle}
                                    </p>
                                </div>
                            </div>

                            {/* Quick Inputs & Actions */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => setEditingSlideId(editingSlideId === b.id ? null : b.id)}
                                    className="px-3 py-1.5 rounded-xl bg-muted/60 hover:bg-muted text-foreground text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                                >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>{editingSlideId === b.id ? "Done" : "Edit Details"}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleDeleteSlide(b.id)}
                                    className="p-2 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                                    title="Delete Slide"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Expanded Edit Form */}
                            {editingSlideId === b.id && (
                                <div className="w-full pt-3 mt-2 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                                            Slide Title (بڑا عنوان)
                                        </label>
                                        <input
                                            type="text"
                                            value={b.title}
                                            onChange={(e) => handleUpdateSlide(b.id, "title", e.target.value)}
                                            className="w-full bg-background border border-border/80 focus:border-primary rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                                            Badge Text (اوپر ٹیگ)
                                        </label>
                                        <input
                                            type="text"
                                            value={b.badge}
                                            onChange={(e) => handleUpdateSlide(b.id, "badge", e.target.value)}
                                            className="w-full bg-background border border-border/80 focus:border-primary rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                                            Subtitle Description (تفصیل)
                                        </label>
                                        <input
                                            type="text"
                                            value={b.subtitle}
                                            onChange={(e) => handleUpdateSlide(b.id, "subtitle", e.target.value)}
                                            className="w-full bg-background border border-border/80 focus:border-primary rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                                            Image URL (تصویر کا لنک)
                                        </label>
                                        <input
                                            type="url"
                                            value={b.imageUrl}
                                            onChange={(e) => handleUpdateSlide(b.id, "imageUrl", e.target.value)}
                                            placeholder="https://images.unsplash.com/..."
                                            className="w-full bg-background border border-border/80 focus:border-primary rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
