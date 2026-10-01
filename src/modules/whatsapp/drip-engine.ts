import { prisma } from "@/lib/prisma";
import { waManager } from "@/modules/whatsapp/manager";
import { logger } from "@/lib/logger";
import { fireSentWebhook } from "@/lib/webhook";

export async function processDueDripSubscribers() {
    try {
        const now = new Date();
        const dueSubscribers = await prisma.dripSubscriber.findMany({
            where: {
                status: "ACTIVE",
                nextRunAt: { lte: now }
            },
            include: {
                campaign: {
                    include: {
                        session: true,
                        steps: {
                            orderBy: { stepOrder: "asc" }
                        }
                    }
                }
            },
            take: 20
        });

        if (dueSubscribers.length === 0) return;

        for (const sub of dueSubscribers) {
            const campaign = sub.campaign;
            if (!campaign || !campaign.enabled) continue;

            const sessionId = campaign.session.sessionId;
            const instance = waManager.getInstance(sessionId);

            if (!instance?.socket) {
                logger.warn("DripEngine", `Session ${sessionId} not active for subscriber ${sub.jid}`);
                continue;
            }

            // Find current step
            const currentStep = campaign.steps.find(s => s.stepOrder === sub.currentStepOrder);

            if (!currentStep) {
                // No current step found, mark completed
                await prisma.dripSubscriber.update({
                    where: { id: sub.id },
                    data: { status: "COMPLETED" }
                });
                continue;
            }

            try {
                // Send step payload according to messageType
                let sendResult: any = null;
                const messageType = currentStep.messageType || "TEXT";
                const jid = sub.jid;

                if (messageType === "POLL" && currentStep.interactiveData) {
                    const data = JSON.parse(currentStep.interactiveData);
                    sendResult = await instance.socket.sendMessage(jid, {
                        poll: {
                            name: data.question || currentStep.content || "Poll",
                            values: data.options || ["Option 1", "Option 2"],
                            selectableCount: data.selectableCount || 1
                        }
                    });
                } else if (messageType === "LOCATION" && currentStep.interactiveData) {
                    const data = JSON.parse(currentStep.interactiveData);
                    sendResult = await instance.socket.sendMessage(jid, {
                        location: {
                            degreesLatitude: data.latitude || 31.5204,
                            degreesLongitude: data.longitude || 74.3587,
                            name: data.name || undefined,
                            address: data.address || undefined
                        }
                    });
                } else if (messageType === "CONTACT" && currentStep.interactiveData) {
                    const data = JSON.parse(currentStep.interactiveData);
                    sendResult = await instance.socket.sendMessage(jid, {
                        contacts: {
                            displayName: data.displayName || "Contact",
                            contacts: [{ displayName: data.displayName || "Contact", vcard: data.vcard }]
                        }
                    });
                } else if (messageType === "MEDIA" && currentStep.mediaUrl) {
                    sendResult = await instance.socket.sendMessage(jid, {
                        image: { url: currentStep.mediaUrl },
                        caption: currentStep.content || undefined
                    });
                } else {
                    sendResult = await instance.socket.sendMessage(jid, {
                        text: currentStep.content || "Follow-up message"
                    });
                }

                fireSentWebhook(sessionId, jid, { type: 'drip', text: currentStep.content || 'Drip Step' }, sendResult).catch(() => {});

                // Find next step
                const nextStep = campaign.steps.find(s => s.stepOrder === sub.currentStepOrder + 1);

                if (nextStep) {
                    const delayMs = (nextStep.delayDays * 86400000) + (nextStep.delayHours * 3600000);
                    const nextRunAt = new Date(Date.now() + Math.max(delayMs, 60000)); // Min 1 min

                    await prisma.dripSubscriber.update({
                        where: { id: sub.id },
                        data: {
                            currentStepOrder: nextStep.stepOrder,
                            lastSentAt: new Date(),
                            nextRunAt
                        }
                    });
                } else {
                    // Sequence finished!
                    await prisma.dripSubscriber.update({
                        where: { id: sub.id },
                        data: {
                            status: "COMPLETED",
                            lastSentAt: new Date()
                        }
                    });
                }

                logger.info("DripEngine", `Sent step ${sub.currentStepOrder} for campaign ${campaign.name} to ${jid}`);

            } catch (err: any) {
                logger.error("DripEngine", `Failed to send drip step to ${sub.jid}: ${err.message}`);
            }
        }
    } catch (error: any) {
        logger.error("DripEngine", `Error processing due drip subscribers: ${error.message}`);
    }
}

// Auto-Stop Drip when customer replies to WhatsApp
export async function cancelDripOnCustomerReply(sessionId: string, senderJid: string) {
    try {
        const normalizedJid = senderJid.endsWith("@c.us") ? senderJid.replace("@c.us", "@s.whatsapp.net") : senderJid;

        const activeSubscribers = await prisma.dripSubscriber.findMany({
            where: {
                jid: normalizedJid,
                status: "ACTIVE",
                campaign: {
                    session: { sessionId },
                    autoStopOnReply: true
                }
            }
        });

        if (activeSubscribers.length > 0) {
            await prisma.dripSubscriber.updateMany({
                where: {
                    id: { in: activeSubscribers.map(s => s.id) }
                },
                data: {
                    status: "STOPPED_REPLIED"
                }
            });
            logger.info("DripEngine", `Stopped ${activeSubscribers.length} active drip sequences for ${normalizedJid} due to customer reply.`);
        }
    } catch (error: any) {
        logger.error("DripEngine", `Error in cancelDripOnCustomerReply: ${error.message}`);
    }
}
