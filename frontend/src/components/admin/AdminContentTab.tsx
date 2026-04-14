/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { BookOpen, Globe, Palette, Video } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AdminLMSTab from "./AdminLMSTab";
import AdminWebDevTab from "./AdminWebDevTab";
import AdminCreativeTab from "./AdminCreativeTab";
import AdminWebinarTab from "./AdminWebinarTab";

interface AdminContentTabProps {
  apiUrl: string;
}

export default function AdminContentTab({ apiUrl }: AdminContentTabProps) {
  const { user }: any = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<"lms" | "webdev" | "creative" | "webinars">("lms");

  const tabs = [
    { id: "lms", label: "LMS Courses", icon: <BookOpen size={16}/> },
    { id: "webdev", label: "Web Development", icon: <Globe size={16}/> },
    { id: "creative", label: "Creative Templates", icon: <Palette size={16}/> },
    { id: "webinars", label: "Webinars", icon: <Video size={16}/> },
  ];

  return (
    <div className="space-y-8">
      {/* Sub-Tab Navigation */}
      <div className="flex flex-wrap gap-4 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeSubTab === tab.id 
                ? 'bg-[var(--color-gold)] text-zinc-900 shadow-lg shadow-yellow-500/10' 
                : 'text-zinc-500 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Render Active Sub-Tab */}
      <div className="min-h-[500px]">
        {activeSubTab === "lms" && <AdminLMSTab apiUrl={apiUrl} user={user} />}
        {activeSubTab === "webdev" && <AdminWebDevTab apiUrl={apiUrl} user={user} />}
        {activeSubTab === "creative" && <AdminCreativeTab apiUrl={apiUrl} user={user} />}
        {activeSubTab === "webinars" && <AdminWebinarTab apiUrl={apiUrl} user={user} />}
      </div>
    </div>
  );
}
