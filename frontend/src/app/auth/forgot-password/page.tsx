/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Failed to send reset link");
      }

      setMessage("Password reset instructions have been sent to your email.");

    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold font-heading text-[var(--color-royal-brown)] text-center mb-6">Reset Password</h2>
      
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}
      {message ? (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4">{message}</div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-[var(--color-royal-brown)]/70 mb-2 leading-relaxed">
            Enter your email address and we&apos;ll send you instructions on how to reset your password.
          </p>

          <div>
            <label className="block text-sm font-medium text-[var(--color-royal-brown)] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-[var(--color-beige)] rounded-lg focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] transition-colors"
              placeholder="john@example.com"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-[var(--color-royal-brown)] text-[var(--color-soft-white)] font-semibold rounded-full hover:bg-[var(--color-gold)] transition-all disabled:opacity-50 mt-2"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      )}

      <div className="mt-8 text-center text-sm">
        <Link href="/auth/login" className="text-[var(--color-royal-brown)] font-semibold hover:text-[var(--color-gold)] transition-colors">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
