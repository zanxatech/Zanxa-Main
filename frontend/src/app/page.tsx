import Link from "next/link";
import { ArrowRight, Code, MonitorPlay, Palette, Video } from "lucide-react";
import Testimonials from "@/components/landing/Testimonials";
import FAQ from "@/components/landing/FAQ";
import BlogPreview from "@/components/landing/BlogPreview";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center bg-background font-sans w-full">
      <div className="flex flex-col w-full items-center">
        {/* Full-width ZANXA TECH header element / Logo area (Top of Hero) */}
        <div className="w-full bg-[var(--color-royal-brown)] dark:bg-zinc-950 py-12 flex flex-col items-center justify-center border-b-[4px] border-[var(--color-gold)]">
          <img src="/logo.jpeg" alt="Zanxa Tech Logo" className="w-20 h-20 md:w-28 md:h-28 rounded-full object-cover shadow-2xl mb-4 border-2 border-[var(--color-gold)]" />
          <h1 className="text-6xl md:text-[8rem] font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold)] to-[#f9f1d8] tracking-widest leading-none drop-shadow-sm text-center">
            ZANXA TECH
          </h1>
          <p className="text-[var(--color-gold)] mt-4 tracking-widest uppercase text-sm font-semibold opacity-90">
            Premium Digital Solutions
          </p>
        </div>

        {/* Hero Section */}
        <section className="w-full max-w-6xl flex flex-col items-center justify-center text-center py-24 px-6 md:py-32">
          <h2 className="text-5xl md:text-7xl font-bold font-heading text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] leading-tight mb-6 mt-4">
            Elevate Your <span className="text-[var(--color-gold)] dark:text-white">Digital Presence</span>
          </h2>
          <p className="max-w-2xl text-lg md:text-xl text-[var(--color-royal-brown)]/80 dark:text-zinc-300 mb-10">
            Premium Web Development, Stunning Creative Designs, Masterful Courses, and Interactive Webinars tailored for excellence.
          </p>
          <div className="flex gap-4">
            <Link href="/services/creative" className="group flex items-center gap-2 px-8 py-4 bg-[var(--color-royal-brown)] dark:bg-[var(--color-gold)] text-[var(--color-soft-white)] dark:text-zinc-900 font-semibold rounded-full hover:bg-[var(--color-gold)] dark:hover:bg-white hover:-translate-y-1 transition-all shadow-lg">
              Explore Services
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/auth/register" className="group hidden md:flex items-center gap-2 px-8 py-4 bg-transparent border-2 border-[var(--color-royal-brown)] dark:border-[var(--color-gold)] text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] font-semibold rounded-full hover:bg-[var(--color-royal-brown)] dark:hover:bg-[var(--color-gold)] hover:text-white dark:hover:text-zinc-900 hover:-translate-y-1 transition-all">
              Sign Up Free
            </Link>
          </div>
        </section>

        {/* Services Section */}
        <section className="w-full bg-[var(--color-beige)] dark:bg-zinc-900 py-24 px-6 transition-colors">
          <div className="max-w-6xl mx-auto flex flex-col items-center">
            <h3 className="text-4xl font-bold font-heading text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] mb-16">Our Services</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              
              <Link href="/services/creative" className="flex flex-col bg-background dark:bg-zinc-800 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all border border-[var(--color-beige)] dark:border-zinc-700">
                <div className="w-14 h-14 rounded-full bg-[var(--color-beige)] dark:bg-zinc-700 flex items-center justify-center text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] mb-6 transition-colors">
                  <Palette size={28} />
                </div>
                <h4 className="text-xl font-bold font-heading mb-3 text-[var(--color-royal-brown)] dark:text-zinc-100">Creative & Design</h4>
                <p className="text-[var(--color-royal-brown)]/70 dark:text-zinc-400 flex-1">Premium templates and bespoke graphic design bringing ideas to life.</p>
              </Link>

              <Link href="/services/webdev" className="flex flex-col bg-background dark:bg-zinc-800 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all border border-[var(--color-beige)] dark:border-zinc-700">
                <div className="w-14 h-14 rounded-full bg-[var(--color-beige)] dark:bg-zinc-700 flex items-center justify-center text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] mb-6 transition-colors">
                  <Code size={28} />
                </div>
                <h4 className="text-xl font-bold font-heading mb-3 text-[var(--color-royal-brown)] dark:text-zinc-100">Web Development</h4>
                <p className="text-[var(--color-royal-brown)]/70 dark:text-zinc-400 flex-1">Scalable Next.js web applications, landing pages, and complex SaaS logic.</p>
              </Link>

              <Link href="/services/courses" className="flex flex-col bg-background dark:bg-zinc-800 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all border border-[var(--color-beige)] dark:border-zinc-700">
                <div className="w-14 h-14 rounded-full bg-[var(--color-beige)] dark:bg-zinc-700 flex items-center justify-center text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] mb-6 transition-colors">
                  <MonitorPlay size={28} />
                </div>
                <h4 className="text-xl font-bold font-heading mb-3 text-[var(--color-royal-brown)] dark:text-zinc-100">Mastercourses</h4>
                <p className="text-[var(--color-royal-brown)]/70 dark:text-zinc-400 flex-1">High-quality video courses to accelerate your technical and creative skills.</p>
              </Link>

              <Link href="/services/webinars" className="flex flex-col bg-background dark:bg-zinc-800 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all border border-[var(--color-beige)] dark:border-zinc-700">
                <div className="w-14 h-14 rounded-full bg-[var(--color-beige)] dark:bg-zinc-700 flex items-center justify-center text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] mb-6 transition-colors">
                  <Video size={28} />
                </div>
                <h4 className="text-xl font-bold font-heading mb-3 text-[var(--color-royal-brown)] dark:text-zinc-100">Live Webinars</h4>
                <p className="text-[var(--color-royal-brown)]/70 dark:text-zinc-400 flex-1">Interactive real-time networking, Q&A, and expert-led tech discussions.</p>
              </Link>

            </div>
          </div>
        </section>

        {/* Additional Landing Page Sections */}
        <Testimonials />
        <FAQ />
        <BlogPreview />
      </div>
    </div>
  );
}
