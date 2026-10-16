import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    Plus,
    Wifi,
    WifiOff,
    MessageSquare,
    Bot,
    Send,
    Settings,
    QrCode,
    ArrowRight,
    Activity,
    Zap,
    Globe,
    Sparkles,
    Store,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { getAccessibleSessions } from "@/lib/api-auth";
import { redirect } from "next/navigation";
import { DashboardSessionCards } from "@/components/dashboard/dashboard-session-cards";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    const sessions = await getAccessibleSessions(session.user.id!, session.user.role || "OWNER");

    const totalSessions = sessions.length;
    const connectedSessions = sessions.filter(s => s.status === 'CONNECTED').length;
    const disconnectedSessions = totalSessions - connectedSessions; // Anything not connected is disconnected
    const otherSessions = 0;

    // Fetch auto-reply count for accessible sessions
    let autoReplyCount = 0;
    try {
        const sessionIds = sessions.map(s => s.sessionId);
        if (sessionIds.length > 0) {
            autoReplyCount = await prisma.autoReply.count({
                where: { sessionId: { in: sessionIds } }
            });
        }
    } catch {
        // If auto-reply table doesn't exist yet, just show 0
    }

    const stats = [
        {
            title: "Total Sessions",
            value: totalSessions,
            icon: QrCode,
            description: "Registered sessions",
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            title: "Connected",
            value: connectedSessions,
            icon: Wifi,
            description: "Online & ready",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
        },
        {
            title: "Disconnected",
            value: disconnectedSessions,
            icon: WifiOff,
            description: "Needs reconnection",
            color: "text-red-500",
            bg: "bg-red-50",
        },
        {
            title: "Auto-Reply Rules",
            value: autoReplyCount,
            icon: Zap,
            description: "Active automations",
            color: "text-amber-600",
            bg: "bg-amber-50",
        },
    ];

    const isSuperAdmin = session.user.role === "SUPERADMIN";
    const isOwner = session.user.role === "OWNER";
    const canAccessAi = isSuperAdmin || isOwner;

    const quickActions = [
        { href: "/store-dashboard", label: "Store (Digital Dukaan)", icon: Store, description: "WhatsApp online store, orders & items" },
        ...(isSuperAdmin ? [{ href: "/dashboard/connect-website", label: "Connect Website", icon: Globe, description: "WooCommerce, Shopify & APIs" }] : []),
        { href: "/dashboard/sessions", label: "Sessions / QR", icon: QrCode, description: "Manage WhatsApp devices" },
        { href: "/dashboard/chat", label: "Send Message", icon: Send, description: "Open chat interface" },
        ...(canAccessAi ? [{ href: "/dashboard/ai-bot", label: "AI Auto-Responder", icon: Sparkles, description: "Free AI customer chatbot" }] : []),
        ...(!isSuperAdmin ? [{ href: "/dashboard/bot-settings", label: "Bot Settings", icon: Bot, description: "Configure chatbot" }] : []),
    ];

    const isStoreOnly = Boolean((session.user as any)?.isStoreOnly);

    // If Store-Only user, load their store and render only WhatsApp Connect Session and Store
    if (isStoreOnly) {
        const userStores = await prisma.store.findMany({
            where: { userId: session.user.id },
            include: {
                _count: {
                    select: { products: true, orders: true }
                }
            }
        });

        const activeStore = userStores[0] || null;
        const activeSession = sessions.find(s => s.status === 'CONNECTED') || sessions[0] || null;

        return (
            <div className="space-y-6 max-w-5xl mx-auto py-2">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel border border-border/70 p-5 rounded-2xl">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <Sparkles className="h-3 w-3" /> Store Creation Mode
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                            Store Command Center
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Manage your WhatsApp connection and Digital Store in one place.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                        <Link href="/dashboard/sessions">
                            <Button size="sm" variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
                                <QrCode className="h-4 w-4" /> WhatsApp Connect
                            </Button>
                        </Link>
                        <Link href="/store-dashboard">
                            <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20">
                                <Store className="h-4 w-4" /> Open Store Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* ONLY 2 CARDS: WhatsApp Connect Session & Store */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* CARD 1: WhatsApp Connect Session */}
                    <div className="glass-panel border border-border/70 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all space-y-5 bg-card/90">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
                                    <QrCode className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-foreground">WhatsApp Connect Session</h2>
                                    <p className="text-xs text-muted-foreground">For automatic order notifications</p>
                                </div>
                            </div>

                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                activeSession?.status === "CONNECTED"
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                    : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                            }`}>
                                {activeSession?.status === "CONNECTED" ? "● Connected" : "○ Not Connected"}
                            </span>
                        </div>

                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            Connect your WhatsApp account via QR scan so your customers receive instant order confirmations and receipts directly on WhatsApp.
                        </p>

                        <div className="rounded-xl bg-muted/60 p-3.5 border border-border/50 text-xs space-y-1.5">
                            <div className="flex items-center justify-between font-semibold">
                                <span className="text-muted-foreground">Active WhatsApp Session:</span>
                                <span className="text-foreground">{activeSession?.name || "No session yet"}</span>
                            </div>
                            <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                                <span>Status:</span>
                                <span className={activeSession?.status === "CONNECTED" ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                                    {activeSession?.status || "DISCONNECTED"}
                                </span>
                            </div>
                        </div>

                        <Link href="/dashboard/sessions" className="block w-full">
                            <Button className="w-full h-11 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20">
                                <QrCode className="mr-2 h-4 w-4" />
                                {activeSession?.status === "CONNECTED" ? "Manage WhatsApp Session" : "Scan QR & Connect WhatsApp"}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>

                    {/* CARD 2: Store (Digital Dukaan) */}
                    <div className="glass-panel border border-border/70 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all space-y-5 bg-card/90">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-primary/20">
                                    <Store className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-foreground">
                                        {activeStore?.name || "Digital Dukaan Store"}
                                    </h2>
                                    <p className="text-xs text-muted-foreground">Online catalog, orders &amp; POS</p>
                                </div>
                            </div>

                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/25">
                                Storefront
                            </span>
                        </div>

                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            Your full Digital Dukaan store command center. Add products, view orders, manage delivery rates, and use the walk-in counter POS.
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-muted/60 p-3 border border-border/50 text-center">
                                <div className="text-xl font-extrabold text-foreground">
                                    {activeStore?._count?.products ?? 0}
                                </div>
                                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">
                                    Products
                                </div>
                            </div>
                            <div className="rounded-xl bg-muted/60 p-3 border border-border/50 text-center">
                                <div className="text-xl font-extrabold text-primary">
                                    {activeStore?._count?.orders ?? 0}
                                </div>
                                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">
                                    Total Orders
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <Link href="/store-dashboard" className="flex-1">
                                <Button className="w-full h-11 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20">
                                    <Store className="mr-2 h-4 w-4" /> Open Store Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            {activeStore && (
                                <a
                                    href={`/s/${activeStore.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2.5 rounded-xl border border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground transition flex items-center justify-center shrink-0"
                                    title="View Live Storefront"
                                >
                                    <Globe className="h-5 w-5" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h2>
                    <p className="text-sm text-slate-500 mt-1">Overview of your WhatsApp gateway &amp; website integrations</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/store-dashboard">
                        <Button size="sm" variant="outline" className="gap-2 border-emerald-500/30 text-emerald-700 hover:bg-emerald-600 hover:text-white">
                            <Store className="h-4 w-4" /> Store Dashboard
                        </Button>
                    </Link>
                    {isSuperAdmin && (
                        <Link href="/dashboard/connect-website">
                            <Button size="sm" variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary hover:text-white">
                                <Globe className="h-4 w-4" /> Connect Website
                            </Button>
                        </Link>
                    )}
                    <Link href="/dashboard/sessions">
                        <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" /> Add Session
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Website Connect Banner (SUPERADMIN only) */}
            {isSuperAdmin && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-emerald-500/10 to-teal-500/10 border border-primary/20 p-5 sm:p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5 max-w-2xl">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-bold">
                                <Sparkles className="h-3 w-3" /> E-Commerce Order Alerts
                            </div>
                            <h3 className="text-lg font-bold text-foreground">
                                Connect Your Online Store (WooCommerce, Shopify, PHP, Laravel)
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                Send instant automated WhatsApp confirmation messages, delivery updates, and receipts to customers when an order is completed.
                            </p>
                        </div>
                        <Link href="/dashboard/connect-website" className="flex-shrink-0">
                            <Button className="gap-2 shadow-sm font-semibold">
                                <Globe className="h-4 w-4" /> Integration Guide &amp; Code <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.title} className="glass-panel border-border/50 shadow-sm hover:shadow-md hover:shadow-primary/5 transition-all duration-300">
                            <CardContent className="p-4 sm:p-5">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.title}</p>
                                        <p className="text-2xl sm:text-3xl font-extrabold text-foreground">{stat.value}</p>
                                        <p className="text-xs text-muted-foreground/70">{stat.description}</p>
                                    </div>
                                    <div className={`${stat.bg} p-2.5 rounded-xl border object-contain border-white/20 dark:border-white/10 shadow-sm`}>
                                        <Icon className={`h-5 w-5 ${stat.color}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Link key={action.href} href={action.href}>
                                <Card className="glass-panel border-border/50 shadow-sm hover:shadow-md hover:shadow-primary/10 hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer h-full">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="bg-muted/50 p-2.5 rounded-xl group-hover:bg-primary transition-colors border border-border/50 shadow-sm">
                                            <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate">{action.label}</p>
                                            <p className="text-xs text-muted-foreground/80 truncate">{action.description}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Sessions List with Prominent Session IDs */}
            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                            <span>WhatsApp Sessions &amp; API Identifiers</span>
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Every session has a unique <strong className="text-foreground">Session ID</strong> required for external websites and API integrations.
                        </p>
                    </div>
                    <Link href="/dashboard/sessions" className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors self-start sm:self-auto">
                        Manage all sessions <ArrowRight size={14} />
                    </Link>
                </div>

                <DashboardSessionCards sessions={sessions} isSuperAdmin={isSuperAdmin} />
            </div>
        </div>
    );
}
