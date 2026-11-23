import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ClientHuntingView from "./client-hunting-view";

export const metadata = {
  title: "Google Maps Client Hunting & Automated Outreach | sole-what",
  description: "Automated 9:00 AM client hunting from Google Maps for businesses without a website, with automated WhatsApp pitch outreach.",
};

export default async function ClientHuntingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  return <ClientHuntingView />;
}
