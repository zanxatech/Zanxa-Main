/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Search, Lock, ShoppingCart, Loader2, Palette, IndianRupee, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function CreativeGalleryPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string>("All");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/services/creative/gallery`);
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error("Gallery fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFolders = categories
    .filter(cat => activeCategoryId === "All" || cat.id === activeCategoryId)
    .flatMap(cat => cat.folders.map((f: any) => ({ ...f, categoryTitle: cat.title })))
    .filter(folder => folder.folderNumber.toLowerCase().includes(searchQuery.toLowerCase()) || folder.categoryTitle.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <Loader2 className="w-12 h-12 text-[var(--color-gold)] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black transition-colors pt-32 pb-32">
      {/* Premium Header */}
      <div className="max-w-7xl mx-auto px-8 mb-20 text-center">
        <div className="inline-flex items-center gap-2 px-6 py-2 bg-[var(--color-gold)]/10 text-[var(--color-gold)] rounded-full text-xs font-black uppercase tracking-widest mb-8 border border-[var(--color-gold)]/20 animate-pulse">
           Visual Excellence Market
        </div>
        <h1 className="text-6xl md:text-8xl font-bold font-heading text-zinc-950 dark:text-white mb-8 tracking-tighter leading-none">Creative Vault</h1>
        <p className="max-w-3xl mx-auto text-xl text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed italic">
          "Bespoke visual strategies for elite brands. Browse our repository of pre-engineered design concepts."
        </p>
      </div>

      {/* Filters & Search - Premium UI */}
      <div className="max-w-7xl mx-auto px-8 mb-16 flex flex-col lg:flex-row justify-between items-center gap-10">
        <div className="flex bg-white dark:bg-zinc-900 rounded-[2.5rem] p-2 border border-zinc-200 dark:border-zinc-800 w-full lg:w-auto overflow-x-auto scrollbar-hide shadow-xl">
          <button
            onClick={() => setActiveCategoryId("All")}
            className={`px-8 py-3 rounded-3xl text-xs font-black uppercase tracking-widest transition-all ${activeCategoryId === "All" ? 'bg-[var(--color-gold)] text-zinc-950 shadow-lg' : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-white'}`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`px-8 py-3 rounded-3xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategoryId === cat.id ? 'bg-[var(--color-gold)] text-zinc-950 shadow-lg' : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-white'}`}
            >
              {cat.title}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-96 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-hover:text-[var(--color-gold)] transition-colors" />
          <input
            type="text"
            placeholder="Search the vault..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-16 pr-6 py-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] focus:outline-none focus:ring-4 focus:ring-[var(--color-gold)]/20 dark:text-white transition-all shadow-xl font-bold text-sm"
          />
        </div>
      </div>

      {/* Folders Grid */}
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
        {filteredFolders.map(folder => (
          <div key={folder.id} className="group relative flex flex-col bg-white dark:bg-zinc-900 rounded-[3rem] overflow-hidden border border-zinc-100 dark:border-zinc-800 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_32px_64px_-16px_rgba(212,175,55,0.1)] hover:-translate-y-4 transition-all duration-700">
            {/* Folder Image Stage */}
            <div className="w-full h-80 bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
              {folder.images[0] ? (
                 <img src={folder.images[0]} alt={folder.folderNumber} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-200"><Palette size={64}/></div>
              )}
              
              {/* Premium Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-500 backdrop-blur-sm p-8">
                <Lock className="w-12 h-12 text-[var(--color-gold)] mb-4 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500" />
                <div className="text-white text-center transform translate-y-8 group-hover:translate-y-0 transition-transform duration-700 delay-75">
                   <p className="font-black uppercase tracking-[0.3em] text-[10px] mb-4">Secured Content</p>
                   <Link href={`/services/creative/order?folder=${folder.id}`} className="px-10 py-4 bg-[var(--color-gold)] text-zinc-900 font-black rounded-2xl shadow-2xl flex items-center gap-3 hover:bg-white active:scale-95 transition-all text-xs uppercase tracking-widest whitespace-nowrap">
                     <ShoppingCart size={18} /> Purchase Bundle
                   </Link>
                </div>
              </div>
              
              {/* Floating Badge */}
              <div className="absolute top-6 left-6 px-4 py-2 bg-black/40 backdrop-blur-md rounded-2xl text-[var(--color-gold)] font-black text-[10px] uppercase tracking-widest border border-white/10">
                 {folder.images.length} Variants
              </div>
            </div>
            
            <div className="p-10 flex flex-col flex-1">
              <div className="text-[10px] font-black text-[var(--color-gold)] tracking-[0.3em] uppercase mb-3">{folder.categoryTitle}</div>
              <h3 className="text-3xl font-bold font-heading text-zinc-900 dark:text-white mb-6 tracking-tighter">Package #{folder.folderNumber}</h3>
              <div className="mt-auto flex justify-between items-center pt-8 border-t border-zinc-50 dark:border-zinc-800">
                <div className="flex flex-col">
                   <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Valuation</span>
                   <span className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-1"><IndianRupee size={20}/> 1,499</span>
                </div>
                <button className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl flex items-center justify-center hover:bg-[var(--color-gold)] hover:text-zinc-950 transition-all">
                   <ChevronRight size={24} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredFolders.length === 0 && (
          <div className="col-span-full py-40 text-center opacity-30">
             <Palette size={80} className="mx-auto mb-4" />
             <p className="text-2xl font-bold font-heading uppercase tracking-widest">No matching artifacts found</p>
          </div>
        )}
      </div>
    </div>
  );
}
