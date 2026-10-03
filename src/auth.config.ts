import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: '/auth/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            
            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn && nextUrl.pathname === '/auth/login') {
                const targetUrl = nextUrl.clone();
                if (targetUrl.hostname.includes("0.0.0.0") || (targetUrl.hostname.includes("localhost") && process.env.NODE_ENV === "production")) {
                    targetUrl.hostname = process.env.RAILWAY_PUBLIC_DOMAIN || "solewhat-production.up.railway.app";
                    targetUrl.port = "";
                    targetUrl.protocol = "https:";
                }
                targetUrl.pathname = '/dashboard';
                return Response.redirect(targetUrl);
            }
            return true;
        },
        async redirect({ url, baseUrl }) {
            const publicDomain = process.env.RAILWAY_PUBLIC_DOMAIN || "solewhat-production.up.railway.app";
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
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                (session.user as any).role = token.role;
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
