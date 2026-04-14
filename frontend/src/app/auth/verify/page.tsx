/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`http://localhost:5000/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Verification failed");
      }

      setMessage("Email verified successfully! Redirecting to login...");
      
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);

    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return setError("Please provide an email to resend OTP");
    
    setError("");
    setMessage("");
    setResending(true);

    try {
      const res = await fetch(`http://localhost:5000/api/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      setMessage("A new OTP has been sent to your email.");

    } catch (err: any) {
      setError(err.message || "Something went wrong sending OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold font-heading text-[var(--color-royal-brown)] text-center mb-2">Verify Email</h2>
      <p className="text-center text-sm text-[var(--color-royal-brown)]/70 mb-6">
        Enter the 6-digit code sent to your email
      </p>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}
      {message && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4">{message}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-royal-brown)] mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-[var(--color-beige)] rounded-lg focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] transition-colors"
            placeholder="john@example.com"
            disabled={!!emailParam}
          />
        </div>

        <div>
           <label className="block text-sm font-medium text-[var(--color-royal-brown)] mb-1">Verification Code</label>
           <input
             type="text"
             value={code}
             onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
             required
             maxLength={6}
             className="w-full px-4 py-3 text-center tracking-widest text-2xl border border-[var(--color-beige)] rounded-lg focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] transition-colors"
             placeholder="000000"
           />
        </div>

        <button 
          type="submit" 
          disabled={loading || code.length !== 6}
          className="w-full py-3 bg-[var(--color-royal-brown)] text-[var(--color-soft-white)] font-semibold rounded-full hover:bg-[var(--color-gold)] transition-all disabled:opacity-50 mt-4"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-[var(--color-royal-brown)]/60">
        Didn&apos;t receive code?{" "}
        <button 
          onClick={handleResend}
          disabled={resending}
          className="text-[var(--color-royal-brown)] font-semibold hover:text-[var(--color-gold)] transition-colors bg-transparent border-none cursor-pointer"
        >
          {resending ? "Sending..." : "Resend Code"}
        </button>
      </div>

      <div className="mt-8 text-center text-sm">
        <Link href="/auth/login" className="text-[var(--color-royal-brown)]/60 hover:text-[var(--color-royal-brown)] transition-colors">
          Return to login
        </Link>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
      <VerifyForm />
    </Suspense>
  );
}
