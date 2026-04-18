/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const role = (credentials.role as string) || "USER";
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";
        
        let endpoint = `${API_URL}/auth/login`;
        if (role === "ADMIN") endpoint = `${API_URL}/auth/login/admin`;
        if (role === "EMPLOYEE") endpoint = `${API_URL}/auth/login/employee`;

        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          
          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || data.message || "Authentication failed");
          }

          if (data.user && data.token) {
            return {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              role: data.user.role,
              backendToken: data.token,
            };
          }
          return null;
        } catch (error: any) {
          throw new Error(error.message || "Failed to authenticate");
        }
      },
    }),
  ],
});
