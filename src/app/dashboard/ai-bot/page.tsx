import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AiBotClient from "./ai-bot-client";

export const metadata = {
    title: "AI Auto-Responder & Knowledge Base | sole-what",
    description: "Train AI on your business knowledge base and automatically respond to customer inquiries 24/7 on WhatsApp.",
};

export default async function AiBotPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/auth/login");
    }

    const role = (session.user as any).role;
    if (role !== "SUPERADMIN" && role !== "OWNER") {
        redirect("/dashboard");
    }

    return <AiBotClient />;
}
