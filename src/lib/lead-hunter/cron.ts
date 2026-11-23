import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { huntBusinessesWithoutWebsite } from "./scraper";
import { dispatchBatchPitches } from "./outreach";

// Map to track last executed date per user to prevent duplicate runs on the same day
const lastExecutedMap = new Map<string, string>();

/**
 * Executes a full client hunting run for a specific user
 */
export async function runHuntingForUser(userId: string): Promise<{
  success: boolean;
  foundCount: number;
  newLeadsSaved: number;
  pitchesSent: number;
  error?: string;
}> {
  try {
    const config = await prisma.clientHuntingConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      return { success: false, foundCount: 0, newLeadsSaved: 0, pitchesSent: 0, error: "Hunting config not found" };
    }

    const niches = config.targetNiche.split(",").map((s) => s.trim()).filter(Boolean);
    const primaryNiche = niches[0] || "Salons";
    const city = config.targetCity || "Lahore";
    const limit = config.dailyLeadLimit || 15;

    logger.info("LeadHunter", `Starting scheduled hunting for User: ${userId} (${primaryNiche} in ${city}, limit: ${limit})...`);

    // 1. Fetch leads without website
    const scrapedLeads = await huntBusinessesWithoutWebsite(
      primaryNiche,
      city,
      limit,
      config.googleApiKey
    );

    // 2. Filter out already existing phone numbers for this user
    const existingPhones = new Set(
      (
        await prisma.clientLead.findMany({
          where: { userId },
          select: { cleanPhone: true },
        })
      ).map((l) => l.cleanPhone)
    );

    const freshLeads = scrapedLeads.filter((l) => !existingPhones.has(l.cleanPhone));

    // 3. Save new leads to database
    const savedIds: string[] = [];
    for (const lead of freshLeads) {
      const created = await prisma.clientLead.create({
        data: {
          userId,
          businessName: lead.businessName,
          phone: lead.phone,
          cleanPhone: lead.cleanPhone,
          address: lead.address,
          city: lead.city,
          category: lead.category,
          rating: lead.rating,
          reviewCount: lead.reviewCount,
          website: lead.website,
          googleMapsUrl: lead.googleMapsUrl,
          status: "FOUND",
        },
      });
      savedIds.push(created.id);
    }

    logger.success("LeadHunter", `Saved ${savedIds.length} fresh leads for User ${userId}!`);

    // 4. Auto-outreach via WhatsApp if enabled
    let pitchesSent = 0;
    if (config.autoSendPitch && config.sessionId && savedIds.length > 0) {
      logger.info("LeadHunter", `Auto-Outreach is ON. Sending WhatsApp pitches to ${savedIds.length} leads...`);
      const outreachRes = await dispatchBatchPitches(savedIds, config.sessionId);
      pitchesSent = outreachRes.sent;
    }

    return {
      success: true,
      foundCount: scrapedLeads.length,
      newLeadsSaved: savedIds.length,
      pitchesSent,
    };
  } catch (err: any) {
    logger.error("LeadHunter", "Error running client hunt:", err);
    return { success: false, foundCount: 0, newLeadsSaved: 0, pitchesSent: 0, error: err.message };
  }
}

/**
 * Checks all active hunting configs and triggers at their scheduled time (default 09:00 AM)
 */
async function checkAndRunScheduledHunting() {
  try {
    const now = new Date();
    // Format current time as HH:MM in 24hr format
    const currentHours = String(now.getHours()).padStart(2, "0");
    const currentMinutes = String(now.getMinutes()).padStart(2, "0");
    const currentTimeStr = `${currentHours}:${currentMinutes}`;
    const todayDateStr = now.toISOString().slice(0, 10);

    const activeConfigs = await prisma.clientHuntingConfig.findMany({
      where: { isEnabled: true },
    });

    for (const config of activeConfigs) {
      const targetTime = (config.scheduleTime || "09:00").trim();
      const userExecutionKey = `${config.userId}_${todayDateStr}`;

      // If time matches and not yet run today
      if (currentTimeStr === targetTime && !lastExecutedMap.has(userExecutionKey)) {
        logger.info("LeadHunter", `⏰ Scheduled time reached (${currentTimeStr}) for user ${config.userId}! Triggering hunt...`);
        lastExecutedMap.set(userExecutionKey, todayDateStr);
        await runHuntingForUser(config.userId);
      }
    }

    // Clean up memory map for previous dates
    if (lastExecutedMap.size > 100) {
      lastExecutedMap.clear();
    }
  } catch (err: any) {
    logger.error("LeadHunter", "Scheduler loop error:", err);
  }
}

/**
 * Initializes the background scheduler (runs every 60 seconds)
 */
export function startLeadHunterScheduler() {
  logger.info("LeadHunter", "Starting 9:00 AM Client Hunter Background Scheduler...");
  // Check every 60 seconds
  setInterval(checkAndRunScheduledHunting, 60 * 1000);
}
