/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        role: "ADMIN",
      });

      if (res?.error) {
        throw new Error("Invalid admin credentials");
      }

      router.push("/dashboard/admin");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-950 p-8 rounded-2xl shadow-xl w-full max-w-md border border-[var(--color-gold)]/30">
      <h2 className="text-3xl font-bold font-heading text-[var(--color-gold)] text-center mb-2">Admin Portal</h2>
      <p className="text-zinc-400 text-center text-sm mb-6">Restricted Access</p>
      
      {error && <div className="bg-red-900/40 text-red-400 p-3 rounded-lg text-sm mb-4 border border-red-800">{error}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Admin Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-zinc-800 bg-zinc-900 text-white rounded-lg focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] transition-colors"
            placeholder="admin@zanxatech.com"
          />
        </div>

        <div>
           <label className="block text-sm font-medium text-zinc-300 mb-1">Password</label>
           <input
             type="password"
             value={password}
             onChange={(e) => setPassword(e.target.value)}
             required
             className="w-full px-4 py-2 border border-zinc-800 bg-zinc-900 text-white rounded-lg focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] transition-colors"
             placeholder="••••••••"
           />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-3 bg-[var(--color-gold)] text-zinc-950 font-bold rounded-full hover:bg-white transition-all disabled:opacity-50 mt-4"
        >
          {loading ? "Authenticating..." : "Login to Workspace"}
        </button>
      </form>
    </div>
  );
}
