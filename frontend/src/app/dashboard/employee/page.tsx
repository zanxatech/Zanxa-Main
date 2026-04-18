/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { 
  FolderKanban, Settings, LogOut, Search, Loader2, 
  Clock, CheckCircle2, Send, Paperclip, UploadCloud,
  ChevronRight, ExternalLink, Briefcase, Trash2, PlusCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function EmployeeDashboard() {
  const router = useRouter();
  const { user, logout, loading: authLoading }: any = useAuth();
  const [activeTab, setActiveTab] = useState("tasks");
  const [loading, setLoading] = useState(true);
  const [assignedOrders, setAssignedOrders] = useState<any[]>([]);
  
  // Delivery Modal
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [deliveryImages, setDeliveryImages] = useState<string[]>([]);
  const [delivering, setDelivering] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";
  const assignedService = (user as any)?.assignedService || "Specialist";

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user?.backendToken) {
      fetchTasks();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/employees/assigned-orders`, {
        headers: { Authorization: `Bearer ${user.backendToken}` }
      });
      const data = await res.json();
      setAssignedOrders(data.orders || []);
    } catch (err) {
      console.error("Fetch tasks failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const base64Array = await Promise.all(Array.from(files).map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }));

    setDeliveryImages(prev => [...prev, ...base64Array]);
  };

  const submitDelivery = async () => {
    if (deliveryImages.length === 0) return alert("Upload at least one proof of work");
    setDelivering(true);
    try {
      const res = await fetch(`${API_URL}/employees/orders/${selectedOrder.id}/deliver`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.backendToken}`
        },
        body: JSON.stringify({ images: deliveryImages })
      });

      if (res.ok) {
        alert("Work delivered successfully! Waiting for admin approval.");
        setShowDeliveryModal(false);
        setDeliveryImages([]);
        fetchTasks();
      }
    } catch (err) {
      alert("Delivery failed");
    } finally {
      setDelivering(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (loading && assignedOrders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-12 h-12 text-[var(--color-gold)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row font-sans">
      {/* Sidebar - Richer Aesthetics */}
      <aside className="w-full md:w-64 bg-[var(--color-royal-brown)] dark:bg-zinc-900 border-r border-white/5 text-white flex flex-col pt-10 pb-4 h-auto md:h-screen md:sticky md:top-0">
        <div className="px-8 mb-12">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 bg-[var(--color-gold)] rounded-xl flex items-center justify-center text-zinc-950 font-black">Z</div>
             <h2 className="text-xl font-bold font-heading tracking-tight">Staff Core</h2>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1">Assigned Unit</p>
            <p className="text-xs font-bold text-[var(--color-gold)] truncate">{assignedService.replace('_', ' ')}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2 px-4 flex-1">
          <button onClick={() => setActiveTab("tasks")} className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all ${activeTab === 'tasks' ? 'bg-[var(--color-gold)] font-bold text-zinc-950 shadow-lg shadow-yellow-500/20' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
            <FolderKanban size={20} /> My Assignments
          </button>
          <button onClick={() => setActiveTab("settings")} className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-[var(--color-gold)] font-bold text-zinc-950 shadow-lg shadow-yellow-500/20' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
            <Settings size={20} /> Account Center
          </button>
        </nav>

        <div className="px-6 mt-auto">
          <button onClick={handleLogout} className="flex items-center gap-3 px-6 py-4 w-full text-left text-red-300 hover:bg-red-900/40 rounded-2xl transition-colors font-bold text-sm">
            <LogOut size={18} /> Disconnect
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 lg:p-16 overflow-y-auto w-full">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold font-heading text-zinc-900 dark:text-white capitalize tracking-tighter">
              {activeTab === 'tasks' ? "Current Workload" : activeTab}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium">Hello {user?.name}, you have {assignedOrders.filter(o => o.status !== 'COMPLETED').length} active tasks today.</p>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
             <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                <input type="text" placeholder="Search orders..." className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] text-sm shadow-sm" />
             </div>
          </div>
        </header>

        {activeTab === "tasks" && (
          <div className="grid grid-cols-1 gap-6">
             {assignedOrders.length === 0 ? (
               <div className="py-24 flex flex-col items-center justify-center text-zinc-400 bg-white dark:bg-zinc-900 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                  <Briefcase size={64} className="opacity-10 mb-4" />
                  <p className="font-bold uppercase tracking-[0.2em] text-sm">No tasks assigned yet</p>
                  <p className="text-xs mt-2">Check back later when admin assigns you work.</p>
               </div>
             ) : (
               assignedOrders.map(order => (
                 <div key={order.id} className="group bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-2xl hover:border-[var(--color-gold)] transition-all duration-500 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="flex gap-6 items-start">
                       <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'} flex-shrink-0 animate-pulse`}>
                          {order.status === 'COMPLETED' ? <CheckCircle2 size={32} /> : <Clock size={32} />}
                       </div>
                       <div>
                          <div className="flex items-center gap-3 mb-2">
                             <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-3 py-1 rounded-full font-black uppercase tracking-widest">{order.id.slice(0, 8)}</span>
                             <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {order.status}
                             </span>
                          </div>
                          <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{order.customerName}</h3>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed">"{order.description || "No specific instructions provided."}"</p>
                          
                          {order.templateFolder && (
                            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[var(--color-gold)] uppercase">
                               <ExternalLink size={14} /> Reference: Folder #{order.templateFolder.folderNumber}
                            </div>
                          )}
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                       {order.status !== 'COMPLETED' && (
                         <button 
                          onClick={() => { setSelectedOrder(order); setShowDeliveryModal(true); }}
                          className="w-full lg:w-auto px-10 py-4 bg-[var(--color-royal-brown)] text-white dark:bg-[var(--color-gold)] dark:text-zinc-950 rounded-2xl font-bold uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl shadow-yellow-500/10 flex items-center justify-center gap-2"
                         >
                           <Send size={16} /> Deliver Work
                         </button>
                       )}
                       {order.status === 'COMPLETED' && (
                         <div className="flex items-center gap-2 text-green-500 font-bold text-sm bg-green-50 dark:bg-green-900/20 px-6 py-3 rounded-2xl border border-green-100 dark:border-green-900/30">
                            <CheckCircle2 size={20} /> Work Submitted
                         </div>
                       )}
                    </div>
                 </div>
               ))
             )}
          </div>
        )}

        {activeTab === "settings" && (
           <div className="bg-white dark:bg-zinc-900 p-12 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-sm max-w-2xl">
              <h3 className="text-2xl font-bold mb-8 dark:text-white">Expert Profile</h3>
              <div className="space-y-8">
                 <div className="grid grid-cols-2 gap-8">
                    <div>
                       <label className="text-[10px] font-black uppercase text-zinc-400 mb-2 block">Legal Name</label>
                       <p className="font-bold dark:text-white">{user?.name}</p>
                    </div>
                    <div>
                       <label className="text-[10px] font-black uppercase text-zinc-400 mb-2 block">Official Email</label>
                       <p className="font-bold dark:text-white">{user?.email}</p>
                    </div>
                 </div>
                 <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800">
                    <button className="text-[var(--color-gold)] text-xs font-bold uppercase tracking-widest hover:underline">Update Credentials</button>
                 </div>
              </div>
           </div>
        )}

      </main>

      {/* Delivery Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 bg-zinc-950/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-6">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl relative overflow-hidden border border-white/5">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--color-gold)] to-orange-500"></div>
              
              <h3 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tighter">Deliver Quality Output</h3>
              <p className="text-zinc-500 text-sm mb-10">You are delivering work for <span className="text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] font-bold">{selectedOrder?.customerName}</span>. Ensure all files meet ZANXA TECH quality standards.</p>
              
              <div className="space-y-6">
                 <div className="p-16 border-4 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] bg-zinc-50 dark:bg-white/[0.02] flex flex-col items-center justify-center gap-4 transition-all hover:border-[var(--color-gold)] group">
                    <input type="file" multiple id="work-delivery" hidden onChange={handleFileChange} />
                    <label htmlFor="work-delivery" className="cursor-pointer flex flex-col items-center gap-4 text-center">
                       <UploadCloud size={64} className="text-zinc-300 group-hover:text-[var(--color-gold)] transition-colors" />
                       <div>
                          <p className="font-bold text-zinc-900 dark:text-white">Click to upload work proof</p>
                          <p className="text-xs text-zinc-500 mt-1">Images, Mockups, or Result Screenshots (Max 5MB per file)</p>
                       </div>
                    </label>
                 </div>

                 {deliveryImages.length > 0 && (
                   <div className="flex flex-wrap gap-3">
                      {deliveryImages.map((img, i) => (
                        <div key={i} className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[var(--color-gold)] bg-zinc-100 relative group">
                           <img src={img} className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" onClick={() => setDeliveryImages(prev => prev.filter((_, idx) => idx !== i))}>
                              <Trash2 size={16} className="text-white" />
                           </div>
                        </div>
                      ))}
                      <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-zinc-200 flex items-center justify-center text-zinc-300">
                         <PlusCircle size={24} />
                      </div>
                   </div>
                 )}

                 <div className="flex gap-4 pt-4">
                    <button 
                      onClick={() => setShowDeliveryModal(false)}
                      className="flex-1 py-5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold rounded-3xl uppercase text-xs tracking-widest hover:bg-zinc-200"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={submitDelivery}
                      disabled={delivering}
                      className="flex-2 py-5 bg-[var(--color-gold)] text-zinc-950 font-bold rounded-3xl uppercase text-xs tracking-widest hover:opacity-90 transition-all shadow-xl shadow-yellow-500/20 flex items-center justify-center gap-2"
                    >
                      {delivering ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Finalize & Submit</>}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
