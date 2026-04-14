/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { MessageCircle, Mail, MonitorPlay } from "lucide-react";

export default function Footer() {
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  useEffect(() => {
    const handleAdminTrigger = () => {
      setShowAdminLogin(true);
    };

    window.addEventListener("adminTriggerActivated", handleAdminTrigger);
    return () => {
      window.removeEventListener("adminTriggerActivated", handleAdminTrigger);
    };
  }, []);

  return (
    <footer className="w-full bg-[var(--color-royal-brown)] dark:bg-zinc-950 text-[var(--color-soft-white)] py-16 px-8 transition-colors mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
        
        {/* Brand */}
        <div className="flex flex-col gap-4">
          <h2 className="text-3xl font-bold font-heading text-[var(--color-gold)]">ZANXA TECH</h2>
          <p className="text-sm opacity-80 max-w-xs">
            Elevating your digital presence with premium web development, creative designs, mastercourses, and interactive webinars.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-heading font-semibold text-white">Services</h3>
          <Link href="/services/creative" className="text-sm opacity-80 hover:text-[var(--color-gold)] transition-colors">Creative & Design</Link>
          <Link href="/services/webdev" className="text-sm opacity-80 hover:text-[var(--color-gold)] transition-colors">Web Development</Link>
          <Link href="/services/courses" className="text-sm opacity-80 hover:text-[var(--color-gold)] transition-colors">Mastercourses</Link>
          <Link href="/services/webinars" className="text-sm opacity-80 hover:text-[var(--color-gold)] transition-colors">Live Webinars</Link>
        </div>

        {/* Contact Links */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-heading font-semibold text-white">Connect</h3>
          <a href="https://instagram.com/zanxa_tech" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm opacity-80 hover:text-[var(--color-gold)] transition-colors">
            📸 Instagram
          </a>
          <a href="https://linkedin.com/company/ZanxaTech" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm opacity-80 hover:text-[var(--color-gold)] transition-colors">
            💼 LinkedIn
          </a>
          <a href="https://wa.me/918870250890?text=Hello%20ZanxaTech" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm opacity-80 hover:text-[var(--color-gold)] transition-colors">
            <MessageCircle size={18} /> WhatsApp
          </a>
          <a href="mailto:zanxatech@gmail.com" className="flex items-center gap-2 text-sm opacity-80 hover:text-[var(--color-gold)] transition-colors">
            <Mail size={18} /> Email
          </a>
          <a href="https://youtube.com/@zanxatech" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm opacity-80 hover:text-[var(--color-gold)] transition-colors">
            <MonitorPlay size={18} /> YouTube
          </a>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-white/20 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm opacity-60">© {new Date().getFullYear()} Zanxa Tech. All rights reserved.</p>
        <div className="flex gap-4">
          {showAdminLogin && (
            <Link href="/auth/admin-login" className="text-xs text-[var(--color-gold)] font-bold transition-opacity">Admin Login</Link>
          )}
          <Link href="/auth/employee-login" className="text-xs opacity-40 hover:opacity-100 transition-opacity">Employee Portal</Link>
        </div>
      </div>
    </footer>
  );
}
