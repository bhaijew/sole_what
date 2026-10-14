"use client";

import { useState, useEffect } from "react";
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
    Filter
} from "lucide-react";
import { toast } from "sonner";

interface StoreData {
    id: string;
    name: string;
    slug: string;
    tagline?: string | null;
    description?: string | null;
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

export default function StoreDashboardPage() {
    const [stores, setStores] = useState<StoreData[]>([]);
    const [activeStore, setActiveStore] = useState<StoreData | null>(null);
    const [activeTab, setActiveTab] = useState<"settings" | "products" | "orders">("settings");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [copied, setCopied] = useState<boolean>(false);

    // Products & Orders state
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>("ALL");

    // New Store Modal
    const [showCreateStoreModal, setShowCreateStoreModal] = useState<boolean>(false);
    const [newStoreName, setNewStoreName] = useState<string>("");
    const [newStorePhone, setNewStorePhone] = useState<string>("");
    const [newStoreSlug, setNewStoreSlug] = useState<string>("");

    // New Product Modal
    const [showAddProductModal, setShowAddProductModal] = useState<boolean>(false);
    const [productName, setProductName] = useState<string>("");
    const [productPrice, setProductPrice] = useState<string>("");
    const [productComparePrice, setProductComparePrice] = useState<string>("");
    const [productUnit, setProductUnit] = useState<string>("item");
    const [productImage, setProductImage] = useState<string>("");

    // Custom Domain Input
    const [customDomainInput, setCustomDomainInput] = useState<string>("");
    const [isSavingDomain, setIsSavingDomain] = useState<boolean>(false);

    // Load Stores on mount
    useEffect(() => {
        fetchStores();
    }, []);

    // Load store products/orders when store or tab changes
    useEffect(() => {
        if (activeStore) {
            setCustomDomainInput(activeStore.customDomain || "");
            if (activeTab === "products") {
                fetchProducts(activeStore.id);
            } else if (activeTab === "orders") {
                fetchOrders(activeStore.id);
            }
        }
    }, [activeStore, activeTab]);

    const fetchStores = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/stores");
            const data = await res.json();
            if (res.ok && data.stores) {
                setStores(data.stores);
                if (data.stores.length > 0) {
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

    const handleCreateStore = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStoreName.trim()) return;

        try {
            const res = await fetch("/api/stores", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newStoreName,
                    phone: newStorePhone,
                    slug: newStoreSlug
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success("Dukaan kamiyabi se create ho gayi hai! 🎉");
            setShowCreateStoreModal(false);
            setNewStoreName("");
            setNewStorePhone("");
            setNewStoreSlug("");
            fetchStores();
        } catch (err: any) {
            toast.error(err.message || "Failed to create store");
        }
    };

    const handleSaveDomain = async () => {
        if (!activeStore) return;
        setIsSavingDomain(true);
        try {
            const res = await fetch(`/api/stores/${activeStore.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customDomain: customDomainInput })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success("Domain settings update ho gayi hain!");
            setActiveStore(data.store);
        } catch (err: any) {
            toast.error(err.message || "Failed to update domain");
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
                toast.success(newStatus ? "Dukaan Online ho gayi hai! (Accepting orders)" : "Dukaan Closed mark kar di gayi hai.");
            }
        } catch (e) {
            toast.error("Failed to update status");
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

            toast.success("Product dukaan par add ho gaya! 📦");
            setShowAddProductModal(false);
            setProductName("");
            setProductPrice("");
            setProductComparePrice("");
            setProductImage("");
            fetchProducts(activeStore.id);
        } catch (err: any) {
            toast.error(err.message || "Failed to add product");
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
                toast.success(`Order #${data.order.orderNumber} status updated to ${newStatus}. WhatsApp notification sent!`);
                fetchOrders(activeStore.id);
            }
        } catch (e) {
            toast.error("Failed to update order status");
        }
    };

    const copyStoreLink = () => {
        if (!activeStore) return;
        const origin = window.location.origin;
        const url = `${origin}/s/${activeStore.slug}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Store link copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Store className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <span>Digital Dukaan / WhatsApp Commerce</span>
                            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                                New
                            </span>
                        </h1>
                        <p className="text-xs text-slate-500">
                            Bina Shopify aur hosting ke apna online store chalayein aur orders seedha WhatsApp par lein.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowCreateStoreModal(true)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Nayi Dukaan Banayein</span>
                    </button>
                </div>
            </div>

            {/* No Store Empty State */}
            {stores.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-md mx-auto my-12 space-y-4">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                        <Store className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Aapki koi dukaan register nahi hai</h2>
                        <p className="text-xs text-slate-500 mt-1">
                            Apni pehli dukaan banayein, products add karein aur WhatsApp par instant orders lena shuru karein.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateStoreModal(true)}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                    >
                        Pehli Dukaan Banayein (1 Minute)
                    </button>
                </div>
            ) : (
                activeStore && (
                    <div className="space-y-6">
                        {/* Store Selector & Status Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold truncate">{activeStore.name}</h2>
                                        <button
                                            onClick={handleToggleStoreOpen}
                                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full cursor-pointer transition ${
                                                activeStore.isOpen
                                                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                                    : "bg-rose-500 text-white hover:bg-rose-600"
                                            }`}
                                        >
                                            {activeStore.isOpen ? "● Store Open" : "● Store Closed"}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                        <span>Link: /s/{activeStore.slug}</span>
                                        {activeStore.customDomain && (
                                            <span className="text-emerald-400 font-medium">
                                                • {activeStore.customDomain}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={copyStoreLink}
                                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition text-slate-200"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copied ? "Copied!" : "Copy Link"}</span>
                                </button>
                                <a
                                    href={`/s/${activeStore.slug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold flex items-center gap-1.5 transition text-white shadow-xs"
                                >
                                    <span>Store Kholain</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
                            <button
                                onClick={() => setActiveTab("settings")}
                                className={`px-4 py-2 font-semibold text-xs sm:text-sm rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                                    activeTab === "settings"
                                        ? "bg-emerald-600 text-white shadow-sm"
                                        : "text-slate-600 hover:bg-slate-100"
                                }`}
                            >
                                <Store className="w-4 h-4" />
                                <span>Dukaan & Domain Settings</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("products")}
                                className={`px-4 py-2 font-semibold text-xs sm:text-sm rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                                    activeTab === "products"
                                        ? "bg-emerald-600 text-white shadow-sm"
                                        : "text-slate-600 hover:bg-slate-100"
                                }`}
                            >
                                <Package className="w-4 h-4" />
                                <span>Products ({products.length})</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("orders")}
                                className={`px-4 py-2 font-semibold text-xs sm:text-sm rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                                    activeTab === "orders"
                                        ? "bg-emerald-600 text-white shadow-sm"
                                        : "text-slate-600 hover:bg-slate-100"
                                }`}
                            >
                                <ShoppingBag className="w-4 h-4" />
                                <span>Orders ({orders.length})</span>
                            </button>
                        </div>

                        {/* TAB 1: SETTINGS & CUSTOM DOMAIN */}
                        {activeTab === "settings" && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Custom Domain Card */}
                                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                                            <Globe className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-slate-900">Custom Domain Integration</h3>
                                            <p className="text-xs text-slate-500">Apni khud ki domain connect karein (e.g. shop.mybrand.pk)</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Domain Name
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="e.g. shop.bismillahstore.com"
                                                    value={customDomainInput}
                                                    onChange={e => setCustomDomainInput(e.target.value)}
                                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                                                />
                                                <button
                                                    onClick={handleSaveDomain}
                                                    disabled={isSavingDomain}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                                                >
                                                    {isSavingDomain ? "Saving..." : "Save Domain"}
                                                </button>
                                            </div>
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
                                                    <span className="block text-[10px] text-slate-400">NAME / HOST</span>
                                                    <strong>shop</strong> ya <strong>@</strong>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] text-slate-400">TARGET</span>
                                                    <strong>domains.solewhat.com</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* WhatsApp Notifications & Policies Card */}
                                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-slate-900">WhatsApp Order Alerts</h3>
                                            <p className="text-xs text-slate-500">Order aate hi dukaan wale aur customer ko auto message</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2 text-xs">
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <div>
                                                <p className="font-bold text-slate-800">Dukaan Ke Phone Par Alert</p>
                                                <p className="text-[11px] text-slate-500">Naye order ka mukammal bill aur address foran receive ho</p>
                                            </div>
                                            <span className="font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full text-[10px]">
                                                {activeStore.autoNotifyOwner ? "Active" : "Disabled"}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <div>
                                                <p className="font-bold text-slate-800">Customer Ko Receipt Confirmation</p>
                                                <p className="text-[11px] text-slate-500">Customer ke number par order # aur bill bhej diya jaye</p>
                                            </div>
                                            <span className="font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full text-[10px]">
                                                {activeStore.autoNotifyCustomer ? "Active" : "Disabled"}
                                            </span>
                                        </div>

                                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                                            <p className="font-bold text-slate-800">Delivery Charges & Policy:</p>
                                            <div className="grid grid-cols-2 gap-2 text-slate-600">
                                                <div>Delivery Fee: <strong>{activeStore.currencySymbol} {activeStore.deliveryFee}</strong></div>
                                                <div>Min Order: <strong>{activeStore.currencySymbol} {activeStore.minOrderAmount}</strong></div>
                                                {activeStore.freeDeliveryAbove && (
                                                    <div className="col-span-2 text-emerald-700 font-semibold">
                                                        Free delivery above {activeStore.currencySymbol} {activeStore.freeDeliveryAbove}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: PRODUCTS */}
                        {activeTab === "products" && (
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h3 className="font-bold text-base text-slate-900">Products Inventory</h3>
                                        <p className="text-xs text-slate-500">Apni dukaan ke saman ki list aur qeematain manage karein</p>
                                    </div>
                                    <button
                                        onClick={() => setShowAddProductModal(true)}
                                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Add Product</span>
                                    </button>
                                </div>

                                {products.length === 0 ? (
                                    <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl my-4 space-y-2">
                                        <Package className="w-10 h-10 text-slate-300 mx-auto" />
                                        <p className="text-sm font-semibold text-slate-700">Koi product add nahi hua</p>
                                        <p className="text-xs text-slate-400">Pehla product add karein taake customer store se buy kar sakein.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                                <tr>
                                                    <th className="py-3 px-4">Product</th>
                                                    <th className="py-3 px-4">Price</th>
                                                    <th className="py-3 px-4">Unit</th>
                                                    <th className="py-3 px-4">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {products.map(p => (
                                                    <tr key={p.id} className="hover:bg-slate-50/50">
                                                        <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2.5">
                                                            {p.image ? (
                                                                <img src={p.image} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                                                    <Package className="w-4 h-4" />
                                                                </div>
                                                            )}
                                                            <span>{p.name}</span>
                                                        </td>
                                                        <td className="py-3 px-4 font-bold text-slate-800">
                                                            {activeStore.currencySymbol} {Number(p.price).toLocaleString("en-PK")}
                                                        </td>
                                                        <td className="py-3 px-4 text-slate-500">{p.unit || "item"}</td>
                                                        <td className="py-3 px-4">
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                                                In Stock
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 3: ORDERS */}
                        {activeTab === "orders" && (
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="font-bold text-base text-slate-900">Live Customer Orders</h3>
                                        <p className="text-xs text-slate-500">Aaye huway orders dekhein aur status update karke customer ko notify karein</p>
                                    </div>

                                    {/* Status Filter */}
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-slate-400" />
                                        <select
                                            value={selectedOrderStatus}
                                            onChange={e => setSelectedOrderStatus(e.target.value)}
                                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
                                        >
                                            <option value="ALL">All Statuses</option>
                                            <option value="PENDING">Pending</option>
                                            <option value="CONFIRMED">Confirmed</option>
                                            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                                            <option value="DELIVERED">Delivered</option>
                                        </select>
                                    </div>
                                </div>

                                {orders.length === 0 ? (
                                    <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl my-4 space-y-2">
                                        <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                                        <p className="text-sm font-semibold text-slate-700">Koi order receive nahi hua</p>
                                        <p className="text-xs text-slate-400">Jab customer aapke store link se order karega, wo yahan show hoga.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {orders.map(order => (
                                            <div
                                                key={order.id}
                                                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition bg-slate-50/50 space-y-3"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm text-slate-900">#{order.orderNumber}</span>
                                                        <span className="text-xs text-slate-500">
                                                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                            order.status === "DELIVERED"
                                                                ? "bg-emerald-100 text-emerald-800"
                                                                : order.status === "OUT_FOR_DELIVERY"
                                                                ? "bg-amber-100 text-amber-800"
                                                                : order.status === "CONFIRMED"
                                                                ? "bg-blue-100 text-blue-800"
                                                                : "bg-slate-200 text-slate-800"
                                                        }`}>
                                                            {order.status}
                                                        </span>
                                                    </div>

                                                    <div className="text-sm font-bold text-emerald-700">
                                                        Total: {activeStore.currencySymbol} {Number(order.total).toLocaleString("en-PK")} ({order.paymentMethod})
                                                    </div>
                                                </div>

                                                <div className="text-xs text-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-slate-100">
                                                    <div>
                                                        <p>👤 <strong>{order.customerName}</strong> (+{order.customerPhone})</p>
                                                        <p className="text-slate-500 text-[11px] mt-0.5">📍 {order.customerAddress}</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">Items:</p>
                                                        <p className="text-[11px] text-slate-600">
                                                            {order.items.map(i => `${i.quantity}x ${i.productName}`).join(", ")}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Action Buttons to update status */}
                                                <div className="flex items-center gap-2 pt-1 flex-wrap">
                                                    <span className="text-xs font-semibold text-slate-500">Update Status:</span>
                                                    {order.status !== "CONFIRMED" && order.status !== "DELIVERED" && (
                                                        <button
                                                            onClick={() => handleUpdateOrderStatus(order.id, "CONFIRMED")}
                                                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs transition cursor-pointer"
                                                        >
                                                            Confirm Order
                                                        </button>
                                                    )}
                                                    {order.status !== "OUT_FOR_DELIVERY" && order.status !== "DELIVERED" && (
                                                        <button
                                                            onClick={() => handleUpdateOrderStatus(order.id, "OUT_FOR_DELIVERY")}
                                                            className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold text-xs transition cursor-pointer"
                                                        >
                                                            Out for Delivery 🛵
                                                        </button>
                                                    )}
                                                    {order.status !== "DELIVERED" && (
                                                        <button
                                                            onClick={() => handleUpdateOrderStatus(order.id, "DELIVERED")}
                                                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs transition cursor-pointer"
                                                        >
                                                            Delivered 🎉
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )
            )}

            {/* CREATE STORE MODAL */}
            {showCreateStoreModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                                <Store className="w-5 h-5 text-emerald-600" />
                                <span>Nayi Digital Dukaan Banayein</span>
                            </h3>
                            <button
                                onClick={() => setShowCreateStoreModal(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateStore} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Dukaan Ka Naam *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Bismillah Kiryana Store"
                                    value={newStoreName}
                                    onChange={e => setNewStoreName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Store URL Slug (Optional)</label>
                                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500">
                                    <span>/s/</span>
                                    <input
                                        type="text"
                                        placeholder="bismillah-store"
                                        value={newStoreSlug}
                                        onChange={e => setNewStoreSlug(e.target.value)}
                                        className="bg-transparent text-slate-900 font-semibold focus:outline-none flex-1 ml-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">WhatsApp Contact Number *</label>
                                <input
                                    type="tel"
                                    required
                                    placeholder="e.g. 0300 1234567"
                                    value={newStorePhone}
                                    onChange={e => setNewStorePhone(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-md cursor-pointer mt-2"
                            >
                                Dukaan Create Karein
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD PRODUCT MODAL */}
            {showAddProductModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
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
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Product Ka Naam *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Shan Biryani Masala"
                                    value={productName}
                                    onChange={e => setProductName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Qeemat (Price in PKR) *</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="120"
                                        value={productPrice}
                                        onChange={e => setProductPrice(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Original Price (Discount)</label>
                                    <input
                                        type="number"
                                        placeholder="150"
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
                                    placeholder="e.g. 50g pack, 1 kg, 1 liter, piece"
                                    value={productUnit}
                                    onChange={e => setProductUnit(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Photo URL (Optional)</label>
                                <input
                                    type="url"
                                    placeholder="https://... image link"
                                    value={productImage}
                                    onChange={e => setProductImage(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-md cursor-pointer mt-2"
                            >
                                Product Save Karein
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
