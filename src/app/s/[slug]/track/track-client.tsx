"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Search,
    Package,
    Truck,
    CheckCircle2,
    Clock,
    Phone,
    MapPin,
    ArrowLeft,
    RefreshCw,
    AlertCircle,
    Store,
    Receipt,
    Sparkles
} from "lucide-react";

interface StoreProps {
    id: string;
    name: string;
    slug: string;
    phone: string;
    logoUrl?: string | null;
    currencySymbol: string;
    estimatedDeliveryTime?: string | null;
    city?: string | null;
}

interface OrderData {
    id: string;
    orderNumber: string;
    status: string;
    customerName: string;
    customerAddress: string;
    subtotal: number;
    deliveryFee: number;
    discount: number;
    total: number;
    paymentMethod: string;
    createdAt: string;
    updatedAt: string;
    items: {
        productName: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        productImage?: string | null;
    }[];
}

const STEPS = [
    { key: "PENDING", label: "Order Received", urdu: "Order Receive Ho Gaya", icon: Package },
    { key: "CONFIRMED", label: "Confirmed", urdu: "Dukaan Se Confirm", icon: CheckCircle2 },
    { key: "PREPARING", label: "Packing / Cooking", urdu: "Saman Pack Ho Raha Hai", icon: Clock },
    { key: "OUT_FOR_DELIVERY", label: "Out For Delivery", urdu: "Rider Raste Mein Hai", icon: Truck },
    { key: "DELIVERED", label: "Delivered", urdu: "Kamyabi Se Deliver", icon: CheckCircle2 }
];

export default function TrackOrderClient({
    store,
    initialQuery
}: {
    store: StoreProps;
    initialQuery?: string;
}) {
    const [query, setQuery] = useState<string>(initialQuery || "");
    const [order, setOrder] = useState<OrderData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const fetchOrder = async (searchTarget: string) => {
        if (!searchTarget.trim()) return;
        setIsLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/store/track?slug=${store.slug}&query=${encodeURIComponent(searchTarget.trim())}`);
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Order nahi mila.");
            }
            setOrder(data.order);
        } catch (err: any) {
            setOrder(null);
            setError(err.message || "Order dhoondne mein masla pesh aaya.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (initialQuery) {
            fetchOrder(initialQuery);
        }
    }, [initialQuery]);

    const getStepStatus = (stepKey: string, currentStatus: string) => {
        if (currentStatus === "CANCELLED") return "cancelled";
        const orderIndex = STEPS.findIndex(s => s.key === currentStatus);
        const thisIndex = STEPS.findIndex(s => s.key === stepKey);

        if (thisIndex < orderIndex) return "completed";
        if (thisIndex === orderIndex) return "active";
        return "upcoming";
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans antialiased selection:bg-emerald-500 selection:text-white">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
                <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                    <Link
                        href={`/s/${store.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-slate-200 transition cursor-pointer"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Dukaan Par Wapis Jayein</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        {store.logoUrl && (
                            <img src={store.logoUrl} alt={store.name} className="w-7 h-7 rounded-lg object-cover" />
                        )}
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                            {store.name}
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
                {/* Search Bar Card */}
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <Truck className="w-4 h-4" />
                        </div>
                        <div>
                            <h1 className="text-base sm:text-lg font-black text-slate-900">
                                Live Order Tracking
                            </h1>
                            <p className="text-xs text-slate-500">
                                Apna Order ID (e.g. ORD-1001) ya WhatsApp Phone number darj karein
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={e => {
                            e.preventDefault();
                            fetchOrder(query);
                        }}
                        className="flex gap-2 pt-1"
                    >
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                required
                                placeholder="e.g. ORD-1001 ya 03001234567"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || !query.trim()}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                            {isLoading ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <span>Track Karein</span>
                            )}
                        </button>
                    </form>

                    {error && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                {/* Order Result Card */}
                {order && (
                    <div className="space-y-4 animate-fade-in">
                        {/* Status Timeline Card */}
                        <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Tracking Order
                                    </span>
                                    <h2 className="text-xl font-black text-slate-900 font-mono">
                                        #{order.orderNumber}
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Placed on: {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide ${
                                        order.status === "DELIVERED"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : order.status === "CANCELLED"
                                            ? "bg-rose-100 text-rose-800"
                                            : "bg-blue-100 text-blue-800 animate-pulse"
                                    }`}>
                                        ● {order.status}
                                    </span>
                                </div>
                            </div>

                            {/* Pizza-Tracker Visual Stepper */}
                            <div className="relative">
                                <div className="space-y-6 sm:space-y-8">
                                    {STEPS.map((step, idx) => {
                                        const state = getStepStatus(step.key, order.status);
                                        const IconComp = step.icon;

                                        return (
                                            <div key={step.key} className="flex items-start gap-3.5 relative">
                                                {/* Vertical connector line */}
                                                {idx < STEPS.length - 1 && (
                                                    <div
                                                        className={`absolute left-4 top-8 -bottom-6 w-0.5 transition-colors ${
                                                            state === "completed"
                                                                ? "bg-emerald-500"
                                                                : "bg-slate-200"
                                                        }`}
                                                    />
                                                )}

                                                {/* Icon node */}
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                                                        state === "completed"
                                                            ? "bg-emerald-600 text-white shadow-sm"
                                                            : state === "active"
                                                            ? "bg-emerald-500 text-white ring-4 ring-emerald-100 shadow-md animate-bounce"
                                                            : "bg-slate-100 text-slate-400 border border-slate-200"
                                                    }`}
                                                >
                                                    <IconComp className="w-4 h-4" />
                                                </div>

                                                <div className="flex-1 min-w-0 pt-0.5">
                                                    <div className="flex items-center justify-between">
                                                        <h4
                                                            className={`text-xs sm:text-sm font-bold ${
                                                                state === "completed" || state === "active"
                                                                    ? "text-slate-900"
                                                                    : "text-slate-400"
                                                            }`}
                                                        >
                                                            {step.label}
                                                        </h4>
                                                        {state === "active" && (
                                                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                                                In Progress
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500">{step.urdu}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Delivery Estimate Box */}
                            <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2 text-emerald-900">
                                    <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>
                                        Estimated Time: <strong>{store.estimatedDeliveryTime || "30-45 mins"}</strong>
                                    </span>
                                </div>
                                <a
                                    href={`https://wa.me/${store.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
                                        `Assalam-o-Alaikum! Mere Order #${order.orderNumber} ke bare mein maloomat chahiye.`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer text-[11px]"
                                >
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>WhatsApp Rabta</span>
                                </a>
                            </div>
                        </div>

                        {/* Order Items & Summary Card */}
                        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-emerald-600" />
                                <span>Aapka Order Saman ({order.items.length} items)</span>
                            </h3>

                            <div className="divide-y divide-slate-100 bg-slate-50 rounded-2xl p-3 space-y-2">
                                {order.items.map((it, idx) => (
                                    <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-slate-800">{it.productName}</p>
                                            <p className="text-[11px] text-slate-400">
                                                {it.quantity}x @ {store.currencySymbol} {it.unitPrice.toLocaleString("en-PK")}
                                            </p>
                                        </div>
                                        <span className="font-mono font-bold text-slate-900">
                                            {store.currencySymbol} {it.totalPrice.toLocaleString("en-PK")}
                                        </span>
                                    </div>
                                ))}

                                <div className="pt-3 space-y-1 font-semibold text-slate-600">
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>{store.currencySymbol} {order.subtotal.toLocaleString("en-PK")}</span>
                                    </div>
                                    {order.discount > 0 && (
                                        <div className="flex justify-between text-emerald-700 font-bold">
                                            <span>Discount:</span>
                                            <span>-{store.currencySymbol} {order.discount.toLocaleString("en-PK")}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span>Delivery:</span>
                                        <span>
                                            {order.deliveryFee === 0 ? "FREE" : `${store.currencySymbol} ${order.deliveryFee.toLocaleString("en-PK")}`}
                                        </span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-900 text-sm">
                                        <span>Total Bill ({order.paymentMethod}):</span>
                                        <span className="text-emerald-700">
                                            {store.currencySymbol} {order.total.toLocaleString("en-PK")}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Address */}
                            <div className="bg-slate-50 p-3 rounded-2xl flex items-start gap-2 text-slate-600 text-xs">
                                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                <div>
                                    <strong className="text-slate-800">Delivery Address:</strong>
                                    <p className="text-slate-600 mt-0.5">{order.customerAddress}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
