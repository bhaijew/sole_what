"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
    X,
    Printer,
    Download,
    Copy,
    Check,
    Store,
    Clock,
    Phone,
    MapPin,
    Sparkles,
    Truck
} from "lucide-react";
import { toast } from "sonner";

interface CounterQrModalProps {
    isOpen: boolean;
    onClose: () => void;
    store: {
        id: string;
        name: string;
        slug: string;
        phone: string;
        tagline?: string | null;
        address?: string | null;
        city?: string | null;
        estimatedDeliveryTime?: string | null;
        openingHours?: string | null;
        customDomain?: string | null;
    };
}

export default function CounterQrModal({ isOpen, onClose, store }: CounterQrModalProps) {
    const [copied, setCopied] = useState<boolean>(false);

    if (!isOpen) return null;

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const storeUrl = store.customDomain
        ? `https://${store.customDomain}`
        : `${origin}/s/${store.slug}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(storeUrl);
        setCopied(true);
        toast.success("Store link copy ho gaya hai!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
            {/* Hidden styles for clean print output */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #counter-stand-print-area, #counter-stand-print-area * {
                        visibility: visible;
                    }
                    #counter-stand-print-area {
                        position: fixed;
                        left: 0;
                        top: 0;
                        width: 100vw;
                        height: 100vh;
                        margin: 0;
                        padding: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: white !important;
                    }
                }
            `}</style>

            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-5 my-8">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                            <Printer className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-slate-900">
                                Dukaan Counter Stand & QR Poster
                            </h3>
                            <p className="text-xs text-slate-500">
                                Isay print karke apni dukaan ke counter ya deewar par lagayein
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Printable Stand Preview Card */}
                <div
                    id="counter-stand-print-area"
                    className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-6 sm:p-8 text-center space-y-5 border-4 border-emerald-500 shadow-xl relative overflow-hidden"
                >
                    {/* Decorative Top Pill */}
                    <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/40 px-3.5 py-1 rounded-full text-emerald-300 text-xs font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>WhatsApp Digital Dukaan • Fast Home Delivery</span>
                    </div>

                    {/* Store Name & Tagline */}
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                            {store.name}
                        </h2>
                        {store.tagline ? (
                            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-sm mx-auto">
                                {store.tagline}
                            </p>
                        ) : (
                            <p className="text-xs text-slate-300 mt-1">
                                Ghar bethay online order mangwayein direct WhatsApp par!
                            </p>
                        )}
                    </div>

                    {/* QR Code Container */}
                    <div className="bg-white p-4 rounded-2xl max-w-[210px] mx-auto shadow-2xl border-4 border-white">
                        <QRCodeSVG
                            value={storeUrl}
                            size={180}
                            level="H"
                            includeMargin={false}
                        />
                        <p className="text-slate-900 font-bold text-[11px] mt-2 tracking-wide uppercase">
                            📷 Camera Se Scan Karein
                        </p>
                    </div>

                    {/* Key Info Badges */}
                    <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto pt-1 text-left">
                        <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div className="text-[11px]">
                                <span className="block text-slate-400 text-[10px]">Delivery Waqt</span>
                                <strong className="text-white">{store.estimatedDeliveryTime || "30-45 mins"}</strong>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div className="text-[11px] truncate">
                                <span className="block text-slate-400 text-[10px]">WhatsApp Order</span>
                                <strong className="text-white truncate">{store.phone}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Footer Details */}
                    <div className="pt-2 border-t border-slate-700/60 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-1 max-w-sm mx-auto">
                        <span className="truncate max-w-[180px] font-mono text-[10px] text-emerald-300">
                            {storeUrl.replace(/^https?:\/\//, "")}
                        </span>
                        {store.city && <span>📍 {store.city}</span>}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                    <button
                        onClick={handlePrint}
                        className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
                    >
                        <Printer className="w-4 h-4" />
                        <span>Counter Stand Print Karein (A4 / Table Stand)</span>
                    </button>

                    <button
                        onClick={handleCopy}
                        className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                    >
                        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? "Link Copied!" : "Store Link"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
