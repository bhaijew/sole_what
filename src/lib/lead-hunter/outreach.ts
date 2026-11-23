import { prisma } from "@/lib/prisma";
import { ChatService } from "@/modules/whatsapp/chat.service";
import { logger } from "@/lib/logger";

export interface SendPitchOptions {
  leadId: string;
  sessionId?: string | null;
  customPitch?: string | null;
}

/**
 * Formats template by interpolating variables
 */
export function formatPitchTemplate(
  template: string,
  vars: { business_name?: string; city?: string; category?: string; phone?: string }
): string {
  let result = template;
  result = result.replace(/\{business_name\}/gi, vars.business_name || "Business Owner");
  result = result.replace(/\{city\}/gi, vars.city || "your city");
  result = result.replace(/\{category\}/gi, vars.category || "business");
  result = result.replace(/\{phone\}/gi, vars.phone || "");
  return result;
}

/**
 * Sends pitch to a specific lead via active WhatsApp session
 */
export async function sendPitchToLead(options: SendPitchOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const lead = await prisma.clientLead.findUnique({
      where: { id: options.leadId },
      include: { user: { include: { clientHuntingConfig: true } } },
    });

    if (!lead) return { success: false, error: "Lead not found" };

    const config = lead.user.clientHuntingConfig;
    const sessionId = options.sessionId || config?.sessionId;

    if (!sessionId) {
      return { success: false, error: "No active WhatsApp session selected for outreach" };
    }

    const template = options.customPitch || config?.pitchTemplate || "Assalam-o-Alaikum {business_name}! I saw your business on Google Maps in {city} but noticed you don't have a website yet. Would you be interested in having a modern website to double your orders?";
    const messageText = formatPitchTemplate(template, {
      business_name: lead.businessName,
      city: lead.city || "",
      category: lead.category || "",
      phone: lead.phone,
    });

    const targetJid = lead.cleanPhone.includes("@") ? lead.cleanPhone : `${lead.cleanPhone}@s.whatsapp.net`;

    logger.info("Outreach", `Sending WhatsApp pitch to ${lead.businessName} (${targetJid}) via session ${sessionId}...`);

    // Send WhatsApp Message via ChatService (resolves session, validates socket, saves to DB, emits live events)
    await ChatService.sendTextMessage(sessionId, targetJid, messageText);

    // Update Lead Status in Database
    await prisma.clientLead.update({
      where: { id: lead.id },
      data: {
        status: "PITCH_SENT",
        pitchSentAt: new Date(),
        pitchContent: messageText,
      },
    });

    logger.success("Outreach", `WhatsApp pitch successfully delivered to ${lead.businessName}!`);
    return { success: true };
  } catch (err: any) {
    logger.error("Outreach", `Failed to send pitch to lead ${options.leadId}:`, err);
    await prisma.clientLead.update({
      where: { id: options.leadId },
      data: { status: "FAILED", notes: err.message },
    }).catch(() => {});
    return { success: false, error: err.message || "Failed to send WhatsApp message" };
  }
}

/**
 * Dispatches a batch of pitches with safety delays (e.g. 15-25 seconds) to avoid spam triggers
 */
export async function dispatchBatchPitches(
  leadIds: string[],
  sessionId?: string | null
): Promise<{ total: number; sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const id of leadIds) {
    const res = await sendPitchToLead({ leadId: id, sessionId });
    if (res.success) {
      sent++;
    } else {
      failed++;
    }

    // Safety pause between messages (12 seconds)
    if (leadIds.length > 1) {
      await new Promise((resolve) => setTimeout(resolve, 12000));
    }
  }

  return { total: leadIds.length, sent, failed };
}
