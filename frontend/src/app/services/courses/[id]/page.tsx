/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  CheckCircle2, Lock, ShieldAlert, Award, Loader2, IndianRupee, Clock as ClockIcon,
  ChevronDown, ChevronUp, Play, Star, CheckSquare, AlertCircle, Download, XCircle
} from "lucide-react";

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user, loading: authLoading }: any = useAuth();
  const { id } = use(params);

  const [course, setCourse] = useState<any>(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState<string | null>(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const [activeVideo, setActiveVideo] = useState<any>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [certificate, setCertificate] = useState<any>(null);
  const [progressPct, setProgressPct] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalModules, setTotalModules] = useState(0);
  const [markingComplete, setMarkingComplete] = useState<string | null>(null);
  const [allCompleted, setAllCompleted] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.backendToken}`
  });

  useEffect(() => {
    if (id) fetchCourse();
  }, [id, user?.backendToken]);

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const headers: any = {};
      if (user?.backendToken) headers.Authorization = `Bearer ${user.backendToken}`;

      const res = await fetch(`${API_URL}/services/courses/${id}`, { headers });
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();

      setCourse(data.course);
      setIsPurchased(data.isPurchased);
      setEnrollmentStatus(data.enrollmentStatus);
      setProgress(data.progress || []);

      if (data.isPurchased) {
        // Fetch full course with video URLs
        const fullRes = await fetch(`${API_URL}/services/courses/${id}/full`, { headers });
        if (fullRes.ok) {
          const fullData = await fullRes.json();
          setCourse(fullData.course);
          setProgressPct(fullData.progressPct);
          setCompletedCount(fullData.completedModules);
          setTotalModules(fullData.totalModules);
          setAllCompleted(fullData.completedModules === fullData.totalModules && fullData.totalModules > 0);

          // Auto-open first module
          if (fullData.course.modules?.[0]) {
            setExpandedModules([fullData.course.modules[0].id]);
            if (fullData.course.modules[0].videoUrl) {
              setActiveVideo(fullData.course.modules[0]);
            }
          }
        }

        // Fetch certificate status
        const certRes = await fetch(`${API_URL}/services/courses/${id}/certificate`, { headers });
        if (certRes.ok) {
          const certData = await certRes.json();
          setCertificate(certData.certificate);
        }
      }
    } catch (err) {
      console.error("Course fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const markModuleComplete = async (moduleId: string) => {
    if (markingComplete) return;
    setMarkingComplete(moduleId);
    try {
      const res = await fetch(`${API_URL}/services/courses/modules/${moduleId}/complete`, {
        method: "POST",
        headers: authHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setProgressPct(data.progressPct);
        setCompletedCount(data.completedModules);
        setTotalModules(data.totalModules);
        setAllCompleted(data.allCompleted);
        // Update local progress state
        setProgress(prev => {
          const existing = prev.find(p => p.moduleId === moduleId);
          if (existing) return prev.map(p => p.moduleId === moduleId ? {...p, completed: true} : p);
          return [...prev, { moduleId, completed: true }];
        });
      }
    } finally { setMarkingComplete(null); }
  };

  const isModuleCompleted = (moduleId: string) =>
    progress.some(p => p.moduleId === moduleId && p.completed);

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

  const handleEnrollment = async () => {
    if (!user?.backendToken) {
      router.push("/auth/login");
      return;
    }
    setEnrolling(true);
    try {
      const isLoaded = await loadRazorpay();
      if (!isLoaded) throw new Error("Payment gateway failed to load");

      // Initialize enrollment
      const enrollRes = await fetch(`${API_URL}/services/courses/${id}/enroll`, {
        method: "POST", headers: authHeaders()
      });
      const enrollData = await enrollRes.json();
      if (!enrollRes.ok) throw new Error(enrollData.error);

      // Create Razorpay order
      const orderRes = await fetch(`${API_URL}/payments/create-order`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ amount: course.price, enrollmentId: enrollData.enrollment.id })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      // Launch Razorpay
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.razorpayOrderId,
        name: "ZANXA TECH ACADEMY",
        description: course.title,
        theme: { color: "#D4AF37" },
        handler: async function (response: any) {
          const verifyRes = await fetch(`${API_URL}/payments/verify`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentId: orderData.paymentId
            })
          });
          if (verifyRes.ok) {
            setShowEnrollModal(false);
            setEnrollmentStatus("WAITING_APPROVAL");
            fetchCourse();
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      alert(err.message || "Payment failed");
    } finally {
      setEnrolling(false);
      setShowEnrollModal(false);
    }
  };

  // ─── STATUS BANNER ─────────────────────────────────────────────────────────
  const renderStatusBanner = () => {
    if (!enrollmentStatus || isPurchased) return null;
    const configs: Record<string, { color: string; icon: any; msg: string }> = {
      WAITING_APPROVAL: {
        color: "bg-yellow-900/30 border-yellow-700/40 text-yellow-400",
        icon: ClockIcon, msg: "Payment received. Waiting for Admin approval to grant access."
      },
      PAYMENT_SUBMITTED: {
        color: "bg-blue-900/30 border-blue-700/40 text-blue-400",
        icon: ClockIcon, msg: "Payment submitted. Admin is reviewing your enrollment."
      },
      REJECTED: {
        color: "bg-red-900/30 border-red-700/40 text-red-400",
        icon: XCircle, msg: "Your enrollment was rejected. Contact support for assistance."
      }
    };
    const cfg = configs[enrollmentStatus];
    if (!cfg) return null;
    const Icon = cfg.icon;
    return (
      <div className={`flex items-center gap-3 p-4 rounded-2xl border ${cfg.color} mb-6`}>
        <Icon size={18}/>
        <p className="text-sm font-bold">{cfg.msg}</p>
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <Loader2 className="w-12 h-12 text-[var(--color-gold)] animate-spin" />
    </div>
  );

  if (!course) return (
    <div className="min-h-screen pt-32 flex flex-col items-center justify-center bg-zinc-950 text-white gap-4">
      <AlertCircle size={48} className="text-red-500"/>
      <p className="text-xl font-bold">Course not found</p>
      <Link href="/services/courses" className="text-[var(--color-gold)] underline">Back to Courses</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pb-32">
      {/* ─── HERO / VIDEO STAGE ─────────────────────────────────────────── */}
      <div className={`relative bg-[var(--color-royal-brown)] dark:bg-zinc-900 text-white overflow-hidden ${isPurchased && activeVideo ? 'pt-6 pb-6' : 'pt-28 pb-20'} px-6`}>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[var(--color-gold)] opacity-[0.03] skew-x-12 translate-x-20"/>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Active video player */}
          {isPurchased && activeVideo && (
            <div className="space-y-4 mb-4">
              <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl">
                {activeVideo.videoType === "YOUTUBE" ? (
                  <iframe src={activeVideo.videoUrl} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"/>
                ) : (
                  <video src={activeVideo.videoUrl} controls className="w-full h-full"/>
                )}
              </div>
              {/* Mark complete button */}
              {!isModuleCompleted(activeVideo.id) && (
                <button
                  onClick={() => markModuleComplete(activeVideo.id)}
                  disabled={markingComplete === activeVideo.id}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50">
                  {markingComplete === activeVideo.id ? <Loader2 size={14} className="animate-spin"/> : <CheckSquare size={14}/>}
                  Mark as Completed
                </button>
              )}
              {isModuleCompleted(activeVideo.id) && (
                <div className="flex items-center gap-2 text-green-400 font-bold text-sm">
                  <CheckCircle2 size={18}/> Module completed
                </div>
              )}
            </div>
          )}

          {/* Course info (when no video playing or not purchased) */}
          {(!isPurchased || !activeVideo) && (
            <div className="flex flex-col lg:flex-row gap-12 items-start">
              <div className="flex-[2]">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--color-gold)] text-zinc-950 font-black text-[10px] rounded-full uppercase tracking-widest mb-5">
                  Premium Course
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold font-heading mb-5 tracking-tighter leading-tight">{course.title}</h1>
                <p className="text-lg opacity-60 max-w-2xl leading-relaxed mb-8 italic">"{course.description}"</p>
                <div className="flex flex-wrap gap-6 font-bold text-xs uppercase tracking-widest text-[var(--color-gold)]">
                  <span className="flex items-center gap-2"><Award size={16}/> Certificate Included</span>
                  <span className="flex items-center gap-2"><ShieldAlert size={16}/> Admin Verified</span>
                  <span className="flex items-center gap-2"><Star size={16}/> {course._count?.reviews || 0} Reviews</span>
                </div>
              </div>
              <div className="flex-1 w-full max-w-sm">
                <div className="bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] shadow-2xl border border-white/5">
                  <p className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] mb-1">Course Fee</p>
                  <p className="text-4xl font-black text-zinc-900 dark:text-white mb-6 flex items-center gap-1">
                    <IndianRupee size={28}/>{course.price?.toLocaleString()}
                  </p>
                  {!enrollmentStatus ? (
                    <button onClick={() => setShowEnrollModal(true)} className="w-full py-4 bg-zinc-900 dark:bg-[var(--color-gold)] text-white dark:text-zinc-950 font-black rounded-2xl uppercase text-xs tracking-widest hover:opacity-90 active:scale-95 transition-all">
                      Enroll Now
                    </button>
                  ) : enrollmentStatus === "APPROVED" ? (
                    <div className="w-full py-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 border border-green-200 dark:border-green-800">
                      <CheckCircle2 size={18}/> Enrolled & Active
                    </div>
                  ) : (
                    <div className="w-full py-4 bg-yellow-900/30 text-yellow-400 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 border border-yellow-700/30">
                      <ClockIcon size={16}/> {enrollmentStatus?.replace(/_/g, " ")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── MAIN CONTENT ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: Module List */}
        <div className="lg:col-span-2 space-y-8">
          {renderStatusBanner()}

          {/* Progress Bar (enrolled users) */}
          {isPurchased && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800">
              <div className="flex justify-between items-center mb-3">
                <p className="font-bold text-zinc-900 dark:text-white text-sm">Course Progress</p>
                <p className="font-black text-[var(--color-gold)]">{progressPct}%</p>
              </div>
              <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--color-gold)] to-yellow-400 rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-2 font-medium">{completedCount}/{totalModules} modules completed</p>
            </div>
          )}

          {/* Modules */}
          <div>
            <h2 className="text-3xl font-bold font-heading text-zinc-900 dark:text-white mb-8 tracking-tight">
              Curriculum
            </h2>
            <div className="space-y-3">
              {course.modules?.map((mod: any, i: number) => {
                const isExpanded = expandedModules.includes(mod.id);
                const isCompleted = isModuleCompleted(mod.id);
                const isActive = activeVideo?.id === mod.id;
                return (
                  <div key={mod.id} className={`bg-white dark:bg-zinc-900 rounded-2xl border transition-all ${isActive ? 'border-[var(--color-gold)]/50' : 'border-zinc-100 dark:border-zinc-800'}`}>
                    <button
                      onClick={() => setExpandedModules(prev =>
                        prev.includes(mod.id) ? prev.filter(x => x !== mod.id) : [...prev, mod.id]
                      )}
                      className="w-full p-5 flex items-center gap-4 text-left"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                        isCompleted ? 'bg-green-500 text-white' : 'bg-[var(--color-gold)]/10 text-[var(--color-gold)]'
                      }`}>
                        {isCompleted ? <CheckCircle2 size={18}/> : i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-zinc-900 dark:text-white">{mod.title}</p>
                        {mod.description && <p className="text-xs text-zinc-500 mt-0.5">{mod.description}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          {mod.videoUrl ? (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              mod.videoType === 'YOUTUBE' ? 'bg-red-900/20 text-red-400' : 'bg-blue-900/20 text-blue-400'
                            }`}>{mod.videoType}</span>
                          ) : (
                            <span className="text-[10px] text-zinc-600">No video</span>
                          )}
                        </div>
                      </div>
                      {isCompleted && <CheckCircle2 size={16} className="text-green-500 flex-shrink-0"/>}
                      {!isPurchased && <Lock size={14} className="text-zinc-400 flex-shrink-0"/>}
                      {isExpanded ? <ChevronUp size={18} className="text-zinc-400 flex-shrink-0"/> : <ChevronDown size={18} className="text-zinc-400 flex-shrink-0"/>}
                    </button>

                    {isExpanded && isPurchased && mod.videoUrl && (
                      <div className="px-5 pb-5">
                        <button
                          onClick={() => setActiveVideo(mod)}
                          className={`w-full py-3 rounded-xl flex items-center gap-3 px-4 font-bold text-sm transition-all ${
                            isActive ? 'bg-[var(--color-gold)] text-zinc-900' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                          }`}>
                          <Play size={16} className={isActive ? 'fill-current' : ''}/>
                          {isActive ? "Now Playing" : "Watch Lesson"}
                        </button>
                      </div>
                    )}

                    {isExpanded && !isPurchased && (
                      <div className="px-5 pb-4">
                        <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3">
                          <Lock size={14}/> Enroll to unlock this module
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {(!course.modules || course.modules.length === 0) && (
                <p className="text-zinc-500 text-center py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  Modules coming soon...
                </p>
              )}
            </div>
          </div>

          {/* Reviews */}
          <div>
            <h2 className="text-3xl font-bold font-heading text-zinc-900 dark:text-white mb-8 tracking-tight">
              Student Reviews
            </h2>
            {course.reviews?.length > 0 ? (
              <div className="space-y-4">
                {course.reviews.map((rev: any) => (
                  <div key={rev.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-[var(--color-gold)]">
                        {rev.user?.avatar ? <img src={rev.user.avatar} className="w-full h-full object-cover" alt=""/> : rev.user?.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white text-sm">{rev.user?.name}</p>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12} className={i < rev.rating ? 'text-[var(--color-gold)] fill-current' : 'text-zinc-600'}/>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400 italic text-sm">"{rev.comment}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-zinc-500 py-10 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm">
                No reviews yet — be the first!
              </p>
            )}

            {/* Write Review (enrolled + approved) */}
            {isPurchased && (
              <form
                className="mt-6 bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as any;
                  const res = await fetch(`${API_URL}/services/courses/${id}/reviews`, {
                    method: "POST", headers: authHeaders(),
                    body: JSON.stringify({ rating: parseInt(form.rating.value), comment: form.comment.value })
                  });
                  if (res.ok) { form.reset(); fetchCourse(); }
                  else { const d = await res.json(); alert(d.error); }
                }}>
                <p className="font-bold text-zinc-900 dark:text-white">Leave a Review</p>
                <select name="rating" className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold focus:outline-none">
                  <option value="5">⭐⭐⭐⭐⭐ Outstanding</option>
                  <option value="4">⭐⭐⭐⭐ Excellent</option>
                  <option value="3">⭐⭐⭐ Good</option>
                  <option value="2">⭐⭐ Fair</option>
                  <option value="1">⭐ Poor</option>
                </select>
                <textarea name="comment" required rows={3} placeholder="Share your experience..." className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none"/>
                <button type="submit" className="px-6 py-3 bg-[var(--color-gold)] text-zinc-900 rounded-xl font-black text-xs uppercase tracking-widest">Submit Review</button>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quiz Access */}
          {isPurchased && (
            <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl border border-[var(--color-gold)]/20 p-6 text-center space-y-4">
              <Award size={36} className="mx-auto text-[var(--color-gold)]"/>
              <h3 className="text-xl font-bold text-white">Certification Exam</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Complete all {totalModules} modules, then take the 10-question exam. Score 7/10 to earn your certificate.
              </p>
              {allCompleted ? (
                <Link href={`/services/courses/${id}/quiz`} className="block w-full py-3 bg-[var(--color-gold)] text-zinc-900 rounded-xl font-black uppercase text-xs tracking-widest hover:opacity-90 transition-all">
                  Start Qualification Exam
                </Link>
              ) : (
                <div className="py-3 bg-zinc-800 text-zinc-500 rounded-xl font-black uppercase text-xs tracking-widest">
                  Complete all modules first
                </div>
              )}
            </div>
          )}

          {/* Certificate Status */}
          {certificate && (
            <div className={`rounded-2xl border p-6 text-center space-y-3 ${
              certificate.status === "APPROVED" ? "bg-green-900/20 border-green-700/30" :
              certificate.status === "WAITING_APPROVAL" ? "bg-yellow-900/20 border-yellow-700/30" :
              "bg-zinc-900 border-zinc-800"
            }`}>
              <Award size={28} className={certificate.status === "APPROVED" ? "mx-auto text-green-400" : "mx-auto text-yellow-400"}/>
              <p className="font-black text-white text-sm uppercase tracking-widest">
                {certificate.status === "APPROVED" ? "Certificate Ready!" :
                 certificate.status === "WAITING_APPROVAL" ? "Awaiting Approval" : "Certificate Requested"}
              </p>
              {certificate.status === "APPROVED" && certificate.pdfUrl ? (
                <a href={certificate.pdfUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 hover:bg-green-400 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                  <Download size={14}/> Download Certificate
                </a>
              ) : certificate.status === "APPROVED" ? (
                <p className="text-green-400 text-xs font-bold">Your certificate has been approved! Contact admin for the PDF.</p>
              ) : (
                <p className="text-yellow-400/80 text-xs">Admin will review and issue your certificate shortly.</p>
              )}
            </div>
          )}

          {/* Learning Outcomes */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800">
            <h4 className="font-bold text-zinc-900 dark:text-white mb-4 text-sm">What You'll Learn</h4>
            <ul className="space-y-3">
              {["Expert-level knowledge", "Project-based learning", "Industry certification", "Career advancement skills"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <CheckCircle2 size={14} className="text-[var(--color-gold)] flex-shrink-0"/>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Enrollment Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/95 backdrop-blur-2xl flex items-center justify-center p-6">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] p-10 border border-white/5 shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--color-gold)] to-yellow-500 rounded-t-[2.5rem]"/>
            <button onClick={() => setShowEnrollModal(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-white text-2xl leading-none">×</button>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">Enroll in Course</h3>
            <p className="text-zinc-500 text-sm mb-8">You're enrolling in <span className="text-[var(--color-gold)] font-bold">{course.title}</span></p>
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-6 mb-8">
              <div className="flex justify-between text-sm font-bold mb-3">
                <span className="text-zinc-500">Course Fee</span>
                <span className="text-zinc-900 dark:text-white">₹{course.price?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-3 border-t border-zinc-200 dark:border-zinc-700">
                <span className="text-zinc-900 dark:text-white font-black">Total</span>
                <span className="text-[var(--color-gold)] font-black text-lg">₹{course.price?.toLocaleString()}</span>
              </div>
            </div>
            <button onClick={handleEnrollment} disabled={enrolling}
              className="w-full py-4 bg-[var(--color-gold)] text-zinc-900 font-black rounded-2xl uppercase text-xs tracking-widest flex items-center justify-center gap-2 disabled:opacity-50">
              {enrolling ? <Loader2 className="animate-spin" size={18}/> : <><IndianRupee size={16}/> Pay & Enroll</>}
            </button>
            <p className="text-[10px] text-zinc-500 text-center mt-4">Powered by Razorpay · Admin approval required after payment</p>
          </div>
        </div>
      )}
    </div>
  );
}
