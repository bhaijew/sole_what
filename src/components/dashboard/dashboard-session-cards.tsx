"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, QrCode, Globe, MessageSquare, ArrowRight, PlugZap } from "lucide-react";
import { toast } from "sonner";

interface SessionItem {
    id: string;
    sessionId: string;
    name: string;
    status: string;
    user?: {
        name: string | null;
        email: string | null;
    } | null;
}

interface DashboardSessionCardsProps {
    sessions: SessionItem[];
}

export function DashboardSessionCards({ sessions }: DashboardSessionCardsProps) {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = (idToCopy: string, label: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(idToCopy);
        setCopiedId(idToCopy);
        toast.success(`${label} copied to clipboard!`);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (sessions.length === 0) {
        return (
            <Card className="border-dashed border-2 border-slate-200 dark:border-border/60 shadow-none">
                <CardContent className="py-12 text-center">
                    <div className="bg-primary/10 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <QrCode className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-base font-semibold text-foreground mb-1">No WhatsApp Sessions Found</p>
                    <p className="text-xs text-muted-foreground mb-4">Connect your first WhatsApp device to start sending automated order alerts</p>
                    <Link href="/dashboard/sessions">
                        <Button size="sm" className="gap-2 shadow-sm">
                            <QrCode className="h-4 w-4" /> Create & Connect Session
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((s) => {
                const isConnected = s.status === "CONNECTED";
                const isDisconnected = !isConnected;
                const isCopied = copiedId === s.sessionId;

                return (
                    <Card
                        key={s.id}
                        className="glass-panel border-border/60 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 flex flex-col justify-between group overflow-hidden relative"
                    >
                        {/* Top status accent bar */}
                        <div
                            className={`h-1.5 w-full ${
                                isConnected
                                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                                    : "bg-gradient-to-r from-red-400 to-rose-500"
                            }`}
                        />

                        <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                            {/* Header with Title & Status */}
                            <div>
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                    <h4 className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                        {s.name || "WhatsApp Session"}
                                    </h4>
                                    <div
                                        className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0 border ${
                                            isConnected
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                                : isDisconnected
                                                ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
                                                : "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                                        }`}
                                    >
                                        <span
                                            className={`h-2 w-2 rounded-full ${
                                                isConnected
                                                    ? "bg-emerald-500 animate-pulse"
                                                    : isDisconnected
                                                    ? "bg-red-500"
                                                    : "bg-amber-500"
                                            }`}
                                        />
                                        {s.status}
                                    </div>
                                </div>
                                {s.user?.email && (
                                    <p className="text-xs text-muted-foreground truncate">
                                        Owner: {s.user.name || s.user.email}
                                    </p>
                                )}
                            </div>

                            {/* Session ID Highlight Box */}
                            <div className="bg-muted/60 dark:bg-card/70 border border-border/80 rounded-xl p-3 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                        <PlugZap className="h-3 w-3 text-primary" /> Session ID (API)
                                    </span>
                                    <span className="text-[10px] text-primary/80 font-medium">Click to Copy</span>
                                </div>
                                
                                <div className="flex items-center justify-between gap-2 bg-background border border-border/70 rounded-lg px-2.5 py-1.5">
                                    <code className="text-xs font-mono font-bold text-primary truncate select-all">
                                        {s.sessionId}
                                    </code>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-colors flex-shrink-0"
                                        onClick={(e) => handleCopy(s.sessionId, "Session ID", e)}
                                        title="Copy Session ID"
                                    >
                                        {isCopied ? (
                                            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                        ) : (
                                            <Copy className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Quick Action Buttons */}
                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40">
                                <Link
                                    href={`/dashboard/connect-website?session=${encodeURIComponent(s.sessionId)}`}
                                    className="w-full"
                                >
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full h-8 text-xs font-medium gap-1.5 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                                    >
                                        <Globe className="h-3.5 w-3.5" /> Connect Site
                                    </Button>
                                </Link>

                                <Link href={`/dashboard/sessions/${s.sessionId}`} className="w-full">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full h-8 text-xs font-medium gap-1.5 hover:bg-muted"
                                    >
                                        <QrCode className="h-3.5 w-3.5" /> Manage / QR
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
