import fs from "fs";
import path from "path";
import { logger } from "./logger";

export interface HandoverRecord {
    sessionId: string;
    jid: string;
    activeUntil: number; // Unix timestamp in ms
    startedAt: number;   // Unix timestamp in ms
    reason: string;
    customerName?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const HANDOVER_FILE = path.join(DATA_DIR, "handover-state.json");

// In-memory cache for 0ms lookup during high-throughput message streaming
const handoverCache = new Map<string, HandoverRecord>();

// Helper key generator
function getCacheKey(sessionId: string, jid: string): string {
    const cleanJid = jid.split("@")[0].split(":")[0];
    return `${sessionId}:${cleanJid}`;
}

// Load state from disk on startup
function initHandoverState() {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        if (fs.existsSync(HANDOVER_FILE)) {
            const raw = fs.readFileSync(HANDOVER_FILE, "utf-8");
            const records: HandoverRecord[] = JSON.parse(raw);
            const now = Date.now();
            records.forEach(r => {
                if (r.activeUntil > now) {
                    handoverCache.set(getCacheKey(r.sessionId, r.jid), r);
                }
            });
            logger.info("HandoverService", `Loaded ${handoverCache.size} active handovers from disk.`);
        }
    } catch (e: any) {
        logger.error("HandoverService", "Failed to load handover state:", e.message);
    }
}

initHandoverState();

function persistHandoverState() {
    try {
        const activeRecords = Array.from(handoverCache.values()).filter(r => r.activeUntil > Date.now());
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(HANDOVER_FILE, JSON.stringify(activeRecords, null, 2), "utf-8");
    } catch (e: any) {
        logger.error("HandoverService", "Failed to persist handover state:", e.message);
    }
}

/**
 * Check if a chat currently has Human Takeover active (meaning AI Bot should stay paused)
 */
export function isHandoverActive(sessionId: string, jid: string): boolean {
    const key = getCacheKey(sessionId, jid);
    const record = handoverCache.get(key);
    if (!record) return false;

    if (Date.now() > record.activeUntil) {
        handoverCache.delete(key);
        persistHandoverState();
        logger.info("HandoverService", `Handover expired for ${jid}. AI bot automatically resumed.`);
        return false;
    }

    return true;
}

/**
 * Enable Human Handover (Pause the AI Bot for this customer)
 */
export function enableHandover(
    sessionId: string,
    jid: string,
    minutes: number = 60,
    reason: string = "Customer requested live staff",
    customerName?: string
): HandoverRecord {
    const key = getCacheKey(sessionId, jid);
    const now = Date.now();
    const activeUntil = now + (minutes * 60 * 1000);

    const record: HandoverRecord = {
        sessionId,
        jid,
        activeUntil,
        startedAt: now,
        reason,
        customerName
    };

    handoverCache.set(key, record);
    persistHandoverState();

    logger.warn("HandoverService", `[PAUSED] AI Bot paused for ${jid} for ${minutes} mins. Reason: "${reason}"`);
    return record;
}

/**
 * Disable Human Handover (Resume AI Bot immediately)
 */
export function disableHandover(sessionId: string, jid: string): boolean {
    const key = getCacheKey(sessionId, jid);
    const existed = handoverCache.delete(key);
    if (existed) {
        persistHandoverState();
        logger.success("HandoverService", `[RESUMED] AI Bot resumed for ${jid}`);
    }
    return existed;
}

/**
 * Get active handover details for a chat
 */
export function getHandoverState(sessionId: string, jid: string): HandoverRecord | null {
    if (!isHandoverActive(sessionId, jid)) return null;
    return handoverCache.get(getCacheKey(sessionId, jid)) || null;
}

/**
 * List all currently paused chats for a session
 */
export function listActiveHandovers(sessionId: string): HandoverRecord[] {
    const now = Date.now();
    return Array.from(handoverCache.values()).filter(r => r.sessionId === sessionId && r.activeUntil > now);
}

/**
 * Detect if incoming message text is asking for human staff / expressing frustration with bot
 */
export function checkIfHandoverRequested(text: string): { requested: boolean; reason: string } {
    if (!text || text.trim().length === 0) return { requested: false, reason: "" };

    const clean = text.toLowerCase().trim();

    // 1. Direct agent / staff keywords
    const agentRegex = /\b(human|agent|staff|manager|banda|banday|insan|admin|representative|boss|dukan\s*dar|owner)\b/i;
    // 2. Clear intent phrases
    const intentRegex = /(?:talk\s*to\s*(?:human|agent|staff|person|manager)|speak\s*to\s*(?:human|agent|staff)|call\s*staff|human\s*se\s*baat|staff\s*se\s*baat|insan\s*se\s*baat|banday\s*se\s*baat|real\s*person|live\s*agent|call\s*karo|phone\s*karo)/i;
    // 3. Frustration / bot stop phrases
    const stopBotRegex = /(?:bot\s*band\s*karo|chup\s*kar\s*bot|bakwas\s*bot|pagal\s*bot|stop\s*bot|stop\s*ai)/i;

    if (intentRegex.test(clean)) {
        return { requested: true, reason: "Customer explicitly requested to talk with staff" };
    }

    if (stopBotRegex.test(clean)) {
        return { requested: true, reason: "Customer asked to pause the automated bot" };
    }

    if (agentRegex.test(clean) && clean.length <= 40) {
        return { requested: true, reason: "Customer mentioned agent/staff keyword" };
    }

    return { requested: false, reason: "" };
}
