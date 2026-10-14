"use client";

import { useState, useMemo } from "react";
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
    ArrowRight
} from "lucide-react";

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
    noticeMessage?: string | null;
    isOpen: boolean;
    customDomain?: string | null;
    categories: Category[];
    products: Product[];
}

export default function StorefrontClient({ store }: { store: StoreData }) {
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [cart, setCart] = useState<Map<string, number>>(new Map());
    const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

    // Checkout Form state
    const [customerName, setCustomerName] = useState<string>("");
    const [customerPhone, setCustomerPhone] = useState<string>("");
    const [customerAddress, setCustomerAddress] = useState<string>("");
    const [customerNotes, setCustomerNotes] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<string>("COD");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");

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

    const deliveryFee = useMemo(() => {
        if (store.freeDeliveryAbove && subtotal >= store.freeDeliveryAbove) {
            return 0;
        }
        return store.deliveryFee;
    }, [subtotal, store.deliveryFee, store.freeDeliveryAbove]);

    const totalBill = subtotal + deliveryFee;

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
                    items: itemsPayload
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Order place karne mein masla pesh aaya.");
            }

            // Order Placed Successfully
            setCompletedOrder({
                orderNumber: data.orderNumber,
                total: data.total,
                whatsappRedirectUrl: data.whatsappRedirectUrl
            });
            setCart(new Map());
            setIsCartOpen(false);
        } catch (err: any) {
            setErrorMessage(err.message || "Failed to submit order. Please try again.");
        } finally {
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

                    <div className="flex items-center gap-2 shrink-0">
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
                        <div className="flex items-center gap-4 shrink-0">
                            {store.address && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>{store.address}</span>
                                </span>
                            )}
                            {store.estimatedDeliveryTime && (
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>{store.estimatedDeliveryTime}</span>
                                </span>
                            )}
                        </div>
                        {store.freeDeliveryAbove && store.freeDeliveryAbove > 0 && (
                            <span className="shrink-0 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Free delivery over {store.currencySymbol} {store.freeDeliveryAbove}
                            </span>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-5xl mx-auto px-4 pt-4 sm:pt-6">
                {/* Search Bar */}
                <div className="relative mb-4">
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
                            );
                        })}
                    </div>
                )}
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
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Payment Method
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod("COD")}
                                            className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition cursor-pointer ${
                                                paymentMethod === "COD"
                                                    ? "bg-emerald-50 border-emerald-600 text-emerald-800"
                                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                            }`}
                                        >
                                            💵 Cash on Delivery
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod("JAZZCASH")}
                                            className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition cursor-pointer ${
                                                paymentMethod === "JAZZCASH"
                                                    ? "bg-emerald-50 border-emerald-600 text-emerald-800"
                                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                            }`}
                                        >
                                            📲 JazzCash / Easypaisa
                                        </button>
                                    </div>
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
                                onClick={() => setCompletedOrder(null)}
                                className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                            >
                                Band Karein (Close)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
