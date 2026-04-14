import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-beige)] p-6">
      <div className="w-full max-w-md bg-background rounded-3xl shadow-xl overflow-hidden border border-[var(--color-beige)]">
        <div className="p-8 sm:p-12">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-[var(--color-royal-brown)]/60 hover:text-[var(--color-royal-brown)] transition-colors mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold font-heading text-[var(--color-royal-brown)] mb-2">Zanxa Tech</h1>
            <p className="text-[var(--color-royal-brown)]/60 text-sm">Premium digital excellence</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
