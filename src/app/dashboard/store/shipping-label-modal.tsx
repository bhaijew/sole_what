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
    Package
} from "lucide-react";

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
    const [format, setFormat] = useState<"courier" | "thermal">("courier");

    if (!isOpen || !order || !store) return null;

    const handlePrint = () => {
        window.print();
    };

    const dateFormatted = new Date(order.createdAt).toLocaleDateString("en-PK", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-label-area, #printable-label-area * {
                        visibility: visible;
                    }
                    #printable-label-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 10px;
                        background: white !important;
                        color: black !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
                {/* Header (No print) */}
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 no-print">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                            <Printer className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-black text-sm text-slate-900">
                                Print Dispatch Label & Invoice
                            </h3>
                            <p className="text-[11px] text-slate-500">
                                Order #{order.orderNumber} • {order.customerName}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 transition cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Format Toggle Bar (No print) */}
                <div className="p-3 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between gap-3 no-print">
                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                        <button
                            type="button"
                            onClick={() => setFormat("courier")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                format === "courier"
                                    ? "bg-slate-900 text-white shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Courier Shipping Label (Sticker)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormat("thermal")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                format === "thermal"
                                    ? "bg-slate-900 text-white shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>80mm Thermal Cash Memo</span>
                        </button>
                    </div>

                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Karein</span>
                    </button>
                </div>

                {/* Printable Label Viewport */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/50 flex justify-center">
                    <div id="printable-label-area" className="w-full">
                        {format === "courier" ? (
                            /* Courier Shipping Label (A4/Sticker format) */
                            <div className="bg-white border-2 border-slate-900 p-4 sm:p-5 rounded-xl font-mono text-xs text-slate-900 space-y-4 max-w-md mx-auto shadow-sm">
                                {/* Header Bar */}
                                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                                    <div>
                                        <h2 className="text-base font-black uppercase tracking-tight">
                                            {store.name}
                                        </h2>
                                        <p className="text-[10px] text-slate-600">
                                            {store.address || store.city || "Pakistan"} • Ph: {store.phone}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="bg-slate-900 text-white font-black text-[10px] px-2 py-0.5 rounded uppercase">
                                            {order.paymentMethod === "COD" ? "COD PARCEL" : "PREPAID"}
                                        </span>
                                        <p className="text-[10px] mt-0.5 font-bold">DATE: {dateFormatted}</p>
                                    </div>
                                </div>

                                {/* Order & Barcode Graphic */}
                                <div className="text-center py-2 bg-slate-50 border border-slate-200 rounded-lg">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        TRACKING NUMBER
                                    </p>
                                    <div className="font-mono text-xl font-black tracking-widest my-1">
                                        *{order.orderNumber}*
                                    </div>
                                    {/* Mock Barcode Graphic representation */}
                                    <div className="h-8 flex items-center justify-center gap-0.5 opacity-80 px-4">
                                        {[2, 4, 1, 3, 2, 5, 1, 3, 4, 2, 1, 3, 5, 2, 1, 4, 2, 3, 1, 4, 2, 5, 1, 3, 2, 4].map((w, idx) => (
                                            <div key={idx} className="bg-slate-900 h-full" style={{ width: `${w * 1.5}px` }} />
                                        ))}
                                    </div>
                                </div>

                                {/* Consignee Details Box */}
                                <div className="border-2 border-slate-900 rounded-lg p-3 space-y-1.5 bg-slate-50">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                                        DELIVER TO (CUSTOMER):
                                    </span>
                                    <div className="text-sm font-black">{order.customerName}</div>
                                    <div className="text-xs font-bold flex items-center gap-1 text-slate-800">
                                        <span>Phone:</span>
                                        <span className="font-mono">{order.customerPhone}</span>
                                    </div>
                                    <div className="text-xs text-slate-700 leading-snug">
                                        <strong>Address:</strong> {order.customerAddress}
                                    </div>
                                    {order.customerNotes && (
                                        <div className="text-[11px] text-amber-900 font-bold bg-amber-50 p-1.5 rounded border border-amber-200 mt-1">
                                            Instruction: {order.customerNotes}
                                        </div>
                                    )}
                                </div>

                                {/* Items Summary in Courier Label */}
                                <div className="border border-slate-300 rounded-lg p-2.5 text-[11px] space-y-1">
                                    <div className="font-bold border-b border-slate-200 pb-1 flex justify-between">
                                        <span>Package Contents ({order.items.length} items):</span>
                                        <span>QTY</span>
                                    </div>
                                    {order.items.map((it, idx) => (
                                        <div key={idx} className="flex justify-between text-slate-700">
                                            <span className="truncate max-w-[240px]">{it.productName}</span>
                                            <span className="font-bold">{it.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Big COD Collectible Box */}
                                <div className="bg-slate-900 text-white p-3 rounded-lg flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-300 uppercase block tracking-wider">
                                            {order.paymentMethod === "COD" ? "AMOUNT TO COLLECT (COD):" : "PAYMENT STATUS:"}
                                        </span>
                                        <div className="text-lg font-black tracking-tight text-amber-300">
                                            {order.paymentMethod === "COD" ? `Rs. ${order.total.toLocaleString("en-PK")}` : "PAID (DO NOT COLLECT)"}
                                        </div>
                                    </div>
                                    <div className="text-right text-[10px] text-slate-400">
                                        <span>Rider Signature:</span>
                                        <div className="w-20 border-b border-slate-500 mt-3" />
                                    </div>
                                </div>

                                <div className="text-center text-[10px] text-slate-500 pt-1">
                                    Shipped via Sole-What Commerce Gateway • Do not accept if seal broken
                                </div>
                            </div>
                        ) : (
                            /* 80mm Thermal Receipt (POS Slip format) */
                            <div className="bg-white border border-slate-300 p-4 rounded-xl font-mono text-xs text-slate-900 space-y-3 max-w-[320px] mx-auto shadow-sm">
                                <div className="text-center space-y-0.5 border-b border-dashed border-slate-400 pb-3">
                                    <h2 className="text-sm font-black uppercase">{store.name}</h2>
                                    <p className="text-[10px] text-slate-500">{store.address || store.city || "Pakistan"}</p>
                                    <p className="text-[10px] text-slate-500">Ph: {store.phone}</p>
                                    <div className="text-[10px] font-bold pt-1">
                                        Invoice #{order.orderNumber}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                        Date: {dateFormatted}
                                    </div>
                                </div>

                                <div className="text-[11px] border-b border-dashed border-slate-300 pb-2">
                                    <p><strong>Customer:</strong> {order.customerName}</p>
                                    <p><strong>Phone:</strong> {order.customerPhone}</p>
                                </div>

                                <div className="space-y-1.5 text-[11px] border-b border-dashed border-slate-400 pb-3">
                                    <div className="flex justify-between font-bold border-b border-slate-200 pb-0.5">
                                        <span>Item</span>
                                        <span>Total</span>
                                    </div>
                                    {order.items.map((it, idx) => (
                                        <div key={idx} className="flex justify-between">
                                            <span>{it.quantity}x {it.productName}</span>
                                            <span>Rs. {it.totalPrice}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-1 text-[11px] pt-1">
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>Rs. {(order.subtotal || order.total).toLocaleString("en-PK")}</span>
                                    </div>
                                    {Number(order.discount) > 0 && (
                                        <div className="flex justify-between font-bold">
                                            <span>Discount:</span>
                                            <span>-Rs. {Number(order.discount).toLocaleString("en-PK")}</span>
                                        </div>
                                    )}
                                    {Number(order.deliveryFee) > 0 && (
                                        <div className="flex justify-between">
                                            <span>Delivery:</span>
                                            <span>Rs. {Number(order.deliveryFee).toLocaleString("en-PK")}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-black text-xs pt-1.5 border-t border-slate-900">
                                        <span>NET PAYABLE:</span>
                                        <span>Rs. {order.total.toLocaleString("en-PK")}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
                                        <span>Mode:</span>
                                        <span>{order.paymentMethod}</span>
                                    </div>
                                </div>

                                <div className="text-center text-[10px] border-t border-dashed border-slate-400 pt-3 text-slate-600">
                                    *** SHUKRIYA VISIT KARNE KA ***
                                    <br />
                                    Powered by Sole-What Digital Dukaan
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
