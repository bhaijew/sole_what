"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
    Store,
    ShoppingBag,
    Users,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Search,
    RefreshCw,
    ExternalLink,
    MapPin,
    Phone,
    Mail,
    CheckCircle2,
    XCircle,
    Power,
    Edit3,
    Trash2,
    Filter,
    Clock,
    AlertCircle,
    Building2,
    Package,
    TrendingUp,
    Check,
    SlidersHorizontal,
    QrCode
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface StoreUserItem {
    id: string;
    userId: string;
    name: string;
    slug: string;
    tagline: string | null;
    description: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    phone: string;
    email: string | null;
    address: string | null;
    city: string | null;
    deliveryFee: number;
    minOrderAmount: number;
    estimatedDeliveryTime: string | null;
    openingHours: string | null;
    noticeMessage: string | null;
    isActive: boolean;
    isOpen: boolean;
    createdAt: string;
    user?: {
        id: string;
        name: string | null;
        email: string;
        role: string;
        createdAt: string;
    } | null;
    session?: {
        id: string;
        sessionId: string;
        name: string;
        status: string;
    } | null;
    _count?: {
        products: number;
        orders: number;
        categories: number;
    };
}

export default function StoreUsersAdminPage() {
    const { data: session } = useSession();
    // @ts-ignore
    const userRole = session?.user?.role;
    const isSuperAdmin = userRole === "SUPERADMIN";

    const [stores, setStores] = useState<StoreUserItem[]>([]);
    const [stats, setStats] = useState({
        totalStores: 0,
        activeStores: 0,
        inactiveStores: 0,
        totalProducts: 0,
        totalOrders: 0
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [cityFilter, setCityFilter] = useState("all");

    // Modal states
    const [editingStore, setEditingStore] = useState<StoreUserItem | null>(null);
    const [editFormData, setEditFormData] = useState({
        name: "",
        phone: "",
        city: "",
        address: "",
        tagline: "",
        noticeMessage: "",
        isActive: true,
        isOpen: true
    });
    const [isSaving, setIsSaving] = useState(false);

    // Confirmation dialogs
    const [banTarget, setBanTarget] = useState<StoreUserItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<StoreUserItem | null>(null);

    const fetchStores = async (isManualRefresh = false) => {
        if (isManualRefresh) setRefreshing(true);
        try {
            const query = new URLSearchParams();
            if (search) query.append("search", search);
            if (statusFilter !== "all") query.append("status", statusFilter);
            if (cityFilter !== "all") query.append("city", cityFilter);

            const res = await fetch(`/api/admin/store-users?${query.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setStores(data.stores || []);
                if (data.stats) setStats(data.stats);
            } else if (res.status === 403) {
                toast.error("Unauthorized. Only SuperAdmin can manage store accounts.");
            } else {
                toast.error("Failed to load store users.");
            }
        } catch (err: any) {
            console.error("Fetch store users error:", err);
            toast.error("Error connecting to server.");
        } finally {
            setLoading(false);
            if (isManualRefresh) setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStores();
    }, [statusFilter, cityFilter]);

    // Handle Search with debounce or submit
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchStores();
    };

    // Toggle Active / Banned status
    const confirmToggleActive = async () => {
        if (!banTarget) return;

        const nextActiveState = !banTarget.isActive;
        try {
            const res = await fetch("/api/admin/store-users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    storeId: banTarget.id,
                    isActive: nextActiveState
                })
            });

            if (res.ok) {
                toast.success(
                    nextActiveState
                        ? `Store "${banTarget.name}" is now Activated! 🟢`
                        : `Store "${banTarget.name}" has been Banned / Deactivated! 🔴`
                );
                // Update local state instantly
                setStores(prev =>
                    prev.map(s => (s.id === banTarget.id ? { ...s, isActive: nextActiveState } : s))
                );
                setStats(prev => ({
                    ...prev,
                    activeStores: nextActiveState ? prev.activeStores + 1 : prev.activeStores - 1,
                    inactiveStores: nextActiveState ? prev.inactiveStores - 1 : prev.inactiveStores + 1
                }));
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to update store status.");
            }
        } catch (err) {
            toast.error("Network error while updating store status.");
        } finally {
            setBanTarget(null);
        }
    };

    // Toggle Open / Closed status
    const handleToggleOpen = async (store: StoreUserItem) => {
        const nextOpenState = !store.isOpen;
        try {
            const res = await fetch("/api/admin/store-users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    storeId: store.id,
                    isOpen: nextOpenState
                })
            });

            if (res.ok) {
                toast.success(`Store "${store.name}" marked as ${nextOpenState ? "Open" : "Closed"}.`);
                setStores(prev =>
                    prev.map(s => (s.id === store.id ? { ...s, isOpen: nextOpenState } : s))
                );
            } else {
                toast.error("Failed to toggle open/close status.");
            }
        } catch (err) {
            toast.error("Network error.");
        }
    };

    // Open Edit Modal
    const handleOpenEdit = (store: StoreUserItem) => {
        setEditingStore(store);
        setEditFormData({
            name: store.name,
            phone: store.phone,
            city: store.city || "Lahore",
            address: store.address || "",
            tagline: store.tagline || "",
            noticeMessage: store.noticeMessage || "",
            isActive: store.isActive,
            isOpen: store.isOpen
        });
    };

    // Save Edit Modal
    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStore) return;

        setIsSaving(true);
        try {
            const res = await fetch("/api/admin/store-users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    storeId: editingStore.id,
                    ...editFormData
                })
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(`Store "${editFormData.name}" updated successfully!`);
                setStores(prev =>
                    prev.map(s => (s.id === editingStore.id ? { ...s, ...data.store } : s))
                );
                setEditingStore(null);
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to update store.");
            }
        } catch (err) {
            toast.error("Error saving store details.");
        } finally {
            setIsSaving(false);
        }
    };

    // Confirm Delete Store
    const confirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            const res = await fetch(`/api/admin/store-users?storeId=${deleteTarget.id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                toast.success(`Store "${deleteTarget.name}" deleted permanently.`);
                setStores(prev => prev.filter(s => s.id !== deleteTarget.id));
                setStats(prev => ({
                    ...prev,
                    totalStores: prev.totalStores - 1,
                    activeStores: deleteTarget.isActive ? prev.activeStores - 1 : prev.activeStores,
                    inactiveStores: !deleteTarget.isActive ? prev.inactiveStores - 1 : prev.inactiveStores
                }));
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to delete store.");
            }
        } catch (err) {
            toast.error("Network error while deleting store.");
        } finally {
            setDeleteTarget(null);
        }
    };

    // Available unique cities in stores list
    const availableCities = useMemo(() => {
        const set = new Set<string>();
        stores.forEach(s => {
            if (s.city) set.add(s.city);
        });
        return Array.from(set);
    }, [stores]);

    return (
        <div className="space-y-6">
            {/* Header Title & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <Store className="h-5 w-5" />
                        </div>
                        <span>Store Users & Dukaanein</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Platform par registered tamam store accounts, unke dukaandaar, active/inactive controls aur ban status manage karein.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchStores(true)}
                        disabled={refreshing}
                        className="rounded-xl text-xs font-semibold flex items-center gap-1.5"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                        <span>Refresh</span>
                    </Button>
                    <Link href="/dukaan" target="_blank">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="rounded-xl text-xs font-semibold flex items-center gap-1.5"
                        >
                            <span>Live Directory</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* PLATFORM STORE STATS CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <Card className="rounded-2xl border-border/70 shadow-sm bg-card/60 backdrop-blur-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Store className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl font-black">{stats.totalStores}</div>
                            <div className="text-[11px] font-medium text-muted-foreground">Total Stores</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/70 shadow-sm bg-card/60 backdrop-blur-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl font-black text-green-600 dark:text-green-400">
                                {stats.activeStores}
                            </div>
                            <div className="text-[11px] font-medium text-muted-foreground">Active Dukaanein</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/70 shadow-sm bg-card/60 backdrop-blur-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                                {stats.inactiveStores}
                            </div>
                            <div className="text-[11px] font-medium text-muted-foreground">Banned / Inactive</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/70 shadow-sm bg-card/60 backdrop-blur-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Package className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl font-black">{stats.totalProducts}</div>
                            <div className="text-[11px] font-medium text-muted-foreground">Total Products</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/70 shadow-sm bg-card/60 backdrop-blur-sm col-span-2 sm:col-span-1">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <ShoppingBag className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl font-black">{stats.totalOrders}</div>
                            <div className="text-[11px] font-medium text-muted-foreground">Total Orders</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* SEARCH AND FILTER BAR */}
            <Card className="rounded-2xl border-border/70 shadow-sm bg-card/80">
                <CardContent className="p-4">
                    <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        {/* Search Input */}
                        <div className="sm:col-span-6 relative">
                            <Input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search store name, owner, email, phone, city or slug..."
                                className="pl-9 rounded-xl text-xs h-10 bg-muted/40 border-border/70 focus-visible:ring-emerald-500"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>

                        {/* Status Filter */}
                        <div className="sm:col-span-3">
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border/70 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                            >
                                <option value="all">Status: All Stores</option>
                                <option value="active">🟢 Active Only</option>
                                <option value="inactive">🔴 Banned / Inactive Only</option>
                                <option value="open">🏪 Open Now Only</option>
                                <option value="closed">⚪ Closed Only</option>
                            </select>
                        </div>

                        {/* City Filter */}
                        <div className="sm:col-span-3 flex items-center gap-2">
                            <select
                                value={cityFilter}
                                onChange={e => setCityFilter(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border/70 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                            >
                                <option value="all">City: All Cities</option>
                                <option value="Lahore">Lahore</option>
                                <option value="Karachi">Karachi</option>
                                <option value="Islamabad">Islamabad</option>
                                <option value="Rawalpindi">Rawalpindi</option>
                                <option value="Faisalabad">Faisalabad</option>
                                <option value="Multan">Multan</option>
                                {availableCities.map(c => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                            <Button type="submit" size="sm" className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0">
                                Filter
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* STORES TABLE */}
            <Card className="rounded-2xl border-border/70 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-muted/50 border-b border-border/70 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                            <tr>
                                <th className="py-3 px-4">Store & Slug</th>
                                <th className="py-3 px-4">Owner / User</th>
                                <th className="py-3 px-4">Location & Contact</th>
                                <th className="py-3 px-4 text-center">Catalog & Orders</th>
                                <th className="py-3 px-4 text-center">Store Status</th>
                                <th className="py-3 px-4 text-center">Ban / Active Control</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
                                            <span>Loading store users...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : stores.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                                            <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                                                <Store className="h-6 w-6" />
                                            </div>
                                            <span className="font-bold text-foreground">No Store Accounts Found</span>
                                            <span className="text-xs">
                                                Aapke criteria ke mutabiq koi store user nahi mila. Filters clear karein ya naya account register karein.
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                stores.map(store => (
                                    <tr key={store.id} className="hover:bg-muted/30 transition-colors">
                                        {/* Store Name & Slug */}
                                        <td className="py-3.5 px-4 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl overflow-hidden border border-border/80 bg-muted shrink-0 flex items-center justify-center">
                                                    {store.logoUrl ? (
                                                        <img src={store.logoUrl} alt={store.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-xs flex items-center justify-center">
                                                            {store.name.slice(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <div className="font-bold text-foreground flex items-center gap-1.5">
                                                        <span>{store.name}</span>
                                                        <Link
                                                            href={`/s/${store.slug}`}
                                                            target="_blank"
                                                            className="text-muted-foreground hover:text-emerald-500"
                                                            title="View Storefront"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                        </Link>
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground font-mono">
                                                        /s/{store.slug}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Owner Details */}
                                        <td className="py-3.5 px-4 align-middle">
                                            <div className="space-y-0.5">
                                                <div className="font-semibold text-foreground flex items-center gap-1">
                                                    <Users className="h-3 w-3 text-muted-foreground" />
                                                    <span>{store.user?.name || "Store Owner"}</span>
                                                </div>
                                                <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                                    <span>{store.user?.email || "No email"}</span>
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    Joined: {new Date(store.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Location & Contact */}
                                        <td className="py-3.5 px-4 align-middle">
                                            <div className="space-y-0.5">
                                                <div className="font-medium text-foreground flex items-center gap-1">
                                                    <MapPin className="h-3 w-3 text-emerald-500 shrink-0" />
                                                    <span>{store.city || "Lahore"}</span>
                                                    {store.address && (
                                                        <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">
                                                            ({store.address.split(",")[0]})
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                    <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                                                    <span>{store.phone || "No phone"}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Catalog & Orders Count */}
                                        <td className="py-3.5 px-4 align-middle text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <div className="flex items-center gap-2 font-bold text-foreground">
                                                    <span title="Products" className="flex items-center gap-0.5">
                                                        <Package className="h-3 w-3 text-blue-500" />
                                                        {store._count?.products || 0}
                                                    </span>
                                                    <span className="text-muted-foreground">•</span>
                                                    <span title="Orders" className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                                                        <ShoppingBag className="h-3 w-3 text-emerald-500" />
                                                        {store._count?.orders || 0}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">Items / Orders</span>
                                            </div>
                                        </td>

                                        {/* Shop Status: Open / Closed Toggle */}
                                        <td className="py-3.5 px-4 align-middle text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleOpen(store)}
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all flex items-center gap-1 border ${
                                                        store.isOpen
                                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20"
                                                            : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                                                    }`}
                                                >
                                                    <span className={`h-1.5 w-1.5 rounded-full ${store.isOpen ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
                                                    <span>{store.isOpen ? "Open" : "Closed"}</span>
                                                </button>
                                                <span className="text-[9px] text-muted-foreground">Click to toggle</span>
                                            </div>
                                        </td>

                                        {/* BAN / ACTIVE CONTROL (KEY USER REQUEST) */}
                                        <td className="py-3.5 px-4 align-middle text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                {store.isActive ? (
                                                    <Badge className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold px-2 py-0.5">
                                                        <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" />
                                                        Active
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[10px] font-bold px-2 py-0.5">
                                                        <ShieldAlert className="h-3 w-3 mr-1 text-rose-500" />
                                                        Banned / Inactive
                                                    </Badge>
                                                )}

                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setBanTarget(store)}
                                                    className={`h-7 px-2 text-[10px] font-bold rounded-lg ${
                                                        store.isActive
                                                            ? "text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                                                            : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                                                    }`}
                                                >
                                                    {store.isActive ? "Ban Store" : "Unban & Activate"}
                                                </Button>
                                            </div>
                                        </td>

                                        {/* Edit & Delete Action Buttons */}
                                        <td className="py-3.5 px-4 align-middle text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleOpenEdit(store)}
                                                    className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                                                    title="Edit Store Info"
                                                >
                                                    <Edit3 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setDeleteTarget(store)}
                                                    className="h-8 w-8 p-0 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-border/80"
                                                    title="Delete Store Permanently"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* BAN / UNBAN CONFIRMATION ALERT DIALOG */}
            <AlertDialog open={!!banTarget} onOpenChange={open => !open && setBanTarget(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            {banTarget?.isActive ? (
                                <div className="h-8 w-8 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center">
                                    <ShieldAlert className="h-4 w-4" />
                                </div>
                            ) : (
                                <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                    <ShieldCheck className="h-4 w-4" />
                                </div>
                            )}
                            <span>
                                {banTarget?.isActive ? "Ban & Deactivate Store?" : "Unban & Activate Store?"}
                            </span>
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                            {banTarget?.isActive ? (
                                <>
                                    Kya aap waqai store <strong className="text-foreground">{banTarget?.name}</strong> ko ban / inactive karna chahte hain? 
                                    Yeh store foran public directory (<code>/dukaan</code>) aur live storefront (<code>/s/{banTarget?.slug}</code>) se hide ho jayega aur customers orders nahi de sakenge.
                                </>
                            ) : (
                                <>
                                    Store <strong className="text-foreground">{banTarget?.name}</strong> ko dobara active karein? 
                                    Yeh store live ho jayega aur public directory mein orders ke liye available hoga.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl text-xs">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmToggleActive}
                            className={`rounded-xl text-xs font-bold ${
                                banTarget?.isActive
                                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            }`}
                        >
                            {banTarget?.isActive ? "Yes, Ban Store" : "Yes, Activate Store"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* DELETE PERMANENTLY CONFIRMATION ALERT DIALOG */}
            <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
                            <Trash2 className="h-5 w-5" />
                            <span>Permanently Delete Store?</span>
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                            Kya aap waqai store <strong className="text-foreground">{deleteTarget?.name}</strong> aur iske tamam products aur orders ko permanently delete karna chahte hain? Yeh amal wapis nahi liya ja sakta.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl text-xs">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            Delete Permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* EDIT STORE DETAILS MODAL DIALOG */}
            <Dialog open={!!editingStore} onOpenChange={open => !open && setEditingStore(null)}>
                <DialogContent className="max-w-lg rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-black">
                            <Store className="h-5 w-5 text-emerald-500" />
                            <span>Edit Store: {editingStore?.name}</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Admin controls ke zariye store ki details, status aur notice update karein.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Store Name</Label>
                                <Input
                                    value={editFormData.name}
                                    onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                    required
                                    className="h-9 text-xs rounded-xl"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold">WhatsApp Phone</Label>
                                <Input
                                    value={editFormData.phone}
                                    onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                                    required
                                    className="h-9 text-xs rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold">City</Label>
                                <Input
                                    value={editFormData.city}
                                    onChange={e => setEditFormData({ ...editFormData, city: e.target.value })}
                                    className="h-9 text-xs rounded-xl"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold">Address / Mohalla</Label>
                                <Input
                                    value={editFormData.address}
                                    onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
                                    className="h-9 text-xs rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Tagline (Slogan)</Label>
                            <Input
                                value={editFormData.tagline}
                                onChange={e => setEditFormData({ ...editFormData, tagline: e.target.value })}
                                placeholder="e.g. Apke Mohallay Ki Apni Dukaan"
                                className="h-9 text-xs rounded-xl"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Notice Message / Admin Banner</Label>
                            <Input
                                value={editFormData.noticeMessage}
                                onChange={e => setEditFormData({ ...editFormData, noticeMessage: e.target.value })}
                                placeholder="Announcement banner shown to customers..."
                                className="h-9 text-xs rounded-xl"
                            />
                        </div>

                        {/* Status Toggles */}
                        <div className="p-3 rounded-2xl bg-muted/40 border border-border/70 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-xs font-bold text-foreground">Active Status (Ban/Unban)</div>
                                    <div className="text-[11px] text-muted-foreground">If disabled, store is completely banned and hidden.</div>
                                </div>
                                <Switch
                                    checked={editFormData.isActive}
                                    onCheckedChange={checked => setEditFormData({ ...editFormData, isActive: checked })}
                                />
                            </div>

                            <div className="flex items-center justify-between border-t border-border/40 pt-2">
                                <div>
                                    <div className="text-xs font-bold text-foreground">Operating Status (Open/Closed)</div>
                                    <div className="text-[11px] text-muted-foreground">Shows whether shop is currently accepting orders.</div>
                                </div>
                                <Switch
                                    checked={editFormData.isOpen}
                                    onCheckedChange={checked => setEditFormData({ ...editFormData, isOpen: checked })}
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingStore(null)}
                                className="rounded-xl text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
