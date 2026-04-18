/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PlayCircle, ShieldCheck, Award, Clock, Loader2, Sparkles, Star, Users } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch(`${API_URL}/services/courses`);
        const data = await res.json();
        setCourses(data.courses || []);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950">
        <Loader2 className="w-12 h-12 text-[var(--color-gold)] animate-spin mb-4" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Loading Academy Vault...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors pt-12 pb-24">
      {/* Hero Header */}
      <div className="relative bg-[var(--color-royal-brown)] dark:bg-zinc-900 py-24 px-6 mb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"/>
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-gold)]/10 rounded-full blur-3xl"/>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-gold)]/10 text-[var(--color-gold)] rounded-full font-black text-[10px] uppercase tracking-widest mb-6 border border-[var(--color-gold)]/20">
            <ShieldCheck size={14}/> Certified Training Programs
          </div>
          <h1 className="text-5xl md:text-7xl font-bold font-heading text-white mb-6 tracking-tighter">
            Mastercourse Academy
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-white/60 leading-relaxed">
            Professional-grade video courses with certification, quiz assessments, and lifetime access. 
            Enroll, learn, and prove your expertise.
          </p>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="max-w-7xl mx-auto px-6">
        {courses.length === 0 ? (
          <div className="py-40 text-center">
            <Sparkles size={80} className="mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
            <p className="text-2xl font-bold font-heading text-zinc-400 uppercase tracking-widest">
              New Mastercourses Arriving Soon
            </p>
            <p className="text-zinc-500 mt-3 text-sm">Check back shortly — our team is preparing premium content.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {courses.map(course => (
              <div key={course.id} className="flex flex-col bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden border border-zinc-100 dark:border-zinc-800 hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-black/40 hover:-translate-y-2 transition-all duration-500 group">
                {/* Thumbnail */}
                <div className="relative w-full h-52 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-royal-brown)] to-zinc-800">
                      <PlayCircle className="text-[var(--color-gold)] opacity-40" size={56}/>
                    </div>
                  )}
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <PlayCircle className="text-white w-16 h-16 drop-shadow-xl" />
                  </div>
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-[var(--color-gold)] text-zinc-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                      Live
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white/90 flex items-center gap-1">
                    <Users size={10}/> {course._count?.enrollments || 0}
                  </div>
                </div>

                <div className="p-8 flex flex-col flex-1">
                  <h2 className="text-xl font-bold font-heading text-zinc-900 dark:text-white mb-3 line-clamp-2 tracking-tight">
                    {course.title}
                  </h2>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-5 flex-1 line-clamp-3 leading-relaxed">
                    {course.description}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="flex items-center gap-1.5"><Clock size={12} className="text-[var(--color-gold)]"/> Self-Paced</span>
                    <span className="flex items-center gap-1.5"><Award size={12} className="text-[var(--color-gold)]"/> Certificate</span>
                    <span className="flex items-center gap-1.5"><Star size={12} className="text-[var(--color-gold)]"/> {course._count?.reviews || 0} Reviews</span>
                  </div>

                  {/* Price + CTA */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-0.5">Tuition</p>
                      <p className="text-3xl font-black text-zinc-900 dark:text-white">
                        ₹{course.price?.toLocaleString()}
                      </p>
                    </div>
                    <Link
                      href={`/services/courses/${course.id}`}
                      className="px-8 py-3.5 bg-zinc-900 dark:bg-[var(--color-gold)] text-white dark:text-zinc-900 font-black rounded-2xl text-xs uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-lg"
                    >
                      View Course
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
