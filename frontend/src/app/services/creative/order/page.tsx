"use client";

import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function OrderFormContent() {
  const searchParams = useSearchParams();
  const { data: session }: any = useSession();
  const templateId = searchParams.get("template") || "";

  const [formData, setFormData] = useState({
    fullName: "",
    contactNumber: "",
    email: "",
    address: "",
    templateNumber: templateId,
    description: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const loadRazorpay = async () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.backendToken) {
      alert("Please log in to place an order.");
      return;
    }
    setLoading(true);

    try {
      // 1. Create Backend Order
      const ordRes = await fetch(`${API_URL}/creative/orders`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.backendToken}`
        },
        body: JSON.stringify({
          customerName: formData.fullName,
          customerPhone: formData.contactNumber,
          category: "CREATIVE_SERVICE",
          templateId: formData.templateNumber,
          description: formData.description
        })
      });
      const ordData = await ordRes.json();
      if (!ordRes.ok) throw new Error(ordData.error || "Failed to create order");

      // 2. Load Razorpay
      const isLoaded = await loadRazorpay();
      if (!isLoaded) throw new Error("Razorpay SDK failed to load");

      // 3. Create Razorpay Order
      const payRes = await fetch(`${API_URL}/payments/create-order`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.backendToken}`
        },
        body: JSON.stringify({ amount: 199, orderId: ordData.order.id }) 
      });
      const payData = await payRes.json();

      // 4. Open Gateway
      const options = {
        key: payData.key,
        amount: payData.amount,
        currency: payData.currency,
        order_id: payData.razorpayOrderId,
        name: "ZANXA TECH",
        description: "Creative Design Order",
        handler: async function (response: any) {
          const verifyRes = await fetch(`${API_URL}/payments/verify`, {
            method: "POST",
            headers: { 
               "Content-Type": "application/json",
               Authorization: `Bearer ${session.user.backendToken}`
            },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentId: payData.paymentId
            })
          });

          if (verifyRes.ok) {
            setSuccess(true);
          } else {
            alert("Verification failed");
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.contactNumber
        },
        theme: { color: "#D4AF37" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-6">
        <div className="bg-green-50 dark:bg-green-900/20 text-center p-12 rounded-3xl border border-green-200 dark:border-green-800 max-w-lg">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-3xl font-bold font-heading text-green-700 dark:text-green-400 mb-4">Order Placed Successfully!</h2>
          <p className="text-green-600 dark:text-green-300 mb-6">We have received your request for template <strong>#{formData.templateNumber}</strong>. Our team will review your requirements and get back to you shortly.</p>
          <a href="/services/creative" className="text-green-800 dark:text-green-100 font-bold hover:underline">Return to Gallery</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 transition-colors py-20 px-6 flex justify-center">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-heading text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] mb-4">Place Your Order</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Fill in the details below to request a custom design based on your selected template.</p>
          <div className="mt-4 inline-block bg-[var(--color-gold)]/10 text-[var(--color-gold)] px-6 py-2 rounded-full font-bold">
            Starting from ₹199
          </div>
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
              <input type="tel" name="contactNumber" required value={formData.contactNumber} onChange={handleChange} className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl focus:outline-none focus:border-[var(--color-gold)] dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-royal-brown)] dark:text-zinc-300 mb-2">Template Number</label>
              <input type="text" name="templateNumber" required value={formData.templateNumber} onChange={handleChange} className="w-full px-4 py-3 border border-[var(--color-gold)] bg-[var(--color-gold)]/5 rounded-xl focus:outline-none focus:border-[var(--color-gold)] text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] font-bold" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-royal-brown)] dark:text-zinc-300 mb-2">Physical Address</label>
            <input type="text" name="address" required value={formData.address} onChange={handleChange} className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl focus:outline-none focus:border-[var(--color-gold)] dark:text-white" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-royal-brown)] dark:text-zinc-300 mb-2">Custom Description / Requirements</label>
            <textarea name="description" rows={5} required value={formData.description} onChange={handleChange} className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl focus:outline-none focus:border-[var(--color-gold)] dark:text-white resize-none" placeholder="Please describe any specific colors, text, or elements you want changed..."></textarea>
          </div>

          <button type="submit" disabled={loading} className="w-full py-4 mt-4 bg-[var(--color-royal-brown)] dark:bg-[var(--color-gold)] text-white dark:text-zinc-900 font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-lg shadow-lg">
            {loading ? "Processing..." : "Submit Order Request"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CreativeOrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <OrderFormContent />
    </Suspense>
  );
}
