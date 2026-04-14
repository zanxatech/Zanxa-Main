/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  CheckCircle, XCircle, Clock, User, BookOpen, Award, Loader2,
  Upload, ExternalLink, RefreshCw, ChevronDown
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

interface AdminApprovalsTabProps {
  apiUrl: string;
}

type ApprovalView = "enrollments" | "certificates";

export default function AdminApprovalsTab({ apiUrl }: AdminApprovalsTabProps) {
  const { user }: any = useAuth();
  const [view, setView] = useState<ApprovalView>("enrollments");
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pdfFiles, setPdfFiles] = useState<Record<string, string>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.backendToken}`
  };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [enrollRes, certRes] = await Promise.all([
        fetch(`${apiUrl}/services/courses/enrollments/pending`, { headers }),
        fetch(`${apiUrl}/services/courses/certificates/pending`, { headers })
      ]);
      const enrollData = await enrollRes.json();
      const certData = await certRes.json();
      setEnrollments(enrollData.enrollments || []);
      setCertificates(certData.certificates || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleEnrollment = async (enrollmentId: string, status: "APPROVED" | "REJECTED", reason?: string) => {
    setActionLoading(enrollmentId);
    try {
      const res = await fetch(`${apiUrl}/services/courses/enrollments/${enrollmentId}`, {
        method: "PATCH", headers,
        body: JSON.stringify({ status, rejectionReason: reason })
      });
      if (res.ok) {
        setEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
      } else {
        const d = await res.json();
        alert(d.error || "Action failed");
      }
    } finally { setActionLoading(null); }
  };

  const handleCertificate = async (certId: string, status: "APPROVED" | "REJECTED") => {
    setActionLoading(certId);
    try {
      const pdfUrl = pdfFiles[certId] || undefined;
      if (status === "APPROVED" && !pdfUrl) {
        if (!confirm("Approve without uploading a certificate PDF? The user will see an approved status but no download link.")) {
          setActionLoading(null);
          return;
        }
      }
      const res = await fetch(`${apiUrl}/services/courses/certificates/${certId}`, {
        method: "PATCH", headers,
        body: JSON.stringify({ status, pdfUrl })
      });
      if (res.ok) {
        setCertificates(prev => prev.filter(c => c.id !== certId));
        const newPdfs = { ...pdfFiles };
        delete newPdfs[certId];
        setPdfFiles(newPdfs);
      } else {
        const d = await res.json();
        alert(d.error || "Action failed");
      }
    } finally { setActionLoading(null); }
  };

  const handlePdfFile = (certId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPdfFiles(prev => ({ ...prev, [certId]: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, string> = {
      WAITING_APPROVAL: "bg-yellow-900/30 text-yellow-400 border-yellow-700/30",
      PAYMENT_SUBMITTED: "bg-blue-900/30 text-blue-400 border-blue-700/30",
      PENDING_PAYMENT: "bg-zinc-800 text-zinc-400 border-zinc-700",
    };
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${map[status] || "bg-zinc-800 text-zinc-400"}`}>
        <Clock size={10}/> {status.replace(/_/g, " ")}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab switcher */}
      <div className="flex items-center gap-4">
        <div className="flex bg-zinc-900 rounded-2xl p-1 border border-zinc-800">
          {(["enrollments", "certificates"] as ApprovalView[]).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                view === v ? 'bg-[var(--color-gold)] text-zinc-900' : 'text-zinc-400 hover:text-white'
              }`}>
              {v === "enrollments" ? <><BookOpen size={14}/> Enrollments <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${view === v ? 'bg-zinc-900 text-[var(--color-gold)]' : 'bg-zinc-800 text-zinc-300'}`}>{enrollments.length}</span></> : <><Award size={14}/> Certificates <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${view === v ? 'bg-zinc-900 text-[var(--color-gold)]' : 'bg-zinc-800 text-zinc-300'}`}>{certificates.length}</span></>}
            </button>
          ))}
        </div>
        <button onClick={fetchAll} disabled={loading} className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""}/>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[var(--color-gold)]" size={36}/></div>
      ) : view === "enrollments" ? (
        /* ─── ENROLLMENTS ─── */
        <div className="space-y-4">
          {enrollments.length === 0 ? (
            <div className="py-24 text-center">
              <CheckCircle className="mx-auto mb-4 text-green-500/30" size={64}/>
              <p className="text-zinc-600 font-bold uppercase tracking-widest text-sm">All caught up — no pending enrollments</p>
            </div>
          ) : (
            enrollments.map(enrollment => (
              <div key={enrollment.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {enrollment.user?.avatar ? (
                        <img src={enrollment.user.avatar} alt={enrollment.user.name} className="w-full h-full object-cover"/>
                      ) : (
                        <User size={20} className="text-zinc-500"/>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white">{enrollment.user?.name}</p>
                      <p className="text-zinc-500 text-xs">{enrollment.user?.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Course</p>
                    <p className="text-white font-bold text-sm">{enrollment.course?.title}</p>
                    <p className="text-[var(--color-gold)] font-black text-sm">₹{enrollment.course?.price?.toLocaleString()}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <StatusBadge status={enrollment.status}/>
                    {enrollment.payment && (
                      <span className="text-xs text-zinc-500">Payment ID: {enrollment.payment.razorpayPaymentId || "—"}</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      disabled={actionLoading === enrollment.id}
                      onClick={() => handleEnrollment(enrollment.id, "APPROVED")}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black text-xs flex items-center gap-1.5 transition-all disabled:opacity-50">
                      {actionLoading === enrollment.id ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle size={14}/>}
                      Approve
                    </button>
                    <button
                      disabled={actionLoading === enrollment.id}
                      onClick={() => {
                        const reason = prompt("Rejection reason (optional):");
                        handleEnrollment(enrollment.id, "REJECTED", reason || undefined);
                      }}
                      className="px-4 py-2 bg-red-900/40 hover:bg-red-900/70 text-red-400 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 border border-red-800/50">
                      <XCircle size={14}/> Reject
                    </button>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-zinc-800 text-xs text-zinc-600">
                  Requested: {new Date(enrollment.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* ─── CERTIFICATES ─── */
        <div className="space-y-4">
          {certificates.length === 0 ? (
            <div className="py-24 text-center">
              <Award className="mx-auto mb-4 text-[var(--color-gold)]/20" size={64}/>
              <p className="text-zinc-600 font-bold uppercase tracking-widest text-sm">No certificate approvals pending</p>
            </div>
          ) : (
            certificates.map(cert => (
              <div key={cert.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20 flex items-center justify-center flex-shrink-0">
                      <Award size={20} className="text-[var(--color-gold)]"/>
                    </div>
                    <div>
                      <p className="font-bold text-white">{cert.user?.name}</p>
                      <p className="text-zinc-500 text-xs">{cert.user?.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Course Completed</p>
                    <p className="text-white font-bold text-sm">{cert.course?.title}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-yellow-900/30 text-yellow-400 border border-yellow-700/30 font-black">
                      <Clock size={10}/> WAITING APPROVAL
                    </span>
                  </div>

                  {/* PDF Upload */}
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Certificate PDF (optional)</p>
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      ref={el => { fileRefs.current[cert.id] = el; }}
                      onChange={e => handlePdfFile(cert.id, e)}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileRefs.current[cert.id]?.click()}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                        pdfFiles[cert.id] ? 'bg-green-900/30 border-green-700/40 text-green-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                      }`}>
                      <Upload size={14}/> {pdfFiles[cert.id] ? "PDF Selected ✓" : "Upload Certificate"}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      disabled={actionLoading === cert.id}
                      onClick={() => handleCertificate(cert.id, "APPROVED")}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black text-xs flex items-center gap-1.5 transition-all disabled:opacity-50">
                      {actionLoading === cert.id ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle size={14}/>}
                      Approve
                    </button>
                    <button
                      disabled={actionLoading === cert.id}
                      onClick={() => handleCertificate(cert.id, "REJECTED")}
                      className="px-4 py-2 bg-red-900/40 hover:bg-red-900/70 text-red-400 rounded-xl font-black text-xs flex items-center gap-1.5 border border-red-800/50 transition-all disabled:opacity-50">
                      <XCircle size={14}/> Reject
                    </button>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-zinc-800 text-xs text-zinc-600">
                  Quiz passed · Certificate requested: {new Date(cert.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
