/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register, loginWithGoogle } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // 1. Create Firebase User
      const firebaseUser = await register(formData.email, formData.password);

      // 2. Sync with Backend
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api"}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          username: formData.username,
          phone: formData.phone,
          firebaseUid: firebaseUser.uid,
          isFirebaseUser: true,
          role: "USER"
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to sync user with database.");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Google login failed.");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold font-heading text-[var(--color-royal-brown)] text-center mb-6">Create an Account</h2>
      
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-royal-brown)] mb-1">Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-[var(--color-beige)] rounded-lg focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] transition-colors"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-royal-brown)] mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-[var(--color-beige)] rounded-lg focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] transition-colors"
            placeholder="john@example.com"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-royal-brown)] mb-1">Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-[var(--color-beige)] rounded-lg focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] transition-colors"
              placeholder="+1234567890"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-royal-brown)] mb-1">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-[var(--color-beige)] rounded-lg focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] transition-colors"
              placeholder="johndoe99"
            />
          </div>
        </div>

        <div>
           <label className="block text-sm font-medium text-[var(--color-royal-brown)] mb-1">Password</label>
           <input
             type="password"
             name="password"
             value={formData.password}
             onChange={handleChange}
             required
             className="w-full px-4 py-2 border border-[var(--color-beige)] rounded-lg focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] transition-colors"
             placeholder="••••••••"
             minLength={6}
           />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-3 bg-[var(--color-royal-brown)] text-[var(--color-soft-white)] font-semibold rounded-full hover:bg-[var(--color-gold)] transition-all disabled:opacity-50 mt-4"
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-[var(--color-royal-brown)]/60">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-[var(--color-royal-brown)] font-semibold hover:text-[var(--color-gold)] transition-colors">
          Sign in
        </Link>
      </div>
    </div>
  );
}
