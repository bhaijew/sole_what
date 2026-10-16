import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      role: string;
      id: string;
      isStoreOnly?: boolean;
    } & DefaultSession["user"]
  }

  interface User {
      role: string;
      id: string;
      isStoreOnly?: boolean;
      apiKey?: string | null;
  }
}

declare module "next-auth/jwt" {
    interface JWT {
        role: string;
        id: string;
        isStoreOnly?: boolean;
    }
}

