"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Navbar from "@/components/Navbar";

const plans = [
  {
    name: "Hobby",
    price: "$0",
    period: "free forever",
    features: [
      "Up to 2 team members",
      "Up to 3 repositories",
      "Community support",
    ],
    cta: (
      <a
        href="/dashboard"
        className="btn-secondary block w-full rounded-xl py-3 text-center text-base font-medium"
      >
        Get Started Free
      </a>
    ),
    note: "No credit card required.",
    highlighted: false,
  },
  {
    name: "Starter",
    price: "$50",
    period: "USD / month",
    features: [
      "Up to 4 team members",
      "10 repositories",
      "Monthly billing",
    ],
    cta: (
      <form action="/api/stripe/purchase" method="POST">
        <button
          type="submit"
          className="btn-primary w-full rounded-xl py-3 text-base font-medium"
        >
          Subscribe Now →
        </button>
      </form>
    ),
    note: "Cancel anytime.",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "tailored to your team",
    features: [
      "Unlimited team members",
      "Unlimited repositories",
      "Dedicated support",
      "Custom SLA & contracts",
    ],
    cta: (
      <a
        href="mailto:hello@tryclean.ai"
        className="btn-secondary block w-full rounded-xl py-3 text-center text-base font-medium"
      >
        Contact Us →
      </a>
    ),
    note: "Let's build something together.",
    highlighted: false,
  },
];

export default function PricingPlanPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--cream)]">
      {/* Background dot grid */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] bg-[size:3rem_3rem]" />
      </div>

      <Navbar />

      <section className="px-5 pt-32 pb-24 sm:px-6 lg:px-12">
        <div className="mx-auto w-full max-w-5xl">

          {/* Header */}
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <p className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--accent)]">
              [ PRICING ]
            </p>
            <h1
              className="mb-4 text-4xl font-normal leading-[1.1] tracking-tight text-[var(--ink)] sm:text-5xl lg:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Simple, <em>transparent</em> pricing.
            </h1>
            <p className="mx-auto max-w-md text-lg text-[var(--ink-light)]">
              Start free. Scale when you&apos;re ready.
            </p>
          </motion.div>

          {/* Plans grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.1 }}
                className={`relative flex flex-col rounded-2xl border p-8 ${
                  plan.highlighted
                    ? "border-[var(--accent)]/30 bg-white shadow-md ring-1 ring-[var(--accent)]/10"
                    : "border-[var(--cream-dark)] bg-white shadow-sm"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan name */}
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-3 py-1 w-fit">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                  <span className="text-xs font-medium uppercase tracking-wider text-[var(--accent)]">
                    {plan.name}
                  </span>
                </div>

                {/* Price */}
                <div className="mb-8 border-b border-[var(--cream-dark)] pb-8">
                  <div className="flex items-end gap-2">
                    <span
                      className="text-5xl font-bold tracking-tight text-[var(--ink)]"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {plan.price}
                    </span>
                    <span className="mb-1.5 text-sm text-[var(--ink-muted)]">
                      {plan.period}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-[var(--ink-light)]">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10">
                        <Check className="h-3 w-3 text-[var(--accent)]" strokeWidth={2.5} />
                      </span>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div>
                  {plan.cta}
                  <p className="mt-3 text-center text-xs text-[var(--ink-muted)]">
                    {plan.note}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>
    </div>
  );
}
