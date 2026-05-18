import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-beige)] dark:bg-zinc-950 p-6 transition-colors">
      <div className="w-full max-w-md bg-background dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-[var(--color-beige)] dark:border-zinc-800 transition-colors">
        <div className="p-8 sm:p-12">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-[var(--color-royal-brown)]/60 dark:text-zinc-400 hover:text-[var(--color-royal-brown)] dark:hover:text-zinc-200 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold font-heading text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] mb-2">Zanxa Tech</h1>
            <p className="text-[var(--color-royal-brown)]/60 dark:text-zinc-400 text-sm">Premium digital excellence</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
