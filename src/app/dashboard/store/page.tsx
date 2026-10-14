"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Store,
    ShoppingBag,
    Package,
    Globe,
    Phone,
    ExternalLink,
    Plus,
    Copy,
    Check,
    Truck,
    Clock,
    Sparkles,
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    X,
    Filter,
    Printer,
    Search,
    ChevronDown,
    ArrowUpRight,
    TrendingUp,
    DollarSign,
    Layers,
    MessageCircle,
    Share2,
    Trash2,
    Eye,
    EyeOff,
    Image as ImageIcon,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { PRESET_CATALOG_PRODUCTS, PRESET_HERO_BANNERS, PresetBanner } from "@/lib/catalog-presets";
import StoreSetupWizardModal from "./store-setup-wizard-modal";
import CounterQrModal from "./counter-qr-modal";

interface StoreData {
    id: string;
    name: string;
    slug: string;
    tagline?: string | null;
    description?: string | null;
    bannerUrl?: string | null;
    phone: string;
    address?: string | null;
    city?: string | null;
    currency: string;
    currencySymbol: string;
    deliveryFee: number;
    minOrderAmount: number;
    freeDeliveryAbove?: number | null;
    estimatedDeliveryTime?: string | null;
    openingHours?: string | null;
    noticeMessage?: string | null;
    isOpen: boolean;
    autoNotifyOwner: boolean;
    autoNotifyCustomer: boolean;
    sessionId?: string | null;
    customDomain?: string | null;
    domainVerified: boolean;
    domainStatus: string;
    session?: {
        id: string;
        sessionId: string;
        name: string;
        status: string;
    } | null;
    _count?: {
        products: number;
        orders: number;
    };
}

interface Product {
    id: string;
    name: string;
    price: number;
    compareAtPrice?: number | null;
    unit?: string | null;
    image?: string | null;
    inStock: boolean;
    createdAt: string;
}

interface Order {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerNotes?: string | null;
    total: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
    items: {
        id: string;
        productName: string;
        unitPrice: number;
        quantity: number;
        totalPrice: number;
    }[];
}

interface WhatsAppSessionItem {
    id: string;
    sessionId: string;
    name: string;
    status: string;
}

export default function StoreDashboardPage() {
    const [stores, setStores] = useState<StoreData[]>([]);
    const [activeStore, setActiveStore] = useState<StoreData | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "orders" | "products" | "slider" | "delivery" | "settings">("overview");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [copied, setCopied] = useState<boolean>(false);

    // Modals
    const [showWizardModal, setShowWizardModal] = useState<boolean>(false);
    const [showCounterQrModal, setShowCounterQrModal] = useState<boolean>(false);
    const [showAddProductModal, setShowAddProductModal] = useState<boolean>(false);

    // Products & Orders state
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>("ALL");
    const [productSearch, setProductSearch] = useState<string>("");
    const [sessions, setSessions] = useState<WhatsAppSessionItem[]>([]);

    // Slider / Banners State
    const [isSliderEnabled, setIsSliderEnabled] = useState<boolean>(true);
    const [customBanners, setCustomBanners] = useState<PresetBanner[]>(PRESET_HERO_BANNERS);
    const [isSavingBanners, setIsSavingBanners] = useState<boolean>(false);
    const [previewSlideIndex, setPreviewSlideIndex] = useState<number>(0);

    // New Product Form
    const [productName, setProductName] = useState<string>("");
    const [productPrice, setProductPrice] = useState<string>("");
    const [productComparePrice, setProductComparePrice] = useState<string>("");
    const [productUnit, setProductUnit] = useState<string>("item");
    const [productImage, setProductImage] = useState<string>("");

    // Settings Inputs
    const [customDomainInput, setCustomDomainInput] = useState<string>("");
    const [isSavingDomain, setIsSavingDomain] = useState<boolean>(false);
    const [selectedSessionId, setSelectedSessionId] = useState<string>("");
    const [noticeMessageInput, setNoticeMessageInput] = useState<string>("");

    // Delivery & Timings Inputs
    const [deliveryFeeInput, setDeliveryFeeInput] = useState<string>("0");
    const [freeDeliveryAboveInput, setFreeDeliveryAboveInput] = useState<string>("");
    const [deliveryTimeInput, setDeliveryTimeInput] = useState<string>("30-45 mins");
    const [openingHoursInput, setOpeningHoursInput] = useState<string>("9:00 AM - 11:00 PM");
    const [isSavingDelivery, setIsSavingDelivery] = useState<boolean>(false);
    const [isImportingPresets, setIsImportingPresets] = useState<boolean>(false);

    // Load Stores & Sessions on mount
    useEffect(() => {
        fetchStores();
        fetchSessions();
    }, []);

    // Sync state when activeStore or tab changes
    useEffect(() => {
        if (activeStore) {
            setCustomDomainInput(activeStore.customDomain || "");
            setDeliveryFeeInput(activeStore.deliveryFee?.toString() || "0");
            setFreeDeliveryAboveInput(activeStore.freeDeliveryAbove ? activeStore.freeDeliveryAbove.toString() : "");
            setDeliveryTimeInput(activeStore.estimatedDeliveryTime || "30-45 mins");
            setOpeningHoursInput(activeStore.openingHours || "9:00 AM - 11:00 PM");
            setNoticeMessageInput(activeStore.noticeMessage || "");
            setSelectedSessionId(activeStore.sessionId || "");

            // Parse banner slider configuration
            if (activeStore.bannerUrl === "OFF" || activeStore.bannerUrl === "DISABLED") {
                setIsSliderEnabled(false);
            } else if (activeStore.bannerUrl) {
                try {
                    const parsed = JSON.parse(activeStore.bannerUrl);
                    if (parsed && typeof parsed === "object") {
                        setIsSliderEnabled(parsed.enabled !== false);
                        if (Array.isArray(parsed.banners) && parsed.banners.length > 0) {
                            setCustomBanners(parsed.banners);
                        } else {
                            setCustomBanners(PRESET_HERO_BANNERS);
                        }
                    }
                } catch {
                    setIsSliderEnabled(true);
                    setCustomBanners(PRESET_HERO_BANNERS);
                }
            } else {
                setIsSliderEnabled(true);
                setCustomBanners(PRESET_HERO_BANNERS);
            }

            fetchProducts(activeStore.id);
            fetchOrders(activeStore.id);
        }
    }, [activeStore]);

    const handleSaveBanners = async () => {
        if (!activeStore) return;
        setIsSavingBanners(true);
        try {
            const payloadValue = !isSliderEnabled
                ? "DISABLED"
                : JSON.stringify({ enabled: true, banners: customBanners });

            const res = await fetch(`/api/stores/${activeStore.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bannerUrl: payloadValue })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success(isSliderEnabled
                ? "Slider aur banners kamiyabi se update ho gaye! 🖼️"
                : "Slider band kar diya gaya hai (Storefront par old banners nahi show honge)! 🚫");
            setActiveStore(data.store);
            fetchStores();
        } catch (err: any) {
            toast.error(err.message || "Failed to save banners");
        } finally {
            setIsSavingBanners(false);
        }
    };

    const fetchSessions = async () => {
        try {
            const res = await fetch("/api/sessions");
            const data = await res.json();
            if (res.ok && data.data && Array.isArray(data.data)) {
                setSessions(data.data);
            }
        } catch (e) {
            console.error("Error fetching sessions:", e);
        }
    };

    const fetchStores = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/stores");
            const data = await res.json();
            if (res.ok && data.stores) {
                setStores(data.stores);
                if (data.stores.length > 0) {
                    // Check if a specific storeId was requested via URL query param
                    if (typeof window !== "undefined") {
                        const urlParams = new URLSearchParams(window.location.search);
                        const targetStoreId = urlParams.get("storeId");
                        const matchedStore = data.stores.find((s: StoreData) => s.id === targetStoreId);
                        if (matchedStore) {
                            setActiveStore(matchedStore);
                            return;
                        }
                    }
                    setActiveStore(data.stores[0]);
                }
            }
        } catch (e) {
            console.error("Error fetching stores:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProducts = async (storeId: string) => {
        try {
            const res = await fetch(`/api/stores/${storeId}/products`);
            const data = await res.json();
            if (res.ok && data.products) {
                setProducts(data.products);
            }
        } catch (e) {
            console.error("Error fetching products:", e);
        }
    };

    const fetchOrders = async (storeId: string) => {
        try {
            const url = selectedOrderStatus === "ALL"
                ? `/api/stores/${storeId}/orders`
                : `/api/stores/${storeId}/orders?status=${selectedOrderStatus}`;
            const res = await fetch(url);
            const data = await res.json();
            if (res.ok && data.orders) {
                setOrders(data.orders);
            }
        } catch (e) {
            console.error("Error fetching orders:", e);
        }
    };

    // Recalculate orders when filter status changes
    useEffect(() => {
        if (activeStore) {
            fetchOrders(activeStore.id);
        }
    }, [selectedOrderStatus]);

    const handleSaveDelivery = async () => {
        if (!activeStore) return;
        setIsSavingDelivery(true);
        try {
            const res = await fetch(`/api/stores/${activeStore.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    deliveryFee: Number(deliveryFeeInput) || 0,
                    freeDeliveryAbove: freeDeliveryAboveInput ? Number(freeDeliveryAboveInput) : null,
                    estimatedDeliveryTime: deliveryTimeInput.trim(),
                    openingHours: openingHoursInput.trim(),
                    noticeMessage: noticeMessageInput.trim() || null
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success("Delivery charges, timing aur auqaat kamiyabi se update ho gaye! 🛵");
            setActiveStore(data.store);
            fetchStores();
        } catch (err: any) {
            toast.error(err.message || "Failed to update delivery settings");
        } finally {
            setIsSavingDelivery(false);
        }
    };

    const handleImportPresets = async () => {
        if (!activeStore) return;
        setIsImportingPresets(true);
        try {
            const res = await fetch(`/api/stores/${activeStore.id}/presets`, {
                method: "POST"
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success(data.message || "Pre-loaded products dukaan par add ho gaye! 📦");
            fetchProducts(activeStore.id);
        } catch (err: any) {
            toast.error(err.message || "Failed to import preset items");
        } finally {
            setIsImportingPresets(false);
        }
    };

    const handleSaveDomainAndSession = async () => {
        if (!activeStore) return;
        setIsSavingDomain(true);
        try {
            const res = await fetch(`/api/stores/${activeStore.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customDomain: customDomainInput.trim() || null,
                    sessionId: selectedSessionId || null
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success("Domain aur WhatsApp session settings update ho gayi hain! ✅");
            setActiveStore(data.store);
            fetchStores();
        } catch (err: any) {
            toast.error(err.message || "Failed to update domain/session");
        } finally {
            setIsSavingDomain(false);
        }
    };

    const handleToggleStoreOpen = async () => {
        if (!activeStore) return;
        const newStatus = !activeStore.isOpen;
        try {
            const res = await fetch(`/api/stores/${activeStore.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isOpen: newStatus })
            });
            const data = await res.json();
            if (res.ok) {
                setActiveStore(data.store);
                toast.success(newStatus ? "Dukaan Online ho gayi hai! (Accepting orders) 🟢" : "Dukaan Closed mark kar di gayi hai. 🔴");
                fetchStores();
            }
        } catch (e) {
            toast.error("Failed to update store status");
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeStore || !productName.trim() || !productPrice) return;

        try {
            const res = await fetch(`/api/stores/${activeStore.id}/products`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: productName,
                    price: Number(productPrice),
                    compareAtPrice: productComparePrice ? Number(productComparePrice) : null,
                    unit: productUnit,
                    image: productImage
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success(`"${productName}" dukaan par add ho gaya! 🎉`);
            setShowAddProductModal(false);
            setProductName("");
            setProductPrice("");
            setProductComparePrice("");
            setProductUnit("item");
            setProductImage("");
            fetchProducts(activeStore.id);
        } catch (err: any) {
            toast.error(err.message || "Failed to add product");
        }
    };

    const handleToggleProductStock = async (product: Product) => {
        if (!activeStore) return;
        try {
            const newStock = !product.inStock;
            const res = await fetch(`/api/stores/${activeStore.id}/products/${product.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inStock: newStock })
            });
            if (res.ok) {
                toast.success(`"${product.name}" ab ${newStock ? "In Stock 🟢" : "Out of Stock 🔴"} hai`);
                fetchProducts(activeStore.id);
            }
        } catch (e) {
            toast.error("Stock status update nahi ho saka");
        }
    };

    const handleDeleteProduct = async (product: Product) => {
        if (!activeStore) return;
        if (!confirm(`Kya aap waqai "${product.name}" ko dukaan se delete karna chahte hain?`)) return;

        try {
            const res = await fetch(`/api/stores/${activeStore.id}/products/${product.id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                toast.success(`"${product.name}" delete ho gaya!`);
                fetchProducts(activeStore.id);
            }
        } catch (e) {
            toast.error("Product delete nahi ho saka");
        }
    };

    const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
        if (!activeStore) return;
        try {
            const res = await fetch(`/api/stores/${activeStore.id}/orders`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId,
                    status: newStatus,
                    notifyCustomer: true
                })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`Order #${data.order.orderNumber} status -> ${newStatus}. WhatsApp alert sent! 📲`);
                fetchOrders(activeStore.id);
            }
        } catch (e) {
            toast.error("Failed to update order status");
        }
    };

    const copyStoreLink = () => {
        if (!activeStore) return;
        const origin = window.location.origin;
        const url = activeStore.customDomain ? `https://${activeStore.customDomain}` : `${origin}/s/${activeStore.slug}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Store link copy ho gaya hai!");
        setTimeout(() => setCopied(false), 2000);
    };

    // Executive Metrics Computations
    const totalRevenue = useMemo(() => {
        return orders
            .filter(o => o.status !== "CANCELLED")
            .reduce((sum, o) => sum + (o.total || 0), 0);
    }, [orders]);

    const pendingOrdersCount = useMemo(() => {
        return orders.filter(o => o.status === "PENDING").length;
    }, [orders]);

    const filteredProducts = useMemo(() => {
        if (!productSearch.trim()) return products;
        const q = productSearch.toLowerCase().trim();
        return products.filter(p => p.name.toLowerCase().includes(q));
    }, [products, productSearch]);

    // Store Readiness Checklist score (0 to 100%)
    const checklistScore = useMemo(() => {
        if (!activeStore) return 0;
        let score = 20; // store created
        if (activeStore.estimatedDeliveryTime) score += 20;
        if (products.length > 0) score += 25;
        if (activeStore.sessionId || activeStore.phone) score += 20;
        if (activeStore.noticeMessage || activeStore.freeDeliveryAbove) score += 15;
        return score;
    }, [activeStore, products]);

    if (isLoading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-3">
                <RefreshCw className="w-9 h-9 animate-spin text-emerald-600" />
                <p className="text-sm font-semibold text-slate-600">Digital Dukaan Hub Load Ho Raha Hai...</p>
            </div>
        );
    }

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const currentLiveStoreUrl = activeStore
        ? activeStore.customDomain
            ? `https://${activeStore.customDomain}`
            : `${origin}/s/${activeStore.slug}`
        : "";

    return (
        <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-6">
            {/* TOP EXECUTIVE BAR & STORE SWITCHER */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
                        {activeStore ? activeStore.name.charAt(0) : "D"}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Store Switcher Dropdown */}
                            {stores.length > 1 ? (
                                <div className="relative inline-block">
                                    <select
                                        value={activeStore?.id}
                                        onChange={(e) => {
                                            const s = stores.find(x => x.id === e.target.value);
                                            if (s) setActiveStore(s);
                                        }}
                                        className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-1 text-sm sm:text-base font-extrabold text-slate-900 pr-8 focus:outline-none cursor-pointer"
                                    >
                                        {stores.map(st => (
                                            <option key={st.id} value={st.id}>
                                                🏪 {st.name} ({st.city || "Pakistan"})
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            ) : (
                                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
                                    {activeStore?.name || "Digital Dukaan"}
                                </h1>
                            )}

                            {/* Store Open/Closed Live Toggle */}
                            {activeStore && (
                                <button
                                    onClick={handleToggleStoreOpen}
                                    title="Dukaan ka status badlein (Online / Closed)"
                                    className={`px-3 py-0.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                        activeStore.isOpen
                                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200"
                                            : "bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200"
                                    }`}
                                >
                                    <span className="w-2 h-2 rounded-full animate-pulse bg-current" />
                                    <span>{activeStore.isOpen ? "Online (Orders Khule Hain)" : "Closed (Abhi Band Hai)"}</span>
                                </button>
                            )}
                        </div>

                        {activeStore && (
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                <span>📱 {activeStore.phone}</span>
                                <span>•</span>
                                <span>⏱️ {activeStore.estimatedDeliveryTime || "30-45 mins"}</span>
                                <span>•</span>
                                <span>📍 {activeStore.city || "Pakistan"}</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Primary Actions: Setup Wizard, QR Poster, Live Store */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setShowWizardModal(true)}
                        className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>Nayi Dukaan Setup Wizard</span>
                    </button>

                    {activeStore && (
                        <>
                            <button
                                onClick={() => setShowCounterQrModal(true)}
                                className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                                <Printer className="w-4 h-4 text-indigo-600" />
                                <span>Counter QR Stand</span>
                            </button>

                            <a
                                href={currentLiveStoreUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                                <span>Live Dukaan ↗</span>
                            </a>
                        </>
                    )}
                </div>
            </div>

            {/* EMPTY STATE: NO STORES */}
            {stores.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 sm:p-14 text-center max-w-xl mx-auto my-8 space-y-5 shadow-xs">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                        <Store className="w-10 h-10" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                            Aapki Koi Online Dukaan Mojood Nahi Hai
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
                            Bina kisi Shopify subscription ya technical hosting ke apni dukaan banayein. Har mohallay ke karkun direct WhatsApp par orders receive kar sakte hain.
                        </p>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={() => setShowWizardModal(true)}
                            className="px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg transition flex items-center gap-2 mx-auto cursor-pointer"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>Pehli Dukaan Banayein (1-Minute Setup)</span>
                        </button>
                    </div>
                </div>
            ) : (
                activeStore && (
                    <div className="space-y-6">
                        {/* EXECUTIVE KPI METRIC CARDS */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            {/* Card 1: Total Orders */}
                            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                                    <span>Total Orders</span>
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                        <ShoppingBag className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                                        {orders.length}
                                    </span>
                                    {pendingOrdersCount > 0 && (
                                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                                            {pendingOrdersCount} naye
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-400">WhatsApp par receive hue tamam orders</p>
                            </div>

                            {/* Card 2: Total Sales (PKR) */}
                            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                                    <span>Total Sales</span>
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                        <TrendingUp className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 truncate">
                                    Rs. {totalRevenue.toLocaleString("en-PK")}
                                </div>
                                <p className="text-[11px] text-slate-400">Ghar tak delivery ka mukammal revenue</p>
                            </div>

                            {/* Card 3: Products in Catalog */}
                            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                                    <span>Products</span>
                                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                        <Package className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                                        {products.length}
                                    </span>
                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                        {products.filter(p => p.inStock).length} in-stock
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-400">Dukaan ki inventory mein available items</p>
                            </div>

                            {/* Card 4: WhatsApp Automation */}
                            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                                    <span>WhatsApp Alerts</span>
                                    <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                                        <MessageCircle className="w-4 h-4" />
                                    </div>
                                </div>
                                <div>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                        <span>Active & Connected</span>
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-400">Customer aur dukaan dar ko foran auto bill</p>
                            </div>
                        </div>

                        {/* STORE READINESS CHECKLIST (PROGRESS BAR) */}
                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                                        Store Readiness & Launch Checklist:
                                    </span>
                                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        {checklistScore}% Complete
                                    </span>
                                </div>
                                <button
                                    onClick={copyStoreLink}
                                    className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copied ? "Link Copied!" : "Copy Share Link"}</span>
                                </button>
                            </div>

                            {/* Visual Progress Bar */}
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-emerald-600 h-full transition-all duration-500"
                                    style={{ width: `${checklistScore}%` }}
                                />
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-[11px]">
                                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                                    ✓ Dukaan Info Ready
                                </span>
                                <span className={`flex items-center gap-1 ${activeStore.estimatedDeliveryTime ? "text-emerald-700 font-semibold" : "text-slate-400"}`}>
                                    {activeStore.estimatedDeliveryTime ? "✓ Delivery Set" : "○ Delivery Pending"}
                                </span>
                                <span className={`flex items-center gap-1 ${products.length > 0 ? "text-emerald-700 font-semibold" : "text-slate-400"}`}>
                                    {products.length > 0 ? `✓ Products (${products.length})` : "○ Products Khali"}
                                </span>
                                <span className={`flex items-center gap-1 ${activeStore.phone ? "text-emerald-700 font-semibold" : "text-slate-400"}`}>
                                    {activeStore.phone ? "✓ WhatsApp Alert" : "○ WhatsApp Missing"}
                                </span>
                                <button
                                    onClick={() => setShowCounterQrModal(true)}
                                    className="text-indigo-600 hover:text-indigo-700 font-bold text-left cursor-pointer flex items-center gap-1"
                                >
                                    <span>🖨️ Print Counter QR ➔</span>
                                </button>
                            </div>
                        </div>

                        {/* TAB SLIDER NAVIGATION (Modern Horizontal Pill Slider) */}
                        <div className="relative flex items-center bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                            <div
                                id="store-tab-slider"
                                className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth w-full px-1"
                            >
                                <button
                                    onClick={() => setActiveTab("overview")}
                                    className={`px-4 py-2 font-bold text-xs sm:text-sm rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                                        activeTab === "overview"
                                            ? "bg-slate-900 text-white shadow-sm"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                                    }`}
                                >
                                    <Layers className="w-4 h-4" />
                                    <span>Overview</span>
                                </button>

                                <button
                                    onClick={() => setActiveTab("orders")}
                                    className={`px-4 py-2 font-bold text-xs sm:text-sm rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                                        activeTab === "orders"
                                            ? "bg-emerald-600 text-white shadow-sm"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                                    }`}
                                >
                                    <ShoppingBag className="w-4 h-4" />
                                    <span>Orders ({orders.length})</span>
                                    {pendingOrdersCount > 0 && (
                                        <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                                            {pendingOrdersCount}
                                        </span>
                                    )}
                                </button>

                                <button
                                    onClick={() => setActiveTab("products")}
                                    className={`px-4 py-2 font-bold text-xs sm:text-sm rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                                        activeTab === "products"
                                            ? "bg-emerald-600 text-white shadow-sm"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                                    }`}
                                >
                                    <Package className="w-4 h-4" />
                                    <span>Products ({products.length})</span>
                                </button>

                                <button
                                    onClick={() => setActiveTab("slider")}
                                    className={`px-4 py-2 font-bold text-xs sm:text-sm rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                                        activeTab === "slider"
                                            ? "bg-emerald-600 text-white shadow-sm"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                                    }`}
                                >
                                    <ImageIcon className="w-4 h-4" />
                                    <span>Slider / Banners</span>
                                    {!isSliderEnabled ? (
                                        <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-rose-200">
                                            Off
                                        </span>
                                    ) : (
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    )}
                                </button>

                                <button
                                    onClick={() => setActiveTab("delivery")}
                                    className={`px-4 py-2 font-bold text-xs sm:text-sm rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                                        activeTab === "delivery"
                                            ? "bg-emerald-600 text-white shadow-sm"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                                    }`}
                                >
                                    <Truck className="w-4 h-4" />
                                    <span>Delivery & Auqaat</span>
                                </button>

                                <button
                                    onClick={() => setActiveTab("settings")}
                                    className={`px-4 py-2 font-bold text-xs sm:text-sm rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                                        activeTab === "settings"
                                            ? "bg-emerald-600 text-white shadow-sm"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                                    }`}
                                >
                                    <Globe className="w-4 h-4" />
                                    <span>Domain & Automation</span>
                                </button>
                            </div>
                        </div>

                        {/* TAB 1: OVERVIEW & RECENT ACTIVITY */}
                        {activeTab === "overview" && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left 2 columns: Recent Orders Feed */}
                                <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-extrabold text-base text-slate-900">Recent Orders Stream</h3>
                                            <p className="text-xs text-slate-500">Taza tareen WhatsApp orders aur unka live status</p>
                                        </div>
                                        <button
                                            onClick={() => setActiveTab("orders")}
                                            className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                                        >
                                            Tamam Orders Dekhein ➔
                                        </button>
                                    </div>

                                    {orders.length === 0 ? (
                                        <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl space-y-2">
                                            <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                                            <p className="text-xs font-semibold text-slate-600">Abhi tak koi order receive nahi hua</p>
                                            <p className="text-[11px] text-slate-400">Store ka link WhatsApp status ya Facebook group par share karein</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {orders.slice(0, 5).map(order => (
                                                <div
                                                    key={order.id}
                                                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                                >
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <strong className="text-slate-900 font-mono">#{order.orderNumber}</strong>
                                                            <span className="font-semibold text-slate-800">{order.customerName}</span>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                order.status === "DELIVERED"
                                                                    ? "bg-emerald-100 text-emerald-800"
                                                                    : order.status === "PENDING"
                                                                    ? "bg-amber-100 text-amber-800"
                                                                    : "bg-blue-100 text-blue-800"
                                                            }`}>
                                                                {order.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-slate-500 text-[11px]">
                                                            {order.items.length} items • Total: <strong>Rs. {order.total.toLocaleString("en-PK")}</strong> ({order.paymentMethod})
                                                        </p>
                                                        <p className="text-slate-400 text-[10px] truncate max-w-sm">
                                                            📍 {order.customerAddress}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <a
                                                            href={`https://wa.me/${order.customerPhone.replace(/[^\d]/g, "")}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 font-bold transition flex items-center gap-1 text-[11px]"
                                                        >
                                                            <MessageCircle className="w-3.5 h-3.5" />
                                                            <span>Chat</span>
                                                        </a>
                                                        {order.status === "PENDING" && (
                                                            <button
                                                                onClick={() => handleUpdateOrderStatus(order.id, "CONFIRMED")}
                                                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition"
                                                            >
                                                                Confirm
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Right column: Quick Controls & Share */}
                                <div className="space-y-4">
                                    {/* Storefront Link Card */}
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
                                        <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
                                            <Globe className="w-4 h-4 text-emerald-600" />
                                            <span>Aapka Live Storefront Link</span>
                                        </h4>
                                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono text-[11px] text-emerald-800 font-bold truncate">
                                            {currentLiveStoreUrl}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                            <button
                                                onClick={copyStoreLink}
                                                className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                                            >
                                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                                <span>{copied ? "Copied" : "Copy Link"}</span>
                                            </button>
                                            <a
                                                href={currentLiveStoreUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                <span>Open Store</span>
                                            </a>
                                        </div>
                                    </div>

                                    {/* Physical Shop Counter Stand Card */}
                                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-md space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Printer className="w-5 h-5 text-indigo-400" />
                                            <h4 className="font-extrabold text-sm text-white">Dukaan Counter Stand</h4>
                                        </div>
                                        <p className="text-xs text-slate-300 leading-relaxed">
                                            Apni dukaan ke counter ke liye QR Stand print karein taake mohallay ke log scan karke ghar se order kar sakein!
                                        </p>
                                        <button
                                            onClick={() => setShowCounterQrModal(true)}
                                            className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                                        >
                                            <Printer className="w-4 h-4" />
                                            <span>Poster / Standee Print Karein</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: ORDERS MANAGER */}
                        {activeTab === "orders" && (
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h3 className="font-extrabold text-base text-slate-900">Orders Management</h3>
                                        <p className="text-xs text-slate-500">Tamam orders ko track karein aur status update karke auto WhatsApp alert bhejein</p>
                                    </div>

                                    {/* Filter Status Chips */}
                                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                                        {["ALL", "PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].map(st => (
                                            <button
                                                key={st}
                                                onClick={() => setSelectedOrderStatus(st)}
                                                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer whitespace-nowrap ${
                                                    selectedOrderStatus === st
                                                        ? "bg-slate-900 text-white border-slate-900"
                                                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                                }`}
                                            >
                                                {st === "ALL" ? "All Orders" : st}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {orders.length === 0 ? (
                                    <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl my-4 space-y-2">
                                        <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                                        <p className="text-sm font-semibold text-slate-700">Koi order mojood nahi hai</p>
                                        <p className="text-xs text-slate-400">Selected filter status ke mutabiq orders khali hain.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3.5">
                                        {orders.map(order => (
                                            <div
                                                key={order.id}
                                                className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-3 shadow-2xs"
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono font-bold text-sm text-slate-900">
                                                                #{order.orderNumber}
                                                            </span>
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide ${
                                                                order.status === "DELIVERED"
                                                                    ? "bg-emerald-100 text-emerald-800"
                                                                    : order.status === "PENDING"
                                                                    ? "bg-amber-100 text-amber-800"
                                                                    : order.status === "CANCELLED"
                                                                    ? "bg-rose-100 text-rose-800"
                                                                    : "bg-blue-100 text-blue-800"
                                                            }`}>
                                                                {order.status}
                                                            </span>
                                                            <span className="text-xs text-slate-400 font-mono">
                                                                {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs font-semibold text-slate-700 mt-1">
                                                            Customer: <strong>{order.customerName}</strong> ({order.customerPhone})
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <a
                                                            href={`https://wa.me/${order.customerPhone.replace(/[^\d]/g, "")}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-3 py-1.5 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                                                        >
                                                            <MessageCircle className="w-3.5 h-3.5" />
                                                            <span>WhatsApp Chat</span>
                                                        </a>
                                                    </div>
                                                </div>

                                                {/* Items summary */}
                                                <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs text-slate-700">
                                                    <div className="font-bold text-slate-900 text-[11px] mb-1">Items Ordered:</div>
                                                    {order.items.map((it, idx) => (
                                                        <div key={idx} className="flex justify-between">
                                                            <span>{it.quantity}x {it.productName}</span>
                                                            <span className="font-mono font-semibold">Rs. {it.totalPrice}</span>
                                                        </div>
                                                    ))}
                                                    <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
                                                        <span>Total Bill ({order.paymentMethod}):</span>
                                                        <span className="text-emerald-700">Rs. {order.total.toLocaleString("en-PK")}</span>
                                                    </div>
                                                </div>

                                                {/* Customer Delivery Address */}
                                                <div className="text-xs text-slate-600 flex items-start gap-1.5">
                                                    <Truck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                                    <span><strong>Address:</strong> {order.customerAddress}</span>
                                                    {order.customerNotes && (
                                                        <span className="text-amber-700 ml-2">({order.customerNotes})</span>
                                                    )}
                                                </div>

                                                {/* Status Action Buttons */}
                                                <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100 text-xs">
                                                    <span className="text-[11px] font-bold text-slate-500">Status Update:</span>
                                                    {order.status === "PENDING" && (
                                                        <button
                                                            onClick={() => handleUpdateOrderStatus(order.id, "CONFIRMED")}
                                                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer"
                                                        >
                                                            ✓ Confirm Order
                                                        </button>
                                                    )}
                                                    {order.status === "CONFIRMED" && (
                                                        <button
                                                            onClick={() => handleUpdateOrderStatus(order.id, "PREPARING")}
                                                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg cursor-pointer"
                                                        >
                                                            🍲 Packing / Preparing
                                                        </button>
                                                    )}
                                                    {order.status === "PREPARING" && (
                                                        <button
                                                            onClick={() => handleUpdateOrderStatus(order.id, "OUT_FOR_DELIVERY")}
                                                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg cursor-pointer"
                                                        >
                                                            🛵 Rider Dispatched
                                                        </button>
                                                    )}
                                                    {order.status === "OUT_FOR_DELIVERY" && (
                                                        <button
                                                            onClick={() => handleUpdateOrderStatus(order.id, "DELIVERED")}
                                                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                                                        >
                                                            🎉 Mark Delivered
                                                        </button>
                                                    )}
                                                    {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
                                                        <button
                                                            onClick={() => handleUpdateOrderStatus(order.id, "CANCELLED")}
                                                            className="px-3 py-1 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 font-semibold rounded-lg cursor-pointer ml-auto"
                                                        >
                                                            Cancel Order
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 3: PRODUCTS & INVENTORY */}
                        {activeTab === "products" && (
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h3 className="font-extrabold text-base text-slate-900">Products Catalog ({products.length})</h3>
                                        <p className="text-xs text-slate-500">Apne store ke items, prices, packing units aur stock availability control karein</p>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button
                                            onClick={handleImportPresets}
                                            disabled={isImportingPresets}
                                            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition border border-indigo-200 cursor-pointer disabled:opacity-50 shadow-2xs"
                                        >
                                            <Sparkles className="w-4 h-4 text-indigo-600" />
                                            <span>{isImportingPresets ? "Import Ho Raha Hai..." : "Pakistani Grocery Items (1-Click Import)"}</span>
                                        </button>

                                        <button
                                            onClick={() => setShowAddProductModal(true)}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>Add Product</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Search Bar */}
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Product ka naam search karein (e.g. Olper's, Shan, Ghee, Bread)..."
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                    />
                                </div>

                                {filteredProducts.length === 0 ? (
                                    <div className="p-10 text-center border border-dashed border-slate-200 rounded-2xl my-4 space-y-3">
                                        <Package className="w-10 h-10 text-slate-300 mx-auto" />
                                        <p className="text-sm font-semibold text-slate-700">Koi product nahi mila</p>
                                        <p className="text-xs text-slate-400">1-click import button dabayein taake foran 14 grocery items load ho jayen.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                        {filteredProducts.map(p => (
                                            <div
                                                key={p.id}
                                                className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                                                    p.inStock ? "bg-white border-slate-200/90 shadow-2xs" : "bg-slate-50 border-slate-200 opacity-60"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {p.image ? (
                                                        <img
                                                            src={p.image}
                                                            alt={p.name}
                                                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                                                            <Package className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                                            {p.name}
                                                        </h4>
                                                        <p className="text-[11px] text-slate-500">
                                                            Rs. {p.price} {p.unit && `• ${p.unit}`}
                                                            {p.compareAtPrice && (
                                                                <span className="line-through text-slate-400 ml-1.5 text-[10px]">
                                                                    Rs. {p.compareAtPrice}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <button
                                                        onClick={() => handleToggleProductStock(p)}
                                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition ${
                                                            p.inStock
                                                                ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                                                : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
                                                        }`}
                                                    >
                                                        {p.inStock ? "In Stock" : "Out of Stock"}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProduct(p)}
                                                        title="Delete Product"
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB: SLIDER / HERO BANNERS MANAGER */}
                        {activeTab === "slider" && (
                            <div className="space-y-6">
                                {/* Header & Master Toggle */}
                                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                                                <ImageIcon className="w-5 h-5" />
                                            </div>
                                            <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                                                Storefront Hero Slider & Banners
                                            </h3>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Apni dukaan ke promotional banner slides manage karein ya default slider ko mukammal band karein
                                        </p>
                                    </div>

                                    {/* Master Enable/Disable Toggle Button */}
                                    <button
                                        onClick={() => setIsSliderEnabled(!isSliderEnabled)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs ${
                                            isSliderEnabled
                                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                : "bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300"
                                        }`}
                                    >
                                        {isSliderEnabled ? (
                                            <>
                                                <Eye className="w-4 h-4" />
                                                <span>Slider Active Hai (Storefront Par Show Hoga)</span>
                                            </>
                                        ) : (
                                            <>
                                                <EyeOff className="w-4 h-4" />
                                                <span>Slider Band Hai (Old Default Banners Na Show Ho!)</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Banner Notice Alert if Disabled */}
                                {!isSliderEnabled && (
                                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <strong className="block text-sm">Storefront Slider Mukammal Chhupa Diya Gaya Hai (Hidden)</strong>
                                            <p className="text-[11px] text-rose-700">
                                                Customer ko store page par koi bhi purana ya default promotional slider nazar nahi aayega. Seedha Search bar aur Products show honge.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Interactive Live Preview (If Enabled) */}
                                {isSliderEnabled && (
                                    <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md space-y-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                                                <Sparkles className="w-4 h-4" />
                                                <span>Live Storefront Slider Preview ({customBanners.length} Slides):</span>
                                            </span>
                                            <span className="text-[11px] text-slate-400">
                                                Slide {previewSlideIndex + 1} of {Math.max(1, customBanners.length)}
                                            </span>
                                        </div>

                                        {customBanners.length > 0 ? (
                                            <div className="relative aspect-[21/9] sm:aspect-[24/8] min-h-[160px] w-full rounded-2xl overflow-hidden shadow-lg border border-white/10 select-none">
                                                {customBanners.map((b, idx) => (
                                                    <div
                                                        key={b.id || idx}
                                                        className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                                                            idx === previewSlideIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                                                        }`}
                                                    >
                                                        <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                                                        <div className={`absolute inset-0 bg-gradient-to-r ${b.bgGradient || "from-emerald-900/90 to-slate-900/80"} opacity-85`} />
                                                        <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between z-20">
                                                            <div>
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md text-white mb-1 border border-white/20">
                                                                    {b.badge}
                                                                </span>
                                                                <h4 className="text-base sm:text-2xl font-extrabold line-clamp-1">{b.title}</h4>
                                                                <p className="text-[11px] sm:text-xs text-slate-200 line-clamp-1 mt-0.5">{b.subtitle}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[10px] text-emerald-300">
                                                                <span className="bg-black/40 px-2 py-0.5 rounded-lg border border-white/10">
                                                                    🛵 Tez Delivery ({activeStore.estimatedDeliveryTime || "30-45 mins"})
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {customBanners.length > 1 && (
                                                    <>
                                                        <button
                                                            onClick={() => setPreviewSlideIndex(p => (p - 1 + customBanners.length) % customBanners.length)}
                                                            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer hover:bg-black/70"
                                                        >
                                                            <ChevronLeft className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setPreviewSlideIndex(p => (p + 1) % customBanners.length)}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer hover:bg-black/70"
                                                        >
                                                            <ChevronRight className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 py-6 text-center">Koi slide add nahi hai.</p>
                                        )}
                                    </div>
                                )}

                                {/* 1-Click Pakistani Banner Presets */}
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                                            <Sparkles className="w-4 h-4 text-emerald-600" />
                                            <span>Pakistani Banner Themes (1-Click Add Karein):</span>
                                        </h4>
                                        <button
                                            onClick={() => {
                                                setCustomBanners(PRESET_HERO_BANNERS);
                                                toast.info("Default presets restore ho gaye");
                                            }}
                                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                                        >
                                            Reset to Default Presets
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                        {[
                                            {
                                                title: "Ghar Ka Ration Mega Sale 🛒",
                                                subtitle: "Olper's, Shan Masala, Dalda Ghee aur tamam zarooriyat foran mangwayein.",
                                                badge: "Super Bachat",
                                                bgGradient: "from-emerald-700 via-teal-800 to-slate-900",
                                                imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80"
                                            },
                                            {
                                                title: "Dhamaka Free Delivery Offer! 🛵",
                                                subtitle: "Muft delivery hasil karein apne mohallay ki pasandeeda dukaan se.",
                                                badge: "Free Delivery",
                                                bgGradient: "from-amber-600 via-orange-700 to-slate-900",
                                                imageUrl: "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=1200&q=80"
                                            },
                                            {
                                                title: "Taaza Phal & Sabziyan 🍎🥕",
                                                subtitle: "Mandi se taza maal rozana aapke darwazay par.",
                                                badge: "100% Fresh",
                                                bgGradient: "from-green-700 via-emerald-800 to-slate-900",
                                                imageUrl: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=1200&q=80"
                                            },
                                            {
                                                title: "Dairy, Eggs & Bakery Fresh 🥛",
                                                subtitle: "Subah ka nashta taaza doodh aur andon ke sath.",
                                                badge: "Subah Sawere",
                                                bgGradient: "from-blue-600 via-indigo-700 to-slate-900",
                                                imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=1200&q=80"
                                            },
                                            {
                                                title: "Fresh Meat & Chicken 🍗",
                                                subtitle: "Saaf shafaf halal gosht aur chicken foran delivery ke sath.",
                                                badge: "Halal & Clean",
                                                bgGradient: "from-rose-700 via-red-800 to-slate-900",
                                                imageUrl: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=1200&q=80"
                                            }
                                        ].map((preset, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => {
                                                    const newSlide: PresetBanner = {
                                                        id: `banner-${Date.now()}-${i}`,
                                                        ...preset
                                                    };
                                                    setCustomBanners(prev => [...prev, newSlide]);
                                                    toast.success(`"${preset.title}" slider mein add ho gaya!`);
                                                }}
                                                className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 text-left transition cursor-pointer flex items-center gap-2.5 shadow-2xs group"
                                            >
                                                <img src={preset.imageUrl} alt={preset.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-800 text-xs truncate group-hover:text-emerald-700">{preset.title}</p>
                                                    <span className="text-[10px] text-slate-400 block truncate">{preset.badge}</span>
                                                </div>
                                                <Plus className="w-4 h-4 text-emerald-600 ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Manage Active Slides Table */}
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                                        Current Slider Slides ({customBanners.length})
                                    </h4>

                                    <div className="space-y-2.5">
                                        {customBanners.map((slide, idx) => (
                                            <div
                                                key={slide.id || idx}
                                                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="font-black text-slate-400 w-5 shrink-0">#{idx + 1}</span>
                                                    <img src={slide.imageUrl} alt={slide.title} className="w-12 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-slate-900 truncate">{slide.title}</p>
                                                        <p className="text-[11px] text-slate-500 truncate">{slide.subtitle}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                                                        {slide.badge}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            setCustomBanners(prev => prev.filter((_, i) => i !== idx));
                                                            toast.info("Slide delete ho gayi");
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Save Slider Changes */}
                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={handleSaveBanners}
                                        disabled={isSavingBanners}
                                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        <span>{isSavingBanners ? "Saving..." : "Save Slider Changes"}</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: DELIVERY CHARGES & AUQAAT */}
                        {activeTab === "delivery" && (
                            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                                        <Truck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-base text-slate-900">
                                            Delivery Charges, Timings & Dukaan Ke Auqaat
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            Apne mohallay ya shehar ke hisaab se delivery charges, delivery waqt aur dukaan khulnay ke auqaat set karein
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">
                                            Base Delivery Charges ({activeStore.currencySymbol}) *
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="50"
                                            value={deliveryFeeInput}
                                            onChange={e => setDeliveryFeeInput(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-0.5">Muft delivery ke liye 0 likhein.</p>
                                    </div>

                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">
                                            Free Delivery Ka Hadaf ({activeStore.currencySymbol})
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="1000"
                                            value={freeDeliveryAboveInput}
                                            onChange={e => setFreeDeliveryAboveInput(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-0.5">Is amount se zyada par delivery FREE hogi.</p>
                                    </div>

                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">
                                            Estimated Delivery Time *
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 15-20 mins"
                                            value={deliveryTimeInput}
                                            onChange={e => setDeliveryTimeInput(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-0.5">Customer ko storefront aur bill par show hoga.</p>
                                    </div>

                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">
                                            Store Opening Timings *
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 9:00 AM - 11:00 PM"
                                            value={openingHoursInput}
                                            onChange={e => setOpeningHoursInput(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-0.5">Dukaan kab khuli aur kab band hoti hai.</p>
                                    </div>
                                </div>

                                {/* 1-Click Quick Preset Chips */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                    <div className="space-y-1.5">
                                        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                                            <span>Delivery Time Quick Presets:</span>
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {[
                                                "⚡ 15-20 Mins",
                                                "🛵 30-45 Mins",
                                                "⏱️ 1-2 Hours",
                                                "📦 Same Day Delivery",
                                                "🌙 Next Day Delivery"
                                            ].map((preset) => (
                                                <button
                                                    key={preset}
                                                    type="button"
                                                    onClick={() => setDeliveryTimeInput(preset)}
                                                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold cursor-pointer transition ${
                                                        deliveryTimeInput === preset
                                                            ? "bg-amber-100 border-amber-400 text-amber-900 font-bold"
                                                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                                    }`}
                                                >
                                                    {preset}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                            <Store className="w-3.5 h-3.5 text-indigo-600" />
                                            <span>Dukaan Ke Auqaat Quick Presets:</span>
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {[
                                                "☀️ 9:00 AM - 11:00 PM",
                                                "🏪 24/7 Khuli Hai",
                                                "🌙 12:00 PM - 12:00 AM",
                                                "🌅 8:00 AM - 10:00 PM"
                                            ].map((preset) => (
                                                <button
                                                    key={preset}
                                                    type="button"
                                                    onClick={() => setOpeningHoursInput(preset)}
                                                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold cursor-pointer transition ${
                                                        openingHoursInput === preset
                                                            ? "bg-indigo-100 border-indigo-400 text-indigo-900 font-bold"
                                                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                                    }`}
                                                >
                                                    {preset}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Announcement Banner Input */}
                                <div className="pt-2 border-t border-slate-100">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Notice / Announcement Banner (Storefront Ke Top Par Show Hoga)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 🎉 Rs. 1000 se zyada ke order par muft delivery! Taza phal aur sabziyan dastyab hain."
                                        value={noticeMessageInput}
                                        onChange={e => setNoticeMessageInput(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                                    />
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={handleSaveDelivery}
                                        disabled={isSavingDelivery}
                                        className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                                    >
                                        <Truck className="w-4 h-4" />
                                        <span>{isSavingDelivery ? "Saving..." : "Save Delivery & Timing Settings"}</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* TAB 5: DOMAIN & WHATSAPP AUTOMATION */}
                        {activeTab === "settings" && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Custom Domain Card */}
                                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                                            <Globe className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">Custom Domain Integration</h3>
                                            <p className="text-xs text-slate-500">Apni khud ki domain connect karein (e.g. shop.mybrand.pk)</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                                Domain Name
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. shop.bismillahstore.pk"
                                                value={customDomainInput}
                                                onChange={e => setCustomDomainInput(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                            />
                                        </div>

                                        {/* DNS instructions banner */}
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                                            <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                                <span>DNS Setup Hidayat (CNAME Record):</span>
                                            </p>
                                            <p className="text-slate-600 text-[11px] leading-relaxed">
                                                Apne domain registrar (Namecheap, GoDaddy, PKNIC, Cloudflare) mein ja kar yeh record add karein:
                                            </p>
                                            <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px]">
                                                <div>
                                                    <span className="block text-[10px] text-slate-400">TYPE</span>
                                                    <strong>CNAME</strong>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] text-slate-400">HOST</span>
                                                    <strong>shop</strong>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] text-slate-400">TARGET</span>
                                                    <strong>domains.solewhat.com</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* WhatsApp Session Connection Card */}
                                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">WhatsApp Session Connection</h3>
                                            <p className="text-xs text-slate-500">Order aate hi dukaan aur customer ko auto message dispatch karne ke liye</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2 text-xs">
                                        <div>
                                            <label className="block font-bold text-slate-700 mb-1">
                                                Connected Baileys WhatsApp Session
                                            </label>
                                            {sessions.length > 0 ? (
                                                <select
                                                    value={selectedSessionId}
                                                    onChange={e => setSelectedSessionId(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                                >
                                                    <option value="">-- Direct WhatsApp Chat Mode (No Bot) --</option>
                                                    {sessions.map(s => (
                                                        <option key={s.id} value={s.id}>
                                                            🟢 {s.name} ({s.sessionId})
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <p className="text-slate-500 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                                    Koi Baileys WhatsApp session connected nahi hai. Customer orders direct WhatsApp link se aapke number <strong>({activeStore.phone})</strong> par receive honge.
                                                </p>
                                            )}
                                        </div>

                                        <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-[11px] text-slate-700 space-y-1.5">
                                            <p className="font-bold text-emerald-900">Auto-Alert System Summary:</p>
                                            <p>✓ Order place hote hi Dukaan ke WhatsApp par mukammal receipt.</p>
                                            <p>✓ Status change hote hi customer ke WhatsApp par notification.</p>
                                        </div>

                                        <div className="pt-2 flex justify-end">
                                            <button
                                                onClick={handleSaveDomainAndSession}
                                                disabled={isSavingDomain}
                                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                                            >
                                                {isSavingDomain ? "Saving..." : "Save Settings"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )
            )}

            {/* MODAL 1: STEP-BY-STEP STORE SETUP WIZARD */}
            <StoreSetupWizardModal
                isOpen={showWizardModal}
                onClose={() => setShowWizardModal(false)}
                onStoreCreated={(newStore) => {
                    fetchStores();
                    setActiveStore(newStore);
                }}
                onOpenCounterQr={(store) => {
                    setActiveStore(store);
                    setShowCounterQrModal(true);
                }}
            />

            {/* MODAL 2: SHOP COUNTER QR STAND & POSTER */}
            {activeStore && (
                <CounterQrModal
                    isOpen={showCounterQrModal}
                    onClose={() => setShowCounterQrModal(false)}
                    store={activeStore}
                />
            )}

            {/* MODAL 3: ADD NEW PRODUCT MODAL */}
            {showAddProductModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 my-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                                <Package className="w-5 h-5 text-emerald-600" />
                                <span>Naya Product Add Karein</span>
                            </h3>
                            <button
                                onClick={() => setShowAddProductModal(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
                            {/* 1-Click Pre-loaded Items Quick Picker */}
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Pre-loaded Products Se Auto-Fill Karein:</span>
                                </span>
                                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                    {PRESET_CATALOG_PRODUCTS.map((preset, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => {
                                                setProductName(preset.name);
                                                setProductPrice(preset.price.toString());
                                                setProductComparePrice(preset.compareAtPrice ? preset.compareAtPrice.toString() : "");
                                                setProductUnit(preset.unit);
                                                setProductImage(preset.image);
                                                toast.info(`"${preset.name}" auto-filled!`);
                                            }}
                                            className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-500 shrink-0 text-left cursor-pointer transition active:scale-95 shadow-2xs"
                                        >
                                            <img src={preset.image} alt={preset.name} className="w-7 h-7 rounded-md object-cover" />
                                            <div className="text-[10px]">
                                                <p className="font-semibold text-slate-800 truncate max-w-[100px]">{preset.name}</p>
                                                <p className="text-emerald-700 font-bold">Rs. {preset.price}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Product Ka Naam *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Olper's Milk 1 Litre"
                                    value={productName}
                                    onChange={e => setProductName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Qeemat (PKR) *</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="280"
                                        value={productPrice}
                                        onChange={e => setProductPrice(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Original Price (Discount)</label>
                                    <input
                                        type="number"
                                        placeholder="300"
                                        value={productComparePrice}
                                        onChange={e => setProductComparePrice(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Unit / Packing</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 1 Litre, 1 kg, 50g pack, piece"
                                    value={productUnit}
                                    onChange={e => setProductUnit(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Image URL (Optional)</label>
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    value={productImage}
                                    onChange={e => setProductImage(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-md cursor-pointer mt-2"
                            >
                                Product Add Karein
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
