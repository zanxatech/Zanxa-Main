/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  BookOpen, Award, ShoppingBag, LogOut, User, Loader2,
  CheckCircle2, Clock, XCircle, Play, Download, Trophy,
  ChevronRight, AlertCircle
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING_PAYMENT:      { label: "Pending Payment",    color: "text-zinc-400 bg-zinc-800 border-zinc-700", icon: Clock },
  PAYMENT_SUBMITTED:    { label: "Payment Submitted",  color: "text-blue-400 bg-blue-900/20 border-blue-700/30", icon: Clock },
  WAITING_APPROVAL:     { label: "Awaiting Approval",  color: "text-yellow-400 bg-yellow-900/20 border-yellow-700/30", icon: Clock },
  APPROVED:             { label: "Active",             color: "text-green-400 bg-green-900/20 border-green-700/30", icon: CheckCircle2 },
  REJECTED:             { label: "Rejected",           color: "text-red-400 bg-red-900/20 border-red-700/30", icon: XCircle },
};

export default function UserDashboard() {
  const router = useRouter();
  const { user, logout, loading: authLoading }: any = useAuth();
  const [activeTab, setActiveTab] = useState("courses");
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
      return;
    }
    
    if (user?.backendToken) {
      fetchData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    setLoading(true);
    const auth = { Authorization: `Bearer ${user.backendToken}` };
    try {
      const [enrollRes, ordersRes] = await Promise.all([
        fetch(`${API_URL}/services/courses/enrollments/me`, { headers: auth }),
        fetch(`${API_URL}/orders/my`, { headers: auth }).catch(() => ({ json: () => ({ orders: [] }) }))
      ]);
      const enrollData = await enrollRes.json();
      const ordersData = await (ordersRes as Response).json();
      setEnrollments(enrollData.enrollments || []);
      setOrders(ordersData.orders || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <Loader2 className="animate-spin text-[var(--color-gold)]" size={40}/>
    </div>
  );

  const approvedCourses = enrollments.filter(e => e.status === "APPROVED");
  const pendingCourses = enrollments.filter(e => e.status !== "APPROVED" && e.status !== "REJECTED");
  const certificates = enrollments.filter(e => e.certificate?.status === "APPROVED");

  const navItems = [
    { key: "courses", label: "My Courses", icon: BookOpen, badge: enrollments.length },
    { key: "certificates", label: "Certificates", icon: Award, badge: certificates.length },
    { key: "orders", label: "Orders", icon: ShoppingBag, badge: orders.length },
    { key: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-[var(--color-royal-brown)] dark:bg-zinc-900 text-white flex flex-col pt-10 pb-6 h-auto md:min-h-screen md:sticky md:top-0 border-r border-white/5 flex-shrink-0">
        {/* User Info */}
        <div className="px-8 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-gold)]/20 flex items-center justify-center text-2xl font-black text-[var(--color-gold)] mb-4 border border-[var(--color-gold)]/20">
            {user?.name?.charAt(0) || "U"}
          </div>
          <h2 className="text-xl font-bold text-white truncate">{user?.name}</h2>
          <p className="text-white/50 text-xs truncate mt-1">{user?.email}</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--color-gold)]/10 text-[var(--color-gold)] rounded-full text-[10px] font-black uppercase border border-[var(--color-gold)]/20">
              <Trophy size={10}/> Student
            </span>
          </div>
        </div>

        <nav className="flex flex-col gap-1 px-4 flex-1">
          {navItems.map(item => (
            <button key={item.key} onClick={() => setActiveTab(item.key)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                activeTab === item.key
                  ? "bg-[var(--color-gold)] text-zinc-900 font-black shadow-lg shadow-yellow-500/20"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}>
              <item.icon size={18}/>
              <span className="flex-1 font-bold">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${activeTab === item.key ? 'bg-zinc-900 text-[var(--color-gold)]' : 'bg-white/20 text-white'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-4 mt-6">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-300 hover:bg-red-900/30 rounded-xl transition-all font-bold text-sm">
            <LogOut size={18}/> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold font-heading text-zinc-900 dark:text-white capitalize">
            {navItems.find(n => n.key === activeTab)?.label}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            {activeTab === "courses" && `${approvedCourses.length} active · ${pendingCourses.length} pending`}
            {activeTab === "certificates" && `${certificates.length} earned`}
          </p>
        </header>

        {loading ? (
          <div className="py-24 flex justify-center"><Loader2 className="animate-spin text-[var(--color-gold)]" size={40}/></div>
        ) : (
          <>
            {/* ─── MY COURSES ─── */}
            {activeTab === "courses" && (
              <div className="space-y-8">
                {/* Active Enrollments */}
                {approvedCourses.length > 0 && (
                  <div>
                    <h2 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-green-500"/> Active Courses
                    </h2>
                    <div className="space-y-4">
                      {approvedCourses.map(e => (
                        <div key={e.id} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] p-6 hover:shadow-lg transition-all">
                          <div className="flex flex-col md:flex-row gap-6">
                            {/* Thumbnail */}
                            <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
                              {e.course.thumbnail ? (
                                <img src={e.course.thumbnail} alt={e.course.title} className="w-full h-full object-cover"/>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BookOpen className="text-zinc-400" size={32}/>
                                </div>
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{e.course.title}</h3>
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase border flex-shrink-0 ${STATUS_CONFIG.APPROVED.color}`}>
                                  <CheckCircle2 size={10}/> Active
                                </span>
                              </div>

                              {/* Progress Bar */}
                              <div className="mb-4">
                                <div className="flex justify-between text-xs font-bold mb-1.5">
                                  <span className="text-zinc-500">{e.completedModules}/{e.totalModules} modules</span>
                                  <span className="text-[var(--color-gold)]">{e.progressPct}%</span>
                                </div>
                                <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-[var(--color-gold)] to-yellow-400 rounded-full transition-all"
                                    style={{ width: `${e.progressPct}%` }}/>
                                </div>
                              </div>

                              {/* Certificate status */}
                              {e.certificate && (
                                <div className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full border mb-4 ${
                                  e.certificate.status === "APPROVED" ? "bg-green-900/20 text-green-400 border-green-700/30" :
                                  e.certificate.status === "WAITING_APPROVAL" ? "bg-yellow-900/20 text-yellow-400 border-yellow-700/30" :
                                  "bg-zinc-800 text-zinc-400 border-zinc-700"
                                }`}>
                                  <Award size={10}/>
                                  {e.certificate.status === "APPROVED" ? "Certificate Ready" :
                                   e.certificate.status === "WAITING_APPROVAL" ? "Certificate: Awaiting Admin" :
                                   "Certificate Pending"}
                                </div>
                              )}

                              <div className="flex gap-3 flex-wrap">
                                <Link href={`/services/courses/${e.courseId}`}
                                  className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-[var(--color-gold)] text-white dark:text-zinc-900 rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all">
                                  <Play size={14}/> {e.progressPct > 0 ? "Continue" : "Start"} Learning
                                </Link>
                                {e.progressPct === 100 && !e.quizPassed && (
                                  <Link href={`/services/courses/${e.courseId}/quiz`}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-gold)] text-zinc-900 rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all">
                                    <Trophy size={14}/> Take Exam
                                  </Link>
                                )}
                                {e.certificate?.status === "APPROVED" && e.certificate?.pdfUrl && (
                                  <a href={e.certificate.pdfUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-500 transition-all">
                                    <Download size={14}/> Certificate
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Enrollments */}
                {pendingCourses.length > 0 && (
                  <div>
                    <h2 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Clock size={14} className="text-yellow-500"/> Pending Approvals
                    </h2>
                    <div className="space-y-3">
                      {pendingCourses.map(e => {
                        const cfg = STATUS_CONFIG[e.status] || STATUS_CONFIG.PENDING_PAYMENT;
                        const Icon = cfg.icon;
                        return (
                          <div key={e.id} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
                                {e.course.thumbnail ? <img src={e.course.thumbnail} alt="" className="w-full h-full object-cover"/> : <BookOpen className="m-auto mt-3 text-zinc-400" size={24}/>}
                              </div>
                              <div>
                                <p className="font-bold text-zinc-900 dark:text-white">{e.course.title}</p>
                                <p className="text-xs text-zinc-500">₹{e.course.price?.toLocaleString()}</p>
                              </div>
                            </div>
                            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border ${cfg.color} flex-shrink-0`}>
                              <Icon size={12}/> {cfg.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {enrollments.length === 0 && (
                  <div className="py-32 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem]">
                    <BookOpen className="mx-auto mb-4 text-zinc-300 dark:text-zinc-700" size={64}/>
                    <p className="text-zinc-500 font-bold mb-2">No courses yet</p>
                    <Link href="/services/courses" className="inline-flex items-center gap-2 mt-2 text-[var(--color-gold)] font-black text-sm hover:underline">
                      Browse Courses <ChevronRight size={16}/>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* ─── CERTIFICATES ─── */}
            {activeTab === "certificates" && (
              <div className="space-y-4">
                {certificates.length === 0 ? (
                  <div className="py-32 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem]">
                    <Award className="mx-auto mb-4 text-zinc-300 dark:text-zinc-700" size={64}/>
                    <p className="text-zinc-500 font-bold mb-1">No certificates yet</p>
                    <p className="text-zinc-600 text-sm">Complete a course and pass the exam to earn your certificate</p>
                  </div>
                ) : (
                  certificates.map(e => (
                    <div key={e.id} className="bg-gradient-to-br from-zinc-900 to-black border border-[var(--color-gold)]/20 rounded-[2rem] p-8 flex items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--color-gold)]/10 flex items-center justify-center">
                          <Award size={32} className="text-[var(--color-gold)]"/>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--color-gold)] font-black uppercase tracking-widest mb-1">Certified</p>
                          <p className="text-xl font-bold text-white">{e.course.title}</p>
                          <p className="text-zinc-500 text-xs mt-1">
                            Issued: {e.certificate?.issuedAt ? new Date(e.certificate.issuedAt).toLocaleDateString() : "Pending"}
                          </p>
                        </div>
                      </div>
                      {e.certificate?.pdfUrl && (
                        <a href={e.certificate.pdfUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 px-5 py-3 bg-[var(--color-gold)] text-zinc-900 rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all flex-shrink-0">
                          <Download size={14}/> Download
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ─── ORDERS ─── */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="py-32 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem]">
                    <ShoppingBag className="mx-auto mb-4 text-zinc-300 dark:text-zinc-700" size={64}/>
                    <p className="text-zinc-500 font-bold">No orders yet</p>
                  </div>
                ) : (
                  orders.map((order: any) => (
                    <div key={order.id} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-6 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white">{order.serviceType?.replace(/_/g, " ")}</p>
                        <p className="text-zinc-500 text-sm mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-zinc-900 dark:text-white">₹{order.totalAmount?.toLocaleString() || "—"}</p>
                        <span className="text-xs text-zinc-500 font-bold uppercase">{order.status?.replace(/_/g, " ")}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ─── PROFILE ─── */}
            {activeTab === "profile" && (
              <div className="max-w-xl space-y-6">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] p-8 space-y-6">
                  <div className="w-20 h-20 rounded-2xl bg-[var(--color-gold)]/10 flex items-center justify-center text-3xl font-black text-[var(--color-gold)] border border-[var(--color-gold)]/20">
                    {user?.name?.charAt(0)}
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: "Full Name", value: user?.name },
                      { label: "Email Address", value: user?.email },
                      { label: "Account Role", value: user?.role || "USER" },
                    ].map(item => (
                      <div key={item.label}>
                        <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1">{item.label}</p>
                        <p className="text-zinc-900 dark:text-white font-bold">{item.value || "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Enrolled", value: enrollments.length, icon: BookOpen },
                    { label: "Active", value: approvedCourses.length, icon: CheckCircle2 },
                    { label: "Certified", value: certificates.length, icon: Award },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-5 text-center">
                      <stat.icon size={18} className="mx-auto mb-2 text-[var(--color-gold)]"/>
                      <p className="text-2xl font-black text-zinc-900 dark:text-white">{stat.value}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
