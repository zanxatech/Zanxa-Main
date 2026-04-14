/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function EmployeeLoginPage() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);

  // Login States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register States
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [service, setService] = useState("CREATIVE_DESIGN");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        role: "EMPLOYEE",
      });

      if (res?.error) {
        throw new Error("Invalid credentials or Waiting for Approval");
      }

      router.push("/dashboard/employee");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      // Typically, you'd send this to your Express backend or a Next.js server action
      const res = await fetch("http://localhost:5000/api/auth/register/employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, address, service }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit registration");

      setMessage("Registration submitted successfully. Status: Waiting for Approval");
      setIsRegistering(false);
    } catch (err: any) {
      setError(err.message || "Failed to submit registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl w-full max-w-md border border-[var(--color-beige)] dark:border-zinc-800 transition-colors">
      <h2 className="text-3xl font-bold font-heading text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] text-center mb-2">Employee Portal</h2>
      <p className="text-zinc-600 dark:text-zinc-400 text-center text-sm mb-6">Staff Access & Registration</p>
      
      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-4 border border-red-200 dark:border-red-800">{error}</div>}
      {message && <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-lg text-sm mb-4 border border-green-200 dark:border-green-800">{message}</div>}

      {!isRegistering ? (
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-royal-brown)] dark:text-zinc-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-[var(--color-beige)] dark:border-zinc-700 bg-white dark:bg-zinc-800 dark:text-white rounded-lg focus:outline-none focus:border-[var(--color-gold)] transition-colors"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-[var(--color-royal-brown)] dark:text-zinc-300 mb-1">Password</label>
             <input
               type="password"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               required
               className="w-full px-4 py-2 border border-[var(--color-beige)] dark:border-zinc-700 bg-white dark:bg-zinc-800 dark:text-white rounded-lg focus:outline-none focus:border-[var(--color-gold)] transition-colors"
             />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-zinc-800 dark:bg-zinc-700 text-[var(--color-soft-white)] font-semibold rounded-full hover:bg-[var(--color-royal-brown)] dark:hover:bg-zinc-600 transition-all disabled:opacity-50 mt-4"
          >
            {loading ? "Authenticating..." : "Login"}
          </button>
          
          <div className="text-center mt-4">
            <button type="button" onClick={() => setIsRegistering(true)} className="text-sm text-[var(--color-gold)] font-bold hover:underline">
              Apply for Employee Account
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-royal-brown)] dark:text-zinc-300 mb-1">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-2 border border-[var(--color-beige)] dark:border-zinc-700 bg-white dark:bg-zinc-800 dark:text-white rounded-lg focus:outline-none focus:border-[var(--color-gold)] transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-royal-brown)] dark:text-zinc-300 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 border border-[var(--color-beige)] dark:border-zinc-700 bg-white dark:bg-zinc-800 dark:text-white rounded-lg focus:outline-none focus:border-[var(--color-gold)] transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-royal-brown)] dark:text-zinc-300 mb-1">Phone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full px-4 py-2 border border-[var(--color-beige)] dark:border-zinc-700 bg-white dark:bg-zinc-800 dark:text-white rounded-lg focus:outline-none focus:border-[var(--color-gold)] transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-royal-brown)] dark:text-zinc-300 mb-1">Service Assignment</label>
            <select value={service} onChange={(e) => setService(e.target.value)} className="w-full px-4 py-2 border border-[var(--color-beige)] dark:border-zinc-700 bg-white dark:bg-zinc-800 dark:text-white rounded-lg focus:outline-none focus:border-[var(--color-gold)] transition-colors">
              <option value="CREATIVE_DESIGN">Creative & Design</option>
              <option value="WEB_DEVELOPMENT">Web Development</option>
              <option value="COURSES">Mastercourses</option>
              <option value="WEBINARS">Live Webinars</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-royal-brown)] dark:text-zinc-300 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-2 border border-[var(--color-beige)] dark:border-zinc-700 bg-white dark:bg-zinc-800 dark:text-white rounded-lg focus:outline-none focus:border-[var(--color-gold)] transition-colors" />
          </div>
          
          <button type="submit" disabled={loading} className="w-full py-3 bg-[var(--color-royal-brown)] dark:bg-[var(--color-gold)] text-[var(--color-soft-white)] dark:text-zinc-950 font-bold rounded-full hover:bg-[var(--color-gold)] dark:hover:bg-white transition-all disabled:opacity-50 mt-4">
            {loading ? "Submitting..." : "Submit Application"}
          </button>
          
          <div className="text-center mt-2">
            <button type="button" onClick={() => setIsRegistering(false)} className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300">
              Back to Login
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
