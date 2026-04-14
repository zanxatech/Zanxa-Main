"use client";

import { motion } from "framer-motion";
import { ArrowRight, Calendar, User } from "lucide-react";
import Link from "next/link";

const blogPosts = [
  {
    id: 1,
    title: "10 Principles of Premium Web Design in 2026",
    excerpt: "Discover how luxury brands are styling their digital presence using minimal layouts and strategic typography.",
    author: "Zanxa Editorial",
    date: "April 10, 2026",
    image: "/blog-placeholder-1.jpg", 
    tag: "Design",
  },
  {
    id: 2,
    title: "Why Custom Software outpaces SaaS in the Long Run",
    excerpt: "An in-depth analysis of scaling challenges and when it makes financial sense to build your own platform over renting one.",
    author: "Tech Team",
    date: "March 28, 2026",
    image: "/blog-placeholder-2.jpg",
    tag: "Engineering",
  },
  {
    id: 3,
    title: "Maximizing ROI with Live Webinars",
    excerpt: "Learn how interactive real-time networking and expert-led tech discussions lead to significantly higher conversion rates.",
    author: "Marketing Dept",
    date: "March 15, 2026",
    image: "/blog-placeholder-3.jpg",
    tag: "Growth",
  },
];

export default function BlogPreview() {
  return (
    <section className="w-full bg-[var(--color-soft-white)] dark:bg-zinc-900 py-24 px-6 transition-colors">
      <div className="max-w-6xl mx-auto flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <h3 className="text-4xl font-bold font-heading text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] mb-4">
              Latest from our Blog
            </h3>
            <p className="text-lg text-[var(--color-royal-brown)]/70 dark:text-zinc-400">
              Insights, tutorials, and strategies to help you grow your digital presence.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-6 md:mt-0"
          >
            <Link 
              href="/blog" 
              className="flex items-center gap-2 text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] font-semibold hover:underline"
            >
              View all articles
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group flex flex-col bg-background dark:bg-zinc-950 border border-[var(--color-beige)] dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-xl transition-all"
            >
              {/* Image placeholder with gradient */}
              <div className="w-full h-48 bg-gradient-to-br from-[var(--color-beige)] to-[#e1dbce] dark:from-zinc-800 dark:to-zinc-900 relative overflow-hidden">
                <div className="absolute top-4 left-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] z-10">
                  {post.tag}
                </div>
                {/* Optional: Add actual Image component here when paths are ready */}
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-500" />
              </div>
              
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-4 text-xs text-[var(--color-royal-brown)]/60 dark:text-zinc-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={14} />
                    {post.author}
                  </span>
                </div>
                
                <h4 className="text-xl font-bold font-heading text-[var(--color-royal-brown)] dark:text-zinc-100 mb-3 group-hover:text-[var(--color-gold)] transition-colors">
                  {post.title}
                </h4>
                
                <p className="text-[var(--color-royal-brown)]/70 dark:text-zinc-400 text-sm leading-relaxed mb-6 flex-1">
                  {post.excerpt}
                </p>
                
                <Link 
                  href={`/blog/${post.id}`}
                  className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] hover:gap-3 transition-all mt-auto"
                >
                  Read Article
                  <ArrowRight size={16} />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
