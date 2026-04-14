/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    if (!token) {
      setError("No reset token found. Please request a new password reset link.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    if (password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to reset password");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="text-green-600 dark:text-green-400" size={40} />
        </div>
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">Password Restored</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">Your account security has been updated successfully. Redirecting to login...</p>
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-[var(--color-gold)] font-bold hover:underline">
          Go to Login <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--color-gold)]/10 text-[var(--color-gold)] rounded-3xl mb-6">
          <Lock size={32} />
        </div>
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Create New Password</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm italic">"Establish a secured signature for your premium access."</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl text-xs font-bold mb-6 border border-red-100 dark:border-red-900/40">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={!token || loading}
            placeholder="••••••••"
            className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] transition-all dark:text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={!token || loading}
            placeholder="••••••••"
            className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] transition-all dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={!token || loading}
          className="w-full py-5 bg-[var(--color-royal-brown)] dark:bg-[var(--color-gold)] text-white dark:text-zinc-950 font-black rounded-2xl uppercase text-xs tracking-[0.2em] shadow-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Update Security Signature"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[var(--color-gold)]" size={40} />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
