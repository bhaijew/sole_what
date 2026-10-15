"use client";

import { useState, useMemo } from "react";
import {
    Search,
    Plus,
    Minus,
    Trash2,
    Printer,
    Check,
    CreditCard,
    Banknote,
    Smartphone,
    X,
    User,
    Phone,
    Receipt,
    Calculator,
    Package,
    ArrowRight,
    Sparkles,
    CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

interface Product {
    id: string;
    name: string;
    price: number;
    compareAtPrice?: number | null;
    unit?: string | null;
    category?: string | null;
    image?: string | null;
    inStock: boolean;
}

interface POSModalProps {
    isOpen: boolean;
    onClose: () => void;
    store: {
        id: string;
        name: string;
        currencySymbol: string;
        city?: string | null;
    };
    products: Product[];
    onSaleComplete?: (order: any) => void;
}

interface CartItem {
    product: Product;
    quantity: number;
}

export default function POSModal({
    isOpen,
    onClose,
    store,
    products,
    onSaleComplete
}: POSModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [discount, setDiscount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "JAZZCASH" | "EASYPAISA" | "BANK">("CASH");
    const [cashReceived, setCashReceived] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastCompletedOrder, setLastCompletedOrder] = useState<any>(null);

    // Extract unique categories
    const categories = useMemo(() => {
        const set = new Set<string>();
        products.forEach(p => {
            if (p.category) set.add(p.category);
        });
        return ["ALL", ...Array.from(set)];
    }, [products]);

    // Filter products
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesCat = selectedCategory === "ALL" || p.category === selectedCategory;
            const matchesSearch = !searchQuery.trim() || 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCat && matchesSearch;
        });
    }, [products, selectedCategory, searchQuery]);

    // Cart calculations
    const subtotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    }, [cart]);

    const total = useMemo(() => {
        return Math.max(0, subtotal - (Number(discount) || 0));
    }, [subtotal, discount]);

    const cashChange = useMemo(() => {
        const received = parseFloat(cashReceived) || 0;
        return received > total ? received - total : 0;
    }, [cashReceived, total]);

    // Add to cart
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(i => i.product.id === product.id);
            if (existing) {
                return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    // Update quantity
    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => {
            return prev
                .map(item => {
                    if (item.product.id === productId) {
                        const newQty = item.quantity + delta;
                        return newQty > 0 ? { ...item, quantity: newQty } : null;
                    }
                    return item;
                })
                .filter(Boolean) as CartItem[];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(i => i.product.id !== productId));
    };

    const clearCart = () => {
        setCart([]);
        setCustomerName("");
        setCustomerPhone("");
        setDiscount(0);
        setCashReceived("");
        setLastCompletedOrder(null);
    };

    // Submit POS sale
    const handleCompleteSale = async (printImmediately = false) => {
        if (cart.length === 0) {
            toast.error("Cart khali hai! Pehle kam az kam aik item add karein.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                storeId: store.id,
                customerName: customerName || "Walk-in Counter Customer",
                customerPhone: customerPhone || "",
                discount: discount,
                paymentMethod: paymentMethod,
                items: cart.map(i => ({
                    productId: i.product.id,
                    quantity: i.quantity
                }))
            };

            const res = await fetch("/api/store/pos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "POS Sale create karne mein masla hua");
            }

            toast.success(`🎉 Sale Complete! Invoice #${data.order.orderNumber}`);
            setLastCompletedOrder(data.order);
            if (onSaleComplete) {
                onSaleComplete(data.order);
            }

            if (printImmediately) {
                setTimeout(() => {
                    window.print();
                }, 300);
            }
        } catch (error: any) {
            toast.error(error.message || "Sale record nahi ho saki");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-background border border-border w-full max-w-6xl h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center font-bold">
                            <Calculator className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold tracking-tight text-foreground">Dukaan Counter POS Mode</h2>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                    Offline & Walk-In Cashier
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {store.name} • Tez billing, WhatsApp digital cash memo aur instant thermal slip
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {cart.length > 0 && (
                            <button
                                onClick={clearCart}
                                className="px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                            >
                                Reset Register
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Main Body: Left 60% Catalog / Right 40% Bill & Checkout */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    
                    {/* Left: Product Catalog & Fast Search */}
                    <div className="flex-1 flex flex-col border-r border-border overflow-hidden bg-background">
                        {/* Search & Category Filter */}
                        <div className="p-4 border-b border-border space-y-3 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Product ka naam ya category search karein..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    autoFocus
                                />
                            </div>

                            {/* Category Badges */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                                            selectedCategory === cat
                                                ? "bg-foreground text-background font-semibold"
                                                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                        }`}
                                    >
                                        {cat === "ALL" ? "Sab Products" : cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Product Grid */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {filteredProducts.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                                    <Package className="h-12 w-12 stroke-[1.2] opacity-40 mb-2" />
                                    <p className="text-sm font-medium">Koi product nahi mila</p>
                                    <p className="text-xs">Search query change karein ya products add karein.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {filteredProducts.map(p => {
                                        const inCart = cart.find(i => i.product.id === p.id);
                                        return (
                                            <div
                                                key={p.id}
                                                onClick={() => addToCart(p)}
                                                className={`group relative p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                                                    inCart 
                                                        ? "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20 ring-1 ring-emerald-500/30" 
                                                        : "border-border/60 bg-card hover:border-border hover:shadow-md"
                                                }`}
                                            >
                                                {/* In Cart Indicator */}
                                                {inCart && (
                                                    <span className="absolute top-2 right-2 h-5 w-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">
                                                        {inCart.quantity}
                                                    </span>
                                                )}

                                                <div className="space-y-1.5 mb-2">
                                                    {p.category && (
                                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-medium truncate">
                                                            {p.category}
                                                        </span>
                                                    )}
                                                    <h4 className="text-xs font-semibold text-foreground line-clamp-2 leading-snug">
                                                        {p.name}
                                                    </h4>
                                                </div>

                                                <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-auto">
                                                    <span className="text-xs font-bold text-foreground">
                                                        {store.currencySymbol} {p.price.toLocaleString("en-PK")}
                                                    </span>
                                                    <span className="h-6 w-6 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                                        <Plus className="h-3.5 w-3.5" />
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Cashier Register & Customer Details */}
                    <div className="w-full md:w-[420px] flex flex-col bg-muted/20 overflow-hidden shrink-0">
                        
                        {/* Sale / Order Banner if completed */}
                        {lastCompletedOrder && (
                            <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/30 flex items-center justify-between animate-in fade-in">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                            Order #{lastCompletedOrder.orderNumber} Saved!
                                        </p>
                                        <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
                                            {lastCompletedOrder.customerNotified ? "WhatsApp slip bhej di gayi hai." : "Sale record ho gayi hai."}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={clearCart}
                                    className="px-2.5 py-1 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm"
                                >
                                    New Sale
                                </button>
                            </div>
                        )}

                        {/* Customer Info Inputs */}
                        <div className="p-4 border-b border-border bg-card/50 space-y-2.5 shrink-0">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="relative">
                                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Customer Naam (optional)"
                                        value={customerName}
                                        onChange={e => setCustomerName(e.target.value)}
                                        className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                                <div className="relative">
                                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <input
                                        type="tel"
                                        placeholder="WhatsApp # (0300...)"
                                        value={customerPhone}
                                        onChange={e => setCustomerPhone(e.target.value)}
                                        className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                            {customerPhone && (
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                                    <Sparkles className="h-3 w-3" /> Sale complete hone par digital slip customer ke WhatsApp par chali jayegi.
                                </p>
                            )}
                        </div>

                        {/* Cart Items List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                                    <Receipt className="h-10 w-10 opacity-30 mb-2 stroke-[1.2]" />
                                    <p className="text-xs font-semibold">Bill abhi khali hai</p>
                                    <p className="text-[11px] text-muted-foreground/80 mt-1">
                                        Left side se items par click karein bill mein shamil karne ke liye.
                                    </p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div
                                        key={item.product.id}
                                        className="p-2.5 rounded-xl border border-border/70 bg-card flex items-center justify-between gap-3 shadow-sm"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <h5 className="text-xs font-semibold text-foreground truncate">
                                                {item.product.name}
                                            </h5>
                                            <p className="text-[11px] text-muted-foreground">
                                                {store.currencySymbol} {item.product.price.toLocaleString("en-PK")} each
                                            </p>
                                        </div>

                                        {/* Quantity Stepper */}
                                        <div className="flex items-center gap-1 bg-muted/80 rounded-lg p-0.5 border border-border/50">
                                            <button
                                                onClick={() => updateQuantity(item.product.id, -1)}
                                                className="h-6 w-6 rounded-md hover:bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <Minus className="h-3 w-3" />
                                            </button>
                                            <span className="w-6 text-center text-xs font-bold text-foreground">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.product.id, 1)}
                                                className="h-6 w-6 rounded-md hover:bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <Plus className="h-3 w-3" />
                                            </button>
                                        </div>

                                        {/* Line Total & Delete */}
                                        <div className="text-right flex items-center gap-2">
                                            <span className="text-xs font-bold text-foreground min-w-[50px]">
                                                {store.currencySymbol} {(item.product.price * item.quantity).toLocaleString("en-PK")}
                                            </span>
                                            <button
                                                onClick={() => removeFromCart(item.product.id)}
                                                className="text-muted-foreground hover:text-rose-500 p-1 transition-colors"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Bill Summary, Discount & Payment Modes */}
                        <div className="p-4 border-t border-border bg-card shrink-0 space-y-3">
                            
                            {/* Subtotal & Discount row */}
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                                    <span>{store.currencySymbol} {subtotal.toLocaleString("en-PK")}</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-muted-foreground">Discount ({store.currencySymbol})</span>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        min={0}
                                        value={discount || ""}
                                        onChange={e => setDiscount(Math.max(0, Number(e.target.value)))}
                                        className="w-24 px-2 py-1 text-right text-xs bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                                <div className="flex justify-between text-sm font-bold text-foreground pt-1 border-t border-border/60">
                                    <span>Net Payable:</span>
                                    <span className="text-base text-emerald-600 dark:text-emerald-400">
                                        {store.currencySymbol} {total.toLocaleString("en-PK")}
                                    </span>
                                </div>
                            </div>

                            {/* Payment Method Selector */}
                            <div className="grid grid-cols-4 gap-1.5 pt-1">
                                {[
                                    { id: "CASH", label: "Naqd / Cash", icon: Banknote },
                                    { id: "JAZZCASH", label: "JazzCash", icon: Smartphone },
                                    { id: "EASYPAISA", label: "EasyPaisa", icon: Smartphone },
                                    { id: "BANK", label: "Bank / Card", icon: CreditCard }
                                ].map(pm => {
                                    const Icon = pm.icon;
                                    const active = paymentMethod === pm.id;
                                    return (
                                        <button
                                            key={pm.id}
                                            type="button"
                                            onClick={() => setPaymentMethod(pm.id as any)}
                                            className={`p-2 rounded-xl text-center flex flex-col items-center justify-center gap-1 border transition-all ${
                                                active
                                                    ? "border-emerald-600 bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 font-semibold shadow-sm"
                                                    : "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                                            }`}
                                        >
                                            <Icon className="h-3.5 w-3.5" />
                                            <span className="text-[10px] leading-tight">{pm.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Quick Cash Tender Calculator (if Cash selected) */}
                            {paymentMethod === "CASH" && (
                                <div className="bg-muted/40 p-2.5 rounded-xl border border-border/60 space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Cash Received:</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[11px] text-muted-foreground">{store.currencySymbol}</span>
                                            <input
                                                type="number"
                                                placeholder={total.toString()}
                                                value={cashReceived}
                                                onChange={e => setCashReceived(e.target.value)}
                                                className="w-24 px-2 py-0.5 text-right text-xs bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                                            />
                                        </div>
                                    </div>
                                    {parseFloat(cashReceived) > total && (
                                        <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 pt-1 border-t border-border/40">
                                            <span>Return Change (Baqaya):</span>
                                            <span>{store.currencySymbol} {cashChange.toLocaleString("en-PK")}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Checkout Buttons */}
                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                    type="button"
                                    disabled={cart.length === 0 || isSubmitting}
                                    onClick={() => handleCompleteSale(false)}
                                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                                >
                                    <Check className="h-4 w-4" />
                                    {isSubmitting ? "Processing..." : "Complete Sale"}
                                </button>
                                <button
                                    type="button"
                                    disabled={cart.length === 0 || isSubmitting}
                                    onClick={() => handleCompleteSale(true)}
                                    className="w-full py-2.5 px-3 bg-foreground hover:bg-foreground/90 disabled:opacity-50 text-background text-xs font-bold rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
                                >
                                    <Printer className="h-4 w-4" />
                                    Print Receipt
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
