"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Search, Moon, Sun, Menu, X, LogOut, User as UserIcon, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value === "zanxatech@0018.#") {
      window.dispatchEvent(new CustomEvent("adminTriggerActivated"));
      setSearchQuery(""); // Clear the trigger stealthily
    }
  };

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      console.log("Searching for:", searchQuery);
    }
  };

  return (
    <header className="w-full flex flex-col md:flex-row justify-between items-center py-4 px-6 md:px-12 border-b border-[var(--color-beige)] dark:border-zinc-800 sticky top-0 bg-background/90 dark:bg-zinc-950/90 backdrop-blur-md z-50 transition-colors">
      <div className="w-full md:w-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold font-heading text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] transition-colors">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.jpeg" alt="Zanxa Tech" className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700" />
            ZANXA TECH
          </Link>
        </h1>
        <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <nav className={`${mobileMenuOpen ? "flex" : "hidden"} md:flex flex-col md:flex-row gap-6 mt-4 md:mt-0 items-center w-full md:w-auto`}>
        <Link href="/services/creative" className="text-sm font-medium hover:text-[var(--color-gold)] transition-colors">Creative</Link>
        <Link href="/services/webdev" className="text-sm font-medium hover:text-[var(--color-gold)] transition-colors">Web Dev</Link>
        <Link href="/services/courses" className="text-sm font-medium hover:text-[var(--color-gold)] transition-colors">Courses</Link>
        <Link href="/services/webinars" className="text-sm font-medium hover:text-[var(--color-gold)] transition-colors">Webinars</Link>
        
        {/* Search Bar */}
        <div className="relative flex items-center group">
          <Search className="absolute left-3 w-4 h-4 text-zinc-400 group-focus-within:text-[var(--color-gold)]" />
          <input 
            type="text" 
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchSubmit}
            className="pl-10 pr-4 py-2 w-full md:w-48 bg-zinc-100 dark:bg-zinc-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] transition-all"
          />
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")} 
            className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            {mounted ? (theme === "dark" ? <Sun size={18} /> : <Moon size={18} />) : <Moon size={18} />}
          </button>
          
          {user ? (
            <div className="flex items-center gap-4 border-l border-zinc-200 dark:border-zinc-800 pl-4">
              <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] hover:opacity-80 transition-all">
                <LayoutDashboard size={16}/> Dashboard
              </Link>
              <button 
                onClick={() => logout()} 
                className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                title="Log Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link href="/auth/login" className="px-5 py-2 text-sm font-bold text-[var(--color-royal-brown)] dark:text-zinc-200 hover:text-[var(--color-gold)] dark:hover:text-[var(--color-gold)] transition-colors">
              Log In
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
