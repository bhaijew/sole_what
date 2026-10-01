import { NextResponse, NextRequest } from "next/server";
import { getAuthenticatedUser, canAccessSession } from "@/lib/api-auth";
import { ChatService } from "@/modules/whatsapp/chat.service";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ status: false, message: "Unauthorized", error: "Unauthorized" }, { status: 401 });
        }

        const { sessionId } = await params;
        const body = await request.json();
        
        // Accept 'to' or 'jid'
        let jid = body.to || body.jid;
        // Accept 'text' or 'message'
        const messageText = body.text || body.message;

        if (!jid) {
            return NextResponse.json({ status: false, message: "'to' or 'jid' parameter is required", error: "'to' or 'jid' is required" }, { status: 400 });
        }

        if (!messageText) {
            return NextResponse.json({ status: false, message: "'text' or 'message' parameter is required", error: "'text' or 'message' is required" }, { status: 400 });
        }

        // Format JID if raw number provided
        let formattedJid = String(jid).trim();
        if (!formattedJid.includes("@")) {
            formattedJid = `${formattedJid.replace(/[^0-9]/g, "")}@s.whatsapp.net`;
        }

        // Check if user can access this session
        const canAccess = await canAccessSession(user.id, user.role, sessionId);
        if (!canAccess) {
            return NextResponse.json({ status: false, message: "Forbidden - Cannot access this session", error: "Forbidden - Cannot access this session" }, { status: 403 });
        }

        // Send Message using ChatService
        const result = await ChatService.sendTextMessage(sessionId, formattedJid, messageText, body.mentions, body.quotedMessageId);

        return NextResponse.json({ status: true, message: "Message sent successfully", data: result });
    } catch (error: any) {
        console.error("Send message API error:", error);
        const errorMsg = error?.message || "Failed to send message";
        return NextResponse.json({ status: false, message: errorMsg, error: errorMsg }, { status: 500 });
    }
}
