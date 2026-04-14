"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Do I need technical skills to use Zanxa Tech?",
    answer: "Not at all. While our Mastercourses are great for developers, our Creative and Web Development services are fully managed. We handle the heavy lifting while you focus on your business.",
  },
  {
    question: "How long does a website project usually take?",
    answer: "Project timelines vary based on complexity, but a standard corporate website or landing page is typically delivered within 2-4 weeks. During our consultation, we will provide an accurate timeline specific to your requirements.",
  },
  {
    question: "Can I access the Mastercourses from any device?",
    answer: "Yes! Our learning platform is fully responsive. You can watch high-quality course videos securely from your desktop, tablet, or mobile phone.",
  },
  {
    question: "Is there a support team if I run into issues?",
    answer: "Absolutely. We offer dedicated support for all our clients and students. Our team is accessible via email, WhatsApp, or through the platform's ticketing system.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full bg-[var(--color-beige)]/10 dark:bg-zinc-900/50 py-24 px-6 transition-colors">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h3 className="text-4xl font-bold font-heading text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] mb-4">
            Frequently Asked Questions
          </h3>
          <p className="text-lg text-[var(--color-royal-brown)]/70 dark:text-zinc-400">
            Find quick answers to common queries about our platform and services.
          </p>
        </motion.div>

        <div className="flex flex-col gap-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-background dark:bg-zinc-900 border border-[var(--color-beige)] dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
              >
                <span className="font-semibold text-lg text-[var(--color-royal-brown)] dark:text-zinc-100">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-[var(--color-gold)] transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-5 text-[var(--color-royal-brown)]/70 dark:text-zinc-400 leading-relaxed border-t border-[var(--color-beige)]/50 dark:border-zinc-800 pt-4">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
