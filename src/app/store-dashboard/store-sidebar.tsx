"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
    Store,
    LayoutDashboard,
    ShoppingBag,
    Package,
    Plus,
    Calculator,
    ShoppingCart,
    Truck,
    Globe,
    ImageIcon,
    ArrowLeft,
    Printer,
    FileSpreadsheet,
    LogOut,
    Menu,
    X,
    ExternalLink,
    Sparkles,
    ShieldCheck,
    ChevronRight,
    MapPin,
    QrCode
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

interface StoreSidebarProps {
    appName: string;
    userName?: string | null;
    userEmail?: string | null;
    isStoreOnly?: boolean;
}

interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: string;
    isExternal?: boolean;
    href?: string;
}

export default function StoreSidebar({
    appName,
    userName,
    userEmail,
    isStoreOnly: initialIsStoreOnly
}: StoreSidebarProps) {
    const { data: session } = useSession();
    // @ts-ignore
    const isStoreOnly = initialIsStoreOnly ?? Boolean((session?.user as any)?.isStoreOnly);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const searchParams = useSearchParams();
    const currentTab = searchParams.get("tab") || "overview";
    const storeIdParam = searchParams.get("storeId");

    const getTabHref = (tab: string) => {
        return `/store-dashboard?tab=${tab}${storeIdParam ? `&storeId=${storeIdParam}` : ""}`;
    };

    const handleLogout = async () => {
        try {
            await signOut({ redirect: false });
        } catch {
            // ignore
        }
        window.location.href = "/auth/login";
    };

    const navSections: { title: string; items: NavItem[] }[] = [
        {
            title: "Sales & Cashier",
            items: [
                { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
                { id: "pos", label: "Walk-In Counter POS", icon: Calculator, badge: "Tez Bill" },
                { id: "orders", label: "Orders & Shipping", icon: ShoppingBag, badge: "Live ⚡" }
            ]
        },
        {
            title: "Catalog & Stock",
            items: [
                { id: "products", label: "Products Catalog", icon: Package },
                {
                    id: "new-product",
                    label: "+ Add Product",
                    icon: Plus,
                    href: `/store-dashboard/products/new${storeIdParam ? `?storeId=${storeIdParam}` : ""}`
                }
            ]
        },
        {
            title: "Growth & Retention",
            items: [
                { id: "abandoned", label: "Abandoned Carts", icon: ShoppingCart, badge: "WhatsApp" },
                { id: "slider", label: "Storefront Slider", icon: ImageIcon }
            ]
        },
        {
            title: "Settings & Logistics",
            items: [
                { id: "delivery", label: "Delivery & Timings", icon: Truck },
                { id: "settings", label: "Domain & Automation", icon: Globe }
            ]
        }
    ];

    return (
        <>
            {/* Mobile Top Hamburger Bar */}
            <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/40 px-4 py-3 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        <Store className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-sm font-extrabold text-foreground leading-tight">
                            Store Dashboard
                        </h2>
                        <span className="text-[10px] text-primary font-bold uppercase tracking-wider block">
                            SoleWhat Dukaan
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href={isStoreOnly ? "/dashboard/sessions" : "/dashboard"}
                        className="px-2.5 py-1 text-[11px] font-bold text-muted-foreground bg-muted rounded-lg flex items-center gap-1"
                    >
                        {isStoreOnly ? <QrCode className="w-3 h-3 text-primary" /> : <ArrowLeft className="w-3 h-3" />}
                        <span>{isStoreOnly ? "WA QR" : "Bot"}</span>
                    </Link>
                    <button
                        onClick={() => setIsMobileOpen(!isMobileOpen)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                    >
                        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Backdrop Overlay */}
            {isMobileOpen && (
                <div
                    onClick={() => setIsMobileOpen(false)}
                    className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs animate-in fade-in"
                />
            )}

            {/* Sidebar Shell */}
            <aside
                className={`
                    fixed md:sticky top-0 bottom-0 left-0 z-50
                    w-[270px] bg-background/80 dark:bg-slate-900/80 backdrop-blur-xl
                    border-r border-border/40
                    flex flex-col h-full shrink-0 shadow-lg md:shadow-none
                    transition-transform duration-300 ease-in-out
                    ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                `}
            >
                {/* Brand & Store Header */}
                <div className="p-4 sm:p-5 border-b border-border/30 space-y-3 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                                <Store className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-base font-bold tracking-tight flex items-center gap-1.5">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">SoleWhat</span>
                                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                                        Store
                                    </span>
                                </h1>
                                <p className="text-[10px] text-muted-foreground font-medium">
                                    Digital Dukaan Manager
                                </p>
                            </div>
                        </div>

                        {/* Mobile Close Button */}
                        <button
                            onClick={() => setIsMobileOpen(false)}
                            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Quick Switch to WhatsApp Connect Session */}
                    <Link
                        href={isStoreOnly ? "/dashboard/sessions" : "/dashboard"}
                        className="w-full py-2 px-3 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground font-semibold text-xs transition flex items-center justify-between group shadow-2xs cursor-pointer border border-border/40"
                    >
                        <span className="flex items-center gap-1.5">
                            {isStoreOnly ? (
                                <QrCode className="w-3.5 h-3.5 text-primary group-hover:scale-105 transition-transform" />
                            ) : (
                                <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground group-hover:-translate-x-0.5 transition-transform" />
                            )}
                            <span>{isStoreOnly ? "WhatsApp Connect" : "Main WhatsApp Bot"}</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground/70 font-normal">
                            {isStoreOnly ? "QR ➔" : "Switch ➔"}
                        </span>
                    </Link>
                </div>

                {/* Navigation Items (Scrollable) */}
                <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5 styled-scrollbar">
                    {navSections.map((section, sIdx) => (
                        <div key={sIdx} className="space-y-1">
                            <h3 className="px-3 text-[10px] font-extrabold text-muted-foreground/70 uppercase tracking-wider">
                                {section.title}
                            </h3>
                            <div className="space-y-0.5 pt-1">
                                {section.items.map(item => {
                                    const Icon = item.icon;
                                    const isActive = item.id === currentTab;
                                    const linkHref = item.href || getTabHref(item.id);

                                    return (
                                        <Link
                                            key={item.id}
                                            href={linkHref}
                                            onClick={() => setIsMobileOpen(false)}
                                            className={`
                                                w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer
                                                ${isActive
                                                    ? "bg-primary/10 text-primary font-bold border border-primary/25 shadow-2xs dark:bg-primary/20"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                                                <span className="truncate">{item.label}</span>
                                            </div>

                                            {item.badge && (
                                                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                                                    isActive
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-primary/10 text-primary border border-primary/20"
                                                }`}>
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Sidebar Footer: User profile & Logout */}
                <div className="p-3.5 border-t border-border/30 bg-background/40 shrink-0 space-y-2">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-blue-500/20 text-primary border border-primary/15 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                {userName?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate leading-tight">
                                    {userName || "Store Owner"}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                    {userEmail || "store@solewhat.com"}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            title="Sign Out"
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Navigation Bar for quick thumb access */}
            <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg">
                <Link
                    href={getTabHref("overview")}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
                        currentTab === "overview"
                            ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
                            : "text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="text-[10px] mt-0.5">Overview</span>
                </Link>

                <Link
                    href={getTabHref("pos")}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
                        currentTab === "pos"
                            ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
                            : "text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                    <Calculator className="w-5 h-5" />
                    <span className="text-[10px] mt-0.5">POS</span>
                </Link>

                <Link
                    href={getTabHref("orders")}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
                        currentTab === "orders"
                            ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
                            : "text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                    <ShoppingBag className="w-5 h-5" />
                    <span className="text-[10px] mt-0.5">Orders</span>
                </Link>

                <Link
                    href={getTabHref("products")}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
                        currentTab === "products"
                            ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
                            : "text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                    <Package className="w-5 h-5" />
                    <span className="text-[10px] mt-0.5">Products</span>
                </Link>

                <button
                    type="button"
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
                        isMobileOpen
                            ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
                            : "text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                    <Menu className="w-5 h-5" />
                    <span className="text-[10px] mt-0.5">Menu</span>
                </button>
            </div>
        </>
    );
}
