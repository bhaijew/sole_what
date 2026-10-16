'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import {
    Store,
    ShoppingBag,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    Lock,
    Mail,
    User,
    Phone,
    MapPin,
    QrCode,
    Loader2,
    Check,
    Globe,
    Zap,
    Calculator
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function StoreAccountCreator() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [storeName, setStoreName] = useState('');
    const [storePhone, setStorePhone] = useState('');
    const [storeCity, setStoreCity] = useState('Lahore');

    const previewSlug = storeName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'apni-dukaan';

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("Please enter your name.");
            return;
        }
        if (!email.trim() || !email.includes('@')) {
            toast.error("Please enter a valid email address.");
            return;
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }

        setIsLoading(true);

        try {
            const finalStoreName = storeName.trim() || `${name.trim()}'s Store`;
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    password,
                    accountType: "store",
                    storeName: finalStoreName,
                    storePhone: storePhone.trim(),
                    storeCity: storeCity.trim() || "Lahore"
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Store account creation failed.");
            }

            toast.success("Account created! Signing you in... 🚀");

            // Auto-sign in with the newly created credentials
            const loginRes = await signIn("credentials", {
                email: email.trim().toLowerCase(),
                password,
                redirect: false
            });

            if (loginRes?.error) {
                toast.info("Account created successfully! Please sign in.");
                router.push("/auth/login");
            } else {
                toast.success("Welcome to your Store Dashboard! 🏪");
                router.push("/store-dashboard");
            }
        } catch (err: any) {
            toast.error(err.message || "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section id="create-store" className="py-24 relative overflow-hidden">
            {/* Ambient Lighting Orbs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[50rem] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none -z-10" />

            <div className="container px-4 md:px-6 max-w-6xl mx-auto relative z-10">
                <div className="text-center mb-12 space-y-3">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <Sparkles size={14} /> 1-Minute Store Creation
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
                        Create Your WhatsApp Store Account
                    </h2>
                    <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                        Start selling online without Shopify fees. Customers browse your catalog and place orders directly to your WhatsApp with automated alerts.
                    </p>
                </div>

                <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-emerald-500/20 shadow-2xl shadow-emerald-500/5 dark:shadow-black/40">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                        
                        {/* LEFT COLUMN: Store Creation Features & Live Preview */}
                        <div className="lg:col-span-5 space-y-6 text-left">
                            <div className="space-y-2">
                                <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                    Simple &bull; Zero Commisions &bull; WhatsApp First
                                </span>
                                <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight">
                                    Only What You Need: WhatsApp &amp; Storefront
                                </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                    No confusing bot setup or complex coding. Your account gives you direct access to <strong>WhatsApp Session Connection</strong> and your <strong>Digital Store Dashboard</strong>.
                                </p>
                            </div>

                            {/* Key Highlights */}
                            <div className="space-y-3 pt-1">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-500/20">
                                        <Store className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-foreground">Dedicated Digital Dukaan</h4>
                                        <p className="text-xs text-muted-foreground">Add products, photo galleries, prices in PKR, and delivery options.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0 border border-primary/20">
                                        <QrCode className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-foreground">WhatsApp Connect Session</h4>
                                        <p className="text-xs text-muted-foreground">Scan QR once to send automated WhatsApp order confirmations &amp; receipts.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 border border-blue-500/20">
                                        <Calculator className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-foreground">Walk-In Counter POS</h4>
                                        <p className="text-xs text-muted-foreground">Tez bill generator with 80mm thermal receipt printing for counter sales.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Storefront Preview Pill Card */}
                            <div className="rounded-2xl bg-muted/60 p-4 border border-border/60 space-y-2">
                                <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                                    <span>Your Store URL Preview:</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Free Forever</span>
                                </div>
                                <div className="flex items-center gap-2 bg-background p-2.5 rounded-xl border border-border/80 text-xs font-mono font-medium text-foreground truncate">
                                    <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span className="truncate">solewhat.com/s/<strong className="text-primary">{previewSlug}</strong></span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Interactive Account Creation Form */}
                        <div className="lg:col-span-7 bg-card/95 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-border/70 shadow-lg space-y-5 text-left">
                            <div className="border-b border-border/40 pb-3">
                                <h3 className="text-lg sm:text-xl font-black text-foreground">
                                    Create Store Account
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Fill in your details below to instantly provision your store.
                                </p>
                            </div>

                            <form onSubmit={handleCreateAccount} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-foreground flex items-center gap-1">
                                            <User className="w-3 h-3 text-primary" /> Full Name *
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="e.g. Muhammad Bilal"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="h-10 text-xs rounded-xl bg-background"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-foreground flex items-center gap-1">
                                            <Mail className="w-3 h-3 text-primary" /> Email Address *
                                        </label>
                                        <Input
                                            type="email"
                                            placeholder="bilal@store.pk"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="h-10 text-xs rounded-xl bg-background"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-foreground flex items-center gap-1">
                                            <Lock className="w-3 h-3 text-primary" /> Password *
                                        </label>
                                        <Input
                                            type="password"
                                            placeholder="At least 6 characters"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            className="h-10 text-xs rounded-xl bg-background"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-foreground flex items-center gap-1">
                                            <Store className="w-3 h-3 text-emerald-500" /> Store Name (Dukaan)
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="e.g. Bismillah Mart"
                                            value={storeName}
                                            onChange={(e) => setStoreName(e.target.value)}
                                            className="h-10 text-xs rounded-xl bg-background"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-foreground flex items-center gap-1">
                                            <Phone className="w-3 h-3 text-emerald-500" /> WhatsApp Number (Order Alerts)
                                        </label>
                                        <Input
                                            type="tel"
                                            placeholder="03001234567"
                                            value={storePhone}
                                            onChange={(e) => setStorePhone(e.target.value)}
                                            className="h-10 text-xs rounded-xl bg-background"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-foreground flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-emerald-500" /> City
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="Lahore / Karachi / Islamabad"
                                            value={storeCity}
                                            onChange={(e) => setStoreCity(e.target.value)}
                                            className="h-10 text-xs rounded-xl bg-background"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        size="lg"
                                        disabled={isLoading}
                                        className="w-full h-12 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/25 cursor-pointer"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating Store &amp; Logging In...
                                            </>
                                        ) : (
                                            <>
                                                <Store className="mr-2 h-4 w-4" />
                                                Create Store Account &amp; Launch 🚀
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>

                            <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2 pt-1 border-t border-border/40">
                                <span>Already have an existing store account?</span>
                                <Link href="/auth/login" className="font-bold text-primary hover:underline">
                                    Sign In Here ➔
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
