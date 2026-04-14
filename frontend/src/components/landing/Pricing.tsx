"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "₹1,999",
    period: "/mo",
    description: "Perfect for individuals and small startups looking to establish an initial presence.",
    features: [
      "Access to basic Creative templates",
      "1 Web project consultation",
      "Standard support",
      "Community webinar access"
    ],
    buttonText: "Get Started",
    isPopular: false,
  },
  {
    name: "Professional",
    price: "₹4,999",
    period: "/mo",
    description: "Ideal for growing businesses that require premium assets and dedicated resources.",
    features: [
      "Unlimited Creative templates",
      "Priority Web Development queue",
      "Access to 3 Mastercourses",
      "Premium 24/7 Support",
      "Exclusive webinar recordings"
    ],
    buttonText: "Choose Pro",
    isPopular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Tailored full-stack solutions and training programs for large organizations.",
    features: [
      "Bespoke Development & Design",
      "Unlimited Mastercourses access",
      "Private team webinars",
      "Dedicated account manager",
      "Custom SLAs"
    ],
    buttonText: "Contact Us",
    isPopular: false,
  },
];

export default function Pricing() {
  return (
    <section className="w-full bg-background dark:bg-zinc-950 py-24 px-6 transition-colors">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h3 className="text-4xl font-bold font-heading text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] mb-4">
            Transparent Pricing
          </h3>
          <p className="text-lg text-[var(--color-royal-brown)]/70 dark:text-zinc-400 max-w-2xl mx-auto">
            Choose the perfect plan to scale your digital efforts. Simple pricing, no hidden fees.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative flex flex-col p-8 rounded-2xl transition-all ${
                plan.isPopular 
                  ? "bg-[var(--color-royal-brown)] text-white dark:bg-zinc-800 shadow-2xl scale-105 border border-[var(--color-gold)]/30" 
                  : "bg-[var(--color-beige)]/30 dark:bg-zinc-900 border border-[var(--color-beige)] dark:border-zinc-800 shadow-sm"
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-[var(--color-gold)] text-[var(--color-royal-brown)] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="mb-8">
                <h4 className={`text-xl font-bold mb-2 ${plan.isPopular ? "text-white" : "text-[var(--color-royal-brown)] dark:text-zinc-100"}`}>
                  {plan.name}
                </h4>
                <div className="flex items-end gap-1 mb-4">
                  <span className={`text-4xl font-bold font-heading ${plan.isPopular ? "text-[var(--color-gold)]" : "text-[var(--color-royal-brown)] dark:text-[var(--color-gold)]"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm mb-1 ${plan.isPopular ? "text-white/70" : "text-[var(--color-royal-brown)]/60 dark:text-zinc-500"}`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed ${plan.isPopular ? "text-white/80" : "text-[var(--color-royal-brown)]/70 dark:text-zinc-400"}`}>
                  {plan.description}
                </p>
              </div>

              <div className="flex-1">
                <ul className="flex flex-col gap-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className={`w-5 h-5 shrink-0 ${plan.isPopular ? "text-[var(--color-gold)]" : "text-[var(--color-royal-brown)] dark:text-[var(--color-gold)]"}`} />
                      <span className={`text-sm ${plan.isPopular ? "text-white/90" : "text-[var(--color-royal-brown)]/80 dark:text-zinc-300"}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link 
                href="/auth/register" 
                className={`w-full py-4 rounded-xl text-center font-bold transition-transform hover:-translate-y-1 ${
                  plan.isPopular
                    ? "bg-[var(--color-gold)] text-[var(--color-royal-brown)] shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                    : "bg-white dark:bg-zinc-800 text-[var(--color-royal-brown)] dark:text-[var(--color-gold)] border border-[var(--color-beige)] dark:border-zinc-700 hover:shadow-lg"
                }`}
              >
                {plan.buttonText}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
