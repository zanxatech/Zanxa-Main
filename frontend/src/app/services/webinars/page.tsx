"use client";

import React, { useState } from "react";
import { Video, Users, Mic, MonitorUp, Settings, Copy, Plus, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function WebinarsPage() {
  const router = useRouter();
  const { user }: any = useAuth();
  const [meetingCode, setMeetingCode] = useState("");
  const [name, setName] = useState(user?.name || "");
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";

  const handleCreateMeeting = async () => {
    if (!user) {
      alert("Please login to host a meeting");
      router.push("/auth/login");
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/services/webinars/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.backendToken}`
        },
        body: JSON.stringify({ title: `${user.name}'s Meeting` })
      });
      
      if (res.ok) {
        const data = await res.json();
        router.push(`/services/webinars/room/${data.meeting.meetingCode}`);
      } else {
        alert("Failed to create meeting");
      }
    } catch (e) {
      alert("Network error. Try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalCode = meetingCode.trim();
    
    // Smart Extract: If user pasted a full URL, get the part after /room/
    if (finalCode.includes("/room/")) {
      finalCode = finalCode.split("/room/").pop() || finalCode;
    }
    
    if (!finalCode) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/services/webinars/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.backendToken || ""}`
        },
        body: JSON.stringify({ meetingCode: finalCode })
      });
      
      if (res.ok) {
        router.push(`/services/webinars/room/${finalCode}`);
      } else {
        // Fallback: If join endpoint fails (maybe guest?), try direct navigation
        router.push(`/services/webinars/room/${finalCode}`);
      }
    } catch (e) {
      // Catch-all: If backend is down, try direct navigation anyway
      router.push(`/services/webinars/room/${finalCode}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 transition-colors">
      
      {/* Hero Section */}
      <div className="bg-[var(--color-royal-brown)] dark:bg-zinc-900 text-white pt-24 pb-32 px-6 relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-[var(--color-gold)] rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 bg-zinc-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16 relative z-10">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-semibold mb-6 border border-white/20">
              <Video size={16} className="text-[var(--color-gold)]" /> No Login Required
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold font-heading mb-6 leading-tight">Instant <span className="text-[var(--color-gold)]">Webinars</span> & Collaboration</h1>
            <p className="text-xl text-white/80 mb-10 max-w-xl">
              Host secure, high-quality video meetings right from your browser. Perfect for growth sessions, team syncs, and client pitches.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleCreateMeeting}
                disabled={isLoading}
                className="px-8 py-4 bg-[var(--color-gold)] text-zinc-900 font-bold rounded-full hover:bg-white transition-colors flex items-center justify-center gap-2 shadow-xl"
              >
                <Plus size={20} /> New Meeting
              </button>
            </div>
          </div>

          {/* Join Form Panel */}
          <div className="w-full max-w-md bg-white dark:bg-zinc-800 p-8 rounded-3xl shadow-2xl">
            <h3 className="text-2xl font-bold font-heading text-[var(--color-royal-brown)] dark:text-white mb-6">Join a Session</h3>
            <form onSubmit={handleJoinMeeting} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-300 mb-2">Your Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-300 mb-2">Meeting ID or Link</label>
                <input 
                  type="text" 
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
                  placeholder="abc-1234"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-4 mt-2 bg-zinc-900 dark:bg-[var(--color-gold)] text-white dark:text-zinc-900 font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-white transition-colors flex items-center justify-center gap-2"
              >
                Join Now <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Features Overview */}
      <div className="py-24 px-6 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
             <h2 className="text-4xl font-bold font-heading text-[var(--color-royal-brown)] dark:text-white mb-4">Enterprise-grade features</h2>
             <p className="text-zinc-500 max-w-2xl mx-auto">Everything you need for a smooth and productive webinar session.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <div className="w-14 h-14 bg-[var(--color-gold)]/10 text-[var(--color-gold)] rounded-xl flex items-center justify-center mb-6">
                <MonitorUp size={24} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Screen Sharing</h3>
              <p className="text-zinc-500 dark:text-zinc-400">Present your slides, code, or applications with high-resolution screen sharing built directly into the browser.</p>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <div className="w-14 h-14 bg-[var(--color-gold)]/10 text-[var(--color-gold)] rounded-xl flex items-center justify-center mb-6">
                <Mic size={24} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Crystal Clear Audio</h3>
              <p className="text-zinc-500 dark:text-zinc-400">Advanced noise suppression and echo cancellation ensures your voice is heard perfectly every time.</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <div className="w-14 h-14 bg-[var(--color-gold)]/10 text-[var(--color-gold)] rounded-xl flex items-center justify-center mb-6">
                <Settings size={24} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Host Controls</h3>
              <p className="text-zinc-500 dark:text-zinc-400">Add optional passwords to your rooms, manage participant microphones, and secure your session.</p>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
