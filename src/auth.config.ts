import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: '/auth/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname.startsWith('/store-dashboard');
            
            if (isOnDashboard) {
                if (!isLoggedIn) return false; // Redirect unauthenticated users to login page

                // Check store-only account restrictions: Only see whatsapp connect session and store
                const isStoreOnly = (auth?.user as any)?.isStoreOnly;
                if (isStoreOnly) {
                    const pathname = nextUrl.pathname;
                    const isAllowed =
                        pathname.startsWith('/store-dashboard') ||
                        pathname.startsWith('/dashboard/sessions') ||
                        pathname === '/dashboard';
                    if (!isAllowed) {
                        const targetUrl = nextUrl.clone();
                        targetUrl.pathname = '/store-dashboard';
                        return Response.redirect(targetUrl);
                    }
                }

                return true;
            } else if (isLoggedIn && nextUrl.pathname === '/auth/login') {
                const targetUrl = nextUrl.clone();
                const configuredUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL;
                let configuredHost = "";
                if (configuredUrl) {
                    try { configuredHost = new URL(configuredUrl).hostname; } catch {}
                }
                if (targetUrl.hostname.includes("0.0.0.0") || (targetUrl.hostname.includes("localhost") && process.env.NODE_ENV === "production")) {
                    targetUrl.hostname = process.env.RAILWAY_PUBLIC_DOMAIN || configuredHost || "solewhat-production-33f6.up.railway.app";
                    targetUrl.port = "";
                    targetUrl.protocol = "https:";
                }
                const isStoreOnly = (auth?.user as any)?.isStoreOnly;
                targetUrl.pathname = isStoreOnly ? '/store-dashboard' : '/dashboard';
                return Response.redirect(targetUrl);
            }
            return true;
        },
        async redirect({ url, baseUrl }) {
            const configuredUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL;
            let configuredHost = "";
            if (configuredUrl) {
                try { configuredHost = new URL(configuredUrl).host; } catch {}
            }
            const publicDomain = process.env.RAILWAY_PUBLIC_DOMAIN || configuredHost || "solewhat-production-33f6.up.railway.app";
            const productionBase = process.env.NEXTAUTH_URL || `https://${publicDomain}`;
            const safeBaseUrl = (baseUrl.includes("0.0.0.0") || (baseUrl.includes("localhost") && process.env.NODE_ENV === "production"))
                ? productionBase
                : baseUrl;

            // Relative callback URL
            if (url.startsWith("/")) {
                if (url.startsWith("//")) return safeBaseUrl;
                return `${safeBaseUrl}${url}`;
            }

            // URL contains 0.0.0.0
            if (url.includes("0.0.0.0")) {
                try {
                    const parsed = new URL(url);
                    return `${safeBaseUrl}${parsed.pathname}${parsed.search}`;
                } catch {
                    return safeBaseUrl;
                }
            }

            try {
                const parsedUrl = new URL(url);
                if (parsedUrl.origin === safeBaseUrl || parsedUrl.origin === baseUrl) {
                    return url;
                }
            } catch {
                return safeBaseUrl;
            }

            return safeBaseUrl;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.isStoreOnly = (user as any).isStoreOnly ?? Boolean((user as any).apiKey?.startsWith("store_") || (user as any).role === "STORE_OWNER");
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                (session.user as any).role = token.role;
                (session.user as any).isStoreOnly = token.isStoreOnly ?? false;
            }
            return session;
        }
    },
    providers: [], // Configured in auth.ts
    session: {
        strategy: 'jwt'
    },
    trustHost: true,
} satisfies NextAuthConfig;
