"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Folder, FolderOpen, Lock, MonitorSmartphone, Code, CheckCircle, ChevronRight, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function WebDevServicePage() {
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-zinc-950">
        <Loader2 className="w-12 h-12 text-[var(--color-gold)] animate-spin mb-4" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Accessing Project Repository...</p>
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
                  {!user && (
                    <Link href={`/auth/login?redirect=/services/webdev`} className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full font-bold flex items-center gap-2 hover:opacity-80 transition-opacity">
                      <Lock size={16} /> Unlock Full View
                    </Link>
                  )}
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
                  <h3 className="text-2xl font-bold text-[var(--color-royal-brown)] dark:text-white mb-4">Want something similar?</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-xl mx-auto">We can build a tailored solution like {project.name} matching your brand guidelines and business logic.</p>
                  <Link href="/services/webdev/contact" className="inline-flex items-center justify-center px-8 py-4 bg-[var(--color-royal-brown)] dark:bg-[var(--color-gold)] text-white dark:text-zinc-900 rounded-full font-bold hover:-translate-y-1 transition-transform shadow-xl">
                    Request a Proposal
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
