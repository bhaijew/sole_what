"use server";

import { prisma } from "@/lib/prisma";
import { canAccessSession } from "@/lib/api-auth";
import { getAuthenticatedUserForAction } from "@/lib/server-action-auth";

// Fetch Drip Campaigns for a session
export async function getDripCampaigns(sessionId: string) {
    const user = await getAuthenticatedUserForAction();
    if (!user) throw new Error("Unauthorized");

    const canAccess = await canAccessSession(user.id, user.role, sessionId);
    if (!canAccess) throw new Error("Forbidden");

    const session = await prisma.session.findUnique({
        where: { sessionId },
        select: { id: true }
    });
    if (!session) throw new Error("Session not found");

    const campaigns = await prisma.dripCampaign.findMany({
        where: { sessionId: session.id },
        include: {
            steps: { orderBy: { stepOrder: "asc" } },
            _count: { select: { subscribers: true } }
        },
        orderBy: { createdAt: "desc" }
    });

    return campaigns;
}

// Create a new Drip Campaign
export async function createDripCampaign(
    sessionId: string,
    data: { name: string; description?: string; autoStopOnReply?: boolean }
) {
    const user = await getAuthenticatedUserForAction();
    if (!user) throw new Error("Unauthorized");

    if (!data.name.trim()) throw new Error("Campaign name is required");

    const canAccess = await canAccessSession(user.id, user.role, sessionId);
    if (!canAccess) throw new Error("Forbidden");

    const session = await prisma.session.findUnique({
        where: { sessionId },
        select: { id: true }
    });
    if (!session) throw new Error("Session not found");

    const campaign = await prisma.dripCampaign.create({
        data: {
            sessionId: session.id,
            name: data.name.trim(),
            description: data.description?.trim() || null,
            autoStopOnReply: data.autoStopOnReply !== undefined ? data.autoStopOnReply : true,
            enabled: true
        }
    });

    return campaign;
}

// Delete Drip Campaign
export async function deleteDripCampaign(sessionId: string, campaignId: string) {
    const user = await getAuthenticatedUserForAction();
    if (!user) throw new Error("Unauthorized");

    const campaign = await prisma.dripCampaign.findUnique({
        where: { id: campaignId },
        include: { session: true }
    });
    if (!campaign) throw new Error("Campaign not found");

    const canAccess = await canAccessSession(user.id, user.role, campaign.session.sessionId);
    if (!canAccess || campaign.session.sessionId !== sessionId) throw new Error("Forbidden");

    await prisma.dripCampaign.delete({ where: { id: campaignId } });
    return { success: true };
}

// Toggle Drip Campaign Status
export async function toggleDripCampaign(sessionId: string, campaignId: string) {
    const user = await getAuthenticatedUserForAction();
    if (!user) throw new Error("Unauthorized");

    const campaign = await prisma.dripCampaign.findUnique({
        where: { id: campaignId },
        include: { session: true }
    });
    if (!campaign) throw new Error("Campaign not found");

    const canAccess = await canAccessSession(user.id, user.role, campaign.session.sessionId);
    if (!canAccess || campaign.session.sessionId !== sessionId) throw new Error("Forbidden");

    const updated = await prisma.dripCampaign.update({
        where: { id: campaignId },
        data: { enabled: !campaign.enabled }
    });

    return updated;
}

// Add Drip Step to Campaign
export async function addDripStep(
    sessionId: string,
    campaignId: string,
    stepData: {
        delayDays: number;
        delayHours: number;
        messageType: string;
        content?: string;
        mediaUrl?: string;
        interactiveData?: string;
    }
) {
    const user = await getAuthenticatedUserForAction();
    if (!user) throw new Error("Unauthorized");

    const campaign = await prisma.dripCampaign.findUnique({
        where: { id: campaignId },
        include: { session: true, steps: true }
    });
    if (!campaign) throw new Error("Campaign not found");

    const canAccess = await canAccessSession(user.id, user.role, campaign.session.sessionId);
    if (!canAccess || campaign.session.sessionId !== sessionId) throw new Error("Forbidden");

    const nextOrder = campaign.steps.length + 1;

    const step = await prisma.dripStep.create({
        data: {
            campaignId,
            stepOrder: nextOrder,
            delayDays: stepData.delayDays || 0,
            delayHours: stepData.delayHours || 0,
            messageType: stepData.messageType || "TEXT",
            content: stepData.content?.trim() || null,
            mediaUrl: stepData.mediaUrl?.trim() || null,
            interactiveData: stepData.interactiveData || null
        }
    });

    return step;
}

// Delete Drip Step
export async function deleteDripStep(sessionId: string, stepId: string) {
    const user = await getAuthenticatedUserForAction();
    if (!user) throw new Error("Unauthorized");

    const step = await prisma.dripStep.findUnique({
        where: { id: stepId },
        include: { campaign: { include: { session: true } } }
    });
    if (!step) throw new Error("Step not found");

    const canAccess = await canAccessSession(user.id, user.role, step.campaign.session.sessionId);
    if (!canAccess || step.campaign.session.sessionId !== sessionId) throw new Error("Forbidden");

    await prisma.dripStep.delete({ where: { id: stepId } });
    return { success: true };
}

// Enroll Contacts / Phone Numbers into Drip Campaign
export async function enrollDripSubscriber(sessionId: string, campaignId: string, phoneInput: string) {
    const user = await getAuthenticatedUserForAction();
    if (!user) throw new Error("Unauthorized");

    const campaign = await prisma.dripCampaign.findUnique({
        where: { id: campaignId },
        include: { session: true, steps: { orderBy: { stepOrder: "asc" } } }
    });
    if (!campaign) throw new Error("Campaign not found");
    if (campaign.steps.length === 0) throw new Error("Campaign has no steps configured");

    const canAccess = await canAccessSession(user.id, user.role, campaign.session.sessionId);
    if (!canAccess || campaign.session.sessionId !== sessionId) throw new Error("Forbidden");

    // Clean & parse phone numbers
    const lines = phoneInput.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
    if (lines.length === 0) throw new Error("Please enter at least one phone number");

    const firstStep = campaign.steps[0];
    const initialDelayMs = (firstStep.delayDays * 86400000) + (firstStep.delayHours * 3600000);
    const nextRunAt = new Date(Date.now() + Math.max(initialDelayMs, 0));

    let addedCount = 0;
    for (let phone of lines) {
        let clean = phone.replace(/[^0-9@a-zA-Z.-]/g, "");
        if (!clean) continue;
        if (!clean.includes("@")) {
            clean = `${clean}@s.whatsapp.net`;
        }

        // Upsert subscription
        await prisma.dripSubscriber.upsert({
            where: {
                id: `${campaignId}_${clean}`
            },
            create: {
                id: `${campaignId}_${clean}`,
                campaignId,
                jid: clean,
                currentStepOrder: 1,
                status: "ACTIVE",
                nextRunAt
            },
            update: {
                currentStepOrder: 1,
                status: "ACTIVE",
                nextRunAt
            }
        });
        addedCount++;
    }

    return { success: true, count: addedCount };
}
