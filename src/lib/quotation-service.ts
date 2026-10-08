import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { getGoldRates } from "./gold-service";
import { ChatService } from "@/modules/whatsapp/chat.service";
import { logger } from "./logger";

export interface QuotationInput {
    customerName?: string;
    customerPhone?: string;
    itemName: string;
    weight: number;         // numeric weight
    weightUnit: "tola" | "gram"; // default tola
    purity: "24k" | "22k" | "21k" | "18k"; // default 22k
    customRatePerTola?: number; // optional override
    makingCharges?: number;     // optional making charges
    notes?: string;
}

export interface QuotationResult {
    quoteNumber: string;
    date: string;
    customerName: string;
    itemName: string;
    weightTola: number;
    weightGram: number;
    purity: string;
    ratePerTola: number;
    goldAmount: number;
    makingCharges: number;
    totalAmount: number;
    pdfPath: string;
    publicUrl: string;
    fileName: string;
}

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "quotations");

function ensureDirectoryExists() {
    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
}

/**
 * Generate a luxury, professional PDF Quotation for Bhai Jewellers
 */
export async function generateQuotationPdf(input: QuotationInput): Promise<QuotationResult> {
    ensureDirectoryExists();

    const rates = getGoldRates();
    const purity = input.purity || "22k";
    
    // Determine rate per tola
    let ratePerTola = input.customRatePerTola;
    if (!ratePerTola || ratePerTola <= 0) {
        if (purity === "24k") ratePerTola = rates.rate24k;
        else if (purity === "22k") ratePerTola = rates.rate22k;
        else if (purity === "21k") ratePerTola = rates.rate21k;
        else if (purity === "18k") ratePerTola = rates.rate18k;
        else ratePerTola = rates.rate22k;
    }

    // Convert weights: 1 tola = 11.6638 grams
    let weightTola = 0;
    let weightGram = 0;
    if (input.weightUnit === "gram") {
        weightGram = Number(input.weight);
        weightTola = Number((weightGram / 11.6638).toFixed(3));
    } else {
        weightTola = Number(input.weight);
        weightGram = Number((weightTola * 11.6638).toFixed(2));
    }

    const goldAmount = Math.round(weightTola * ratePerTola);
    const makingCharges = Number(input.makingCharges || 4000);
    const totalAmount = goldAmount + makingCharges;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const quoteNumber = `BJ-${new Date().getFullYear()}-${randomSuffix}`;
    const fileName = `Quotation_${quoteNumber}.pdf`;
    const pdfPath = path.join(UPLOADS_DIR, fileName);
    const publicUrl = `/uploads/quotations/${fileName}`;

    const dateStr = new Date().toLocaleDateString("en-PK", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    // Generate PDF document using PDFKit
    await new Promise<void>((resolve, reject) => {
        const doc = new PDFDocument({ margin: 45, size: "A4" });
        const writeStream = fs.createWriteStream(pdfPath);

        doc.pipe(writeStream);

        // Styling Palette: Deep Navy & Rich Gold
        const primaryColor = "#111827";   // Charcoal Navy
        const goldColor = "#B45309";      // Royal Amber/Gold
        const mutedColor = "#6B7280";     // Cool Gray
        const lightBg = "#F9FAFB";        // Light Gray Background

        // 1. Header Banner
        doc.rect(0, 0, doc.page.width, 10).fill(goldColor);

        // Store Name / Branding
        doc.fillColor(goldColor)
           .fontSize(22)
           .font("Helvetica-Bold")
           .text("BHAI JEWELLERS", 45, 35, { characterSpacing: 1.5 });

        doc.fillColor(mutedColor)
           .fontSize(9)
           .font("Helvetica")
           .text("FINE GOLD & TRADITIONAL BRIDAL JEWELLERY", 45, 62, { characterSpacing: 1 });

        doc.fillColor(primaryColor)
           .fontSize(8)
           .font("Helvetica")
           .text("Shop #12, Liberty Market, Gulberg III, Lahore, Pakistan", 45, 78)
           .text("UAN / WhatsApp: +92-300-1234567 | info@bhaijewellers.com", 45, 90);

        // Right side: QUOTATION badge
        doc.fillColor(goldColor)
           .fontSize(20)
           .font("Helvetica-Bold")
           .text("QUOTATION", 360, 35, { align: "right" });

        doc.fillColor(primaryColor)
           .fontSize(9)
           .font("Helvetica")
           .text(`Quote Ref: #${quoteNumber}`, 360, 62, { align: "right" })
           .text(`Date: ${dateStr}`, 360, 75, { align: "right" })
           .text(`Status: VALID (24 Hours)`, 360, 88, { align: "right" });

        // Divider
        doc.moveTo(45, 115).lineTo(doc.page.width - 45, 115).strokeColor("#E5E7EB").lineWidth(1).stroke();

        // 2. Customer & Order Info Box
        doc.roundedRect(45, 130, doc.page.width - 90, 50, 6).fillAndStroke(lightBg, "#E5E7EB");
        doc.fillColor(primaryColor).fontSize(9).font("Helvetica-Bold").text("ESTIMATE PREPARED FOR:", 58, 142);
        
        const custName = input.customerName || "Valued Client";
        const custPhone = input.customerPhone ? `(${input.customerPhone})` : "";
        doc.fillColor(primaryColor).fontSize(10).font("Helvetica").text(`${custName} ${custPhone}`, 58, 157);

        doc.fillColor(mutedColor).fontSize(8).text("Bullion Benchmark: APSGJA Official Sarafa Karachi/Lahore Index", 300, 157, { align: "right" });

        // 3. Table Header
        const tableTop = 205;
        doc.rect(45, tableTop, doc.page.width - 90, 24).fill(primaryColor);
        doc.fillColor("#FFFFFF").fontSize(8).font("Helvetica-Bold");
        doc.text("ITEM DESCRIPTION", 55, tableTop + 7);
        doc.text("PURITY", 220, tableTop + 7);
        doc.text("WEIGHT", 300, tableTop + 7);
        doc.text("RATE / TOLA", 390, tableTop + 7);
        doc.text("NET VALUE", 465, tableTop + 7, { align: "right", width: 85 });

        // Table Row
        const rowTop = tableTop + 24;
        doc.rect(45, rowTop, doc.page.width - 90, 35).fillAndStroke("#FFFFFF", "#E5E7EB");
        doc.fillColor(primaryColor).fontSize(9).font("Helvetica-Bold").text(input.itemName || "22K Gold Jewellery Item", 55, rowTop + 8);
        doc.fillColor(mutedColor).fontSize(7).font("Helvetica").text("100% Certified Hallmark Purity", 55, rowTop + 20);

        doc.fillColor(goldColor).fontSize(9).font("Helvetica-Bold").text(`${purity.toUpperCase()} Gold`, 220, rowTop + 12);
        doc.fillColor(primaryColor).fontSize(8).font("Helvetica").text(`${weightTola} Tola (${weightGram}g)`, 300, rowTop + 12);
        doc.fillColor(primaryColor).fontSize(8).font("Helvetica").text(`Rs. ${ratePerTola.toLocaleString()}`, 390, rowTop + 12);
        doc.fillColor(primaryColor).fontSize(9).font("Helvetica-Bold").text(`Rs. ${goldAmount.toLocaleString()}`, 465, rowTop + 12, { align: "right", width: 85 });

        // 4. Summary & Making Charges
        const summaryTop = rowTop + 50;

        doc.roundedRect(300, summaryTop, doc.page.width - 345, 100, 6).fillAndStroke(lightBg, "#E5E7EB");
        
        doc.fillColor(mutedColor).fontSize(9).font("Helvetica").text("Net Gold Value:", 315, summaryTop + 12);
        doc.fillColor(primaryColor).fontSize(9).font("Helvetica-Bold").text(`PKR ${goldAmount.toLocaleString()}`, 430, summaryTop + 12, { align: "right", width: 120 });

        doc.fillColor(mutedColor).fontSize(9).font("Helvetica").text("Making & Crafting:", 315, summaryTop + 32);
        doc.fillColor(primaryColor).fontSize(9).font("Helvetica-Bold").text(`PKR ${makingCharges.toLocaleString()}`, 430, summaryTop + 32, { align: "right", width: 120 });

        doc.moveTo(315, summaryTop + 54).lineTo(doc.page.width - 55, summaryTop + 54).strokeColor("#D1D5DB").lineWidth(1).stroke();

        doc.fillColor(goldColor).fontSize(11).font("Helvetica-Bold").text("Total Estimated:", 315, summaryTop + 65);
        doc.fillColor(goldColor).fontSize(12).font("Helvetica-Bold").text(`PKR ${totalAmount.toLocaleString()}`, 430, summaryTop + 64, { align: "right", width: 120 });

        // Left note under summary
        doc.fillColor(mutedColor).fontSize(8).font("Helvetica")
           .text("• Gold weight is calculated based on exact digital scale measurement (1 Tola = 11.6638 Grams).", 45, summaryTop + 12)
           .text("• Making charges include handcrafted carving, stone setting, and polish finishing.", 45, summaryTop + 25)
           .text("• Due to market volatility, this quotation is valid for 24 hours only.", 45, summaryTop + 38)
           .text("• Custom designs can be crafted according to your preferred weight and budget.", 45, summaryTop + 51);

        // 5. Terms & Guarantee Footer
        const footerTop = 410;
        doc.roundedRect(45, footerTop, doc.page.width - 90, 80, 6).fillAndStroke("#FEF3C7", "#FDE68A");
        doc.fillColor(goldColor).fontSize(9).font("Helvetica-Bold").text("GUARANTEE & RETURN POLICY:", 58, footerTop + 12);
        doc.fillColor("#92400E").fontSize(8).font("Helvetica")
           .text("1. Lifetime 100% Hallmark Gold Purity Guarantee on all Bhai Jewellers articles.", 58, footerTop + 27)
           .text("2. Guaranteed buyback and exchange available anytime at prevailing market gold rate.", 58, footerTop + 39)
           .text("3. Delivery available across Pakistan via insured TCS Secure Express Courier.", 58, footerTop + 51)
           .text("4. Payment methods accepted: Cash on Delivery, Meezan Bank Transfer, JazzCash & Raast.", 58, footerTop + 63);

        // Signatures
        const signTop = 530;
        doc.moveTo(45, signTop + 35).lineTo(180, signTop + 35).strokeColor("#9CA3AF").lineWidth(1).stroke();
        doc.fillColor(mutedColor).fontSize(8).font("Helvetica").text("Customer Acceptance", 45, signTop + 42);

        doc.moveTo(doc.page.width - 180, signTop + 35).lineTo(doc.page.width - 45, signTop + 35).strokeColor("#9CA3AF").lineWidth(1).stroke();
        doc.fillColor(mutedColor).fontSize(8).font("Helvetica").text("Authorized Signature & Seal", doc.page.width - 180, signTop + 42);

        // Bottom Banner
        doc.rect(0, doc.page.height - 15, doc.page.width, 15).fill(primaryColor);
        doc.fillColor("#FFFFFF").fontSize(7).font("Helvetica").text("Bhai Jewellers • Established with Trust • Liberty Market Lahore", 0, doc.page.height - 11, { align: "center" });

        doc.end();

        writeStream.on("finish", () => {
            logger.success("QuotationService", `Generated PDF quotation: ${fileName} (PKR ${totalAmount.toLocaleString()})`);
            resolve();
        });

        writeStream.on("error", (err) => {
            logger.error("QuotationService", "Failed to write PDF file:", err);
            reject(err);
        });
    });

    return {
        quoteNumber,
        date: dateStr,
        customerName: input.customerName || "Valued Client",
        itemName: input.itemName || "22K Gold Jewellery Item",
        weightTola,
        weightGram,
        purity: purity.toUpperCase(),
        ratePerTola,
        goldAmount,
        makingCharges,
        totalAmount,
        pdfPath,
        publicUrl,
        fileName
    };
}

/**
 * Generate quotation and dispatch directly to the customer on WhatsApp
 */
export async function sendQuotationViaWhatsApp(
    sessionId: string,
    jid: string,
    input: QuotationInput
): Promise<QuotationResult> {
    const result = await generateQuotationPdf(input);

    const caption = `Salam! 💍
Bhai Jewellers ki janib se aapka official jewellery quotation PDF tayyar kar dia gaya hai:

📌 *Quotation Details:*
• Item: *${result.itemName}* (${result.purity} Gold)
• Weight: *${result.weightTola} Tola* (${result.weightGram} Grams)
• Rate: *PKR ${result.ratePerTola.toLocaleString()} / tola*
• Gold Value: *PKR ${result.goldAmount.toLocaleString()}*
• Making Charges: *PKR ${result.makingCharges.toLocaleString()}*
━━━━━━━━━━━━━━━━━━━━
💰 *Total Estimated:* *PKR ${result.totalAmount.toLocaleString()}*

_Yeh quotation official Sarafa rate par mabni hai aur 24 hours ke liye valid hai. Document neeche attach hai._`;

    try {
        await ChatService.sendTextMessage(sessionId, jid, {
            document: { url: result.publicUrl },
            fileName: result.fileName,
            caption
        });
        logger.success("QuotationService", `Successfully dispatched quotation PDF ${result.fileName} to ${jid}`);
    } catch (e: any) {
        logger.error("QuotationService", `Failed to send quotation document to ${jid}:`, e.message);
        // Fallback to text message
        await ChatService.sendTextMessage(sessionId, jid, caption);
    }

    return result;
}
