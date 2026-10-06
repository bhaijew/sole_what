'use client';

import { ShieldAlert, ArrowRight, ArrowLeft, Lock, Users, KeyRound } from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
    return (
        <div className="flex items-center justify-center min-h-screen relative overflow-hidden bg-background py-12 px-4">
            {/* Background Orbs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/4 w-[40rem] h-[40rem] bg-emerald-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 -translate-x-1/4 translate-y-1/4 w-[30rem] h-[30rem] bg-primary/20 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="relative flex h-16 w-16 mb-4 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-primary text-white shadow-lg shadow-primary/25">
                        <Lock className="h-8 w-8" />
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-3">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Private Gateway Only
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Registration Closed</h1>
                    <p className="text-muted-foreground text-sm mt-1.5">SoleWhat WhatsApp Automation System</p>
                </div>

                <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/5 dark:shadow-black/40 border border-white/20 dark:border-white/10 space-y-6">
                    <div className="rounded-2xl bg-muted/60 dark:bg-muted/30 p-4 border border-border/50 text-xs text-muted-foreground space-y-3 leading-relaxed">
                        <div className="flex items-start gap-2.5">
                            <KeyRound className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <p><strong className="text-foreground">Super Admin Provisioned:</strong> Public self-registration is closed to ensure gateway security and dedicated resources.</p>
                        </div>
                        <div className="flex items-start gap-2.5">
                            <Users className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <p><strong className="text-foreground">Need Access?</strong> If you are a team member, client, or store manager, please request an invitation account from your Super Admin.</p>
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <Link href="/auth/login" className="block w-full">
                            <Button size="lg" className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30">
                                Sign In with Existing Account <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/" className="block w-full">
                            <Button size="lg" variant="outline" className="w-full h-12 rounded-xl text-sm font-semibold border-border/70 hover:bg-muted/60">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Homepage
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="mt-8 text-center text-xs text-muted-foreground">
                    Protected by enterprise session authentication &bull; SoleWhat
                </div>
            </div>
        </div>
    );
}
