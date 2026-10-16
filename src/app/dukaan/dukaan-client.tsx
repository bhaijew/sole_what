"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
    Store,
    ShoppingBag,
    MapPin,
    Clock,
    Truck,
    Search,
    Compass,
    Navigation,
    Phone,
    CheckCircle2,
    Sparkles,
    ArrowRight,
    BadgePercent,
    ExternalLink,
    Filter,
    X,
    SlidersHorizontal,
    MessageCircle,
    ChevronDown,
    Building2,
    Heart,
    Zap,
    Utensils,
    PackageCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export interface StoreItem {
    id: string;
    name: string;
    slug: string;
    tagline: string | null;
    description: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    phone: string;
    address: string | null;
    city: string | null;
    area?: string;
    isOpen: boolean;
    deliveryFee: number;
    freeDeliveryAbove: number | null;
    estimatedDeliveryTime: string | null;
    openingHours: string | null;
    minOrderAmount: number;
    noticeMessage: string | null;
    categories: string[];
    productCount: number;
    totalOrders?: number;
    sampleProducts?: { name: string; price: number; image?: string | null }[];
}

interface DukaanClientProps {
    initialStores: StoreItem[];
    initialCities: string[];
    initialAreas: string[];
    totalCount: number;
}

const PAKISTANI_CITIES = [
    "All",
    "Lahore",
    "Karachi",
    "Islamabad",
    "Rawalpindi",
    "Faisalabad",
    "Multan",
    "Peshawar",
    "Sialkot",
    "Gujranwala",
    "Quetta"
];

const POPULAR_AREAS_BY_CITY: Record<string, string[]> = {
    Lahore: [
        "Johar Town",
        "Gulberg III",
        "DHA Phase 5",
        "Model Town",
        "Faisal Town",
        "Bahria Town",
        "Iqbal Town",
        "Wapda Town",
        "Cavalry Ground",
        "Cantt"
    ],
    Karachi: [
        "Gulshan-e-Iqbal",
        "DHA Phase 5",
        "Clifton",
        "North Nazimabad",
        "PECHS",
        "Gulistan-e-Jauhar",
        "Bahadurabad",
        "Malir Cantt"
    ],
    Islamabad: [
        "F-10 Markaz",
        "F-7 Markaz",
        "F-6 Super Market",
        "G-11 Markaz",
        "I-8 Markaz",
        "Bahria Town Islamabad",
        "DHA Phase 2"
    ],
    Rawalpindi: [
        "Bahria Town Phase 4",
        "Saddar",
        "Satellite Town",
        "Westridge",
        "Commercial Market"
    ],
    Faisalabad: [
        "D Ground",
        "People's Colony",
        "Madina Town",
        "Kohinoor City"
    ],
    Multan: [
        "Gulgasht Colony",
        "Cantt",
        "Bosan Road",
        "Shah Rukn-e-Alam"
    ]
};

const CATEGORIES = [
    { id: "all", label: "Sab Dukaanein", icon: "🏪" },
    { id: "grocery", label: "Kirana & Ration", icon: "🛒" },
    { id: "dairy", label: "Milk & Dairy", icon: "🥛" },
    { id: "bakery", label: "Bakery & Sweets", icon: "🥐" },
    { id: "meat", label: "Fresh Meat", icon: "🥩" },
    { id: "fruits", label: "Phal & Sabzi", icon: "🍎" },
    { id: "pharmacy", label: "Medical Store", icon: "💊" },
    { id: "frozen", label: "Frozen & Snacks", icon: "🧊" }
];

export default function DukaanClient({
    initialStores,
    initialCities,
    initialAreas,
    totalCount
}: DukaanClientProps) {
    const [selectedCity, setSelectedCity] = useState<string>("All");
    const [selectedArea, setSelectedArea] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [onlyOpen, setOnlyOpen] = useState<boolean>(false);
    const [sortBy, setSortBy] = useState<string>("recommended");
    const [isLocating, setIsLocating] = useState<boolean>(false);
    const [stores, setStores] = useState<StoreItem[]>(initialStores);

    // Filter stores in client for instant sub-millisecond responsiveness
    const filteredStores = useMemo(() => {
        return stores.filter((store) => {
            // City check
            if (selectedCity !== "All") {
                const storeCity = (store.city || "").toLowerCase();
                if (!storeCity.includes(selectedCity.toLowerCase())) {
                    return false;
                }
            }

            // Area check
            if (selectedArea.trim()) {
                const areaQuery = selectedArea.toLowerCase().trim();
                const storeArea = (store.area || "").toLowerCase();
                const storeAddress = (store.address || "").toLowerCase();
                if (!storeArea.includes(areaQuery) && !storeAddress.includes(areaQuery)) {
                    return false;
                }
            }

            // Search query check (name, tagline, description, address, category)
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchName = store.name.toLowerCase().includes(q);
                const matchTagline = (store.tagline || "").toLowerCase().includes(q);
                const matchAddress = (store.address || "").toLowerCase().includes(q);
                const matchCategory = (store.categories || []).some((c) =>
                    c.toLowerCase().includes(q)
                );
                const matchProducts = (store.sampleProducts || []).some((p) =>
                    p.name.toLowerCase().includes(q)
                );

                if (!matchName && !matchTagline && !matchAddress && !matchCategory && !matchProducts) {
                    return false;
                }
            }

            // Category check
            if (selectedCategory !== "all") {
                const catLower = selectedCategory.toLowerCase();
                const hasCategory = (store.categories || []).some((c) => {
                    const cl = c.toLowerCase();
                    if (catLower === "grocery") return cl.includes("groc") || cl.includes("kirana") || cl.includes("ration");
                    if (catLower === "dairy") return cl.includes("dair") || cl.includes("milk") || cl.includes("doodh");
                    if (catLower === "bakery") return cl.includes("bake") || cl.includes("sweet") || cl.includes("mithai");
                    if (catLower === "meat") return cl.includes("meat") || cl.includes("gosht") || cl.includes("poultry") || cl.includes("chicken");
                    if (catLower === "fruits") return cl.includes("fruit") || cl.includes("veg") || cl.includes("sabzi");
                    if (catLower === "pharmacy") return cl.includes("pharm") || cl.includes("medic") || cl.includes("dawakhana");
                    if (catLower === "frozen") return cl.includes("froz") || cl.includes("snack");
                    return cl.includes(catLower);
                });

                if (!hasCategory) return false;
            }

            // Only open check
            if (onlyOpen && !store.isOpen) {
                return false;
            }

            return true;
        }).sort((a, b) => {
            if (sortBy === "delivery") {
                const aTime = parseInt(a.estimatedDeliveryTime || "40") || 40;
                const bTime = parseInt(b.estimatedDeliveryTime || "40") || 40;
                return aTime - bTime;
            }
            if (sortBy === "freeDelivery") {
                return (a.deliveryFee || 0) - (b.deliveryFee || 0);
            }
            if (sortBy === "products") {
                return (b.productCount || 0) - (a.productCount || 0);
            }
            // default: recommended (open stores first, then total orders)
            if (a.isOpen !== b.isOpen) {
                return a.isOpen ? -1 : 1;
            }
            return (b.totalOrders || 0) - (a.totalOrders || 0);
        });
    }, [stores, selectedCity, selectedArea, searchQuery, selectedCategory, onlyOpen, sortBy]);

    // Available mohallas for the currently chosen city
    const currentCityAreas = useMemo(() => {
        if (selectedCity === "All") {
            return ["Johar Town", "Gulberg", "DHA", "Gulshan-e-Iqbal", "F-10 Markaz", "Bahria Town"];
        }
        return POPULAR_AREAS_BY_CITY[selectedCity] || [];
    }, [selectedCity]);

    // Geolocation detection handler
    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser.");
            return;
        }

        setIsLocating(true);
        toast.info("Aapki location detect ki ja rahi hai... 📍");

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                let detectedCity = "Lahore";
                let detectedArea = "";

                try {
                    // Quick distance approximation for Pakistani cities
                    const cityCoords = [
                        { name: "Lahore", lat: 31.5204, lon: 74.3587 },
                        { name: "Karachi", lat: 24.8607, lon: 67.0011 },
                        { name: "Islamabad", lat: 33.6844, lon: 73.0479 },
                        { name: "Rawalpindi", lat: 33.5651, lon: 73.0169 },
                        { name: "Faisalabad", lat: 31.4504, lon: 73.1350 },
                        { name: "Multan", lat: 30.1575, lon: 71.5249 },
                        { name: "Peshawar", lat: 34.0151, lon: 71.5249 },
                        { name: "Sialkot", lat: 32.4945, lon: 74.5229 },
                        { name: "Gujranwala", lat: 32.1877, lon: 74.1945 },
                        { name: "Quetta", lat: 30.1798, lon: 66.9750 }
                    ];

                    let closest = cityCoords[0];
                    let minDistance = Infinity;

                    cityCoords.forEach((c) => {
                        const dist = Math.hypot(c.lat - latitude, c.lon - longitude);
                        if (dist < minDistance) {
                            minDistance = dist;
                            closest = c;
                        }
                    });

                    detectedCity = closest.name;

                    // Optional reverse geocode attempt with short timeout
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 2500);

                    try {
                        const res = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
                            { signal: controller.signal }
                        );
                        clearTimeout(timeoutId);
                        if (res.ok) {
                            const data = await res.json();
                            const addr = data.address || {};
                            const sub = addr.suburb || addr.neighbourhood || addr.city_district || "";
                            if (sub) {
                                detectedArea = sub;
                            }
                        }
                    } catch (e) {
                        // ignore reverse geocode timeout
                    }

                    setSelectedCity(detectedCity);
                    if (detectedArea) {
                        setSelectedArea(detectedArea);
                        toast.success(`Location set to ${detectedCity} (${detectedArea}) 🎯`);
                    } else {
                        toast.success(`Nearest City detected: ${detectedCity} 🎯`);
                    }
                } catch (err: any) {
                    toast.error("Location calculate nahi ho saki. Please manual select karein.");
                } finally {
                    setIsLocating(false);
                }
            },
            (error) => {
                setIsLocating(false);
                toast.error("Location permission denied. Shehr dropdown se select karein.");
            },
            { timeout: 8000 }
        );
    };

    const clearAllFilters = () => {
        setSelectedCity("All");
        setSelectedArea("");
        setSearchQuery("");
        setSelectedCategory("all");
        setOnlyOpen(false);
        setSortBy("recommended");
    };

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-emerald-500/20 selection:text-emerald-500">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/85 border-b border-border/60 transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                                <Store className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-lg tracking-tight leading-none text-foreground flex items-center gap-1.5">
                                    SoleWhat <span className="text-emerald-500 font-semibold text-xs uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">Dukaan</span>
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium">Mohalla Store Directory</span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Location Badge Display */}
                    <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-muted/60 border border-border/60 text-xs">
                        <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-bold text-foreground">
                            {selectedCity === "All" ? "Pakistan (All Cities)" : selectedCity}
                            {selectedArea ? ` • ${selectedArea}` : ""}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link href="/#create-store">
                            <Button size="sm" className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer">
                                <Store className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Apni Dukaan Banayein</span>
                                <span className="sm:hidden">Register</span>
                            </Button>
                        </Link>
                        <Link href="/dashboard">
                            <Button size="sm" variant="outline" className="rounded-full text-xs font-semibold border-border/80">
                                Sign In
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* HERO SECTION WITH LOCATION SEARCH */}
            <section className="relative pt-10 pb-14 px-4 sm:px-6 overflow-hidden bg-gradient-to-b from-emerald-500/[0.04] via-transparent to-transparent border-b border-border/40">
                {/* Background Ambient Glows */}
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[42rem] h-[20rem] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
                <div className="absolute top-20 right-10 w-[20rem] h-[20rem] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

                <div className="max-w-5xl mx-auto text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide animate-fade-in">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Apke Mohallay Ki Apni Dukaan - 30 Minutes Direct WhatsApp Delivery</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.15]">
                        Apna Ilaqa Select Karein, <br />
                        <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                            Mohallay Ki Dukaan Se Order Mangwayein
                        </span>
                    </h1>

                    <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Chahay subha ka khalis doodh ho, dophar ki fresh roti & ration, ya shaam ka nashta — apne qareebi dukaandaar se direct WhatsApp par order karein bina kisi extra fees ke.
                    </p>

                    {/* MAIN SEARCH & LOCATION CARD */}
                    <div className="mt-8 pt-2">
                        <div className="glass-panel p-3 sm:p-4 rounded-3xl border border-emerald-500/25 shadow-2xl shadow-emerald-500/5 bg-background/80 backdrop-blur-xl max-w-4xl mx-auto text-left">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                {/* City Selector */}
                                <div className="md:col-span-4 relative">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1 px-1">
                                        Shehr (City)
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={selectedCity}
                                            onChange={(e) => {
                                                setSelectedCity(e.target.value);
                                                setSelectedArea(""); // reset area when city changes
                                            }}
                                            className="w-full h-12 pl-10 pr-8 rounded-2xl bg-muted/50 border border-border/80 text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                                        >
                                            {PAKISTANI_CITIES.map((city) => (
                                                <option key={city} value={city}>
                                                    {city === "All" ? "🇵🇰 All Cities (Poora Pakistan)" : `${city}`}
                                                </option>
                                            ))}
                                        </select>
                                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 pointer-events-none" />
                                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>

                                {/* Mohalla / Area Input & Suggestions */}
                                <div className="md:col-span-5 relative">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1 px-1">
                                        Mohalla / Ilaqa / Address
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            value={selectedArea}
                                            onChange={(e) => setSelectedArea(e.target.value)}
                                            placeholder="e.g. Johar Town, DHA, Gulberg..."
                                            className="h-12 pl-10 pr-8 rounded-2xl bg-muted/50 border-border/80 text-sm font-medium focus-visible:ring-emerald-500"
                                        />
                                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 pointer-events-none" />
                                        {selectedArea && (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedArea("")}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* GPS Detect Button */}
                                <div className="md:col-span-3 flex items-end">
                                    <Button
                                        type="button"
                                        onClick={handleDetectLocation}
                                        disabled={isLocating}
                                        className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                                    >
                                        <Navigation className={`h-4 w-4 ${isLocating ? "animate-spin" : ""}`} />
                                        <span>{isLocating ? "Detecting..." : "Detect Location"}</span>
                                    </Button>
                                </div>
                            </div>

                            {/* Popular Mohallas Quick Chips */}
                            {currentCityAreas.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2 flex-wrap">
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                        <Compass className="h-3 w-3 text-emerald-500" /> Popular:
                                    </span>
                                    {currentCityAreas.map((area) => {
                                        const isSelected = selectedArea.toLowerCase() === area.toLowerCase();
                                        return (
                                            <button
                                                key={area}
                                                type="button"
                                                onClick={() => setSelectedArea(isSelected ? "" : area)}
                                                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                                                    isSelected
                                                        ? "bg-emerald-500 text-white shadow-sm font-bold"
                                                        : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50"
                                                }`}
                                            >
                                                {area}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Secondary Search (Product / Dukaan Name) & Category Chips */}
                    <div className="max-w-4xl mx-auto pt-4 space-y-3">
                        <div className="relative">
                            <Input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Dukaan ka naam ya item search karein (e.g. Bismillah Store, Milk, Atta, Dawn Bread, Gosht)..."
                                className="h-11 pl-10 pr-9 rounded-full bg-card/60 backdrop-blur-md border-border/70 text-sm shadow-sm focus-visible:ring-emerald-500"
                            />
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Category Selector Pills */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                            {CATEGORIES.map((cat) => {
                                const isSelected = selectedCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                            isSelected
                                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25 scale-105"
                                                : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60"
                                        }`}
                                    >
                                        <span>{cat.icon}</span>
                                        <span>{cat.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* RESULTS & STORES LISTING SECTION */}
            <section className="py-10 px-4 sm:px-6 max-w-7xl mx-auto">
                {/* Control bar: Result count, Open filter, Sorting */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/60">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                            <span>Dukaanein (Stores)</span>
                            <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                                {filteredStores.length} Available
                            </Badge>
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Showing stores in{" "}
                            <span className="font-bold text-foreground">
                                {selectedCity === "All" ? "Pakistan" : selectedCity}
                            </span>
                            {selectedArea && (
                                <span>
                                    {" "}
                                    (Mohalla: <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedArea}</span>)
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
                        {/* Only Open Toggle */}
                        <button
                            type="button"
                            onClick={() => setOnlyOpen(!onlyOpen)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                                onlyOpen
                                    ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                            }`}
                        >
                            <span className={`h-2 w-2 rounded-full ${onlyOpen ? "bg-white" : "bg-emerald-500"}`} />
                            <span>Khuli Hui Dukaanein (Open Now)</span>
                        </button>

                        {/* Sort Selector */}
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="h-9 pl-3 pr-7 rounded-xl bg-muted/50 border border-border text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer appearance-none"
                            >
                                <option value="recommended">⭐ Recommended</option>
                                <option value="delivery">⚡ Fastest Delivery</option>
                                <option value="freeDelivery">🛵 Free / Low Delivery Fee</option>
                                <option value="products">📦 Most Products</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        </div>

                        {/* Clear Filters (if active) */}
                        {(selectedCity !== "All" || selectedArea || searchQuery || selectedCategory !== "all" || onlyOpen) && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={clearAllFilters}
                                className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                                Reset
                            </Button>
                        )}
                    </div>
                </div>

                {/* STORE CARDS GRID */}
                {filteredStores.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStores.map((store) => (
                            <div
                                key={store.id}
                                className="group rounded-3xl overflow-hidden border border-border/70 bg-card hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 flex flex-col justify-between"
                            >
                                {/* Top Banner Image */}
                                <div>
                                    <div className="relative h-40 w-full overflow-hidden bg-muted">
                                        <img
                                            src={
                                                store.bannerUrl ||
                                                "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80"
                                            }
                                            alt={store.name}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                                        {/* Status Badges on Banner */}
                                        <div className="absolute top-3 left-3 flex items-center gap-2">
                                            {store.isOpen ? (
                                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md text-white font-black text-[10px] tracking-wide uppercase flex items-center gap-1 shadow-sm">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                                    Khula Hai (Open)
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-full bg-red-500/90 backdrop-blur-md text-white font-bold text-[10px] tracking-wide uppercase shadow-sm">
                                                    Abhi Band Hai
                                                </span>
                                            )}
                                        </div>

                                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                                            <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-bold text-[10px] flex items-center gap-1 border border-white/10">
                                                <Clock className="h-3 w-3 text-emerald-400" />
                                                <span>{store.estimatedDeliveryTime || "30-45 mins"}</span>
                                            </span>
                                        </div>

                                        {/* Store Logo overlapping banner bottom */}
                                        <div className="absolute -bottom-4 left-4 h-14 w-14 rounded-2xl bg-card p-1 shadow-lg border-2 border-emerald-500/40 overflow-hidden">
                                            <img
                                                src={
                                                    store.logoUrl ||
                                                    "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=200&auto=format&fit=crop&q=80"
                                                }
                                                alt={store.name}
                                                className="h-full w-full object-cover rounded-xl"
                                            />
                                        </div>

                                        <div className="absolute bottom-2 right-3 text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                                            <Truck className="h-3.5 w-3.5" />
                                            <span>
                                                {store.deliveryFee === 0
                                                    ? "Free Delivery"
                                                    : `Rs. ${store.deliveryFee} Delivery`}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Store Details Body */}
                                    <div className="p-5 pt-7 space-y-3">
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <h3 className="font-black text-lg text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                                                    {store.name}
                                                </h3>
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 font-medium">
                                                {store.tagline || "Apke Mohallay Ki Apni Dukaan"}
                                            </p>
                                        </div>

                                        {/* Location info */}
                                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border/40">
                                            <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                            <span className="line-clamp-2">
                                                {store.address || `${store.area || "City Center"}, ${store.city || "Pakistan"}`}
                                            </span>
                                        </div>

                                        {/* Categories Chips */}
                                        {store.categories && store.categories.length > 0 && (
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {store.categories.slice(0, 3).map((cat, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground"
                                                    >
                                                        {cat}
                                                    </span>
                                                ))}
                                                {store.categories.length > 3 && (
                                                    <span className="text-[10px] text-muted-foreground font-semibold">
                                                        +{store.categories.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Sample Items preview (if available) */}
                                        {store.sampleProducts && store.sampleProducts.length > 0 && (
                                            <div className="pt-1">
                                                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-between">
                                                    <span>Featured Items:</span>
                                                    <span className="text-emerald-600 dark:text-emerald-400">
                                                        {store.productCount} items
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 overflow-hidden text-xs text-foreground/80">
                                                    {store.sampleProducts.slice(0, 2).map((item, i) => (
                                                        <span
                                                            key={i}
                                                            className="truncate bg-muted/60 px-2 py-1 rounded-md text-[11px] border border-border/40"
                                                        >
                                                            {item.name} (Rs. {item.price})
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Card Actions */}
                                <div className="p-5 pt-0 border-t border-border/40 mt-3 flex items-center gap-2">
                                    <Link href={`/s/${store.slug}`} className="flex-1">
                                        <Button
                                            size="sm"
                                            className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/15 flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <ShoppingBag className="h-3.5 w-3.5" />
                                            <span>Dukaan Kholein / Order Now</span>
                                        </Button>
                                    </Link>

                                    {/* Direct WhatsApp Callout button */}
                                    {store.phone && (
                                        <a
                                            href={`https://wa.me/${store.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
                                                `Assalam o Alaikum ${store.name}! Maine SoleWhat par aapki dukaan dekhi hai. Kya aapke paas delivery available hai?`
                                            )}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="WhatsApp Rabta"
                                            className="h-10 w-10 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center transition-colors shrink-0"
                                        >
                                            <MessageCircle className="h-4 w-4" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* EMPTY STATE */
                    <div className="rounded-3xl border border-dashed border-border/80 p-12 text-center max-w-xl mx-auto space-y-4 my-8">
                        <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                            <Store className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-black text-foreground">
                            Is Filter Par Koi Dukaan Nahi Mili
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {selectedArea
                                ? `Mohalla "${selectedArea}" mein abhi koi dukaan registered nahi hai.`
                                : "Aapki search query ke mutabiq koi dukaan nahi mili. Please shehr ya mohalla change karke check karein."}
                        </p>
                        <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                            <Button
                                variant="outline"
                                onClick={clearAllFilters}
                                className="rounded-full text-xs font-semibold"
                            >
                                All Dukaanein Dekhein
                            </Button>
                            <Link href="/#create-store">
                                <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                                    Apni Dukaan Register Karein
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </section>

            {/* CALLOUT BANNER FOR DUKAAN-DAARS */}
            <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white p-8 sm:p-12 border border-emerald-500/30 shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 max-w-3xl space-y-4">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                            <Store className="h-3.5 w-3.5" /> Dukaan-Daar Hazraat Ke Liye Khusoosi Khidmat
                        </div>

                        <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                            Kya Aap Ki Apni Dukaan Hai? <br />
                            <span className="text-emerald-400">2 Minute Mein Digital Dukaan Banayein</span>
                        </h2>

                        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                            Bina kisi Shopify ya monthly fees ke apne mohallay ke customers se direct WhatsApp par orders receive karein. AI Catalog Builder, Auto Invoicing aur WhatsApp Notifications bilkul muft.
                        </p>

                        <div className="flex items-center gap-3 pt-3 flex-wrap">
                            <Link href="/#create-store">
                                <Button className="h-12 px-6 rounded-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/30 flex items-center gap-2 cursor-pointer">
                                    <span>Apni Free Dukaan Banayein</span>
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="/dashboard">
                                <Button
                                    variant="outline"
                                    className="h-12 px-5 rounded-full border-white/20 text-white hover:bg-white/10 font-bold text-sm"
                                >
                                    Merchant Login
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-border/60 py-8 px-4 sm:px-6 text-center text-xs text-muted-foreground">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                            <Store className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-bold text-foreground">SoleWhat Digital Dukaan Network</span>
                    </div>
                    <p>© {new Date().getFullYear()} SoleWhat. Ghar Bethay Mohallay Ki Dukaan Se Khareedari.</p>
                    <div className="flex items-center gap-4">
                        <Link href="/" className="hover:text-foreground">Home</Link>
                        <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
                        <Link href="/terms" className="hover:text-foreground">Terms</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
