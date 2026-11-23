import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

// GET: Fetch client hunting settings
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ status: false, error: "Unauthorized" }, { status: 401 });
    }

    let config = await prisma.clientHuntingConfig.findUnique({
      where: { userId: user.id },
    });

    if (!config) {
      // Create initial defaults
      config = await prisma.clientHuntingConfig.create({
        data: {
          userId: user.id,
          isEnabled: true,
          scheduleTime: "09:00",
          targetNiche: "Restaurants, Salons, Clinics, Gyms",
          targetCity: "Lahore",
          dailyLeadLimit: 15,
          pitchTemplate: "Assalam-o-Alaikum {business_name}! I noticed your business on Google in {city} but saw that you don't have an official website yet. A website can easily help you get 2x-3x more customers. Would you be open to a quick 2-minute demo preview?",
          autoSendPitch: false,
        },
      });
    }

    return NextResponse.json({ status: true, data: config });
  } catch (error: any) {
    console.error("Get hunting config error:", error);
    return NextResponse.json({ status: false, error: error.message || "Failed to fetch settings" }, { status: 500 });
  }
}

// POST: Update hunting settings
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ status: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      sessionId,
      isEnabled = true,
      scheduleTime = "09:00",
      targetNiche = "Salons",
      targetCity = "Lahore",
      dailyLeadLimit = 15,
      pitchTemplate,
      autoSendPitch = false,
      googleApiKey,
    } = body;

    const config = await prisma.clientHuntingConfig.upsert({
      where: { userId: user.id },
      update: {
        sessionId: sessionId || null,
        isEnabled: Boolean(isEnabled),
        scheduleTime: String(scheduleTime).trim() || "09:00",
        targetNiche: String(targetNiche).trim(),
        targetCity: String(targetCity).trim(),
        dailyLeadLimit: Number(dailyLeadLimit) || 15,
        pitchTemplate: pitchTemplate !== undefined ? pitchTemplate : undefined,
        autoSendPitch: Boolean(autoSendPitch),
        googleApiKey: googleApiKey !== undefined ? (googleApiKey ? googleApiKey.trim() : null) : undefined,
      },
      create: {
        userId: user.id,
        sessionId: sessionId || null,
        isEnabled: Boolean(isEnabled),
        scheduleTime: String(scheduleTime).trim() || "09:00",
        targetNiche: String(targetNiche).trim(),
        targetCity: String(targetCity).trim(),
        dailyLeadLimit: Number(dailyLeadLimit) || 15,
        pitchTemplate: pitchTemplate || "Assalam-o-Alaikum {business_name}! I noticed your business on Google in {city} but saw that you don't have an official website yet. A website can easily help you get 2x-3x more customers. Would you be open to a quick 2-minute demo preview?",
        autoSendPitch: Boolean(autoSendPitch),
        googleApiKey: googleApiKey ? googleApiKey.trim() : null,
      },
    });

    return NextResponse.json({ status: true, message: "Settings saved successfully", data: config });
  } catch (error: any) {
    console.error("Save hunting config error:", error);
    return NextResponse.json({ status: false, error: error.message || "Failed to save settings" }, { status: 500 });
  }
}
