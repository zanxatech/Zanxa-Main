"use client";

import { useSession } from "next-auth/react";
import { useState, Suspense } from "react";
import { Loader2, CheckCircle, MonitorSmartphone } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";

function ContactFormContent() {
  const { user, loading: authLoading }: any = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    contactNumber: user?.phone || "",
    email: user?.email || "",
    companyName: "",
    description: "",
    budget: "Not Sure Yet"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.backendToken) {
      alert("Please log in to submit a custom request.");
      return;
    }
    setLoading(true);

    try {
      const payload = {
        customerName: formData.fullName,
        customerPhone: formData.contactNumber,
        websiteProjectId: null, // Custom project
        description: `Custom Project Request\nCompany: ${formData.companyName}\nBudget: ${formData.budget}\nDetails: ${formData.description}`
      };

      const res = await fetch(`${API_URL}/services/webdev/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.backendToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit request.");

      setSuccess(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <Loader2 className="animate-spin text-[var(--color-gold)] w-10 h-10" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
        <div className="max-w-lg w-full text-center space-y-6 animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-500/20">
            <CheckCircle className="text-white w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">Request Received!</h2>
          <p className="text-zinc-400 leading-relaxed">
            Your custom web development request has been registered. Our engineering team will review your requirements and reach out directly to discuss the roadmap and quote.
          </p>
          <Link href="/services/webdev" className="inline-block px-8 py-4 bg-[var(--color-gold)] text-zinc-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform">
            Back to Web Solutions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 transition-colors py-20 px-6 flex justify-center">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[var(--color-gold)]/10 text-[var(--color-gold)] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6">
            <MonitorSmartphone size={14} /> Custom Software Request
          </div>
          <h1 className="text-4xl font-bold font-heading text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] mb-4">
            Let's build together
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Provide details about your custom web platform, SaaS, or enterprise solution.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-50 dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[var(--color-royal-brown)] dark:text-zinc-300 mb-2">Full Name</label>
              <input type="text" name="fullName" required value={formData.fullName} onChange={handleChange} className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl focus:outline-none focus:border-[var(--color-gold)] dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-royal-brown)] dark:text-zinc-300 mb-2">Email Address</label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl focus:outline-none focus:border-[var(--color-gold)] dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[var(--color-royal-brown)] dark:text-zinc-300 mb-2">Contact Number</label>
              <input type="tel" name="contactNumber" required value={formData.contactNumber} onChange={handleChange} placeholder="+91 XXXXX XXXXX" className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl focus:outline-none focus:border-[var(--color-gold)] dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-royal-brown)] dark:text-zinc-300 mb-2">Company Name (Optional)</label>
              <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Your Organization Name" className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl focus:outline-none focus:border-[var(--color-gold)] dark:text-white" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-royal-brown)] dark:text-zinc-300 mb-2">Estimated Budget Range</label>
            <select name="budget" value={formData.budget} onChange={handleChange} className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl focus:outline-none focus:border-[var(--color-gold)] dark:text-white">
              <option value="Not Sure Yet">Not Sure Yet</option>
              <option value="Under ₹50,000">Under ₹50,000</option>
              <option value="₹50,000 - ₹2,00,000">₹50,000 - ₹2,00,000</option>
              <option value="₹2,00,000 - ₹10,00,000">₹2,00,000 - ₹10,00,000</option>
              <option value="Above ₹10,00,000">Above ₹10,00,000</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-royal-brown)] dark:text-zinc-300 mb-2">Project Brief / Custom Requirements</label>
            <textarea
              name="description"
              rows={5}
              required
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl focus:outline-none focus:border-[var(--color-gold)] dark:text-white resize-none"
              placeholder="Describe your project, features required, integrations, or similar platforms you like..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 bg-[var(--color-royal-brown)] dark:bg-[var(--color-gold)] text-white dark:text-zinc-900 font-black rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 text-sm uppercase tracking-widest shadow-lg flex items-center justify-center gap-3"
          >
            {loading ? (
              <><Loader2 className="animate-spin" size={18} /> Processing...</>
            ) : (
              <>Submit Proposal Request</>
            )}
          </button>

          {!user && (
            <p className="text-center text-sm text-zinc-500">
              <Link href="/auth/login?redirect=/services/webdev/contact" className="text-[var(--color-gold)] font-bold hover:underline">Log in</Link> to submit your request.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default function WebDevContactPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--color-gold)] w-10 h-10" />
      </div>
    }>
      <ContactFormContent />
    </Suspense>
  );
}
