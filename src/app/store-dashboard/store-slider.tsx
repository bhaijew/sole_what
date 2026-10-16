"use client";

import { useState, useEffect, useRef } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Calculator,
    ShoppingCart,
    Truck,
    ExternalLink,
    ArrowRight,
    TrendingUp,
    Store,
    Printer,
    Package
} from "lucide-react";

interface StoreSliderProps {
    storeName: string;
    liveStoreUrl: string;
    onOpenPos: () => void;
    onSwitchTab: (tab: string) => void;
    ordersCount: number;
    pendingOrdersCount: number;
    abandonedCount: number;
}

export default function StoreSlider({
    storeName,
    liveStoreUrl,
    onOpenPos,
    onSwitchTab,
    ordersCount,
    pendingOrdersCount,
    abandonedCount
}: StoreSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const slides = [
        {
            id: "pulse",
            badge: "🏪 LIVE DUKAAN PULSE",
            badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
            title: `Welcome to ${storeName || "Your Store"}`,
            subtitle: "Pakistani small businesses ke liye mukammal WhatsApp e-commerce command center. Local customers direct WhatsApp par orders place kar rahe hain.",
            gradient: "from-emerald-950 via-teal-900 to-slate-900",
            accentColor: "text-emerald-400",
            primaryBtnText: "Live Storefront Dekhein ↗",
            primaryBtnAction: () => window.open(liveStoreUrl, "_blank"),
            secondaryBtnText: "Orders Dekhein",
            secondaryBtnAction: () => onSwitchTab("orders"),
            metric: `${ordersCount} Orders Received`,
            metricSub: pendingOrdersCount > 0 ? `${pendingOrdersCount} naye orders pending!` : "Tamam orders up-to-date"
        },
        {
            id: "pos",
            badge: "⚡ HIGH-SPEED WALK-IN BILLING",
            badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/30",
            title: "Dukaan Counter POS Cashier Mode",
            subtitle: "Bina kisi scanner ya mehngi machine ke counter par tez billing karein. Cash return calculator aur auto WhatsApp digital cash memo slip.",
            gradient: "from-teal-950 via-emerald-900 to-slate-950",
            accentColor: "text-teal-300",
            primaryBtnText: "Launch POS Register ➔",
            primaryBtnAction: () => onOpenPos(),
            secondaryBtnText: "POS Guide",
            secondaryBtnAction: () => onSwitchTab("pos"),
            metric: "1-Click WhatsApp Memo",
            metricSub: "Zero paper wastage cash memo"
        },
        {
            id: "abandoned",
            badge: "🛒 AUTOMATED WIN-BACK",
            badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
            title: "Recover 35% of Lost Sales via WhatsApp",
            subtitle: "Jo customers cart chorr kar chale gaye, unhe automatic 10% promo code (WELCOME10) ke sath WhatsApp alert bhej kar foran wapis layein.",
            gradient: "from-amber-950 via-orange-950 to-slate-950",
            accentColor: "text-amber-400",
            primaryBtnText: "Recover Dropped Carts ➔",
            primaryBtnAction: () => onSwitchTab("abandoned"),
            secondaryBtnText: "Discounts & Deals",
            secondaryBtnAction: () => onSwitchTab("settings"),
            metric: `${abandonedCount} Dropped Carts`,
            metricSub: "1-click recovery available"
        },
        {
            id: "shipping",
            badge: "🖨️ TCS • TRAX • LEOPARDS READY",
            badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
            title: "Courier Shipping Flyer Labels & Thermal Receipts",
            subtitle: "Barcode wale standardized packaging labels aur 80mm thermal receipts sirf aik click mein print karein taake delivery rider foran parcel le sake.",
            gradient: "from-indigo-950 via-slate-900 to-slate-950",
            accentColor: "text-indigo-400",
            primaryBtnText: "Print Shipping Labels",
            primaryBtnAction: () => onSwitchTab("orders"),
            secondaryBtnText: "Counter QR Stand",
            secondaryBtnAction: () => onSwitchTab("overview"),
            metric: "Barcode Packaging",
            metricSub: "Thermal & Flyer Print Ready"
        },
        {
            id: "slider-packs",
            badge: "🖼️ PRE-INSTALLED STORE SLIDERS",
            badgeColor: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
            title: "1-Click Storefront Slider Packs & Deals",
            subtitle: "Super Mart Ration, Bakery & Nashta, Ramadan Deals, Weekend Flash Sale ke ready-made banners apne storefront par 1-click se active karein.",
            gradient: "from-purple-950 via-fuchsia-950 to-slate-950",
            accentColor: "text-fuchsia-300",
            primaryBtnText: "Slider Packs Active Karein 🎨",
            primaryBtnAction: () => onSwitchTab("slider"),
            secondaryBtnText: "Live Storefront ↗",
            secondaryBtnAction: () => window.open(liveStoreUrl, "_blank"),
            metric: "5 Ready Packs",
            metricSub: "1-Click Theme Activation"
        }
    ];

    // Autoplay
    useEffect(() => {
        if (isPaused) return;
        timeoutRef.current = setTimeout(() => {
            setCurrentIndex(prev => (prev + 1) % slides.length);
        }, 5500);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [currentIndex, isPaused, slides.length]);

    const handlePrev = () => {
        setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length);
    };

    const handleNext = () => {
        setCurrentIndex(prev => (prev + 1) % slides.length);
    };

    const activeSlide = slides[currentIndex];

    return (
        <div
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/50 dark:border-slate-800 select-none group"
        >
            {/* Background Gradient & Animated Layers */}
            <div className={`relative min-h-[220px] sm:min-h-[240px] md:min-h-[260px] bg-gradient-to-r ${activeSlide.gradient} text-white transition-all duration-700 p-5 sm:p-7 md:p-8 flex flex-col justify-between overflow-hidden`}>
                
                {/* Decorative Ambient Light Glows */}
                <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/[0.06] rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-emerald-500/[0.08] rounded-full blur-3xl pointer-events-none" />

                {/* Top Row: Badge & Metric Counter */}
                <div className="relative z-10 flex items-center justify-between gap-3 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border backdrop-blur-md ${activeSlide.badgeColor}`}>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{activeSlide.badge}</span>
                    </span>

                    {/* Live Metric Chip */}
                    <div className="hidden sm:flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/10 text-xs">
                        <TrendingUp className={`w-3.5 h-3.5 ${activeSlide.accentColor}`} />
                        <span className="font-bold text-white">{activeSlide.metric}</span>
                        <span className="text-[10px] text-slate-300">({activeSlide.metricSub})</span>
                    </div>
                </div>

                {/* Middle: Title & Subtitle */}
                <div className="relative z-10 space-y-1.5 my-2 max-w-2xl">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white line-clamp-1 drop-shadow-sm">
                        {activeSlide.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                        {activeSlide.subtitle}
                    </p>
                </div>

                {/* Bottom Row: Action Buttons & Navigation Dots */}
                <div className="relative z-10 flex items-center justify-between gap-4 pt-1 flex-wrap">
                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={activeSlide.primaryBtnAction}
                            className="px-4 py-2 sm:px-5 sm:py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs rounded-xl shadow-lg transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                            <span>{activeSlide.primaryBtnText}</span>
                        </button>

                        <button
                            onClick={activeSlide.secondaryBtnAction}
                            className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/15 backdrop-blur-md transition cursor-pointer"
                        >
                            <span>{activeSlide.secondaryBtnText}</span>
                        </button>
                    </div>

                    {/* Pagination Indicators */}
                    <div className="flex items-center gap-1.5">
                        {slides.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                aria-label={`Slide ${idx + 1}`}
                                className={`transition-all duration-300 cursor-pointer rounded-full ${
                                    idx === currentIndex
                                        ? "w-7 h-2 bg-white"
                                        : "w-2 h-2 bg-white/40 hover:bg-white/60"
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Next & Previous Arrow Controls */}
                <button
                    onClick={handlePrev}
                    aria-label="Previous Slide"
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200 cursor-pointer"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                    onClick={handleNext}
                    aria-label="Next Slide"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200 cursor-pointer"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>

            </div>
        </div>
    );
}
