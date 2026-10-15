"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
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
    Calculator,
    ShoppingCart,
    Download,
    UploadCloud,
    FileSpreadsheet,
    Send,
    ChevronLeft,
    ChevronRight,
    Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { PRESET_CATALOG_PRODUCTS, PRESET_HERO_BANNERS, PresetBanner } from "@/lib/catalog-presets";
import StoreSlider from "./store-slider";
import StoreSetupWizardModal from "@/app/dashboard/store/store-setup-wizard-modal";
import CounterQrModal from "@/app/dashboard/store/counter-qr-modal";
import ShippingLabelModal from "@/app/dashboard/store/shipping-label-modal";
import BulkImportModal from "@/app/dashboard/store/bulk-import-modal";
import POSModal from "@/app/dashboard/store/pos-modal";

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
    category?: string | null;
}

interface Order {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerNotes?: string | null;
    subtotal?: number;
    deliveryFee?: number;
    discount?: number;
    total: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
    itemsSnapshot?: any;
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

function StoreDashboardContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [stores, setStores] = useState<StoreData[]>([]);
    const [activeStore, setActiveStore] = useState<StoreData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [copied, setCopied] = useState<boolean>(false);

    // Active Tab driven by URL or state
    const currentTab = (searchParams.get("tab") as any) || "overview";

    const handleSwitchTab = (tab: string) => {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", tab);
        if (activeStore) {
            url.searchParams.set("storeId", activeStore.id);
        }
        router.push(url.pathname + url.search);
    };

    // Modals
    const [showWizardModal, setShowWizardModal] = useState<boolean>(false);
    const [showCounterQrModal, setShowCounterQrModal] = useState<boolean>(false);
    const [showLabelModal, setShowLabelModal] = useState<boolean>(false);
    const [selectedLabelOrder, setSelectedLabelOrder] = useState<Order | null>(null);
    const [showBulkImportModal, setShowBulkImportModal] = useState<boolean>(false);
    const [showPosModal, setShowPosModal] = useState<boolean>(false);

    // Products & Orders state
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>("ALL");
    const [productSearch, setProductSearch] = useState<string>("");
    const [sessions, setSessions] = useState<WhatsAppSessionItem[]>([]);

    // Abandoned Carts State
    const [abandonedCarts, setAbandonedCarts] = useState<any[]>([]);
    const [isLoadingAbandoned, setIsLoadingAbandoned] = useState<boolean>(false);
    const [recoveringCartId, setRecoveringCartId] = useState<string | null>(null);

    // Slider / Banners State
    const [isSliderEnabled, setIsSliderEnabled] = useState<boolean>(true);
    const [customBanners, setCustomBanners] = useState<PresetBanner[]>(PRESET_HERO_BANNERS);
    const [isSavingBanners, setIsSavingBanners] = useState<boolean>(false);
    const [previewSlideIndex, setPreviewSlideIndex] = useState<number>(0);

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

    // Sync state when activeStore changes
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
            fetchAbandonedCarts(activeStore.id);
        }
    }, [activeStore]);

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
                    const targetStoreId = searchParams.get("storeId");
                    const matchedStore = data.stores.find((s: StoreData) => s.id === targetStoreId);
                    if (matchedStore) {
                        setActiveStore(matchedStore);
                        return;
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

    const fetchAbandonedCarts = async (storeId: string) => {
        setIsLoadingAbandoned(true);
        try {
            const res = await fetch(`/api/store/abandoned?storeId=${storeId}`);
            const data = await res.json();
            if (res.ok && data.carts) {
                setAbandonedCarts(data.carts);
            }
        } catch (e) {
            console.error("Error fetching abandoned carts:", e);
        } finally {
            setIsLoadingAbandoned(false);
        }
    };

    const handleRecoverCart = async (cartId: string) => {
        if (!activeStore) return;
        setRecoveringCartId(cartId);
        try {
            const res = await fetch("/api/store/abandoned", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "recover",
                    storeId: activeStore.id,
                    cartId
                })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Recovery message send nahi ho saka");
            }
            toast.success("Recovery WhatsApp alert send ho gaya! 📲");
            fetchAbandonedCarts(activeStore.id);
            if (data.whatsappDirectUrl) {
                window.open(data.whatsappDirectUrl, "_blank");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to recover cart");
        } finally {
            setRecoveringCartId(null);
        }
    };

    const handleExportProductsCSV = () => {
        if (!products.length) {
            toast.error("Export karne ke liye koi product nahi hai");
            return;
        }
        const headers = "Name,Category,Price,CompareAtPrice,Unit,ImageURL,InStock\n";
        const rows = products.map(p => `"${p.name.replace(/"/g, '""')}","${p.category || 'General'}",${p.price},${p.compareAtPrice || ''},"${p.unit || ''}","${p.image || ''}",${p.inStock}`).join("\n");
        const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${activeStore?.slug || "store"}-products.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Products CSV export ho gaya hai! 📄");
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
                toast.success(newStatus ? "Dukaan Online ho gayi hai! 🟢" : "Dukaan Closed mark kar di gayi hai. 🔴");
                fetchStores();
            }
        } catch {
            toast.error("Failed to update store status");
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
        } catch {
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
        } catch {
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
        } catch {
            toast.error("Failed to update order status");
        }
    };

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
                ? "Slider aur banners update ho gaye! 🖼️"
                : "Slider band kar diya gaya hai! 🚫");
            setActiveStore(data.store);
            fetchStores();
        } catch (err: any) {
            toast.error(err.message || "Failed to save banners");
        } finally {
            setIsSavingBanners(false);
        }
    };

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

            toast.success("Delivery settings update ho gayi hain! 🛵");
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

            toast.success(data.message || "Pakistani Grocery Items dukaan par add ho gaye! 📦");
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

            toast.success("Domain aur WhatsApp session settings save ho gayi hain! ✅");
            setActiveStore(data.store);
            fetchStores();
        } catch (err: any) {
            toast.error(err.message || "Failed to update domain/session");
        } finally {
            setIsSavingDomain(false);
        }
    };

    const copyStoreLink = () => {
        if (!activeStore) return;
        const origin = window.location.origin;
        const url = activeStore.customDomain ? `https://${activeStore.customDomain}` : `${origin}/s/${activeStore.slug}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Storefront link copy ho gaya!");
        setTimeout(() => setCopied(false), 2000);
    };

    // Computations
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

    const checklistScore = useMemo(() => {
        if (!activeStore) return 0;
        let score = 20;
        if (activeStore.estimatedDeliveryTime) score += 20;
        if (products.length > 0) score += 25;
        if (activeStore.sessionId || activeStore.phone) score += 20;
        if (activeStore.noticeMessage || activeStore.freeDeliveryAbove) score += 15;
        return score;
    }, [activeStore, products]);

    if (isLoading) {
        return (
            <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] space-y-3">
                <RefreshCw className="w-9 h-9 animate-spin text-emerald-600" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Dedicated Store Dashboard Load Ho Raha Hai...
                </p>
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
        <div className="max-w-7xl mx-auto space-y-6 pt-12 md:pt-0">
            
            {/* TOP EXECUTIVE BAR & STORE SWITCHER */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
                        {activeStore ? activeStore.name.charAt(0) : "D"}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Store Switcher */}
                            {stores.length > 1 ? (
                                <div className="relative inline-block">
                                    <select
                                        value={activeStore?.id}
                                        onChange={(e) => {
                                            const s = stores.find(x => x.id === e.target.value);
                                            if (s) setActiveStore(s);
                                        }}
                                        className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 rounded-xl px-3 py-1 text-sm sm:text-base font-extrabold text-slate-900 dark:text-white pr-8 focus:outline-none cursor-pointer"
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
                                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                                    {activeStore?.name || "Digital Dukaan"}
                                </h1>
                            )}

                            {/* Store Status Toggle */}
                            {activeStore && (
                                <button
                                    onClick={handleToggleStoreOpen}
                                    title="Dukaan ka status badlein (Online / Closed)"
                                    className={`px-3 py-0.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                        activeStore.isOpen
                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-700"
                                    }`}
                                >
                                    <span className="w-2 h-2 rounded-full animate-pulse bg-current" />
                                    <span>{activeStore.isOpen ? "Online (Accepting Orders)" : "Closed (Abhi Band Hai)"}</span>
                                </button>
                            )}
                        </div>

                        {activeStore && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                                <span>📱 {activeStore.phone}</span>
                                <span>•</span>
                                <span>⏱️ {activeStore.estimatedDeliveryTime || "30-45 mins"}</span>
                                <span>•</span>
                                <span>📍 {activeStore.city || "Pakistan"}</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Primary Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setShowPosModal(true)}
                        className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        title="Dukaan Counter POS Cashier Register Kholein"
                    >
                        <Calculator className="w-4 h-4" />
                        <span>⚡ Counter POS</span>
                    </button>

                    <button
                        onClick={() => setShowBulkImportModal(true)}
                        className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="CSV ya Excel se products bulk import karein"
                    >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span>Bulk Import</span>
                    </button>

                    <a
                        href={`/s/${activeStore?.slug}/track`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                        <Truck className="w-4 h-4 text-blue-600" />
                        <span>Tracking Portal ↗</span>
                    </a>

                    <button
                        onClick={() => setShowCounterQrModal(true)}
                        className="px-3.5 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                        <Printer className="w-4 h-4 text-indigo-600" />
                        <span>Counter Stand</span>
                    </button>

                    <a
                        href={currentLiveStoreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                        <span>Live Storefront ↗</span>
                    </a>
                </div>
            </div>

            {/* DEDICATED STORE CAROUSEL / SLIDER (Requirement 3) */}
            {activeStore && (
                <StoreSlider
                    storeName={activeStore.name}
                    liveStoreUrl={currentLiveStoreUrl}
                    onOpenPos={() => setShowPosModal(true)}
                    onSwitchTab={handleSwitchTab}
                    ordersCount={orders.length}
                    pendingOrdersCount={pendingOrdersCount}
                    abandonedCount={abandonedCarts.filter(c => !c.recovered).length}
                />
            )}

            {/* EMPTY STATE IF NO STORES EXIST */}
            {stores.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-10 sm:p-14 text-center max-w-xl mx-auto my-8 space-y-5 shadow-xs">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                        <Store className="w-10 h-10" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                            Aapki Koi Online Dukaan Mojood Nahi Hai
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
                            Bina kisi Shopify subscription ya hosting fees ke apni dukaan banayein. Har customer direct WhatsApp par orders place kar sakta hai.
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
                            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                                    <span>Total Orders</span>
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl">
                                        <ShoppingBag className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                                        {orders.length}
                                    </span>
                                    {pendingOrdersCount > 0 && (
                                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 animate-pulse">
                                            {pendingOrdersCount} naye
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-400">WhatsApp par receive hue tamam orders</p>
                            </div>

                            {/* Card 2: Total Sales (PKR) */}
                            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                                    <span>Total Sales</span>
                                    <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-xl">
                                        <TrendingUp className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white truncate">
                                    Rs. {totalRevenue.toLocaleString("en-PK")}
                                </div>
                                <p className="text-[11px] text-slate-400">Ghar tak delivery ka mukammal revenue</p>
                            </div>

                            {/* Card 3: Products in Catalog */}
                            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                                    <span>Products</span>
                                    <div className="p-2 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-xl">
                                        <Package className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                                        {products.length}
                                    </span>
                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                                        {products.filter(p => p.inStock).length} in-stock
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-400">Dukaan ki inventory mein available items</p>
                            </div>

                            {/* Card 4: WhatsApp Automation */}
                            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                                    <span>WhatsApp Alerts</span>
                                    <div className="p-2 bg-green-50 dark:bg-green-950 text-green-600 rounded-xl">
                                        <MessageCircle className="w-4 h-4" />
                                    </div>
                                </div>
                                <div>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                        <span>Active & Connected</span>
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-400">Customer aur dukaan dar ko foran auto bill</p>
                            </div>
                        </div>

                        {/* STORE READINESS CHECKLIST */}
                        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                        Store Readiness & Launch Checklist:
                                    </span>
                                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
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

                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
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

                        {/* TAB 1: OVERVIEW */}
                        {currentTab === "overview" && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Recent Orders Stream</h3>
                                            <p className="text-xs text-slate-500">Taza tareen WhatsApp orders aur unka live status</p>
                                        </div>
                                        <button
                                            onClick={() => handleSwitchTab("orders")}
                                            className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                                        >
                                            Tamam Orders Dekhein ➔
                                        </button>
                                    </div>

                                    {orders.length === 0 ? (
                                        <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                                            <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Abhi tak koi order receive nahi hua</p>
                                            <p className="text-[11px] text-slate-400">Store ka link WhatsApp status ya Facebook group par share karein</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {orders.slice(0, 5).map(order => (
                                                <div
                                                    key={order.id}
                                                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                                >
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <strong className="text-slate-900 dark:text-white font-mono">#{order.orderNumber}</strong>
                                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{order.customerName}</span>
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

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedLabelOrder(order);
                                                                setShowLabelModal(true);
                                                            }}
                                                            className="p-1.5 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] flex items-center gap-1 border border-slate-200 dark:border-slate-600"
                                                            title="Print Shipping Label & Slip"
                                                        >
                                                            <Printer className="w-3.5 h-3.5 text-emerald-600" />
                                                            <span>Slip</span>
                                                        </button>

                                                        <a
                                                            href={`https://wa.me/${order.customerPhone.replace(/[^\d]/g, "")}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1.5 px-2.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 font-bold transition flex items-center gap-1 text-[11px]"
                                                        >
                                                            <MessageCircle className="w-3.5 h-3.5" />
                                                            <span>Chat</span>
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Right Controls */}
                                <div className="space-y-4">
                                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
                                        <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                            <Globe className="w-4 h-4 text-emerald-600" />
                                            <span>Aapka Live Storefront Link</span>
                                        </h4>
                                        <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-emerald-800 dark:text-emerald-300 font-bold truncate">
                                            {currentLiveStoreUrl}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                            <button
                                                onClick={copyStoreLink}
                                                className="py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
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

                                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-md space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Printer className="w-5 h-5 text-indigo-400" />
                                            <h4 className="font-extrabold text-sm text-white">Dukaan Counter Stand</h4>
                                        </div>
                                        <p className="text-xs text-slate-300 leading-relaxed">
                                            Apni dukaan ke counter ke liye QR Standee print karein taake mohallay ke log scan karke ghar se order kar sakein!
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

                        {/* TAB 2: POS COUNTER */}
                        {currentTab === "pos" && (
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-xl">
                                                <Calculator className="w-5 h-5" />
                                            </div>
                                            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Dukaan Walk-In Counter POS</h3>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Dukaan par aane wale gahakon ke liye tez tareen barcode / item billing aur instant WhatsApp digital cash memo
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => setShowPosModal(true)}
                                        className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                                    >
                                        <Calculator className="w-4 h-4" />
                                        <span>Open Fullscreen Counter POS ➔</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                                        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                                            <span className="text-xl">⚡</span>
                                            <span>Lightning-Fast Checkout</span>
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                            Product search karein ya barcode scan karein. Cart automatically calculate hogi aur change calculator cash return display karega.
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                                        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                                            <span className="text-xl">📲</span>
                                            <span>Zero-Paper WhatsApp Slip</span>
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                            Customer ka phone number darj karein. Sale complete hote hi WhatsApp par digital receipt automatically dispatch ho jayegi.
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                                        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                                            <span className="text-xl">🖨️</span>
                                            <span>80mm Thermal Receipt</span>
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                            Standard 80mm thermal cash memo printer ya A4 par 1-click print slip generate karein jo offline dukaan par chalta hai.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: ORDERS */}
                        {currentTab === "orders" && (
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Orders Management ({orders.length})</h3>
                                        <p className="text-xs text-slate-500">Tamam orders ko track karein aur status update karke auto WhatsApp alert bhejein</p>
                                    </div>

                                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                                        {["ALL", "PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].map(st => (
                                            <button
                                                key={st}
                                                onClick={() => setSelectedOrderStatus(st)}
                                                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer whitespace-nowrap ${
                                                    selectedOrderStatus === st
                                                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900"
                                                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                                                }`}
                                            >
                                                {st === "ALL" ? "All Orders" : st}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {orders.length === 0 ? (
                                    <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl my-4 space-y-2">
                                        <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Koi order mojood nahi hai</p>
                                        <p className="text-xs text-slate-400">Selected filter status ke mutabiq orders khali hain.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3.5">
                                        {orders.map(order => (
                                            <div
                                                key={order.id}
                                                className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 transition space-y-3 shadow-2xs"
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
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
                                                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                                                            Customer: <strong>{order.customerName}</strong> ({order.customerPhone})
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedLabelOrder(order);
                                                                setShowLabelModal(true);
                                                            }}
                                                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                                        >
                                                            <Printer className="w-3.5 h-3.5 text-emerald-600" />
                                                            <span>Print Label / Slip</span>
                                                        </button>

                                                        <a
                                                            href={`/s/${activeStore.slug}/track?q=${order.orderNumber}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                                                        >
                                                            <Truck className="w-3.5 h-3.5" />
                                                            <span>Track</span>
                                                        </a>

                                                        <a
                                                            href={`https://wa.me/${order.customerPhone.replace(/[^\d]/g, "")}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-3 py-1.5 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                                                        >
                                                            <MessageCircle className="w-3.5 h-3.5" />
                                                            <span>WhatsApp</span>
                                                        </a>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                                                    <div className="font-bold text-slate-900 dark:text-white text-[11px] mb-1">Items Ordered:</div>
                                                    {order.items.map((it, idx) => (
                                                        <div key={idx} className="flex justify-between">
                                                            <span>{it.quantity}x {it.productName}</span>
                                                            <span className="font-mono font-semibold">Rs. {it.totalPrice}</span>
                                                        </div>
                                                    ))}
                                                    {Number(order.discount) > 0 && (
                                                        <div className="flex justify-between text-emerald-700 font-semibold pt-1 border-t border-slate-200 dark:border-slate-700">
                                                            <span>Discount Applied:</span>
                                                            <span>-Rs. {Number(order.discount).toLocaleString("en-PK")}</span>
                                                        </div>
                                                    )}
                                                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center font-bold text-slate-900 dark:text-white text-sm">
                                                        <span>Total Bill ({order.paymentMethod}):</span>
                                                        <span className="text-emerald-700">Rs. {order.total.toLocaleString("en-PK")}</span>
                                                    </div>
                                                </div>

                                                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                                                    <div className="flex items-start gap-1.5">
                                                        <Truck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                                        <span><strong>Address:</strong> {order.customerAddress}</span>
                                                    </div>
                                                </div>

                                                {/* Status Action Buttons */}
                                                <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
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
                                                            className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 text-slate-600 hover:text-rose-700 font-semibold rounded-lg cursor-pointer ml-auto"
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

                        {/* TAB 4: PRODUCTS */}
                        {currentTab === "products" && (
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Products Catalog ({products.length})</h3>
                                        <p className="text-xs text-slate-500">Apne store ke items, prices, packing units aur stock availability control karein</p>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button
                                            onClick={() => setShowBulkImportModal(true)}
                                            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
                                        >
                                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                            <span>Bulk Import CSV</span>
                                        </button>

                                        <button
                                            onClick={handleExportProductsCSV}
                                            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
                                        >
                                            <Download className="w-4 h-4 text-blue-600" />
                                            <span>Export CSV</span>
                                        </button>

                                        <button
                                            onClick={handleImportPresets}
                                            disabled={isImportingPresets}
                                            className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition border border-indigo-200 dark:border-indigo-800 cursor-pointer disabled:opacity-50 shadow-2xs"
                                        >
                                            <Sparkles className="w-4 h-4 text-indigo-600" />
                                            <span>{isImportingPresets ? "Import Ho Raha Hai..." : "Pakistani Grocery (1-Click)"}</span>
                                        </button>

                                        <Link
                                            href={`/store-dashboard/products/new${activeStore ? `?storeId=${activeStore.id}` : ""}`}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>Add Product</span>
                                        </Link>
                                    </div>
                                </div>

                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Product ka naam search karein (e.g. Olper's, Shan, Ghee, Bread)..."
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                    />
                                </div>

                                {filteredProducts.length === 0 ? (
                                    <div className="p-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl my-4 space-y-4">
                                        <Package className="w-10 h-10 text-slate-300 mx-auto" />
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Koi product nahi mila</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                        {filteredProducts.map(p => (
                                            <div
                                                key={p.id}
                                                className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                                                    p.inStock ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs" : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 opacity-60"
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
                                                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                                                            {p.name}
                                                        </h4>
                                                        <p className="text-[11px] text-slate-500">
                                                            Rs. {p.price} {p.unit && `• ${p.unit}`}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <button
                                                        onClick={() => handleToggleProductStock(p)}
                                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition ${
                                                            p.inStock
                                                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                                                : "bg-rose-50 text-rose-800 border-rose-200"
                                                        }`}
                                                    >
                                                        {p.inStock ? "In Stock" : "Out of Stock"}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProduct(p)}
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

                        {/* TAB 5: ABANDONED CARTS */}
                        {currentTab === "abandoned" && (
                            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                                                <ShoppingCart className="w-5 h-5" />
                                            </div>
                                            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                                                WhatsApp Abandoned Cart Recovery 🛒
                                            </h3>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Jo customers checkout tak pohanch kar order place kiye baghair chale gaye, unhe WhatsApp par discount de kar recover karein!
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => activeStore && fetchAbandonedCarts(activeStore.id)}
                                        disabled={isLoadingAbandoned}
                                        className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${isLoadingAbandoned ? "animate-spin" : ""}`} />
                                        <span>Refresh Carts</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                                        <span className="text-[11px] text-slate-500 font-bold">Total Lost Value</span>
                                        <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                                            Rs. {abandonedCarts.reduce((sum, c) => sum + (c.subtotal || 0), 0).toLocaleString("en-PK")}
                                        </p>
                                    </div>
                                    <div className="bg-amber-50/60 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200 space-y-1">
                                        <span className="text-[11px] text-amber-800 dark:text-amber-300 font-bold">Pending Recovery</span>
                                        <p className="text-xl font-extrabold text-amber-900 dark:text-amber-200">
                                            {abandonedCarts.filter(c => !c.recovered).length} Carts
                                        </p>
                                    </div>
                                    <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 space-y-1">
                                        <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold">Recovered Orders</span>
                                        <p className="text-xl font-extrabold text-emerald-900 dark:text-emerald-200">
                                            {abandonedCarts.filter(c => c.recovered).length}
                                        </p>
                                    </div>
                                    <div className="bg-indigo-50/60 dark:bg-indigo-950/40 p-4 rounded-xl border border-indigo-200 space-y-1">
                                        <span className="text-[11px] text-indigo-800 dark:text-indigo-300 font-bold">Incentive Code</span>
                                        <p className="text-xl font-extrabold text-indigo-900 dark:text-indigo-200 font-mono">
                                            WELCOME10
                                        </p>
                                    </div>
                                </div>

                                {abandonedCarts.length === 0 ? (
                                    <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                                        <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto" />
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Koi abandoned cart nahi mila!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {abandonedCarts.map(cart => (
                                            <div
                                                key={cart.id}
                                                className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                                                    cart.recovered
                                                        ? "bg-emerald-50/30 border-emerald-200"
                                                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs"
                                                }`}
                                            >
                                                <div className="space-y-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <strong className="text-sm text-slate-900 dark:text-white">{cart.customerName}</strong>
                                                        <span className="font-mono text-xs text-slate-600 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                                                            {cart.customerPhone}
                                                        </span>
                                                        {cart.recovered ? (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                                ✓ Recovered
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                                                Pending Recovery
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                                                        🛒 {cart.itemsSummary}
                                                    </p>
                                                    <p className="text-xs font-bold text-emerald-700">
                                                        Potential Sale: Rs. {cart.subtotal.toLocaleString("en-PK")}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        onClick={() => handleRecoverCart(cart.id)}
                                                        disabled={recoveringCartId === cart.id}
                                                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                                                    >
                                                        <Send className="w-3.5 h-3.5" />
                                                        <span>{recoveringCartId === cart.id ? "Sending..." : "Recover via WhatsApp 📲"}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 6: SLIDER / HERO BANNERS */}
                        {currentTab === "slider" && (
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                                                <ImageIcon className="w-5 h-5" />
                                            </div>
                                            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                                                Storefront Hero Slider & Banners
                                            </h3>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Apni dukaan ke promotional banner slides manage karein ya default slider ko band karein
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => setIsSliderEnabled(!isSliderEnabled)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs ${
                                            isSliderEnabled
                                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                : "bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300"
                                        }`}
                                    >
                                        {isSliderEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        <span>{isSliderEnabled ? "Slider Active Hai" : "Slider Band Hai"}</span>
                                    </button>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        onClick={handleSaveBanners}
                                        disabled={isSavingBanners}
                                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition cursor-pointer"
                                    >
                                        {isSavingBanners ? "Saving..." : "Save Slider Changes"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* TAB 7: DELIVERY & TIMINGS */}
                        {currentTab === "delivery" && (
                            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
                                <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-4">
                                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                                        <Truck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">Delivery Charges & Auqaat</h3>
                                        <p className="text-xs text-slate-500">Apne mohallay ya city ke mutabiq delivery charges aur timing set karein</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            Delivery Fee ({activeStore.currencySymbol})
                                        </label>
                                        <input
                                            type="number"
                                            value={deliveryFeeInput}
                                            onChange={e => setDeliveryFeeInput(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            Free Delivery Above Order ({activeStore.currencySymbol})
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="e.g. 1500"
                                            value={freeDeliveryAboveInput}
                                            onChange={e => setFreeDeliveryAboveInput(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            Estimated Delivery Time
                                        </label>
                                        <input
                                            type="text"
                                            value={deliveryTimeInput}
                                            onChange={e => setDeliveryTimeInput(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            Opening Hours (Auqaat)
                                        </label>
                                        <input
                                            type="text"
                                            value={openingHoursInput}
                                            onChange={e => setOpeningHoursInput(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Top Notice / Announcement Banner
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 🎉 Rs. 1000 se zyada ke order par muft delivery!"
                                        value={noticeMessageInput}
                                        onChange={e => setNoticeMessageInput(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                                    />
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={handleSaveDelivery}
                                        disabled={isSavingDelivery}
                                        className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition cursor-pointer"
                                    >
                                        {isSavingDelivery ? "Saving..." : "Save Delivery Settings"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* TAB 8: DOMAIN & WHATSAPP SETTINGS */}
                        {currentTab === "settings" && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                                            <Globe className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">Custom Domain Integration</h3>
                                            <p className="text-xs text-slate-500">Apni khud ki domain connect karein (e.g. shop.mybrand.pk)</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                Domain Name
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. shop.bismillahstore.pk"
                                                value={customDomainInput}
                                                onChange={e => setCustomDomainInput(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">WhatsApp Session Connection</h3>
                                            <p className="text-xs text-slate-500">Order aate hi dukaan aur customer ko auto message dispatch karne ke liye</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2 text-xs">
                                        <div>
                                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                Connected Baileys WhatsApp Session
                                            </label>
                                            <select
                                                value={selectedSessionId}
                                                onChange={e => setSelectedSessionId(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                            >
                                                <option value="">-- Direct WhatsApp Chat Mode (No Bot) --</option>
                                                {sessions.map(s => (
                                                    <option key={s.id} value={s.id}>
                                                        🟢 {s.name} ({s.sessionId})
                                                    </option>
                                                ))}
                                            </select>
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

            {/* MODALS */}
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

            {activeStore && (
                <CounterQrModal
                    isOpen={showCounterQrModal}
                    onClose={() => setShowCounterQrModal(false)}
                    store={activeStore}
                />
            )}

            {activeStore && (
                <ShippingLabelModal
                    isOpen={showLabelModal}
                    onClose={() => setShowLabelModal(false)}
                    order={selectedLabelOrder as any}
                    store={{
                        name: activeStore.name,
                        phone: activeStore.phone,
                        address: activeStore.address,
                        city: activeStore.city,
                        currencySymbol: activeStore.currencySymbol
                    }}
                />
            )}

            {activeStore && (
                <BulkImportModal
                    isOpen={showBulkImportModal}
                    onClose={() => setShowBulkImportModal(false)}
                    storeId={activeStore.id}
                    onSuccess={() => {
                        fetchProducts(activeStore.id);
                        toast.success("Products catalog refresh ho gaya hai! 📦");
                    }}
                />
            )}

            {activeStore && (
                <POSModal
                    isOpen={showPosModal}
                    onClose={() => setShowPosModal(false)}
                    store={{
                        id: activeStore.id,
                        name: activeStore.name,
                        currencySymbol: activeStore.currencySymbol,
                        city: activeStore.city
                    }}
                    products={products}
                    onSaleComplete={() => {
                        fetchOrders(activeStore.id);
                    }}
                />
            )}

        </div>
    );
}

export default function StoreDashboardPage() {
    return (
        <Suspense fallback={
            <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] space-y-3">
                <RefreshCw className="w-9 h-9 animate-spin text-emerald-600" />
                <p className="text-sm font-semibold text-slate-600">Store Dashboard Load Ho Raha Hai...</p>
            </div>
        }>
            <StoreDashboardContent />
        </Suspense>
    );
}
