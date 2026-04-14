/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Watch for user role to decide redirect
  React.useEffect(() => {
    if (isRedirecting) {
      console.log("[Auth Debug] Redirect Watcher triggered. User:", user);
      if (user?.role) {
        console.log("[Auth Debug] Role identified:", user.role);
        if (user.role === "ADMIN") {
          router.push("/dashboard/admin");
        } else if (user.role === "EMPLOYEE") {
          router.push("/dashboard/employee");
        } else {
          router.push("/dashboard");
        }
        setIsRedirecting(false);
      } else if (!authLoading) {
        console.log("[Auth Debug] Still waiting for role in user object...");
      }
    }
  }, [user, isRedirecting, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      setIsRedirecting(true);
    } catch (err: any) {
      console.error(err);
      setLoading(false);
      setError(err.message || "Invalid email or password.");
    }
  };

  const isUnverified = error.toLowerCase().includes("verify") || error.toLowerCase().includes("verification");

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      setIsRedirecting(true);
    } catch (err: any) {
      setError(err.message || "Google login failed.");
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl w-full max-w-md border border-[var(--color-beige)] dark:border-zinc-800 transition-colors">
      <h2 className="text-3xl font-bold font-heading text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] text-center mb-6">Welcome Back</h2>
      
      {error && (
        <div className={`p-4 rounded-2xl text-xs font-bold mb-6 border transition-all ${
          isUnverified 
            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
        }`}>
          {error}
          {isUnverified && (
            <Link 
              href={`/auth/verify?email=${encodeURIComponent(email)}`} 
              className="block mt-2 text-[var(--color-royal-brown)] dark:text-white underline hover:opacity-80 decoration-[var(--color-gold)]"
            >
              Verify your account now →
            </Link>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4 mb-6">
        <button 
          onClick={handleGoogleLogin}
          type="button"
          className="w-full py-3 flex items-center justify-center gap-2 border border-zinc-300 dark:border-zinc-700 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors dark:text-white"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
              <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
              <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
            </g>
          </svg>
          Continue with Google
        </button>
      </div>
      
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px bg-zinc-200 dark:bg-zinc-700 flex-1"></div>
        <span className="text-sm text-zinc-400">OR</span>
        <div className="h-px bg-zinc-200 dark:bg-zinc-700 flex-1"></div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-royal-brown)] dark:text-zinc-300 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-[var(--color-beige)] dark:border-zinc-700 bg-white dark:bg-zinc-800 dark:text-white rounded-lg focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] transition-colors"
            placeholder="john@example.com"
          />
        </div>

        <div>
           <label className="block text-sm font-medium text-[var(--color-royal-brown)] dark:text-zinc-300 mb-1">Password</label>
           <input
             type="password"
             value={password}
             onChange={(e) => setPassword(e.target.value)}
             required
             className="w-full px-4 py-2 border border-[var(--color-beige)] dark:border-zinc-700 bg-white dark:bg-zinc-800 dark:text-white rounded-lg focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] transition-colors"
             placeholder="••••••••"
           />
        </div>

        <button 
          type="submit" 
          disabled={loading || isRedirecting}
          className="w-full py-3 bg-[var(--color-royal-brown)] dark:bg-[var(--color-gold)] text-[var(--color-soft-white)] dark:text-zinc-900 font-semibold rounded-full hover:bg-[var(--color-gold)] dark:hover:bg-white transition-all disabled:opacity-50 mt-2"
        >
          {loading || isRedirecting ? "Syncing Profile..." : "Sign In"}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-[var(--color-royal-brown)]/60 dark:text-zinc-400">
        Don&apos;t have an account?{" "}
        <Link href="/auth/register" className="text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] font-semibold hover:text-[var(--color-gold)] dark:hover:text-white transition-colors">
          Sign up
        </Link>
      </div>
      
      <div className="mt-2 text-center">
         <Link href="/auth/forgot-password" className="text-sm text-[var(--color-royal-brown)]/60 dark:text-zinc-500 hover:text-[var(--color-royal-brown)] dark:hover:text-zinc-300 transition-colors">
           Forgot your password?
         </Link>
      </div>
    </div>
  );
}
