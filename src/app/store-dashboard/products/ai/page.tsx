"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Store,
    Sparkles,
    RefreshCw,
    Package
} from "lucide-react";
import AiProductCreator from "../../ai-product-creator";

interface StoreItem {
    id: string;
    name: string;
    slug: string;
    currency?: string;
    currencySymbol?: string;
}

function AiProductAddContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const storeIdParam = searchParams.get("storeId");

    const [stores, setStores] = useState<StoreItem[]>([]);
    const [selectedStore, setSelectedStore] = useState<StoreItem | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        try {
            const res = await fetch("/api/stores");
            const data = await res.json();
            if (data.stores && data.stores.length > 0) {
                setStores(data.stores);
                if (storeIdParam) {
                    const matched = data.stores.find((s: StoreItem) => s.id === storeIdParam);
                    setSelectedStore(matched || data.stores[0]);
                } else {
                    setSelectedStore(data.stores[0]);
                }
            }
        } catch (err) {
            console.error("Failed to load stores", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-violet-600" />
                <p className="text-sm font-semibold text-muted-foreground">AI Dukaan Studio Load Ho Raha Hai...</p>
            </div>
        );
    }

    if (!selectedStore) {
        return (
            <div className="max-w-xl mx-auto my-12 p-8 text-center glass-panel border border-border/70 rounded-3xl space-y-4">
                <Store className="w-12 h-12 text-muted-foreground mx-auto" />
                <h2 className="text-xl font-bold text-foreground">Aapki Koi Online Dukaan Mojood Nahi Hai</h2>
                <p className="text-xs text-muted-foreground">
                    Pehle Store Dashboard par ja kar apni dukaan banayein.
                </p>
                <Link
                    href="/store-dashboard"
                    className="inline-flex px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
                >
                    Dashboard Par Jayein
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* TOP NAVIGATION BAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
                <div className="flex items-center gap-3">
                    <Link
                        href={`/store-dashboard?tab=products&storeId=${selectedStore.id}`}
                        className="p-2 rounded-xl bg-card border border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground transition"
                        title="Back to Catalog"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-muted-foreground">Dukaan Catalog</span>
                            <span className="text-muted-foreground/40">/</span>
                            <span className="text-xs font-extrabold text-violet-600 dark:text-violet-400">
                                AI Magic Add
                            </span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                            <span>✨ AI Dukaan Product Studio</span>
                        </h1>
                    </div>
                </div>

                {/* STORE SWITCHER */}
                {stores.length > 1 && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground">Active Dukaan:</span>
                        <select
                            value={selectedStore.id}
                            onChange={(e) => {
                                const st = stores.find((s) => s.id === e.target.value);
                                if (st) setSelectedStore(st);
                            }}
                            className="bg-card border border-border/70 text-foreground font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-violet-500 cursor-pointer"
                        >
                            {stores.map((s) => (
                                <option key={s.id} value={s.id}>
                                    🏪 {s.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* AI PRODUCT CREATOR COMPONENT */}
            <AiProductCreator
                activeStore={{
                    id: selectedStore.id,
                    name: selectedStore.name,
                    currencySymbol: selectedStore.currencySymbol || "Rs.",
                    slug: selectedStore.slug
                }}
                onComplete={() => {
                    router.push(`/store-dashboard?tab=products&storeId=${selectedStore.id}`);
                }}
            />
        </div>
    );
}

export default function AiProductAddPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-violet-600" />
                    <p className="text-sm font-semibold text-muted-foreground">Loading Studio...</p>
                </div>
            }
        >
            <AiProductAddContent />
        </Suspense>
    );
}
