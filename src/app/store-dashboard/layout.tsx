import { auth } from "@/lib/auth";
import { SessionProvider } from "@/components/dashboard/session-provider";
import { Toaster } from "sonner";
import { prisma } from "@/lib/prisma";
import StoreSidebar from "./store-sidebar";

export const metadata = {
    title: "Store Management Dashboard - SoleWhat Dukaan",
    description: "All-in-one Store Management Command Center for WhatsApp E-Commerce, POS billing, shipping labels, and abandoned cart recovery."
};

export default async function StoreDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    // @ts-ignore
    const systemConfig = await prisma.systemConfig.findUnique({ where: { id: "default" } });
    const appName = systemConfig?.appName || process.env.APP_NAME || "SoleWhat";

    return (
        <SessionProvider>
            <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden font-sans">
                {/* Subtle Ambient Background Gradient */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute -top-[20%] -left-[10%] w-[38rem] h-[38rem] bg-emerald-500/[0.04] rounded-full blur-[110px]" />
                    <div className="absolute -bottom-[20%] -right-[10%] w-[30rem] h-[30rem] bg-teal-500/[0.04] rounded-full blur-[90px]" />
                </div>

                {/* Dedicated Store Management Sidebar */}
                <StoreSidebar
                    appName={appName}
                    userName={session?.user?.name}
                    userEmail={session?.user?.email}
                />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative z-10">
                    <main className="flex-1 overflow-y-auto pt-16 pb-24 md:pt-6 md:pb-6 px-3 sm:px-5 lg:px-7 styled-scrollbar">
                        {children}
                    </main>
                </div>

                <Toaster position="top-right" richColors />
            </div>
        </SessionProvider>
    );
}
