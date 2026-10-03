import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessibleSessions } from "@/lib/api-auth";
import { redirect } from "next/navigation";
import { ConnectWebsiteClient } from "./connect-website-client";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Connect Website - SoleWhat",
    description: "Automate WhatsApp order notifications for your online store or website.",
};

export default async function ConnectWebsitePage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const [sessions, user] = await Promise.all([
        getAccessibleSessions(session.user.id, session.user.role || "OWNER"),
        prisma.user.findUnique({
            where: { id: session.user.id },
            select: { apiKey: true },
        }),
    ]);

    const formattedSessions = sessions.map((s) => ({
        id: s.id,
        sessionId: s.sessionId,
        name: s.name,
        status: s.status,
    }));

    return (
        <ConnectWebsiteClient
            sessions={formattedSessions}
            userApiKey={user?.apiKey || null}
        />
    );
}
