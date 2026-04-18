"use client";

import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Loader2, CheckCircle, IndianRupee, Palette } from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";

function OrderFormContent() {
  const searchParams = useSearchParams();
  const { data: session }: any = useSession();
  const templateId = searchParams.get("template") || "";

  const [templateData, setTemplateData] = useState<any>(null);
  const [fetchingTemplate, setFetchingTemplate] = useState(!!templateId);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: session?.user?.name || "",
    contactNumber: "",
    email: session?.user?.email || "",
    address: "",
    templateNumber: templateId,
    description: ""
  });

  // Fetch template metadata + price from DB
  useEffect(() => {
    if (!templateId) { setFetchingTemplate(false); return; }
    const fetchTemplate = async () => {
      try {
        const res = await fetch(`${API_URL}/services/creative/folders/${templateId}`);
        if (res.ok) {
          const data = await res.json();
          setTemplateData(data.folder);
        }
      } catch (e) {
        console.error("Failed to load template:", e);
      } finally {
        setFetchingTemplate(false);
      }
    };
    fetchTemplate();
  }, [templateId]);

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
      // 1. Create Backend Order — link the templateFolderId so backend can look up price
      const ordRes = await fetch(`${API_URL}/services/creative/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.backendToken}`
        },
        body: JSON.stringify({
          customerName: formData.fullName,
          customerPhone: formData.contactNumber,
          category: "CREATIVE_SERVICE",
          templateFolderId: templateData?.id || null,
          description: formData.description
        })
      });
      const ordData = await ordRes.json();
      if (!ordRes.ok) throw new Error(ordData.error || "Failed to create order");

      // If no template is selected, it's a custom request (No initial payment required)
      if (!templateData) {
        setSuccess(true);
        return;
      }

      // 2. Load Razorpay
      const isLoaded = await loadRazorpay();
      if (!isLoaded) throw new Error("Razorpay SDK failed to load");

      // 3. Create Razorpay Order — DO NOT send amount; backend fetches from DB
      const payRes = await fetch(`${API_URL}/payments/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.backendToken}`
        },
        body: JSON.stringify({ orderId: ordData.order.id })
      });
      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.error || "Payment gateway error");

      // 4. Open Razorpay Gateway
      const options = {
        key: payData.key,
        amount: payData.amount,
        currency: payData.currency || "INR",
        order_id: payData.razorpayOrderId,
        name: "ZANXA TECH",
        description: `Design Template: ${templateData?.folderNumber || formData.templateNumber}`,
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
            alert("Payment verification failed. Please contact support with your payment ID.");
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

  if (fetchingTemplate) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
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
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">Order Confirmed!</h2>
          <p className="text-zinc-400 leading-relaxed">
            We have received your request for template <strong className="text-[var(--color-gold)]">#{templateData?.folderNumber || formData.templateNumber}</strong>.
            Our creative team will review your requirements and reach out within 24 hours.
          </p>
          <Link href="/services/creative" className="inline-block px-8 py-4 bg-[var(--color-gold)] text-zinc-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform">
            Back to Gallery
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
            <Palette size={14} /> Creative Design
          </div>
          <h1 className="text-4xl font-bold font-heading text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] mb-4">
            Place Your Order
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Fill in the details below to get a custom design based on your selected template.
          </p>

          {/* Dynamic Price Display */}
          {templateData && (
            <div className="mt-6 inline-flex items-center gap-3 bg-zinc-900 border border-[var(--color-gold)]/20 px-6 py-3 rounded-2xl">
              <div className="text-left">
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Template Price</p>
                <p className="text-2xl font-black text-[var(--color-gold)] flex items-center gap-1">
                  <IndianRupee size={18} />{(templateData.price || 199).toLocaleString()}
                </p>
              </div>
              <div className="w-px h-10 bg-zinc-700" />
              <div className="text-left">
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Catalog ID</p>
                <p className="text-sm font-black text-white">{templateData.folderNumber}</p>
              </div>
            </div>
          )}
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
              <label className="block text-sm font-medium text-[var(--color-royal-brown)] dark:text-zinc-300 mb-2">Template Number</label>
              <input
                type="text"
                name="templateNumber"
                required
                value={formData.templateNumber}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[var(--color-gold)] bg-[var(--color-gold)]/5 rounded-xl focus:outline-none focus:border-[var(--color-gold)] text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-royal-brown)] dark:text-zinc-300 mb-2">Physical Address</label>
            <input type="text" name="address" required value={formData.address} onChange={handleChange} placeholder="Street, City, State, PIN Code" className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl focus:outline-none focus:border-[var(--color-gold)] dark:text-white" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-royal-brown)] dark:text-zinc-300 mb-2">Custom Requirements</label>
            <textarea
              name="description"
              rows={5}
              required
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl focus:outline-none focus:border-[var(--color-gold)] dark:text-white resize-none"
              placeholder="Describe your business name, specific colors, text content, or any elements you'd like changed..."
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
              <>
                {templateData ? `Pay ₹${(templateData.price || 199).toLocaleString()} & Submit` : "Submit Order Request"}
              </>
            )}
          </button>

          {!session?.user && (
            <p className="text-center text-sm text-zinc-500">
              <Link href="/auth/login" className="text-[var(--color-gold)] font-bold hover:underline">Log in</Link> to complete your purchase.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default function CreativeOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--color-gold)] w-10 h-10" />
      </div>
    }>
      <OrderFormContent />
    </Suspense>
  );
}
