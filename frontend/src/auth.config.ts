/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }: any) {
      if (account?.provider === "google") {
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
          const res = await fetch(`${API_URL}/auth/social/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: user.name,
              email: user.email,
              avatar: user.image,
              providerId: account.providerAccountId,
              provider: "google",
            }),
          });

          const data = await res.json();
          if (res.ok && data.token) {
            user.backendToken = data.token;
            user.role = data.user.role;
            return true;
          }
          return false;
        } catch (error) {
          console.error("Social login sync failed:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.role = (user as any).role || "USER";
        token.backendToken = (user as any).backendToken;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token && session.user) {
        (session.user as any).role = token.role;
        (session.user as any).backendToken = token.backendToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: { strategy: "jwt" },
} satisfies NextAuthConfig;
