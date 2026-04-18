/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart3, Users, CheckSquare, Settings, LogOut, 
  Search, FileVideo, Palette, Loader2, FileText 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, AreaChart, Area 
} from 'recharts';
import AdminStaffTab from "@/components/admin/AdminStaffTab";
import AdminContentTab from "@/components/admin/AdminContentTab";
import AdminBlogTab from "@/components/admin/AdminBlogTab";
import AdminApprovalsTab from "@/components/admin/AdminApprovalsTab";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout, loading: authLoading }: any = useAuth();
  const [activeTab, setActiveTab] = useState("analytics");
  const [loading, setLoading] = useState(true);
  
  // Real Data States
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [revenueChart, setRevenueChart] = useState<any[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/auth/admin-login");
      return;
    }
    
    // Strict admin check
    if (user.role !== "ADMIN") {
      router.push("/dashboard"); // Send non-admins to their respective dashboard
      return;
    }

    if (user.backendToken) {
      fetchDashboardData();
    }
  }, [user, authLoading]);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    // Safety Timeout: If data takes too long, clear the spinner anyway so the UI isn't stuck
    const timeout = setTimeout(() => {
      if (loading) setLoading(false);
    }, 4000);

    try {
      const headers = { Authorization: `Bearer ${user.backendToken}` };
      const [statsRes, approvRes, chartRes] = await Promise.all([
        fetch(`${API_URL}/admin/dashboard`, { headers }),
        fetch(`${API_URL}/approvals/pending`, { headers }),
        fetch(`${API_URL}/admin/revenue-chart`, { headers })
      ]);

      const stats = await statsRes.json();
      const approvals = await approvRes.json();
      const chart = await chartRes.json();

      setDashboardData(stats);
      setPendingApprovals(approvals.approvals || []);
      setRevenueChart(chart.chart || []);
    } catch (err) {
      console.error("Dashboard fetch failed:", err);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const handleApproval = async (id: string, status: string, pdfUrl?: string) => {
    try {
      const res = await fetch(`${API_URL}/approvals/${id}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.backendToken}`
        },
        body: JSON.stringify({ status, pdfUrl })
      });

      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      alert("Action failed");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-12 h-12 text-[var(--color-gold)] animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: "Total Users", value: dashboardData?.stats?.totalUsers || 0, change: "+12%" },
    { label: "Active Orders", value: dashboardData?.stats?.totalOrders || 0, change: "+5%" },
    { label: "Pending Approvals", value: pendingApprovals.length, change: "Live" },
    { label: "Monthly Revenue", value: `₹${(dashboardData?.stats?.revenue?.monthly || 0).toLocaleString()}`, change: "+24%" }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[var(--color-royal-brown)] dark:bg-zinc-900 text-white flex flex-col pt-8 pb-4 h-auto md:h-screen md:sticky md:top-0 border-r border-white/5">
        <div className="px-6 mb-10">
          <h2 className="text-2xl font-bold font-heading text-[var(--color-gold)]">ZANXA ADMIN</h2>
          <span className="text-[10px] bg-white/10 text-[var(--color-gold)] border border-[var(--color-gold)]/30 px-3 py-1 rounded-full mt-3 inline-block font-black tracking-widest uppercase">
            Administrative Access
          </span>
        </div>

        <nav className="flex flex-col gap-2 px-4 flex-1">
          <button onClick={() => setActiveTab("analytics")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'analytics' ? 'bg-[var(--color-gold)] text-zinc-900 font-bold shadow-lg shadow-yellow-500/20' : 'text-zinc-300 hover:bg-white/10'}`}>
            <BarChart3 size={18} /> Analytics & Growth
          </button>
          <button onClick={() => setActiveTab("approvals")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'approvals' ? 'bg-[var(--color-gold)] text-zinc-900 font-bold shadow-lg shadow-yellow-500/20' : 'text-zinc-300 hover:bg-white/10'}`}>
             <CheckSquare size={18} />
             <span>Approvals</span>
          </button>
          <button onClick={() => setActiveTab("content")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'content' ? 'bg-[var(--color-gold)] text-zinc-900 font-bold shadow-lg shadow-yellow-500/20' : 'text-zinc-300 hover:bg-white/10'}`}>
            <FileVideo size={18} /> Content Management
          </button>
          <button onClick={() => setActiveTab("employees")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'employees' ? 'bg-[var(--color-gold)] text-zinc-900 font-bold shadow-lg shadow-yellow-500/20' : 'text-zinc-300 hover:bg-white/10'}`}>
            <Users size={18} /> Staff / Employees
          </button>
          <button onClick={() => setActiveTab("blog")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'blog' ? 'bg-[var(--color-gold)] text-zinc-900 font-bold shadow-lg shadow-yellow-500/20' : 'text-zinc-300 hover:bg-white/10'}`}>
            <FileText size={18} /> Official Blog
          </button>
          <button onClick={() => setActiveTab("system")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'system' ? 'bg-[var(--color-gold)] text-zinc-900 font-bold shadow-lg shadow-yellow-500/20' : 'text-zinc-300 hover:bg-white/10'}`}>
            <Settings size={18} /> System Settings
          </button>
        </nav>

        <div className="px-4 mt-auto">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-300 hover:bg-red-900/40 rounded-xl transition-colors font-bold">
            <LogOut size={18} /> Exit Admin
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto w-full">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold font-heading text-zinc-900 dark:text-white capitalize">
              {activeTab.replace("-", " ")}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Managed directly from live cloud services.</p>
          </div>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <input type="text" placeholder="Global Search..." className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] text-sm shadow-sm transition-all" />
          </div>
        </header>

        {activeTab === "analytics" && (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm group hover:border-[var(--color-gold)] transition-all">
                  <p className="text-zinc-500 mb-2 font-bold text-xs uppercase tracking-wider">{stat.label}</p>
                  <div className="flex items-end justify-between">
                    <h3 className="text-3xl font-bold text-zinc-900 dark:text-white">{stat.value}</h3>
                    <span className={`text-xs p-1 rounded-lg px-2 font-bold ${stat.change.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{stat.change}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm min-h-[400px]">
                  <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-8">Revenue Analytics (INR)</h4>
                  <div className="w-full h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueChart}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
                        <XAxis dataKey="month" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                        <Tooltip 
                           contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                           itemStyle={{ color: '#d4af37', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#d4af37" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
               </div>

               <div className="bg-[var(--color-royal-brown)] text-white p-8 rounded-[2rem] shadow-xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-[var(--color-gold)] mb-2 font-heading">System Performance</h4>
                    <p className="text-zinc-300 text-sm mb-8">ZANXA TECH backend infrastructure is currently running at peak efficiency.</p>
                    
                    <div className="space-y-6">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-400">Database Load</span>
                        <span className="font-bold text-green-400">12%</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-green-400 h-full w-[12%]"></div>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-400">Active Sessions</span>
                        <span className="font-bold text-[var(--color-gold)]">1,248</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[var(--color-gold)] h-full w-[65%]"></div>
                      </div>
                    </div>
                  </div>
                  
                  <button className="mt-8 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-bold uppercase transition-colors">View Logs</button>
               </div>
            </div>
          </div>
        )}

        {activeTab === "approvals" && (
          <AdminApprovalsTab apiUrl={API_URL} />
        )}

        {activeTab === "content" && (
          <AdminContentTab apiUrl={API_URL} />
        )}

        {activeTab === "employees" && (
          <AdminStaffTab apiUrl={API_URL} />
        )}

        {activeTab === "blog" && (
          <AdminBlogTab apiUrl={API_URL} />
        )}

        {activeTab === "system" && (
          <div className="flex flex-col gap-8 max-w-5xl">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-10 shadow-sm">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Cloud Infrastructure</h3>
              <p className="text-zinc-500 text-sm mb-10">Connected services and API security management.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-6">
                    <h4 className="text-xs font-bold text-[var(--color-gold)] uppercase tracking-[0.2em]">Active Services</h4>
                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Cloudinary Storage</span>
                      </div>
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">HEALTHY</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Supabase Database</span>
                      </div>
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">HEALTHY</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Razorpay Gateway</span>
                      </div>
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">LIVE</span>
                    </div>
                 </div>

                 <div className="space-y-6">
                     <h4 className="text-xs font-bold text-[var(--color-gold)] uppercase tracking-[0.2em]">Admin Identity</h4>
                    <div className="p-6 border border-zinc-100 dark:border-zinc-800 rounded-3xl">
                       <p className="text-[10px] text-zinc-400 uppercase font-bold mb-1">Signed in as</p>
                       <p className="text-lg font-bold text-zinc-900 dark:text-white">{user?.name}</p>
                       <p className="text-xs text-zinc-500">{user?.email}</p>
                       <button className="mt-6 text-xs font-bold text-[var(--color-gold)] hover:underline">Revoke All Sessions</button>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
