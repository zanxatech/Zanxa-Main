"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Folder, FolderOpen, Lock, MonitorSmartphone, Code, CheckCircle, ChevronRight, Loader2, IndianRupee, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";

export default function WebDevServicePage() {
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user }: any = useAuth();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${API_URL}/services/webdev`);
        const data = await res.json();
        const formattedProjects = (data.projects || []).map((p: any) => ({
          ...p,
          name: p.title || p.name || "Untitled Project",
          tech: p.tech || "Modern Web Stack",
          status: p.status || "Completed",
          images: p.images || []
        }));
        setProjects(formattedProjects);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

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

  const handleCreateOrder = async (project: any) => {
    if (!user) {
      alert("Please log in to purchase this solution.");
      return;
    }
    setOrderLoading(true);

    try {
      // 1. Create Internal Order
      const res = await fetch(`${API_URL}/services/webdev/orders`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.backendToken}`
        },
        body: JSON.stringify({
          customerName: user.name,
          customerPhone: user.phone || "0000000000",
          websiteProjectId: project.id,
          description: `Direct purchase of ${project.name}`
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");

      // 2. Load Razorpay
      const isLoaded = await loadRazorpay();
      if (!isLoaded) throw new Error("Razorpay SDK failed to load");

      // 3. Create RZP Order (Backend will fetch price from DB)
      const payRes = await fetch(`${API_URL}/payments/create-order`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.backendToken}`
        },
        body: JSON.stringify({ orderId: data.order.id }) 
      });
      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.error || "Payment gateway error");

      // 4. Open Gateway
      const options = {
        key: payData.key,
        amount: payData.amount,
        currency: "INR",
        name: "ZANXA TECH",
        description: `Project: ${project.name}`,
        order_id: payData.razorpayOrderId,
        handler: async (response: any) => {
          const verifyRes = await fetch(`${API_URL}/payments/verify`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              Authorization: `Bearer ${user.backendToken}`
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
            alert("Verification failed. Please contact support.");
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: { color: "#D4AF37" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      alert(err.message);
    } finally {
      setOrderLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-zinc-950">
        <Loader2 className="w-12 h-12 text-[var(--color-gold)] animate-spin mb-4" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Accessing Project Repository...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6 animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-500/20">
            <CheckCircle className="text-white w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Order Placed!</h2>
          <p className="text-zinc-400">Your purchase of the solution has been registered. Our development team will contact you within 24 hours to begin the deployment process.</p>
          <Link href="/dashboard" className="inline-block px-8 py-4 bg-[var(--color-gold)] text-zinc-900 rounded-2xl font-black uppercase tracking-widest text-xs">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors pt-12 pb-24 flex">
      {/* Sidebar - Folder Structure */}
      <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hidden md:flex flex-col flex-shrink-0 h-[calc(100vh-80px)] sticky top-[80px]">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold font-heading text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] flex items-center gap-2">
            <Code size={20} /> Web Projects
          </h2>
          <p className="text-sm text-zinc-500 mt-2">Explore our portfolio</p>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          {projects.map((proj) => (
            <button
              key={proj.id}
              onClick={() => setActiveFolder(proj.id === activeFolder ? null : proj.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${activeFolder === proj.id ? 'bg-[var(--color-gold)]/10 text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] font-bold' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
            >
              {activeFolder === proj.id ? <FolderOpen size={20} className="text-[var(--color-gold)]" /> : <Folder size={20} />}
              <span className="flex-1 truncate">{proj.name}</span>
            </button>
          ))}
        </div>
        
        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 text-center">
           <Link href="/services/webdev/contact" className="w-full inline-block py-3 bg-[var(--color-royal-brown)] dark:bg-[var(--color-gold)] text-white dark:text-zinc-900 rounded-lg font-semibold hover:opacity-90 transition-opacity">
              Request Similar Project
           </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-12 overflow-y-auto">
        {!activeFolder ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
            <MonitorSmartphone className="w-24 h-24 text-zinc-300 dark:text-zinc-700 mb-6" />
            <h1 className="text-4xl font-bold font-heading text-[var(--color-royal-brown)] dark:text-white mb-4">Web Development Portfolio</h1>
            <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-8">
              Select a project folder from the sidebar to view our previous work, screenshots, and architecture diagrams.
            </p>
            
            {/* Mobile View Folders (Hidden on Desktop) */}
            <div className="w-full md:hidden flex flex-col gap-3">
              {projects.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => setActiveFolder(proj.id)}
                  className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <Folder className="text-[var(--color-gold)]" />
                    <span className="font-semibold text-zinc-800 dark:text-white">{proj.name}</span>
                  </div>
                  <ChevronRight className="text-zinc-400" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            {projects.filter(p => p.id === activeFolder).map(project => (
              <div key={project.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-4xl font-bold font-heading text-[var(--color-royal-brown)] dark:text-white mb-2">{project.name}</h2>
                    <div className="flex items-center gap-4 text-sm font-medium">
                      <span className="text-[var(--color-gold)]">{project.tech}</span>
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><CheckCircle size={14} /> {project.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {project.price > 0 && (
                      <div className="flex flex-col items-end">
                        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Setup Cost</p>
                        <p className="text-2xl font-black text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] flex items-center gap-1">
                          <IndianRupee size={20}/> {project.price.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {!user ? (
                      <Link href={`/auth/login?redirect=/services/webdev`} className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full font-bold flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <Lock size={16} /> Unlock Full View
                      </Link>
                    ) : project.price > 0 && (
                      <button 
                        onClick={() => handleCreateOrder(project)}
                        disabled={orderLoading}
                        className="px-8 py-3 bg-[var(--color-gold)] text-zinc-900 rounded-full font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-yellow-500/20"
                      >
                        {orderLoading ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                        Purchase Solution
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {project.images.map((img: string, idx: number) => (
                    <div key={idx} className="relative group rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 aspect-video">
                      <img src={img} alt={`${project.name} Screenshot`} className={`w-full h-full object-cover transition-all duration-500 ${!user ? 'blur-sm brightness-75 group-hover:blur-md' : 'hover:scale-105'}`} />
                      
                      {!user && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-white/20">
                            <Lock className="text-white w-8 h-8" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">Login Required</h3>
                          <p className="text-zinc-300 text-sm max-w-xs">You must be logged in to view high-resolution screenshots and project details.</p>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Empty state for single image to fill grid */}
                  {project.images.length === 1 && (
                     <div className="relative rounded-2xl overflow-hidden border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 aspect-video flex items-center justify-center">
                        <span className="text-zinc-400 font-medium">Additional views locked</span>
                     </div>
                  )}
                </div>
                
                <div className="mt-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 text-center shadow-lg">
                  <h3 className="text-2xl font-bold text-[var(--color-royal-brown)] dark:text-white mb-4">Want something custom?</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-xl mx-auto">We can build a tailored solution from scratch matching your exact brand guidelines and business flow.</p>
                  <Link href="/services/webdev/contact" className="inline-flex items-center justify-center px-8 py-4 bg-[var(--color-royal-brown)] dark:bg-[var(--color-gold)] text-white dark:text-zinc-900 rounded-full font-bold hover:-translate-y-1 transition-transform shadow-xl">
                    Request a Custom Proposal
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
