"use client";

import { useState } from "react";
import {
    UploadCloud,
    Download,
    FileSpreadsheet,
    X,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    Package
} from "lucide-react";
import { toast } from "sonner";

interface BulkImportModalProps {
    storeId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function BulkImportModal({
    storeId,
    isOpen,
    onClose,
    onSuccess
}: BulkImportModalProps) {
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [parsedRows, setParsedRows] = useState<any[]>([]);
    const [isParsing, setIsParsing] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    if (!isOpen) return null;

    // Download Sample Template CSV
    const handleDownloadTemplate = () => {
        const headers = "Name,Category,Price,CompareAtPrice,Unit,ImageURL,Description,InStock\n";
        const sample1 = "Basmati Rice 5kg,Grocery,1650,1800,pack,https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500,Premium Super Kernel Basmati Rice,true\n";
        const sample2 = "Casual Cotton Polo Shirt,Apparel,2200,2800,piece,https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500,High quality breathable cotton,true\n";
        const sample3 = "Pure Honey 500g,Organic,1200,1500,jar,,100% natural organic sidr honey,true\n";

        const blob = new Blob([headers + sample1 + sample2 + sample3], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "sole_what_products_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Parse CSV File locally
    const handleFileChange = (file: File) => {
        setCsvFile(file);
        setError("");
        setIsParsing(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
                if (lines.length <= 1) {
                    throw new Error("CSV file khali hai ya us mein koi data row nahi hai.");
                }

                const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
                const rows: any[] = [];

                for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ""));
                    if (cols.length === 0 || !cols[0]) continue;

                    const rowObj: any = {};
                    headers.forEach((h, idx) => {
                        rowObj[h] = cols[idx] || "";
                    });

                    if (rowObj.name && rowObj.price) {
                        rows.push({
                            name: rowObj.name,
                            categoryName: rowObj.category || rowObj.categoryname || "General",
                            price: parseFloat(rowObj.price),
                            compareAtPrice: rowObj.compareatprice ? parseFloat(rowObj.compareatprice) : null,
                            unit: rowObj.unit || "item",
                            image: rowObj.imageurl || rowObj.image || null,
                            description: rowObj.description || null,
                            inStock: rowObj.instock === undefined ? true : (rowObj.instock === "true" || rowObj.instock === "1")
                        });
                    }
                }

                setParsedRows(rows);
            } catch (err: any) {
                setError(err.message || "CSV parse karne mein masla pesh aaya.");
                setParsedRows([]);
            } finally {
                setIsParsing(false);
            }
        };
        reader.readAsText(file);
    };

    // Submit Parsed rows to backend
    const handleSubmit = async () => {
        if (parsedRows.length === 0) return;
        setIsSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/store/bulk-import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    storeId,
                    products: parsedRows
                })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Bulk import failed");
            }

            toast.success(data.message || `${parsedRows.length} products import ho gaye!`);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to import products");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                            <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                                Bulk Products Import (Excel / CSV)
                            </h3>
                            <p className="text-xs text-slate-500">
                                1-Click mein sainkaron products apni dukaan mein shamil karein
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

                <div className="p-5 sm:p-6 space-y-5 flex-1 overflow-y-auto">
                    {/* Step 1: Download Sample Sheet */}
                    <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between gap-3 text-xs">
                        <div>
                            <strong className="text-indigo-950 font-bold block">
                                Step 1: Pehle Sample Excel / CSV Sheet Download Karein
                            </strong>
                            <p className="text-indigo-800 text-[11px] mt-0.5">
                                Is sheet mein apne products, keemat aur categories daal kar save karein.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleDownloadTemplate}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download CSV Template</span>
                        </button>
                    </div>

                    {/* Step 2: Upload CSV */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700">
                            Step 2: Tayyar Ki Gayi CSV File Yahan Upload Karein
                        </label>
                        <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition text-center space-y-2">
                            <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-emerald-600" />
                            <div>
                                <p className="text-xs font-bold text-slate-800">
                                    {csvFile ? csvFile.name : "Click karein ya CSV file drag & drop karein"}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    Supported format: .csv (Comma Delimited)
                                </p>
                            </div>
                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={e => {
                                    const f = e.target.files?.[0];
                                    if (f) handleFileChange(f);
                                }}
                            />
                        </label>
                    </div>

                    {error && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Preview Table */}
                    {parsedRows.length > 0 && (
                        <div className="space-y-2 pt-1 border-t border-slate-200">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span>{parsedRows.length} Products Dastyab Hain (Ready to Import)</span>
                                </span>
                            </div>

                            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl text-[11px] divide-y divide-slate-100 bg-white shadow-2xs">
                                {parsedRows.slice(0, 10).map((r, idx) => (
                                    <div key={idx} className="p-2.5 flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 truncate">{r.name}</p>
                                            <p className="text-[10px] text-slate-400">{r.categoryName} • {r.unit}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="font-bold font-mono text-emerald-700">Rs. {r.price}</span>
                                            {r.compareAtPrice && (
                                                <span className="text-[10px] text-slate-400 line-through ml-1.5">Rs. {r.compareAtPrice}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {parsedRows.length > 10 && (
                                    <div className="p-2 text-center text-[10px] text-slate-500 bg-slate-50">
                                        + {parsedRows.length - 10} mazeed products shamil hain
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={parsedRows.length === 0 || isSubmitting}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                        {isSubmitting ? (
                            <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Import Ho Rahe Hain...</span>
                            </>
                        ) : (
                            <>
                                <Package className="w-3.5 h-3.5" />
                                <span>{parsedRows.length} Products Dukaan Mein Add Karein</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
