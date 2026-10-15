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
    MapPin
} from "lucide-react";
import { signOut } from "next-auth/react";

interface StoreSidebarProps {
    appName: string;
    userName?: string | null;
    userEmail?: string | null;
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
    userEmail
}: StoreSidebarProps) {
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
                { id: "orders", label: "Orders & Shipping", icon: ShoppingBag }
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
            <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        <Store className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                            Store Dashboard
                        </h2>
                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">
                            SoleWhat Dukaan
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/dashboard"
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center gap-1"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Bot Gateway</span>
                    </Link>
                    <button
                        onClick={() => setIsMobileOpen(!isMobileOpen)}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                    w-[270px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
                    border-r border-slate-200/80 dark:border-slate-800
                    flex flex-col h-full shrink-0 shadow-lg md:shadow-none
                    transition-transform duration-300 ease-in-out
                    ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                `}
            >
                {/* Brand & Store Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 space-y-3 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                                <Store className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <span>SoleWhat</span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                        Dukaan
                                    </span>
                                </h1>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                    E-Commerce Command Center
                                </p>
                            </div>
                        </div>

                        {/* Mobile Close Button */}
                        <button
                            onClick={() => setIsMobileOpen(false)}
                            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Quick Switch to Main WhatsApp Dashboard */}
                    <Link
                        href="/dashboard"
                        className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition flex items-center justify-between group shadow-2xs cursor-pointer border border-slate-200/60 dark:border-slate-700"
                    >
                        <span className="flex items-center gap-1.5">
                            <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
                            <span>Main WhatsApp Bot</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Switch ➔</span>
                    </Link>
                </div>

                {/* Navigation Items (Scrollable) */}
                <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5 styled-scrollbar">
                    {navSections.map((section, sIdx) => (
                        <div key={sIdx} className="space-y-1">
                            <h3 className="px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
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
                                                w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer
                                                ${isActive
                                                    ? "bg-emerald-600 text-white shadow-xs"
                                                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800"
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
                                                <span className="truncate">{item.label}</span>
                                            </div>

                                            {item.badge && (
                                                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                                                    isActive
                                                        ? "bg-white/20 text-white"
                                                        : "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
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
                <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 space-y-2">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                {userName?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                                    {userName || "Store Owner"}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">
                                    {userEmail || "store@solewhat.com"}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            title="Sign Out"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
