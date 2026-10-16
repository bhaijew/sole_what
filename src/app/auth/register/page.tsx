'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import {
    Store,
    ShoppingBag,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    CheckCircle2,
    Lock,
    Mail,
    User,
    Phone,
    MapPin,
    QrCode,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [storeName, setStoreName] = useState('');
    const [storePhone, setStorePhone] = useState('');
    const [storeCity, setStoreCity] = useState('Lahore');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !password.trim()) {
            toast.error("Please fill in your name, email, and password.");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters long.");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    password,
                    accountType: "store",
                    storeName: storeName.trim() || `${name.trim()}'s Store`,
                    storePhone: storePhone.trim(),
                    storeCity: storeCity.trim() || "Lahore"
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to create store account.");
            }

            toast.success("Store account created successfully! Signing you in... 🎉");

            // Auto-login with credentials
            const loginRes = await signIn("credentials", {
                email: email.trim().toLowerCase(),
                password,
                redirect: false
            });

            if (loginRes?.error) {
                toast.info("Account created! Please sign in with your email and password.");
                router.push("/auth/login");
            } else {
                router.push("/store-dashboard");
            }
        } catch (err: any) {
            toast.error(err.message || "Something went wrong during account creation.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen relative overflow-hidden bg-background py-10 px-4 sm:px-6">
            {/* Ambient Backdrops */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/4 w-[42rem] h-[42rem] bg-emerald-500/10 rounded-full blur-[140px]" />
                <div className="absolute bottom-0 left-0 -translate-x-1/4 translate-y-1/4 w-[36rem] h-[36rem] bg-primary/20 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-lg animate-in fade-in zoom-in-95 duration-500 my-6">
                {/* Header */}
                <div className="flex flex-col items-center mb-6 text-center">
                    <div className="relative flex h-16 w-16 mb-3 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-primary to-teal-500 text-white shadow-xl shadow-primary/25">
                        <Store className="h-8 w-8" />
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-2.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        Digital Dukaan &bull; Store Creation
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                        Create Your Store Account
                    </h1>
                    <p className="text-muted-foreground text-xs sm:text-sm mt-1 max-w-sm">
                        Launch your online store with instant WhatsApp ordering and automated customer order notifications.
                    </p>
                </div>

                {/* Form Card */}
                <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/5 dark:shadow-black/40 border border-border/70 space-y-5">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Section: Personal Info */}
                        <div className="space-y-3.5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-primary" />
                                <span>Owner Details</span>
                            </h3>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground">Your Full Name</label>
                                <div className="relative">
                                    <Input
                                        type="text"
                                        placeholder="e.g. Muhammad Ahmed"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="h-11 rounded-xl bg-background/60 pl-3 text-sm border-border/60 focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">Email Address</label>
                                    <div className="relative">
                                        <Input
                                            type="email"
                                            placeholder="ahmed@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="h-11 rounded-xl bg-background/60 pl-3 text-sm border-border/60 focus:border-primary"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">Password (min 6 chars)</label>
                                    <div className="relative">
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            className="h-11 rounded-xl bg-background/60 pl-3 text-sm border-border/60 focus:border-primary"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-border/40 pt-3 space-y-3.5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Store Setup</span>
                            </h3>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground">Store Name</label>
                                <Input
                                    type="text"
                                    placeholder="e.g. Bismillah Super Store"
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                    className="h-11 rounded-xl bg-background/60 pl-3 text-sm border-border/60 focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">WhatsApp Order Number</label>
                                    <Input
                                        type="tel"
                                        placeholder="03001234567"
                                        value={storePhone}
                                        onChange={(e) => setStorePhone(e.target.value)}
                                        className="h-11 rounded-xl bg-background/60 pl-3 text-sm border-border/60 focus:border-emerald-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">City</label>
                                    <Input
                                        type="text"
                                        placeholder="Lahore / Karachi"
                                        value={storeCity}
                                        onChange={(e) => setStoreCity(e.target.value)}
                                        className="h-11 rounded-xl bg-background/60 pl-3 text-sm border-border/60 focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Store Features Summary */}
                        <div className="rounded-2xl bg-muted/50 p-3.5 border border-border/50 text-xs text-muted-foreground space-y-2">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                <span>Dedicated Online Dukaan with your custom slug</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                <span>Direct WhatsApp connect session for instant order alerts</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                <span>Walk-In Counter POS with thermal print receipts</span>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            size="lg"
                            disabled={isLoading}
                            className="w-full h-12 rounded-xl text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 cursor-pointer"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Your Store...
                                </>
                            ) : (
                                <>
                                    Create Store Account <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Footer Links */}
                    <div className="pt-2 text-center space-y-2.5">
                        <p className="text-xs text-muted-foreground">
                            Already have an account?{" "}
                            <Link href="/auth/login" className="font-bold text-primary hover:underline">
                                Sign In
                            </Link>
                        </p>
                        <div>
                            <Link href="/" className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Homepage
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-center text-xs text-muted-foreground">
                    SoleWhat Dukaan &bull; WhatsApp E-Commerce Platform
                </div>
            </div>
        </div>
    );
}
