"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
    Lock,
    Unlock,
    CheckCircle2,
    Clock,
    AlertCircle,
    Copy,
    Check,
    Send,
    MessageCircle,
    RefreshCw,
    ShieldAlert,
    Building2,
    Sparkles,
    CreditCard,
    ArrowRight,
    X,
    Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SubscriptionPaywallProps {
    enabled?: boolean;
    isSuperAdmin?: boolean;
}

interface SubscriptionData {
    enabled: boolean;
    isSuperAdmin: boolean;
    isLocked: boolean;
    config: {
        price: number;
        trialDays: number;
        jazzcash: string;
        easypaisa: string;
        bankDetails: string;
        supportPhone: string;
    };
    store: {
        id: string;
        name: string;
        slug: string;
        isActive: boolean;
        subscriptionStatus: string;
        subscriptionExpiresAt: string | null;
        subscriptionPlan: string | null;
        subscriptionTransactionId: string | null;
        subscriptionPaymentProof: string | null;
        subscriptionNotes: string | null;
    } | null;
}

export default function SubscriptionPaywallModal({
    enabled = true,
    isSuperAdmin = false
}: SubscriptionPaywallProps) {
    const searchParams = useSearchParams();
    const queryStoreId = searchParams.get("storeId");

    const [data, setData] = useState<SubscriptionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [checkingStatus, setCheckingStatus] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [dismissedByAdmin, setDismissedByAdmin] = useState(false);
    const [isUnlockingAdmin, setIsUnlockingAdmin] = useState(false);

    // Form inputs
    const [transactionId, setTransactionId] = useState("");
    const [paymentProofUrl, setPaymentProofUrl] = useState("");
    const [senderNotes, setSenderNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchSubscriptionInfo = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const url = queryStoreId
                ? `/api/store/subscription?storeId=${queryStoreId}`
                : `/api/store/subscription`;
            const res = await fetch(url);
            if (res.ok) {
                const json = await res.json();
                setData(json);
                if (json.store?.subscriptionTransactionId) {
                    setTransactionId(json.store.subscriptionTransactionId);
                }
            }
        } catch (e) {
            console.error("Failed to load subscription info:", e);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        setDismissedByAdmin(false);
        fetchSubscriptionInfo();
    }, [queryStoreId]);

    const handleCopy = (text: string, key: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        toast.success("Copied to clipboard! 📋");
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const handleCheckStatus = async () => {
        setCheckingStatus(true);
        await fetchSubscriptionInfo(true);
        setTimeout(() => setCheckingStatus(false), 600);
        toast.info("Status refreshed! 🔄");
    };

    const handleAdminQuickUnlock = async () => {
        if (!data?.store?.id) return;
        setIsUnlockingAdmin(true);
        try {
            const res = await fetch("/api/admin/store-users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    storeId: data.store.id,
                    action: "approve_month"
                })
            });
            if (res.ok) {
                toast.success(`Store "${data.store.name}" unlocked for 1 Month (+30 Days)! 🟢`);
                await fetchSubscriptionInfo(true);
            } else {
                toast.error("Failed to unlock store.");
            }
        } catch {
            toast.error("Network error while unlocking store.");
        } finally {
            setIsUnlockingAdmin(false);
        }
    };

    const handleSubmitPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transactionId.trim() && !paymentProofUrl.trim()) {
            toast.error("Transaction ID (TID) ya payment screenshot link laazmi darj karein.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/store/subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    storeId: data?.store?.id,
                    transactionId: transactionId.trim(),
                    paymentProofUrl: paymentProofUrl.trim(),
                    notes: senderNotes.trim()
                })
            });

            const result = await res.json();
            if (res.ok) {
                toast.success(result.message || "Payment proof submit ho gaya!");
                await fetchSubscriptionInfo(true);
            } else {
                toast.error(result.error || "Submission fail ho gaya.");
            }
        } catch (err: any) {
            toast.error("Network error submitting payment proof.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // If still loading initial check, return null
    if (loading) {
        return null;
    }

    // If not locked or dismissed by SuperAdmin, don't show
    if (!data || !data.isLocked || dismissedByAdmin) {
        return null;
    }

    const store = data.store;
    const config = data.config;
    const isPendingApproval = store?.subscriptionStatus === "PENDING_APPROVAL";
    const monthlyPrice = config?.price || 1500;
    const viewerIsSuperAdmin = data.isSuperAdmin || isSuperAdmin;

    // Support WhatsApp link
    const supportPhoneRaw = config?.supportPhone?.replace(/[^0-9]/g, "") || "923000000000";
    const waMessage = encodeURIComponent(
        `Assalam o Alaikum! Mene ${store?.name || "Dukaan"} ki monthly subscription fee transfer kar di hai.\nStore: ${store?.name || ""}\nSlug: ${store?.slug || ""}\nTrx ID: ${transactionId || "N/A"}\nBaraye meharbani mera store dashboard unlock kar dein.`
    );
    const whatsappSupportUrl = `https://wa.me/${supportPhoneRaw}?text=${waMessage}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-background/85 backdrop-blur-xl overflow-y-auto styled-scrollbar animate-in fade-in duration-300">
            {/* Ambient background glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[35rem] h-[35rem] bg-gradient-to-tr from-rose-500/15 via-amber-500/10 to-emerald-500/15 rounded-full blur-[120px]" />
            </div>

            <div className="relative w-full max-w-2xl bg-card/95 border border-border/80 shadow-2xl rounded-3xl overflow-hidden my-auto backdrop-blur-2xl">
                
                {/* SUPERADMIN PREVIEW BANNER (IF ADMIN IS TESTING) */}
                {viewerIsSuperAdmin && (
                    <div className="bg-amber-500/15 border-b border-amber-500/30 px-5 py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
                            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                            <span>SuperAdmin Mode: Store <u>{store?.name}</u> is Expired & Locked for store user.</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                onClick={handleAdminQuickUnlock}
                                disabled={isUnlockingAdmin}
                                className="h-7 px-2.5 rounded-lg text-[11px] font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                            >
                                {isUnlockingAdmin ? "Unlocking..." : "+30d 1-Click Unlock"}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDismissedByAdmin(true)}
                                className="h-7 px-2 rounded-lg text-[11px] text-muted-foreground hover:text-foreground"
                                title="Dismiss modal to test dashboard as SuperAdmin"
                            >
                                <X className="w-3.5 h-3.5 mr-1" />
                                <span>Dismiss</span>
                            </Button>
                        </div>
                    </div>
                )}

                {/* TOP HERO BANNER */}
                <div className="relative p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-950 to-rose-950 text-white overflow-hidden border-b border-border/50">
                    <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-bold tracking-wide">
                                <Lock className="w-3.5 h-3.5" />
                                <span>Store Dashboard Locked</span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                                <span>{store?.name || "Dukaan"} Subscription Expired</span>
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
                                Store Dashboard access karne aur online customer orders receive karne ke liye monthly subscription fee ada karein.
                            </p>
                        </div>

                        {/* Price Badge */}
                        <div className="shrink-0 text-left sm:text-right bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15">
                            <div className="text-[11px] font-semibold text-rose-300 uppercase tracking-wider">Fee Per Month</div>
                            <div className="text-2xl font-black text-white">
                                Rs. {monthlyPrice.toLocaleString("en-PK")}
                            </div>
                            <div className="text-[10px] text-slate-300">30 Days Full Access</div>
                        </div>
                    </div>
                </div>

                <div className="p-5 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto styled-scrollbar">
                    
                    {/* STATUS ALERT BANNER */}
                    {isPendingApproval ? (
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                            <div className="space-y-1 flex-1">
                                <div className="text-sm font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                                    <span>Payment Proof Verification In Progress!</span>
                                    <Badge variant="outline" className="text-[10px] bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-amber-300">
                                        Pending Admin Approval
                                    </Badge>
                                </div>
                                <p className="text-xs text-amber-800/90 dark:text-amber-300/80">
                                    Aapka payment proof aur Trx ID (<strong className="font-mono">{store?.subscriptionTransactionId || "Submitted"}</strong>) receive ho chuka hai. Admin verify karke aapka dashboard foran unlock kar dega.
                                </p>
                                <div className="pt-2 flex items-center gap-2 flex-wrap">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleCheckStatus}
                                        disabled={checkingStatus}
                                        className="h-8 rounded-xl text-xs font-semibold gap-1.5 border-amber-500/30"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${checkingStatus ? "animate-spin" : ""}`} />
                                        <span>Check Status Now</span>
                                    </Button>
                                    <a href={whatsappSupportUrl} target="_blank" rel="noopener noreferrer">
                                        <Button
                                            size="sm"
                                            className="h-8 rounded-xl text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                        >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                            <span>WhatsApp Admin for Quick Unlock</span>
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3">
                            <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                            <div className="space-y-1 flex-1">
                                <div className="text-sm font-bold text-rose-900 dark:text-rose-300 flex items-center gap-2">
                                    <span>Subscription Expired & Dukaan Inactive</span>
                                    <Badge variant="destructive" className="text-[10px] font-bold">Locked</Badge>
                                </div>
                                <p className="text-xs text-rose-800/90 dark:text-rose-300/80">
                                    Store: <strong className="text-foreground">{store?.name}</strong>. Neeche diye gaye official payment accounts par Rs. {monthlyPrice} transfer karein aur Transaction ID submit karein taake dashboard aur online orders unlock ho sakein.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* PAYMENT ACCOUNTS (JAZZCASH, EASYPAISA, BANK) */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <CreditCard className="w-4 h-4 text-emerald-500" />
                                <span>Official Payment Transfer Accounts</span>
                            </h3>
                            <span className="text-[11px] text-muted-foreground font-medium">Click to Copy</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* JazzCash */}
                            {config?.jazzcash && (
                                <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/40 hover:bg-muted/70 transition flex items-center justify-between gap-3 group">
                                    <div className="space-y-0.5 min-w-0">
                                        <div className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                                            <span>JazzCash Account</span>
                                        </div>
                                        <div className="text-sm font-extrabold font-mono tracking-tight truncate text-foreground">
                                            {config.jazzcash}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleCopy(config.jazzcash, "jazzcash")}
                                        className="h-8 w-8 p-0 rounded-xl shrink-0 border-border/80 hover:bg-background"
                                        title="Copy JazzCash Number"
                                    >
                                        {copiedKey === "jazzcash" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                                    </Button>
                                </div>
                            )}

                            {/* EasyPaisa */}
                            {config?.easypaisa && (
                                <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/40 hover:bg-muted/70 transition flex items-center justify-between gap-3 group">
                                    <div className="space-y-0.5 min-w-0">
                                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span>EasyPaisa Account</span>
                                        </div>
                                        <div className="text-sm font-extrabold font-mono tracking-tight truncate text-foreground">
                                            {config.easypaisa}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleCopy(config.easypaisa, "easypaisa")}
                                        className="h-8 w-8 p-0 rounded-xl shrink-0 border-border/80 hover:bg-background"
                                        title="Copy EasyPaisa Number"
                                    >
                                        {copiedKey === "easypaisa" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Bank Account Details */}
                        {config?.bankDetails && (
                            <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/40 hover:bg-muted/70 transition space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5" />
                                        <span>Bank Transfer Details</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleCopy(config.bankDetails, "bank")}
                                        className="h-7 px-2.5 rounded-lg text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground"
                                    >
                                        {copiedKey === "bank" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                        <span>Copy Details</span>
                                    </Button>
                                </div>
                                <div className="text-xs font-mono text-muted-foreground whitespace-pre-line bg-background/50 p-2.5 rounded-xl border border-border/60">
                                    {config.bankDetails}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SUBMIT PAYMENT PROOF FORM */}
                    <form onSubmit={handleSubmitPayment} className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                                <Send className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Submit Payment Details</span>
                            </h3>
                            <span className="text-[11px] text-muted-foreground">Verification within minutes</span>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold flex items-center gap-1">
                                    <span>Transaction ID (TID) / Trx Hash</span>
                                    <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    value={transactionId}
                                    onChange={e => setTransactionId(e.target.value)}
                                    placeholder="e.g. TID 1234567890 ya JazzCash/EasyPaisa message ID"
                                    required
                                    className="h-10 text-xs rounded-xl font-mono"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold flex items-center gap-1">
                                    <span>Slip Screenshot URL / Image Link (Optional)</span>
                                </Label>
                                <Input
                                    value={paymentProofUrl}
                                    onChange={e => setPaymentProofUrl(e.target.value)}
                                    placeholder="https://... receipt image link ya Google Drive link"
                                    className="h-10 text-xs rounded-xl font-mono"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold flex items-center gap-1">
                                    <span>Sender Name / Notes (Optional)</span>
                                </Label>
                                <Input
                                    value={senderNotes}
                                    onChange={e => setSenderNotes(e.target.value)}
                                    placeholder="Kis naam ya account se payment bheji (e.g. Ali Khan - 0300...)"
                                    className="h-10 text-xs rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full sm:w-auto h-10 px-6 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center justify-center gap-2"
                            >
                                <Send className={`w-3.5 h-3.5 ${isSubmitting ? "animate-pulse" : ""}`} />
                                <span>{isSubmitting ? "Submitting..." : "Submit Payment Proof"}</span>
                            </Button>

                            <a
                                href={whatsappSupportUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto"
                            >
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full sm:w-auto h-10 px-4 rounded-xl text-xs font-bold border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 flex items-center justify-center gap-2"
                                >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>Direct WhatsApp Help</span>
                                </Button>
                            </a>
                        </div>
                    </form>

                </div>

            </div>
        </div>
    );
}
