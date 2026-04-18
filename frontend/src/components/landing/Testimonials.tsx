"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";

export default function Testimonials() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        let fetchUrl = `${API_URL}/reviews/featured`;
        if (fetchUrl.includes('localhost')) {
          fetchUrl = fetchUrl.replace('localhost', '127.0.0.1');
        }
        const res = await fetch(fetchUrl);
        const data = await res.json();
        setReviews(data.reviews || []);
      } catch (err) {
        console.error("Testimonials fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  if (loading) return (
    <section className="w-full py-24 flex justify-center">
      <Loader2 className="animate-spin text-[var(--color-gold)]" size={32} />
    </section>
  );
  
  if (reviews.length === 0) return null;

  return (
    <section className="w-full bg-background dark:bg-zinc-950 py-24 px-6 relative overflow-hidden transition-colors">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h3 className="text-4xl font-bold font-heading text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] mb-4">
            Trusted by Leaders
          </h3>
          <p className="text-lg text-[var(--color-royal-brown)]/70 dark:text-zinc-400">
            See what our clients say about their experience with Zanxa Tech.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          {reviews.map((rev, index) => (
            <motion.div
              key={rev.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-[var(--color-beige)]/30 dark:bg-zinc-900 border border-[var(--color-beige)] dark:border-zinc-800 p-10 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all group"
            >
              <div className="flex gap-1 mb-6 text-[var(--color-gold)]">
                {[...Array(rev.rating)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <p className="text-[var(--color-royal-brown)]/90 dark:text-zinc-300 italic mb-8 leading-relaxed font-medium">
                &quot;{rev.comment}&quot;
              </p>
              <div className="flex items-center gap-4 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--color-royal-brown)] dark:bg-zinc-800 border-2 border-[var(--color-gold)]/20 shadow-lg">
                  {rev.user?.avatar ? (
                    <img src={rev.user.avatar} alt={rev.user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold">
                       {rev.user?.name?.charAt(0) || "G"}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-[var(--color-royal-brown)] dark:text-white text-sm">{rev.user?.name}</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-gold)]">{rev.course?.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
