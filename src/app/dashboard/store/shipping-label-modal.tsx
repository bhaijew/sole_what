"use client";

import { useState } from "react";
import {
    Printer,
    X,
    Truck,
    Receipt,
    Check,
    Barcode,
    QrCode,
    MapPin,
    Phone,
    Calendar,
    DollarSign,
    Package,
    MessageCircle,
    Store as StoreIcon,
    Sparkles
} from "lucide-react";
import { toast } from "sonner";

interface OrderItem {
    id: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
}

interface OrderData {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerCity?: string | null;
    customerNotes?: string | null;
    subtotal?: number;
    deliveryFee?: number;
    discount?: number;
    total: number;
    paymentMethod: string;
    createdAt: string;
    items: OrderItem[];
}

interface StoreData {
    id?: string;
    name: string;
    phone: string;
    address?: string | null;
    city?: string | null;
    currencySymbol: string;
}

export default function ShippingLabelModal({
    order,
    store,
    isOpen,
    onClose
}: {
    order: OrderData | null;
    store: StoreData | null;
    isOpen: boolean;
    onClose: () => void;
}) {
    const [format, setFormat] = useState<"thermal" | "courier">("thermal");
    const [isSendingWa, setIsSendingWa] = useState<boolean>(false);

    if (!isOpen || !order || !store) return null;

    const handlePrint = () => {
        window.print();
    };

    const handleSendWhatsAppReceipt = async () => {
        if (!order || !store) return;
        setIsSendingWa(true);
        try {
            if (store.id) {
                const res = await fetch(`/api/stores/${store.id}/orders/receipt`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId: order.id })
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    toast.success(data.message || "Customer ko WhatsApp receipt bhej di gayi hai! 📲");
                    return;
                }
                if (data.waLink) {
                    window.open(data.waLink, "_blank");
                    toast.info("WhatsApp direct window khol di gayi hai.");
                    return;
                }
                throw new Error(data.error || "Receipt send nahi ho saki");
            } else {
                const cleanPhone = order.customerPhone.replace(/[^\d]/g, "");
                const waClean = cleanPhone.startsWith("0") ? "92" + cleanPhone.slice(1) : cleanPhone;
                window.open(`https://wa.me/${waClean}`, "_blank");
            }
        } catch (e: any) {
            toast.error(e.message || "Receipt send error");
        } finally {
            setIsSendingWa(false);
        }
    };

    const dateFormatted = new Date(order.createdAt).toLocaleDateString("en-PK", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

    const timeFormatted = new Date(order.createdAt).toLocaleTimeString("en-PK", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });

    const barcodeLines = [3, 1, 4, 2, 1, 5, 2, 4, 1, 3, 5, 2, 1, 4, 3, 2, 5, 1, 4, 2, 3, 1, 4, 2, 5, 1, 3, 4, 2, 1, 3, 5, 2, 4];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    #printable-label-area, #printable-label-area * {
                        visibility: visible !important;
                    }
                    #printable-label-area {
                        position: fixed !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        color: black !important;
                        box-shadow: none !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    @page {
                        margin: 0;
                        size: auto;
                    }
                }
            `}</style>

            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden my-auto transition-all">
                {/* Header (No print) */}
                <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md no-print">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white flex items-center justify-center shadow-sm">
                            <Printer className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                                    Print Invoice & Slip
                                </h3>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                    #{order.orderNumber}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Customer: <strong className="text-slate-700 dark:text-slate-200">{order.customerName}</strong> ({order.customerPhone})
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                        title="Close Modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Format Toggle & Action Bar (No print) */}
                <div className="p-3.5 bg-slate-100/70 dark:bg-slate-950/50 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print">
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                        <button
                            type="button"
                            onClick={() => setFormat("thermal")}
                            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                format === "thermal"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>80mm Thermal Receipt</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setFormat("courier")}
                            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                format === "courier"
                                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Courier Shipping Sticker</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={isSendingWa}
                            onClick={handleSendWhatsAppReceipt}
                            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap"
                            title="Customer ke WhatsApp par exact digital thermal receipt bhejein"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span>{isSendingWa ? "Bhej raha hai..." : "WhatsApp Receipt"}</span>
                        </button>

                        <button
                            onClick={handlePrint}
                            className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Print Karein</span>
                        </button>
                    </div>
                </div>

                {/* Printable Label Viewport */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/60 dark:bg-slate-950 flex justify-center items-start">
                    <div id="printable-label-area" className="w-full flex justify-center">
                        {format === "thermal" ? (
                            /* Realistic 80mm Thermal Cash Memo / Slip format */
                            <div className="w-full max-w-[340px] bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-300/80 p-5 font-mono text-xs space-y-3.5 relative overflow-hidden">
                                {/* Decorative perforated top notch */}
                                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 opacity-90" />

                                {/* Store Header */}
                                <div className="text-center space-y-1 border-b-2 border-dashed border-slate-300 pb-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 mx-auto flex items-center justify-center mb-1 text-slate-800">
                                        <StoreIcon className="w-4 h-4" />
                                    </div>
                                    <h2 className="text-base font-black uppercase tracking-wider text-slate-950">
                                        {store.name}
                                    </h2>
                                    <p className="text-[11px] text-slate-600 font-medium">
                                        {store.address || store.city || "Pakistan"}
                                    </p>
                                    <p className="text-[11px] text-slate-600 font-medium">
                                        Ph: {store.phone}
                                    </p>
                                    <div className="pt-1 flex items-center justify-center gap-2 text-[11px] font-bold text-slate-900">
                                        <span>Invoice #{order.orderNumber}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500">
                                        Date: {dateFormatted} {timeFormatted}
                                    </p>
                                </div>

                                {/* Customer Info */}
                                <div className="text-[11px] border-b-2 border-dashed border-slate-300 pb-2.5 space-y-0.5">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 font-semibold">Customer:</span>
                                        <span className="font-bold text-slate-900">{order.customerName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 font-semibold">Phone:</span>
                                        <span className="font-bold text-slate-900">{order.customerPhone}</span>
                                    </div>
                                    {order.customerAddress && (
                                        <div className="pt-0.5 text-[10px] text-slate-600 leading-snug">
                                            <span className="text-slate-500 font-semibold">Address: </span>
                                            <span>{order.customerAddress}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Items Ordered Table */}
                                <div className="space-y-1.5 text-[11px] border-b-2 border-dashed border-slate-300 pb-3">
                                    <div className="flex justify-between font-extrabold border-b border-slate-200 pb-1 text-slate-800 uppercase text-[10px] tracking-wider">
                                        <span>Item Description</span>
                                        <span>Total</span>
                                    </div>
                                    {order.items.map((it, idx) => (
                                        <div key={idx} className="space-y-0.5">
                                            <div className="flex justify-between items-baseline font-medium">
                                                <span className="truncate pr-2">{it.quantity}x {it.productName}</span>
                                                <span className="font-bold shrink-0">Rs. {Number(it.totalPrice).toLocaleString("en-PK")}</span>
                                            </div>
                                            {it.quantity > 1 && (
                                                <div className="text-[9px] text-slate-400 pl-3">
                                                    @{Number(it.unitPrice).toLocaleString("en-PK")} each
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Financial Breakdown */}
                                <div className="space-y-1 text-[11px] pt-0.5">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Subtotal:</span>
                                        <span className="font-semibold">Rs. {(order.subtotal || order.total).toLocaleString("en-PK")}</span>
                                    </div>
                                    {Number(order.discount) > 0 && (
                                        <div className="flex justify-between font-bold text-emerald-700">
                                            <span>Discount:</span>
                                            <span>-Rs. {Number(order.discount).toLocaleString("en-PK")}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-slate-600">
                                        <span>Delivery Charges:</span>
                                        <span className="font-semibold">
                                            {Number(order.deliveryFee) === 0 ? "FREE" : `Rs. ${Number(order.deliveryFee).toLocaleString("en-PK")}`}
                                        </span>
                                    </div>

                                    {/* Prominent NET PAYABLE Box */}
                                    <div className="mt-2 p-2 bg-slate-900 text-white rounded-lg flex justify-between items-center font-extrabold text-sm">
                                        <span className="text-xs uppercase tracking-wide">NET PAYABLE:</span>
                                        <span className="text-base text-emerald-400">Rs. {Number(order.total).toLocaleString("en-PK")}</span>
                                    </div>

                                    <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                                        <span>Payment Method:</span>
                                        <span className="font-bold text-slate-800 uppercase">{order.paymentMethod || "Cash on Delivery"}</span>
                                    </div>
                                </div>

                                {/* Barcode Graphic */}
                                <div className="pt-2 text-center border-t-2 border-dashed border-slate-300 space-y-1">
                                    <div className="h-9 flex items-center justify-center gap-0.5 opacity-85 px-4 my-1">
                                        {barcodeLines.map((w, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-black h-full rounded-2xs"
                                                style={{ width: `${w}px` }}
                                            />
                                        ))}
                                    </div>
                                    <p className="font-mono text-[10px] tracking-widest font-black text-slate-700">
                                        *{order.orderNumber}*
                                    </p>
                                </div>

                                {/* Slip Footer */}
                                <div className="text-center text-[10px] text-slate-600 pt-1 leading-relaxed">
                                    <p className="font-black tracking-wide">*** SHUKRIYA VISIT KARNE KA ***</p>
                                    <p className="text-[9px] text-slate-400 mt-0.5">Powered by Sole-What Digital Dukaan</p>
                                </div>
                            </div>
                        ) : (
                            /* Courier Shipping Sticker (4x6 / A6 Waybill format) */
                            <div className="w-full max-w-md bg-white border-2 border-slate-900 p-5 rounded-2xl font-mono text-xs text-slate-900 space-y-4 shadow-xl">
                                {/* Header Bar */}
                                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                                    <div>
                                        <h2 className="text-base font-black uppercase tracking-tight text-slate-950">
                                            {store.name}
                                        </h2>
                                        <p className="text-[10px] text-slate-600">
                                            {store.address || store.city || "Pakistan"} • Ph: {store.phone}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="bg-slate-900 text-white font-black text-[10px] px-2.5 py-1 rounded-md uppercase tracking-wider">
                                            {order.paymentMethod === "COD" ? "COD PARCEL" : "PREPAID"}
                                        </span>
                                        <p className="text-[10px] mt-1 font-bold">DATE: {dateFormatted}</p>
                                    </div>
                                </div>

                                {/* Tracking & Barcode */}
                                <div className="text-center py-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        COURIER AIR WAYBILL NUMBER
                                    </p>
                                    <div className="font-mono text-xl font-black tracking-widest my-0.5">
                                        *{order.orderNumber}*
                                    </div>
                                    <div className="h-8 flex items-center justify-center gap-0.5 opacity-85 px-4">
                                        {barcodeLines.map((w, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-black h-full rounded-2xs"
                                                style={{ width: `${w}px` }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Sender / Receiver Grid */}
                                <div className="grid grid-cols-2 gap-3 text-[11px]">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                                            FROM (SENDER):
                                        </span>
                                        <p className="font-bold text-slate-900">{store.name}</p>
                                        <p className="text-[10px] text-slate-600 leading-tight">
                                            {store.address || store.city || "Pakistan"}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-700">📱 {store.phone}</p>
                                    </div>

                                    <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1">
                                        <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider block">
                                            SHIP TO (CONSIGNEE):
                                        </span>
                                        <p className="font-bold text-sm text-white">{order.customerName}</p>
                                        <p className="text-[10px] text-slate-300 leading-tight">
                                            {order.customerAddress}{order.customerCity ? `, ${order.customerCity}` : ""}
                                        </p>
                                        <p className="text-[11px] font-bold text-emerald-300">📱 {order.customerPhone}</p>
                                    </div>
                                </div>

                                {/* Order Items Summary */}
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                                        PACKAGE CONTENT ({order.items.length} items):
                                    </span>
                                    {order.items.map((it, idx) => (
                                        <div key={idx} className="flex justify-between text-slate-700">
                                            <span className="truncate pr-2">• {it.quantity}x {it.productName}</span>
                                            <span className="font-semibold shrink-0">Rs. {Number(it.totalPrice).toLocaleString("en-PK")}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Big COD Collectible Box */}
                                <div className="bg-slate-900 text-white p-3.5 rounded-xl flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-300 uppercase block tracking-wider">
                                            {order.paymentMethod === "COD" ? "AMOUNT TO COLLECT (COD):" : "PAYMENT STATUS:"}
                                        </span>
                                        <div className="text-xl font-black tracking-tight text-amber-300">
                                            {order.paymentMethod === "COD" ? `Rs. ${Number(order.total).toLocaleString("en-PK")}` : "PAID (DO NOT COLLECT)"}
                                        </div>
                                    </div>
                                    <div className="text-right text-[10px] text-slate-400">
                                        <span>Rider Signature:</span>
                                        <div className="w-24 border-b border-slate-500 mt-4" />
                                    </div>
                                </div>

                                <div className="text-center text-[10px] text-slate-500 pt-1">
                                    Shipped via Sole-What Commerce Gateway • Do not accept if seal broken
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
