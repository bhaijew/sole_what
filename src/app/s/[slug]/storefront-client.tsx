"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
    ShoppingBag,
    Search,
    MapPin,
    Phone,
    Clock,
    Plus,
    Minus,
    Trash2,
    X,
    CheckCircle2,
    Sparkles,
    AlertCircle,
    Store,
    Share2,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Truck,
    Settings,
    ArrowUpRight,
    Tag,
    Ticket,
    Flame,
    Copy,
    Check,
    UploadCloud,
    Bot,
    Send,
    MessageSquare,
    Receipt,
    QrCode,
    Loader2,
    RefreshCw,
    ExternalLink,
    History,
    Calendar,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { PRESET_HERO_BANNERS, PresetBanner } from "@/lib/catalog-presets";

const AVAILABLE_COUPONS: Record<string, { type: "PERCENT" | "FIXED" | "FREESHIP"; value: number; label: string; minSubtotal?: number }> = {
    WELCOME10: { type: "PERCENT", value: 10, label: "10% OFF Total Order" },
    FREESHIP: { type: "FREESHIP", value: 0, label: "100% Free Delivery" },
    BACHAT50: { type: "FIXED", value: 50, label: "Rs. 50 OFF (Orders over Rs. 300)", minSubtotal: 300 },
    VIP100: { type: "FIXED", value: 100, label: "Rs. 100 OFF (Orders over Rs. 800)", minSubtotal: 800 }
};

interface Category {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
}

interface Product {
    id: string;
    categoryId?: string | null;
    name: string;
    slug: string;
    description?: string | null;
    price: number;
    compareAtPrice?: number | null;
    unit?: string | null;
    image?: string | null;
    inStock: boolean;
}

interface StoreData {
    id: string;
    name: string;
    slug: string;
    tagline?: string | null;
    description?: string | null;
    logoUrl?: string | null;
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
    customDomain?: string | null;
    categories: Category[];
    products: Product[];
}

export interface CachedCustomerOrderItem {
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    productImage?: string | null;
}

export interface CachedCustomerOrder {
    orderNumber: string;
    orderId?: string;
    storeId: string;
    storeSlug: string;
    storeName: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    subtotal: number;
    deliveryFee: number;
    discount: number;
    total: number;
    paymentMethod: string;
    status: string;
    placedAt: string;
    whatsappRedirectUrl?: string;
    items: CachedCustomerOrderItem[];
}

export default function StorefrontClient({ store }: { store: StoreData }) {
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [cart, setCart] = useState<Map<string, number>>(new Map());
    const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
    const [currentSlide, setCurrentSlide] = useState<number>(0);

    // Browser Cached Orders State (Order History saved in customer's local browser)
    const [cachedOrders, setCachedOrders] = useState<CachedCustomerOrder[]>([]);
    const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState<boolean>(false);
    const [isRefreshingHistory, setIsRefreshingHistory] = useState<boolean>(false);
    const [expandedOrderNum, setExpandedOrderNum] = useState<string | null>(null);

    // Dynamic banner configuration from store.bannerUrl (allows custom slides or hiding the slider completely)
    const bannerConfig = useMemo(() => {
        if (!store.bannerUrl) {
            return { enabled: true, banners: PRESET_HERO_BANNERS };
        }
        if (store.bannerUrl === "OFF" || store.bannerUrl === "DISABLED") {
            return { enabled: false, banners: [] };
        }
        try {
            const parsed = JSON.parse(store.bannerUrl);
            if (parsed && typeof parsed === "object") {
                const enabled = parsed.enabled !== false;
                const banners = Array.isArray(parsed.banners) && parsed.banners.length > 0
                    ? parsed.banners
                    : (enabled ? PRESET_HERO_BANNERS : []);
                return { enabled, banners };
            }
        } catch {
            if (store.bannerUrl.startsWith("http")) {
                return {
                    enabled: true,
                    banners: [{
                        id: "custom-1",
                        title: store.name,
                        subtitle: store.tagline || "Ghar bethay online order mangwayein",
                        badge: "Special Offer",
                        bgGradient: "from-emerald-700 via-teal-800 to-slate-900",
                        imageUrl: store.bannerUrl
                    }]
                };
            }
        }
        return { enabled: true, banners: PRESET_HERO_BANNERS };
    }, [store.bannerUrl, store.name, store.tagline]);

    const activeBanners: PresetBanner[] = bannerConfig.banners;

    // Auto-advance hero banner slider every 4.5 seconds if enabled and more than 1 banner
    useEffect(() => {
        if (!bannerConfig.enabled || activeBanners.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % activeBanners.length);
        }, 4500);
        return () => clearInterval(timer);
    }, [bannerConfig.enabled, activeBanners.length]);

    // Checkout Form state
    const [customerName, setCustomerName] = useState<string>("");
    const [customerPhone, setCustomerPhone] = useState<string>("");
    const [customerAddress, setCustomerAddress] = useState<string>("");
    const [customerNotes, setCustomerNotes] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<string>("COD");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const isSubmittingRef = useRef<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");

    // Load Cached Orders and profile from browser cache (localStorage)
    useEffect(() => {
        try {
            const raw = localStorage.getItem(`solewhat_orders_${store.id}`);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setCachedOrders(parsed);
                    setExpandedOrderNum(parsed[0].orderNumber);
                }
            }
            const profileRaw = localStorage.getItem("solewhat_customer_profile");
            if (profileRaw) {
                const profile = JSON.parse(profileRaw);
                if (profile.name) setCustomerName(profile.name);
                if (profile.phone) setCustomerPhone(profile.phone);
                if (profile.address) setCustomerAddress(profile.address);
            }
        } catch (e) {
            console.warn("Failed to read from browser cache:", e);
        }
    }, [store.id]);

    // Live Sync / Auto-Status Refresh from /api/store/track
    const refreshCachedOrdersStatus = async () => {
        if (cachedOrders.length === 0 || isRefreshingHistory) return;
        setIsRefreshingHistory(true);
        try {
            const updated = await Promise.all(
                cachedOrders.map(async (ord) => {
                    if (ord.status === "DELIVERED" || ord.status === "CANCELLED") {
                        return ord;
                    }
                    try {
                        const res = await fetch(`/api/store/track?slug=${encodeURIComponent(store.slug)}&query=${encodeURIComponent(ord.orderNumber)}`);
                        if (res.ok) {
                            const data = await res.json();
                            if (data.success && data.order) {
                                return {
                                    ...ord,
                                    status: data.order.status || ord.status,
                                    total: data.order.total ?? ord.total,
                                    items: Array.isArray(data.order.items) && data.order.items.length > 0
                                        ? data.order.items.map((it: any) => ({
                                            productName: it.productName,
                                            quantity: it.quantity,
                                            unitPrice: it.unitPrice,
                                            totalPrice: it.totalPrice,
                                            productImage: it.productImage
                                        }))
                                        : ord.items
                                };
                            }
                        }
                    } catch {
                        // ignore network error
                    }
                    return ord;
                })
            );
            setCachedOrders(updated);
            try {
                localStorage.setItem(`solewhat_orders_${store.id}`, JSON.stringify(updated));
            } catch {}
        } catch (err) {
            console.error("Failed to refresh cached orders status:", err);
        } finally {
            setIsRefreshingHistory(false);
        }
    };

    const handleClearOrderHistory = () => {
        if (!confirm("Kya aap waqai is browser se apni tamam order history khatam (clear) karna chahte hain?")) return;
        try {
            localStorage.removeItem(`solewhat_orders_${store.id}`);
            setCachedOrders([]);
        } catch {}
    };

    // Feature 6: Coupons & Flash Deals State
    const [couponInput, setCouponInput] = useState<string>("");
    const [appliedCoupon, setAppliedCoupon] = useState<{
        code: string;
        type: "PERCENT" | "FIXED" | "FREESHIP";
        value: number;
        label: string;
    } | null>(null);
    const [couponError, setCouponError] = useState<string>("");
    const [showCouponInput, setShowCouponInput] = useState<boolean>(false);
    const [dealCountdown, setDealCountdown] = useState<{ hours: number; minutes: number; seconds: number }>({
        hours: 3,
        minutes: 42,
        seconds: 18
    });

    // Feature 7: JazzCash / EasyPaisa Proof & TID State
    const [transactionId, setTransactionId] = useState<string>("");
    const [paymentProofUrl, setPaymentProofUrl] = useState<string>("");
    const [isUploadingProof, setIsUploadingProof] = useState<boolean>(false);
    const [copiedNumber, setCopiedNumber] = useState<boolean>(false);

    // Feature 3: AI Dukandar Shopping Assistant State
    const [isAiOpen, setIsAiOpen] = useState<boolean>(false);
    const [aiMessages, setAiMessages] = useState<{ role: "assistant" | "user"; content: string }[]>([
        {
            role: "assistant",
            content: `Assalam-o-Alaikum! 🏪 Main *${store.name}* ka virtual AI shopping assistant hoon. Kisi bhi item ki keemat, deals ya delivery ke bare mein poochhein!`
        }
    ]);
    const [aiInput, setAiInput] = useState<string>("");
    const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
    const aiMessagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll AI messages to bottom when new message arrives
    useEffect(() => {
        if (isAiOpen) {
            aiMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [aiMessages, isAiOpen]);

    // Live Deal Countdown Timer (Ticking every second)
    useEffect(() => {
        const timer = setInterval(() => {
            setDealCountdown(prev => {
                if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
                if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
                if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
                return { hours: 4, minutes: 0, seconds: 0 };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Order Success State
    const [completedOrder, setCompletedOrder] = useState<{
        orderNumber: string;
        total: number;
        whatsappRedirectUrl: string;
    } | null>(null);

    // Product lookup map
    const productMap = useMemo(() => {
        return new Map(store.products.map(p => [p.id, p]));
    }, [store.products]);

    // Cart calculations
    const cartItems = useMemo(() => {
        const items: { product: Product; quantity: number; lineTotal: number }[] = [];
        cart.forEach((quantity, productId) => {
            const product = productMap.get(productId);
            if (product && quantity > 0) {
                items.push({
                    product,
                    quantity,
                    lineTotal: product.price * quantity
                });
            }
        });
        return items;
    }, [cart, productMap]);

    const cartCount = useMemo(() => {
        let count = 0;
        cart.forEach(q => (count += q));
        return count;
    }, [cart]);

    const subtotal = useMemo(() => {
        return cartItems.reduce((acc, item) => acc + item.lineTotal, 0);
    }, [cartItems]);

    // Calculate dynamic discount from applied coupon
    const discountAmount = useMemo(() => {
        if (!appliedCoupon) return 0;
        if (appliedCoupon.type === "PERCENT") {
            return Math.round((subtotal * appliedCoupon.value) / 100);
        }
        if (appliedCoupon.type === "FIXED") {
            return Math.min(subtotal, appliedCoupon.value);
        }
        return 0;
    }, [appliedCoupon, subtotal]);

    // Calculate delivery fee (0 if FREESHIP coupon or exceeds threshold)
    const deliveryFee = useMemo(() => {
        if (appliedCoupon?.type === "FREESHIP") return 0;
        if (store.freeDeliveryAbove && subtotal >= store.freeDeliveryAbove) {
            return 0;
        }
        return store.deliveryFee;
    }, [subtotal, store.deliveryFee, store.freeDeliveryAbove, appliedCoupon]);

    const totalBill = Math.max(0, subtotal - discountAmount + deliveryFee);

    const freeDeliveryDiff = useMemo(() => {
        if (!store.freeDeliveryAbove) return 0;
        return Math.max(0, store.freeDeliveryAbove - subtotal);
    }, [store.freeDeliveryAbove, subtotal]);

    // Cart modification actions
    const addToCart = (productId: string) => {
        setCart(prev => {
            const next = new Map(prev);
            const current = next.get(productId) || 0;
            next.set(productId, current + 1);
            return next;
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => {
            const next = new Map(prev);
            const current = next.get(productId) || 0;
            if (current <= 1) {
                next.delete(productId);
            } else {
                next.set(productId, current - 1);
            }
            return next;
        });
    };

    const deleteFromCart = (productId: string) => {
        setCart(prev => {
            const next = new Map(prev);
            next.delete(productId);
            return next;
        });
    };

    // Feature 6: Apply Coupon Code Handler
    const handleApplyCoupon = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setCouponError("");
        const clean = couponInput.trim().toUpperCase();
        if (!clean) return;

        const found = AVAILABLE_COUPONS[clean];
        if (!found) {
            setCouponError("Yeh coupon code durust nahi hai.");
            return;
        }

        if (found.minSubtotal && subtotal < found.minSubtotal) {
            setCouponError(`Is coupon ke liye kam az kam ${store.currencySymbol} ${found.minSubtotal} ka order zaroori hai.`);
            return;
        }

        setAppliedCoupon({ code: clean, ...found });
        setCouponInput("");
        setCouponError("");
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponError("");
    };

    // Feature 5: Direct 1-Click WhatsApp Order
    const handleQuickWhatsAppOrder = (product: Product) => {
        const cleanPhone = store.phone ? store.phone.replace(/[^\d]/g, "") : "";
        const formattedPhone = cleanPhone.startsWith("0") ? "92" + cleanPhone.slice(1) : cleanPhone;
        const text = `Assalam-o-Alaikum! 🛒\nMujhe *${store.name}* se yeh item order karna hai:\n\n📦 *Item:* ${product.name}\n💵 *Keemat:* ${store.currencySymbol} ${product.price}${product.unit ? ` (${product.unit})` : ""}\n\n👤 *Mera Naam:*\n📍 *Delivery Pata / Address:*\n\nBaraye meherbani confirmation bhej dein. Shukriya!`;
        const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
        window.open(waUrl, "_blank");
    };

    // Feature 7: Upload Payment Screenshot Slip
    const handleUploadReceipt = async (file: File) => {
        setIsUploadingProof(true);
        setErrorMessage("");
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch("/api/store/upload-receipt", {
                method: "POST",
                body: fd
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Payment slip upload nahi ho saki.");
            }
            setPaymentProofUrl(data.url);
        } catch (err: any) {
            setErrorMessage(err.message || "Failed to upload payment slip");
        } finally {
            setIsUploadingProof(false);
        }
    };

    // Copy Account Number helper
    const handleCopyAccount = (accountStr: string) => {
        navigator.clipboard.writeText(accountStr);
        setCopiedNumber(true);
        setTimeout(() => setCopiedNumber(false), 2000);
    };

    // Feature 3: AI Shopping Assistant Message Sender
    const handleSendAiMessage = async (customText?: string) => {
        const textToSend = (customText || aiInput).trim();
        if (!textToSend || isAiLoading) return;

        setAiInput("");
        setAiMessages(prev => [...prev, { role: "user", content: textToSend }]);
        setIsAiLoading(true);

        try {
            const res = await fetch("/api/store/ai-assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    storeId: store.id,
                    message: textToSend,
                    history: aiMessages.slice(-4)
                })
            });
            const data = await res.json();
            if (data.success && data.reply) {
                setAiMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
            } else {
                setAiMessages(prev => [
                    ...prev,
                    {
                        role: "assistant",
                        content: "Mafi chahta hoon, is waqt connection issue hai. Aap direct WhatsApp par rabta kar sakte hain!"
                    }
                ]);
            }
        } catch {
            setAiMessages(prev => [
                ...prev,
                {
                    role: "assistant",
                    content: "Internet connection check karein ya direct WhatsApp par rabta karein."
                }
            ]);
        } finally {
            setIsAiLoading(false);
        }
    };

    // Filter products
    const filteredProducts = useMemo(() => {
        return store.products.filter(p => {
            const matchesCategory =
                selectedCategory === "all" || p.categoryId === selectedCategory;
            const matchesSearch =
                searchQuery.trim() === "" ||
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCategory && matchesSearch;
        });
    }, [store.products, selectedCategory, searchQuery]);

    // Submit Checkout
    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmittingRef.current || isSubmitting) return;

        setErrorMessage("");

        if (!customerName.trim()) {
            setErrorMessage("Baraye meherbani apna naam darj karein.");
            return;
        }
        if (!customerPhone.trim()) {
            setErrorMessage("WhatsApp phone number darj karein taake order confirm kiya ja sake.");
            return;
        }
        if (!customerAddress.trim()) {
            setErrorMessage("Mukammal delivery address (Makaan / Gali / Mohalla) darj karein.");
            return;
        }
        if (store.minOrderAmount > 0 && subtotal < store.minOrderAmount) {
            setErrorMessage(`Kam az kam order amount ${store.currencySymbol} ${store.minOrderAmount} hona zaroori hai.`);
            return;
        }

        isSubmittingRef.current = true;
        setIsSubmitting(true);
        try {
            const itemsPayload = cartItems.map(item => ({
                productId: item.product.id,
                quantity: item.quantity
            }));

            const res = await fetch("/api/store/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    storeId: store.id,
                    customerName,
                    customerPhone,
                    customerAddress,
                    customerCity: store.city || "Pakistan",
                    customerNotes,
                    paymentMethod,
                    discount: discountAmount,
                    couponCode: appliedCoupon?.code,
                    transactionId: transactionId.trim() || undefined,
                    paymentProofUrl: paymentProofUrl || undefined,
                    items: itemsPayload
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Order place karne mein masla pesh aaya.");
            }

            // Order Placed Successfully - Save to Customer's Browser Cache (localStorage)
            const newCachedOrder: CachedCustomerOrder = {
                orderNumber: data.orderNumber,
                orderId: data.orderId,
                storeId: store.id,
                storeSlug: store.slug,
                storeName: store.name,
                customerName: customerName.trim(),
                customerPhone: customerPhone.trim(),
                customerAddress: customerAddress.trim(),
                subtotal: subtotal,
                deliveryFee: deliveryFee,
                discount: discountAmount,
                total: data.total || totalBill,
                paymentMethod: paymentMethod,
                status: "PENDING",
                placedAt: new Date().toISOString(),
                whatsappRedirectUrl: data.whatsappRedirectUrl,
                items: cartItems.map(item => ({
                    productName: item.product.name,
                    quantity: item.quantity,
                    unitPrice: item.product.price,
                    totalPrice: item.product.price * item.quantity,
                    productImage: item.product.image || null
                }))
            };

            setCachedOrders(prev => {
                const nextOrders = [newCachedOrder, ...prev.filter(o => o.orderNumber !== data.orderNumber)];
                try {
                    localStorage.setItem(`solewhat_orders_${store.id}`, JSON.stringify(nextOrders));
                    localStorage.setItem("solewhat_customer_profile", JSON.stringify({
                        name: customerName.trim(),
                        phone: customerPhone.trim(),
                        address: customerAddress.trim()
                    }));
                } catch (e) {
                    console.warn("Failed to store order in localStorage:", e);
                }
                return nextOrders;
            });
            setExpandedOrderNum(data.orderNumber);

            setCompletedOrder({
                orderNumber: data.orderNumber,
                total: data.total,
                whatsappRedirectUrl: data.whatsappRedirectUrl
            });
            setCart(new Map());
            setAppliedCoupon(null);
            setTransactionId("");
            setPaymentProofUrl("");
            setIsCartOpen(false);
        } catch (err: any) {
            setErrorMessage(err.message || "Failed to submit order. Please try again.");
        } finally {
            isSubmittingRef.current = false;
            setIsSubmitting(false);
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: store.name,
                text: `${store.name} - Online order karein!`,
                url: window.location.href
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Dukaan ka link copy ho gaya hai!");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 font-sans antialiased selection:bg-emerald-500 selection:text-white">
            {/* Top Announcement Bar */}
            {store.noticeMessage && (
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs sm:text-sm font-medium py-2 px-4 text-center flex items-center justify-center gap-2 shadow-sm">
                    <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
                    <span>{store.noticeMessage}</span>
                </div>
            )}

            {/* Feature 6: Top Flash Deal & Promo Ticker with Live Timer */}
            <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-700 text-white text-[11px] sm:text-xs py-2 px-3 sm:px-4 shadow-sm flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md font-bold tracking-wider text-[10px] uppercase">
                        <Flame className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                        <span>Flash Deal</span>
                    </span>
                    <span className="font-medium">
                        Promo Code <strong className="bg-white/20 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider text-amber-200">WELCOME10</strong> lagayein aur 10% discount payein!
                    </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline text-white/80">Khatam honay mein:</span>
                    <div className="flex items-center gap-1 font-mono font-bold bg-black/40 px-2 py-0.5 rounded-lg border border-white/20 text-amber-300 text-[10px] sm:text-xs">
                        <span>{String(dealCountdown.hours).padStart(2, "0")}h</span>:
                        <span>{String(dealCountdown.minutes).padStart(2, "0")}m</span>:
                        <span>{String(dealCountdown.seconds).padStart(2, "0")}s</span>
                    </div>
                </div>
            </div>

            {/* Store Header Banner */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/95">
                <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        {store.logoUrl ? (
                            <img
                                src={store.logoUrl}
                                alt={store.name}
                                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0"
                            />
                        ) : (
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
                                {store.name.substring(0, 1)}
                            </div>
                        )}
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 truncate">
                                    {store.name}
                                </h1>
                                {store.isOpen ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                        ● Open
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                                        ● Closed
                                    </span>
                                )}
                            </div>
                            {store.tagline && (
                                <p className="text-xs text-slate-500 truncate">{store.tagline}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        {/* Browser Cached Order History Trigger */}
                        <button
                            onClick={() => {
                                setIsOrderHistoryOpen(true);
                                refreshCachedOrdersStatus();
                            }}
                            title="Aapke Orders (Browser Cache History)"
                            className="relative px-2.5 sm:px-3 py-2 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition flex items-center gap-1.5 font-bold text-xs cursor-pointer shadow-2xs"
                        >
                            <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="hidden sm:inline">Orders</span>
                            {cachedOrders.length > 0 && (
                                <span className="bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                                    {cachedOrders.length}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={handleShare}
                            title="Share Store"
                            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                        >
                            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative p-2 sm:p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-sm"
                        >
                            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-scale">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Meta details bar */}
                <div className="bg-slate-50/70 border-t border-slate-100 px-4 py-2 text-xs text-slate-600">
                    <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                            {store.estimatedDeliveryTime && (
                                <span className="flex items-center gap-1.5 font-medium text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>{store.estimatedDeliveryTime}</span>
                                </span>
                            )}
                            {store.openingHours && (
                                <span className="flex items-center gap-1.5 font-medium text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                                    <Store className="w-3.5 h-3.5 text-blue-600" />
                                    <span>{store.openingHours}</span>
                                </span>
                            )}
                            {store.address && (
                                <span className="flex items-center gap-1 text-slate-500">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{store.address}</span>
                                </span>
                            )}
                        </div>
                        {store.freeDeliveryAbove && store.freeDeliveryAbove > 0 && (
                            <span className="shrink-0 font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                Free delivery over {store.currencySymbol} {store.freeDeliveryAbove}
                            </span>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-5xl mx-auto px-4 pt-3 sm:pt-6">
                {/* Hero Promotional Banner Slider (Hidden if store owner disabled or customized) */}
                {bannerConfig.enabled && activeBanners.length > 0 && (
                    <div className="relative mb-4 sm:mb-6 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 bg-slate-900 select-none">
                        <div className="relative aspect-[21/10] sm:aspect-[24/8] min-h-[150px] w-full overflow-hidden">
                            {activeBanners.map((banner, idx) => (
                                <div
                                    key={banner.id || idx}
                                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                                        idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                                    }`}
                                >
                                    <img
                                        src={banner.imageUrl}
                                        alt={banner.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className={`absolute inset-0 bg-gradient-to-r ${banner.bgGradient} opacity-85`} />

                                    <div className="absolute inset-0 p-4 sm:p-7 flex flex-col justify-between text-white z-20">
                                        <div>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md text-white mb-1.5 border border-white/20">
                                                {banner.badge}
                                            </span>
                                            <h2 className="text-sm sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight line-clamp-1 drop-shadow-sm">
                                                {banner.title}
                                            </h2>
                                            <p className="text-[11px] sm:text-xs md:text-sm text-slate-200 mt-0.5 line-clamp-2 max-w-md opacity-90 drop-shadow-sm">
                                                {banner.subtitle}
                                            </p>
                                        </div>

                                        {/* Delivery Badge & Call-To-Action Link on Slider */}
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-medium text-emerald-300">
                                                <span className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-lg backdrop-blur-md border border-white/10">
                                                    <Truck className="w-3 h-3 text-emerald-400" />
                                                    <span>
                                                        {Number(store.deliveryFee) === 0 ? "FREE Delivery" : `Delivery: ${store.currencySymbol} ${store.deliveryFee}`}
                                                    </span>
                                                </span>
                                                {store.freeDeliveryAbove && store.freeDeliveryAbove > 0 && (
                                                    <span className="hidden sm:inline bg-white/15 px-2 py-0.5 rounded-lg backdrop-blur-md border border-white/10 text-white">
                                                        Free over {store.currencySymbol} {store.freeDeliveryAbove}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Mobile Responsive Action Button / Link */}
                                            <a
                                                href={banner.linkUrl || "#products-catalog"}
                                                onClick={(e) => {
                                                    const targetUrl = banner.linkUrl || "#products-catalog";
                                                    if (targetUrl === "#products" || targetUrl === "#products-catalog") {
                                                        e.preventDefault();
                                                        document.getElementById("products-catalog")?.scrollIntoView({ behavior: "smooth" });
                                                    }
                                                }}
                                                className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-white bg-white/20 hover:bg-white/30 active:scale-95 backdrop-blur-md px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl border border-white/20 shadow-xs cursor-pointer transition"
                                            >
                                                <span>Saman Dekhein</span>
                                                <ArrowUpRight className="w-3 h-3 text-emerald-300" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Arrow Navigation Controls (only if more than 1 banner) */}
                        {activeBanners.length > 1 && (
                            <>
                                <button
                                    onClick={() => setCurrentSlide(prev => (prev - 1 + activeBanners.length) % activeBanners.length)}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center transition border border-white/10 cursor-pointer active:scale-90"
                                    aria-label="Previous Slide"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setCurrentSlide(prev => (prev + 1) % activeBanners.length)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center transition border border-white/10 cursor-pointer active:scale-90"
                                    aria-label="Next Slide"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>

                                {/* Slider Indicator Dots */}
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1">
                                    {activeBanners.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentSlide(idx)}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                                idx === currentSlide ? "w-5 bg-white" : "w-1.5 bg-white/40"
                                            }`}
                                            aria-label={`Slide ${idx + 1}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Search Bar & Catalog Target */}
                <div id="products-catalog" className="relative mb-4 scroll-mt-20">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search products, brands, essentials..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition shadow-xs"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Category Filter Pills */}
                {store.categories.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
                        <button
                            onClick={() => setSelectedCategory("all")}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                                selectedCategory === "all"
                                    ? "bg-slate-900 text-white shadow-sm"
                                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                            }`}
                        >
                            All Items ({store.products.length})
                        </button>
                        {store.categories.map(cat => {
                            const count = store.products.filter(p => p.categoryId === cat.id).length;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                                        selectedCategory === cat.id
                                            ? "bg-emerald-600 text-white shadow-sm"
                                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                                    }`}
                                >
                                    {cat.icon && <span>{cat.icon}</span>}
                                    <span>{cat.name}</span>
                                    <span className="opacity-70 text-[10px]">({count})</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Product Grid */}
                {filteredProducts.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center my-6">
                        <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-base font-semibold text-slate-800">Koi item nahi mila</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            Aapki search ya selected category mein is waqt koi product available nahi hai.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                        {filteredProducts.map(product => {
                            const qty = cart.get(product.id) || 0;
                            const hasDiscount =
                                product.compareAtPrice && product.compareAtPrice > product.price;
                            const discountPercent = hasDiscount
                                ? Math.round(
                                      ((product.compareAtPrice! - product.price) /
                                          product.compareAtPrice!) *
                                          100
                                  )
                                : 0;

                            return (
                                <div
                                    key={product.id}
                                    className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all duration-200 group"
                                >
                                    <div>
                                        {/* Product Image */}
                                        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 mb-2.5 flex items-center justify-center">
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                />
                                            ) : (
                                                <ShoppingBag className="w-8 h-8 text-slate-300" />
                                            )}
                                            {hasDiscount && (
                                                <span className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                                                    -{discountPercent}%
                                                </span>
                                            )}
                                        </div>

                                        {/* Title & Unit */}
                                        <h3 className="font-semibold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-tight">
                                            {product.name}
                                        </h3>
                                        {product.unit && (
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                {product.unit}
                                            </p>
                                        )}
                                    </div>

                                    {/* Price & Add to Cart button */}
                                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                                        <div>
                                            <div className="text-xs sm:text-sm font-bold text-slate-900">
                                                {store.currencySymbol} {Number(product.price).toLocaleString("en-PK")}
                                            </div>
                                            {hasDiscount && (
                                                <div className="text-[10px] text-slate-400 line-through">
                                                    {store.currencySymbol} {Number(product.compareAtPrice).toLocaleString("en-PK")}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            {/* Feature 5: Direct 1-Click WhatsApp Quick Order Button */}
                                            <button
                                                type="button"
                                                onClick={() => handleQuickWhatsAppOrder(product)}
                                                title="WhatsApp Par Direct 1-Click Order Karein"
                                                className="p-1.5 rounded-xl bg-green-50 hover:bg-green-600 text-green-700 hover:text-white border border-green-200 hover:border-green-600 transition flex items-center justify-center shadow-2xs active:scale-95 cursor-pointer"
                                            >
                                                <Phone className="w-3.5 h-3.5" />
                                            </button>

                                            {qty === 0 ? (
                                                <button
                                                    onClick={() => addToCart(product.id)}
                                                    className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-semibold text-xs transition flex items-center gap-1 active:scale-95 cursor-pointer border border-emerald-200 hover:border-emerald-600"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    <span>Add</span>
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-1.5 bg-emerald-600 text-white rounded-xl px-1.5 py-1 shadow-xs">
                                                    <button
                                                        onClick={() => removeFromCart(product.id)}
                                                        className="w-5 h-5 flex items-center justify-center rounded-lg hover:bg-emerald-700 transition"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="text-xs font-bold w-4 text-center">
                                                        {qty}
                                                    </span>
                                                    <button
                                                        onClick={() => addToCart(product.id)}
                                                        className="w-5 h-5 flex items-center justify-center rounded-lg hover:bg-emerald-700 transition"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Store Footer */}
                <footer className="mt-14 pt-8 pb-4 border-t border-slate-200/80 text-center text-xs text-slate-500">
                    <p className="font-medium text-slate-600">
                        © {new Date().getFullYear()} {store.name} • WhatsApp Commerce Powered by Sole-What
                    </p>
                </footer>
            </main>

            {/* Floating Mobile Cart Bar (When cart has items) */}
            {cartCount > 0 && !isCartOpen && (
                <div className="fixed bottom-3 inset-x-3 sm:max-w-md sm:mx-auto z-40 animate-slide-up">
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-4 rounded-2xl shadow-xl flex items-center justify-between font-bold text-sm transition active:scale-[0.98] cursor-pointer border border-emerald-500/40"
                    >
                        <div className="flex items-center gap-2">
                            <span className="bg-emerald-700/80 px-2 py-0.5 rounded-lg text-xs font-semibold">
                                {cartCount} items
                            </span>
                            <span>{store.currencySymbol} {totalBill.toLocaleString("en-PK")}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs sm:text-sm">
                            <span>View Cart / Order</span>
                            <ArrowRight className="w-4 h-4" />
                        </div>
                    </button>
                </div>
            )}

            {/* Slide-over / Cart Drawer Modal */}
            {isCartOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
                    <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-slide-left">
                        {/* Drawer Header */}
                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                                <h2 className="font-bold text-base text-slate-900">Aapka Order Cart</h2>
                            </div>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Free Delivery Bar in Drawer */}
                        {store.freeDeliveryAbove && store.freeDeliveryAbove > 0 && (
                            <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-100 text-xs text-emerald-800">
                                {freeDeliveryDiff > 0 ? (
                                    <div>
                                        <span>
                                            Free delivery ke liye mazeed <strong>{store.currencySymbol} {freeDeliveryDiff}</strong> ka saman add karein!
                                        </span>
                                        <div className="w-full bg-emerald-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                            <div
                                                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        (subtotal / store.freeDeliveryAbove) * 100
                                                    )}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        Mubarak ho! Aapko is order par FREE Delivery milegi! 🎉
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Drawer Body */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-6">
                            {/* Items List */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                                    Selected Items ({cartCount})
                                </h3>
                                {cartItems.length === 0 ? (
                                    <p className="text-sm text-slate-500 text-center py-6">
                                        Cart khali hai.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {cartItems.map(({ product, quantity, lineTotal }) => (
                                            <div
                                                key={product.id}
                                                className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500">
                                                        {store.currencySymbol} {product.price} x {quantity} ={" "}
                                                        <strong className="text-slate-800">
                                                            {store.currencySymbol} {lineTotal}
                                                        </strong>
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <button
                                                        onClick={() => removeFromCart(product.id)}
                                                        className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="text-xs font-bold w-4 text-center">
                                                        {quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => addToCart(product.id)}
                                                        className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteFromCart(product.id)}
                                                        className="p-1 text-slate-400 hover:text-rose-500 ml-1"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Feature 6: Coupon Promo Code Box */}
                            <div className="pt-3 border-t border-slate-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                        <Ticket className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Promo / Discount Coupon</span>
                                    </span>
                                    {!appliedCoupon && !showCouponInput && (
                                        <button
                                            type="button"
                                            onClick={() => setShowCouponInput(true)}
                                            className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                                        >
                                            + Coupon Add Karein
                                        </button>
                                    )}
                                </div>

                                {appliedCoupon ? (
                                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                                                %
                                            </div>
                                            <div>
                                                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                                                    <span>{appliedCoupon.code}</span>
                                                    <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded-full font-semibold">
                                                        Applied!
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-emerald-700">
                                                    {appliedCoupon.label} (-{store.currencySymbol} {discountAmount.toLocaleString("en-PK")})
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemoveCoupon}
                                            className="p-1 rounded-lg hover:bg-emerald-200 text-emerald-700 transition cursor-pointer"
                                            title="Remove Coupon"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : showCouponInput ? (
                                    <div className="space-y-1.5">
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Enter coupon (e.g. WELCOME10, FREESHIP)"
                                                    value={couponInput}
                                                    onChange={e => setCouponInput(e.target.value.toUpperCase())}
                                                    className="w-full uppercase font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleApplyCoupon}
                                                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                        {couponError && (
                                            <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>
                                        )}
                                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                                            <span className="text-[10px] text-slate-400">Available:</span>
                                            {Object.keys(AVAILABLE_COUPONS).map(code => (
                                                <button
                                                    key={code}
                                                    type="button"
                                                    onClick={() => {
                                                        setCouponInput(code);
                                                        setCouponError("");
                                                    }}
                                                    className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 text-[10px] font-mono font-bold text-slate-700 hover:text-emerald-700 rounded-md border border-slate-200 transition cursor-pointer shrink-0"
                                                >
                                                    {code}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            {/* Customer Information Form */}
                            <form id="checkout-form" onSubmit={handleCheckout} className="space-y-3 pt-2 border-t border-slate-200">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    Delivery Details
                                </h3>

                                {errorMessage && (
                                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                                        <span>{errorMessage}</span>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Aapka Naam (Customer Name) *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Muhammad Ali"
                                        value={customerName}
                                        onChange={e => setCustomerName(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        WhatsApp Phone Number *
                                    </label>
                                    <div className="relative">
                                        <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="tel"
                                            required
                                            placeholder="e.g. 0300 1234567"
                                            value={customerPhone}
                                            onChange={e => setCustomerPhone(e.target.value)}
                                            onBlur={() => {
                                                if (customerPhone.trim().length >= 10 && cartItems.length > 0) {
                                                    fetch("/api/store/abandoned", {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({
                                                            action: "record",
                                                            storeId: store.id,
                                                            customerName: customerName.trim() || "Customer",
                                                            customerPhone: customerPhone.trim(),
                                                            customerAddress: customerAddress.trim() || undefined,
                                                            subtotal: subtotal,
                                                            items: cartItems.map(item => ({ productName: item.product.name, quantity: item.quantity }))
                                                        })
                                                    }).catch(() => {});
                                                }
                                            }}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Order confirmation isi WhatsApp par bhej di jayegi.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Delivery Address / Mohalla *
                                    </label>
                                    <div className="relative">
                                        <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                                        <textarea
                                            required
                                            rows={2}
                                            placeholder="Ghar / Flat number, Gali, Mohalla, Mashhoor jagah..."
                                            value={customerAddress}
                                            onChange={e => setCustomerAddress(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Rider Ke Liye Hidayat (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Gate par bell bajayein, change sath layein..."
                                        value={customerNotes}
                                        onChange={e => setCustomerNotes(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                                    />
                                </div>

                                {/* Payment Method */}
                                <div className="space-y-2.5 pt-1">
                                    <label className="block text-xs font-semibold text-slate-700">
                                        Payment Method *
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod("COD")}
                                            className={`py-2 px-1.5 rounded-xl border text-[11px] sm:text-xs font-semibold text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                                                paymentMethod === "COD"
                                                    ? "bg-emerald-50 border-emerald-600 text-emerald-800 font-bold shadow-2xs"
                                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                            }`}
                                        >
                                            <span className="text-sm">💵</span>
                                            <span>Cash (COD)</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod("JAZZCASH")}
                                            className={`py-2 px-1.5 rounded-xl border text-[11px] sm:text-xs font-semibold text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                                                paymentMethod === "JAZZCASH"
                                                    ? "bg-orange-50 border-orange-500 text-orange-900 font-bold shadow-2xs"
                                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                            }`}
                                        >
                                            <span className="text-sm">📱</span>
                                            <span>JazzCash</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod("EASYPAISA")}
                                            className={`py-2 px-1.5 rounded-xl border text-[11px] sm:text-xs font-semibold text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                                                paymentMethod === "EASYPAISA"
                                                    ? "bg-teal-50 border-teal-500 text-teal-900 font-bold shadow-2xs"
                                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                            }`}
                                        >
                                            <span className="text-sm">🟢</span>
                                            <span>EasyPaisa</span>
                                        </button>
                                    </div>

                                    {/* Feature 7: Interactive Payment Details for JazzCash & EasyPaisa */}
                                    {(paymentMethod === "JAZZCASH" || paymentMethod === "EASYPAISA") && (
                                        <div className={`p-3.5 rounded-2xl border text-xs space-y-3 animate-fade-in ${
                                            paymentMethod === "JAZZCASH"
                                                ? "bg-gradient-to-br from-amber-50 to-orange-50/70 border-orange-200"
                                                : "bg-gradient-to-br from-emerald-50 to-teal-50/70 border-teal-200"
                                        }`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">
                                                        {paymentMethod === "JAZZCASH" ? "📱" : "🟢"}
                                                    </span>
                                                    <div>
                                                        <strong className="text-slate-900">
                                                            {paymentMethod === "JAZZCASH" ? "JazzCash Account" : "EasyPaisa Account"}
                                                        </strong>
                                                        <p className="text-[10px] text-slate-500">
                                                            Title: <strong>{store.name}</strong>
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyAccount(store.phone)}
                                                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-mono text-[11px] font-bold text-slate-800 transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                                                >
                                                    {copiedNumber ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                                                    <span>{copiedNumber ? "Copied!" : store.phone}</span>
                                                </button>
                                            </div>

                                            <p className="text-[11px] text-slate-600 leading-relaxed bg-white/70 p-2 rounded-xl border border-black/5">
                                                💡 Apne {paymentMethod === "JAZZCASH" ? "JazzCash" : "EasyPaisa"} App se is number par total bill <strong>{store.currencySymbol} {totalBill.toLocaleString("en-PK")}</strong> send karke neeche TID ya screenshot darj karein.
                                            </p>

                                            {/* TID Input */}
                                            <div>
                                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                                    Transaction ID (TID) *
                                                </label>
                                                <div className="relative">
                                                    <Receipt className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. 12-digit TID Number (SMS se)"
                                                        value={transactionId}
                                                        onChange={e => setTransactionId(e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                                    />
                                                </div>
                                            </div>

                                            {/* Receipt Screenshot Upload */}
                                            <div>
                                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                                    Payment Screenshot / Slip (Optional)
                                                </label>
                                                {paymentProofUrl ? (
                                                    <div className="flex items-center justify-between p-2 bg-emerald-100/70 border border-emerald-300 rounded-xl text-emerald-900">
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                            <span className="text-[11px] font-bold">Payment Slip Verified!</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setPaymentProofUrl("")}
                                                            className="text-[10px] text-rose-600 font-bold hover:underline"
                                                        >
                                                            Hataiye (Remove)
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="flex items-center justify-center gap-2 p-2.5 border border-dashed border-slate-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/50 rounded-xl cursor-pointer transition text-xs font-semibold text-slate-700">
                                                        {isUploadingProof ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                                                                <span>Slip Upload Ho Rahi Hai...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <UploadCloud className="w-4 h-4 text-emerald-600" />
                                                                <span>Payment Slip / Screenshot Upload Karein</span>
                                                            </>
                                                        )}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            disabled={isUploadingProof}
                                                            onChange={e => {
                                                                const f = e.target.files?.[0];
                                                                if (f) handleUploadReceipt(f);
                                                            }}
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Drawer Footer & Total */}
                        <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
                            <div className="space-y-1.5 text-xs text-slate-600">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>{store.currencySymbol} {subtotal.toLocaleString("en-PK")}</span>
                                </div>
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-emerald-700 font-bold">
                                        <span className="flex items-center gap-1">
                                            <Ticket className="w-3.5 h-3.5" />
                                            <span>Discount {appliedCoupon ? `(${appliedCoupon.code})` : ""}:</span>
                                        </span>
                                        <span>-{store.currencySymbol} {discountAmount.toLocaleString("en-PK")}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span>Delivery Charges:</span>
                                    <span>
                                        {deliveryFee === 0 ? (
                                            <span className="text-emerald-700 font-bold">FREE</span>
                                        ) : (
                                            `${store.currencySymbol} ${deliveryFee.toLocaleString("en-PK")}`
                                        )}
                                    </span>
                                </div>
                                {store.estimatedDeliveryTime && (
                                    <div className="flex justify-between items-center text-[11px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-emerald-600" />
                                            <span>Est. Delivery:</span>
                                        </span>
                                        <span className="font-bold">{store.estimatedDeliveryTime}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-200">
                                    <span>Total Bill:</span>
                                    <span className="text-emerald-700">
                                        {store.currencySymbol} {totalBill.toLocaleString("en-PK")}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                form="checkout-form"
                                disabled={isSubmitting || cartItems.length === 0}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isSubmitting ? (
                                    <span>Order Submit Ho Raha Hai...</span>
                                ) : (
                                    <>
                                        <ShoppingBag className="w-4 h-4" />
                                        <span>Order Place Karein ({store.currencySymbol} {totalBill.toLocaleString("en-PK")})</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Success Modal */}
            {completedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl space-y-4">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Order Receive Ho Gaya! 🎉</h2>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Aapka order number <strong>#{completedOrder.orderNumber}</strong> hai. Total Bill:{" "}
                            <strong>{store.currencySymbol} {completedOrder.total.toLocaleString("en-PK")}</strong>. Dukaan wale jald dispatch karenge.
                        </p>

                        <div className="pt-2 space-y-2">
                            <a
                                href={completedOrder.whatsappRedirectUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm"
                            >
                                <Phone className="w-4 h-4" />
                                <span>WhatsApp Par Dukaan Se Chat Karein</span>
                            </a>
                            <button
                                onClick={() => {
                                    setCompletedOrder(null);
                                    setIsOrderHistoryOpen(true);
                                    refreshCachedOrdersStatus();
                                }}
                                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 text-xs cursor-pointer"
                            >
                                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                <span>📜 Browser Order History Dekhein</span>
                            </button>
                            <button
                                onClick={() => setCompletedOrder(null)}
                                className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                            >
                                Band Karein (Close)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Feature 3: Floating AI Dukandar Shopping Assistant Trigger Button */}
            <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-40">
                <button
                    type="button"
                    onClick={() => setIsAiOpen(true)}
                    className="group relative flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs sm:text-sm py-2.5 px-3.5 rounded-full shadow-xl border-2 border-white transition active:scale-95 cursor-pointer"
                >
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-200"></span>
                    </span>
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0" />
                    <span className="tracking-wide">AI Dukandar</span>
                    <span className="bg-white/20 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                        Online
                    </span>
                </button>
            </div>

            {/* Feature 3: AI Dukandar Sliding Chat Drawer */}
            {isAiOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
                    <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-slide-left">
                        {/* Chat Header */}
                        <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 text-white">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold">
                                    <Bot className="w-5 h-5 text-emerald-300" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm flex items-center gap-1.5">
                                        <span>AI Dukandar</span>
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    </h3>
                                    <p className="text-[10px] text-emerald-200">
                                        {store.name} Shopping Guide
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAiOpen(false)}
                                className="p-1.5 rounded-xl hover:bg-white/20 text-white transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Quick Chips Banner */}
                        <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                            {[
                                "🔥 Deals & Coupons?",
                                "🚚 Delivery Fee Kitni Hai?",
                                "⭐ Best Products Dikhayein",
                                "🕒 Dukaan Timing Kya Hai?"
                            ].map(chip => (
                                <button
                                    key={chip}
                                    type="button"
                                    onClick={() => handleSendAiMessage(chip)}
                                    className="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 text-[10px] font-semibold whitespace-nowrap transition cursor-pointer shrink-0 shadow-2xs"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>

                        {/* Chat Messages Feed */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
                            {aiMessages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs whitespace-pre-line ${
                                            msg.role === "user"
                                                ? "bg-emerald-600 text-white rounded-tr-none font-medium"
                                                : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none font-normal"
                                        }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isAiLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3 shadow-2xs flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" />
                                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
                                        <span className="text-[11px] text-slate-400 font-semibold ml-1">AI Dukandar type kar raha hai...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={aiMessagesEndRef} />
                        </div>

                        {/* Chat Input */}
                        <div className="p-3 bg-white border-t border-slate-200">
                            <form
                                onSubmit={e => {
                                    e.preventDefault();
                                    handleSendAiMessage();
                                }}
                                className="flex items-center gap-2"
                            >
                                <input
                                    type="text"
                                    placeholder="Urdu ya English mein sawal poochhein..."
                                    value={aiInput}
                                    onChange={e => setAiInput(e.target.value)}
                                    disabled={isAiLoading}
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                                />
                                <button
                                    type="submit"
                                    disabled={!aiInput.trim() || isAiLoading}
                                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white transition flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Recent Order Badge (Mobile & Desktop Quick Access when cart is empty) */}
            {cartCount === 0 && cachedOrders.length > 0 && !isCartOpen && !isOrderHistoryOpen && (
                <div className="fixed bottom-3 left-3 sm:bottom-6 sm:left-6 z-30 animate-bounce">
                    <button
                        type="button"
                        onClick={() => {
                            setIsOrderHistoryOpen(true);
                            refreshCachedOrdersStatus();
                        }}
                        className="flex items-center gap-2 bg-slate-900/95 hover:bg-black text-white text-xs font-bold py-2.5 px-4 rounded-full shadow-2xl border border-slate-700/80 backdrop-blur-md cursor-pointer transition active:scale-95"
                    >
                        <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>📜 Recent Order: #{cachedOrders[0].orderNumber}</span>
                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {cachedOrders[0].status}
                        </span>
                    </button>
                </div>
            )}

            {/* Customer Order History Slide-over Drawer (Browser Cache) */}
            {isOrderHistoryOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
                    <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-slide-left">
                        {/* Drawer Header */}
                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-xs">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-sm sm:text-base leading-tight">
                                        📜 Aapki Order History
                                    </h2>
                                    <p className="text-[11px] text-slate-300">
                                        Browser Cache mein mehfooz ({cachedOrders.length} {cachedOrders.length === 1 ? "Order" : "Orders"})
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={refreshCachedOrdersStatus}
                                    disabled={isRefreshingHistory || cachedOrders.length === 0}
                                    title="Refresh status from store"
                                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer disabled:opacity-40"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isRefreshingHistory ? "animate-spin text-emerald-400" : ""}`} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsOrderHistoryOpen(false)}
                                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Top Info Banner */}
                        <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2.5 text-xs text-emerald-900 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="text-[11px]">Bina account banaye orders aapke browser cache mein mehfooz hain.</span>
                            </div>
                            {cachedOrders.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleClearOrderHistory}
                                    className="text-[10px] text-rose-600 hover:text-rose-700 font-bold underline shrink-0 cursor-pointer"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* Orders List / Scrollable Container */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50 styled-scrollbar">
                            {cachedOrders.length === 0 ? (
                                <div className="text-center py-16 space-y-3">
                                    <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto shadow-inner">
                                        <ShoppingBag className="w-8 h-8" />
                                    </div>
                                    <h3 className="font-extrabold text-sm text-slate-800">
                                        Koi Purana Order Nahi Mila
                                    </h3>
                                    <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                                        Jab aap is dukaan se order place karenge, wo automatic aapke browser cache mein save ho jayega.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setIsOrderHistoryOpen(false)}
                                        className="mt-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer inline-flex items-center gap-1.5"
                                    >
                                        <ShoppingBag className="w-3.5 h-3.5" />
                                        <span>Abhi Shopping Karein</span>
                                    </button>
                                </div>
                            ) : (
                                cachedOrders.map((ord) => {
                                    const isExpanded = expandedOrderNum === ord.orderNumber;
                                    const statusLower = (ord.status || "PENDING").toUpperCase();

                                    const getStatusInfo = (st: string) => {
                                        switch (st) {
                                            case "DELIVERED":
                                                return {
                                                    label: "Delivered (پہنچ گیا)",
                                                    bg: "bg-emerald-500/15 text-emerald-800 border-emerald-500/30",
                                                    dot: "bg-emerald-500",
                                                    stepIndex: 3
                                                };
                                            case "OUT_FOR_DELIVERY":
                                                return {
                                                    label: "On The Way (راستے میں ہے)",
                                                    bg: "bg-purple-500/15 text-purple-800 border-purple-500/30",
                                                    dot: "bg-purple-500 animate-pulse",
                                                    stepIndex: 2
                                                };
                                            case "PREPARING":
                                                return {
                                                    label: "Packing (تیار ہو رہا ہے)",
                                                    bg: "bg-amber-500/15 text-amber-800 border-amber-500/30",
                                                    dot: "bg-amber-500",
                                                    stepIndex: 1
                                                };
                                            case "CONFIRMED":
                                                return {
                                                    label: "Confirmed (منظور شدہ)",
                                                    bg: "bg-blue-500/15 text-blue-800 border-blue-500/30",
                                                    dot: "bg-blue-500",
                                                    stepIndex: 1
                                                };
                                            case "CANCELLED":
                                                return {
                                                    label: "Cancelled (منسوخ)",
                                                    bg: "bg-rose-500/15 text-rose-800 border-rose-500/30",
                                                    dot: "bg-rose-500",
                                                    stepIndex: -1
                                                };
                                            default:
                                                return {
                                                    label: "Pending (زیرِ غور)",
                                                    bg: "bg-amber-500/15 text-amber-800 border-amber-500/30",
                                                    dot: "bg-amber-500 animate-pulse",
                                                    stepIndex: 0
                                                };
                                        }
                                    };

                                    const stInfo = getStatusInfo(statusLower);
                                    const formattedDate = ord.placedAt
                                        ? new Date(ord.placedAt).toLocaleDateString("en-PK", {
                                              day: "numeric",
                                              month: "short",
                                              year: "numeric",
                                              hour: "numeric",
                                              minute: "2-digit",
                                              hour12: true
                                          })
                                        : "Recent Order";

                                    const waInquiryUrl = `https://wa.me/${store.phone ? store.phone.replace(/[^\d]/g, "") : ""}?text=${encodeURIComponent(
                                        `Assalam-o-Alaikum! Mere order #${ord.orderNumber} (Rs. ${ord.total.toLocaleString("en-PK")}) ka status kya hai?`
                                    )}`;

                                    return (
                                        <div
                                            key={ord.orderNumber}
                                            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md"
                                        >
                                            {/* Order Card Top Bar */}
                                            <div
                                                onClick={() => setExpandedOrderNum(isExpanded ? null : ord.orderNumber)}
                                                className="p-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-3 cursor-pointer select-none"
                                            >
                                                <div className="space-y-0.5 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-mono font-black text-sm text-slate-900">
                                                            #{ord.orderNumber}
                                                        </span>
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${stInfo.bg}`}
                                                        >
                                                            <span className={`w-1.5 h-1.5 rounded-full ${stInfo.dot}`} />
                                                            <span>{stInfo.label}</span>
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3 text-slate-400" />
                                                        <span>{formattedDate}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <div className="text-right">
                                                        <div className="font-black text-sm text-emerald-700">
                                                            {store.currencySymbol} {ord.total.toLocaleString("en-PK")}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-medium">
                                                            {ord.items?.length || 0} items
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition"
                                                    >
                                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Progress Stepper Bar */}
                                            {statusLower !== "CANCELLED" && (
                                                <div className="px-4 py-3 bg-white border-b border-slate-100">
                                                    <div className="flex items-center justify-between relative">
                                                        <div className="absolute top-1/2 left-3 right-3 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />
                                                        <div
                                                            className="absolute top-1/2 left-3 -translate-y-1/2 h-0.5 bg-emerald-500 transition-all duration-500 z-0"
                                                            style={{
                                                                width:
                                                                    stInfo.stepIndex === 0
                                                                        ? "15%"
                                                                        : stInfo.stepIndex === 1
                                                                        ? "48%"
                                                                        : stInfo.stepIndex === 2
                                                                        ? "80%"
                                                                        : "100%"
                                                            }}
                                                        />
                                                        {[
                                                            { step: 0, title: "Booked" },
                                                            { step: 1, title: "Confirmed" },
                                                            { step: 2, title: "On The Way" },
                                                            { step: 3, title: "Delivered" }
                                                        ].map(st => {
                                                            const isDone = stInfo.stepIndex >= st.step;
                                                            return (
                                                                <div key={st.step} className="flex flex-col items-center relative z-10">
                                                                    <div
                                                                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                                                            isDone
                                                                                ? "bg-emerald-600 text-white shadow-xs"
                                                                                : "bg-slate-200 text-slate-500"
                                                                        }`}
                                                                    >
                                                                        {isDone ? "✓" : st.step + 1}
                                                                    </div>
                                                                    <span
                                                                        className={`text-[9px] mt-1 font-semibold ${
                                                                            isDone ? "text-emerald-700" : "text-slate-400"
                                                                        }`}
                                                                    >
                                                                        {st.title}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Expanded Order Details */}
                                            {isExpanded && (
                                                <div className="p-4 space-y-3 bg-white">
                                                    {/* Items List */}
                                                    <div className="space-y-2">
                                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                                            Order Items
                                                        </span>
                                                        <div className="divide-y divide-slate-100 bg-slate-50/60 rounded-xl p-2.5 border border-slate-100">
                                                            {ord.items && ord.items.length > 0 ? (
                                                                ord.items.map((it, idx) => (
                                                                    <div key={idx} className="py-1.5 flex items-center justify-between text-xs gap-2">
                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                            {it.productImage && (
                                                                                <img
                                                                                    src={it.productImage}
                                                                                    alt={it.productName}
                                                                                    className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0"
                                                                                />
                                                                            )}
                                                                            <span className="font-semibold text-slate-800 truncate">
                                                                                {it.productName}
                                                                            </span>
                                                                            <span className="text-[11px] text-slate-500 shrink-0">
                                                                                × {it.quantity}
                                                                            </span>
                                                                        </div>
                                                                        <span className="font-bold text-slate-900 shrink-0">
                                                                            {store.currencySymbol} {it.totalPrice?.toLocaleString("en-PK") || (it.unitPrice * it.quantity).toLocaleString("en-PK")}
                                                                        </span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <p className="text-xs text-slate-500">Items summary not available</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Delivery & Payment Info */}
                                                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                        <div>
                                                            <span className="text-slate-400 font-bold block">Delivery Address:</span>
                                                            <p className="text-slate-700 font-medium truncate mt-0.5">
                                                                {ord.customerAddress}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 font-bold block">Payment Mode:</span>
                                                            <p className="text-slate-700 font-medium mt-0.5">
                                                                {ord.paymentMethod === "COD" ? "Cash On Delivery (COD)" : ord.paymentMethod}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Price Breakdown */}
                                                    <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2">
                                                        <div className="flex justify-between">
                                                            <span>Subtotal:</span>
                                                            <span>{store.currencySymbol} {(ord.subtotal || 0).toLocaleString("en-PK")}</span>
                                                        </div>
                                                        {ord.discount > 0 && (
                                                            <div className="flex justify-between text-emerald-700 font-semibold">
                                                                <span>Discount:</span>
                                                                <span>-{store.currencySymbol} {ord.discount.toLocaleString("en-PK")}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between">
                                                            <span>Delivery Charges:</span>
                                                            <span>{ord.deliveryFee === 0 ? "FREE" : `${store.currencySymbol} ${ord.deliveryFee.toLocaleString("en-PK")}`}</span>
                                                        </div>
                                                        <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-100">
                                                            <span>Total Bill:</span>
                                                            <span className="text-emerald-700">
                                                                {store.currencySymbol} {ord.total.toLocaleString("en-PK")}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="pt-2 grid grid-cols-2 gap-2">
                                                        <a
                                                            href={waInquiryUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                                                        >
                                                            <Phone className="w-3.5 h-3.5" />
                                                            <span>WhatsApp Chat</span>
                                                        </a>
                                                        <a
                                                            href={`/s/${store.slug}/track?query=${encodeURIComponent(ord.orderNumber)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                                                        >
                                                            <Truck className="w-3.5 h-3.5 text-blue-600" />
                                                            <span>Live Track ↗</span>
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Drawer Footer */}
                        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
                            <a
                                href={`https://wa.me/${store.phone ? store.phone.replace(/[^\d]/g, "") : ""}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                            >
                                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Dukaan Helpline</span>
                            </a>
                            <button
                                type="button"
                                onClick={() => setIsOrderHistoryOpen(false)}
                                className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
