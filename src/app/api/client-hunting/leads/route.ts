import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

// GET: Fetch captured leads
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ status: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = { userId: user.id };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { businessName: { contains: q } },
        { phone: { contains: q } },
        { cleanPhone: { contains: q } },
        { city: { contains: q } },
        { category: { contains: q } },
      ];
    }

    const leads = await prisma.clientLead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const stats = {
      total: await prisma.clientLead.count({ where: { userId: user.id } }),
      found: await prisma.clientLead.count({ where: { userId: user.id, status: "FOUND" } }),
      pitchSent: await prisma.clientLead.count({ where: { userId: user.id, status: "PITCH_SENT" } }),
      replied: await prisma.clientLead.count({ where: { userId: user.id, status: "REPLIED" } }),
      converted: await prisma.clientLead.count({ where: { userId: user.id, status: "CONVERTED" } }),
    };

    return NextResponse.json({ status: true, data: leads, stats });
  } catch (error: any) {
    console.error("Get leads error:", error);
    return NextResponse.json({ status: false, error: error.message || "Failed to fetch leads" }, { status: 500 });
  }
}

// DELETE: Delete a lead
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ status: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ status: false, error: "Lead ID required" }, { status: 400 });
    }

    await prisma.clientLead.deleteMany({
      where: { id, userId: user.id },
    });

    return NextResponse.json({ status: true, message: "Lead deleted successfully" });
  } catch (error: any) {
    console.error("Delete lead error:", error);
    return NextResponse.json({ status: false, error: error.message || "Failed to delete lead" }, { status: 500 });
  }
}
