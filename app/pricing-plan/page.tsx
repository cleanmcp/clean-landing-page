"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type Plan = {
  name: string;
  price: string;
  period: string;
  rows: { label: string; value: string }[];
  features: string[];
  ctaLabel: string;
  ctaAction: "dashboard" | "pro" | "max" | "contact";
  note: string;
  highlighted: boolean;
};

const plans: Plan[] = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    rows: [
      { label: "Hosting", value: "Cloud only" },
      { label: "Repos", value: "3" },
      { label: "Searches", value: "50/day" },
      { label: "Team", value: "1 user" },
      { label: "Setup", value: "API key only" },
    ],
    features: ["Search", "Index"],
    ctaLabel: "Get Started Free",
    ctaAction: "dashboard",
    note: "No credit card required.",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$14.99",
    period: "/ user / mo",
    rows: [
      { label: "Hosting", value: "Cloud only" },
      { label: "Repos", value: "15" },
      { label: "Searches", value: "1,000/day" },
      { label: "Team", value: "5 users" },
      { label: "Setup", value: "API key only" },
    ],
    features: ["Everything in Free", "Priority indexing"],
    ctaLabel: "Subscribe to Pro",
    ctaAction: "pro",
    note: "Cancel anytime.",
    highlighted: true,
  },
  {
    name: "Max",
    price: "$29.99",
    period: "/ user / mo",
    rows: [
      { label: "Hosting", value: "Cloud + Self-host" },
      { label: "Repos", value: "Unlimited" },
      { label: "Searches", value: "10,000/day" },
      { label: "Team", value: "10 users" },
      { label: "Setup", value: "API key or Docker" },
    ],
    features: ["Everything in Pro", "Private cloud", "SLA"],
    ctaLabel: "Subscribe to Max",
    ctaAction: "max",
    note: "Cancel anytime.",
    highlighted: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "tailored to your org",
    rows: [
      { label: "Hosting", value: "Cloud + Self-host" },
      { label: "Repos", value: "Unlimited" },
      { label: "Searches", value: "Unlimited" },
      { label: "Team", value: "Unlimited" },
      { label: "Setup", value: "Dedicated infra" },
    ],
    features: ["Everything in Max", "SSO", "Audit logs", "Dedicated support"],
    ctaLabel: "Contact Us",
    ctaAction: "contact",
    note: "Let's build something together.",
    highlighted: false,
  },
];

function PlanCard({ plan, index }: { plan: Plan; index: number }) {
  const cta =
    plan.ctaAction === "dashboard" ? (
      <a
        href="/dashboard"
        className="block w-full rounded-xl border border-[var(--blue-border)] bg-white py-3 text-center text-sm font-semibold text-[var(--ink)] transition-all duration-200 hover:border-[var(--blue-dark)] hover:text-[var(--blue-dark)]"
      >
        {plan.ctaLabel}
      </a>
    ) : plan.ctaAction === "contact" ? (
      <a
        href="mailto:hello@tryclean.ai"
        className="block w-full rounded-xl border border-[var(--blue-border)] bg-white py-3 text-center text-sm font-semibold text-[var(--ink)] transition-all duration-200 hover:border-[var(--blue-dark)] hover:text-[var(--blue-dark)]"
      >
        {plan.ctaLabel} &rarr;
      </a>
    ) : (
      <form action="/api/stripe/purchase" method="POST">
        <input type="hidden" name="plan" value={plan.ctaAction} />
        <button
          type="submit"
          className="btn-gradient w-full rounded-xl py-3 text-sm font-semibold text-white"
        >
          {plan.ctaLabel} &rarr;
        </button>
      </form>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.08 + index * 0.08 }}
      className={`relative flex flex-col rounded-2xl border p-7 ${
        plan.highlighted
          ? "border-[var(--blue-dark)]/30 bg-white shadow-[0_0_40px_rgba(23,114,231,0.08)] ring-1 ring-[var(--blue-dark)]/10"
          : "border-[var(--blue-border)] bg-white"
      }`}
    >
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span
            className="btn-gradient rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white"
          >
            Most Popular
          </span>
        </div>
      )}

      {/* Plan name */}
      <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--blue-border)] bg-[var(--blue-faint)]/40 px-3 py-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--blue-dark)]">
          {plan.name}
        </span>
      </div>

      {/* Price */}
      <div className="mb-6 border-b border-[var(--blue-border)] pb-6">
        <div className="flex items-end gap-2">
          <span
            className="text-4xl font-bold tracking-tight text-[var(--ink)] sm:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {plan.price}
          </span>
          <span className="mb-1.5 text-sm text-[var(--ink-muted)]">
            {plan.period}
          </span>
        </div>
      </div>

      {/* Spec rows */}
      <div className="mb-6 space-y-2.5">
        {plan.rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <span className="text-[var(--ink-muted)]">{row.label}</span>
            <span className="font-medium text-[var(--ink)]">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Features */}
      <ul className="mb-7 flex-1 space-y-2.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-2.5 text-[var(--ink-muted)]">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--blue-dark)]/10">
              <Check className="h-3 w-3 text-[var(--blue-dark)]" strokeWidth={2.5} />
            </span>
            <span className="text-sm">{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div>
        {cta}
        <p className="mt-3 text-center text-xs text-[var(--ink-muted)]">{plan.note}</p>
      </div>
    </motion.div>
  );
}

export default function PricingPlanPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 sm:px-12">
        <Link href="/" className="flex items-center gap-1">
          <Image src="/landing/clean-icon.svg" alt="" width={20} height={20} />
          <span
            className="text-xl font-bold tracking-tight text-[var(--ink)]"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            lean.ai
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/sign-in" className="text-sm font-medium text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]">
            Sign In
          </Link>
          <Link
            href="/waitlist"
            className="btn-gradient rounded-full px-5 py-2 text-sm font-semibold text-white"
          >
            Join Waitlist
          </Link>
        </div>
      </nav>

      <section className="px-5 pt-16 pb-24 sm:px-6 lg:px-12">
        <div className="mx-auto w-full max-w-6xl">
          {/* Header */}
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="section-badge mx-auto mb-6 w-fit bg-white/50">
              <span className="section-badge__icon">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <span className="font-semibold text-lg text-[var(--ink)]" style={{ fontFamily: "var(--font-jakarta)" }}>
                Pricing
              </span>
            </div>
            <h1
              className="mb-4 text-4xl font-normal leading-[1.1] tracking-tight text-[var(--ink)] sm:text-5xl lg:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Simple, <em>transparent</em> pricing.
            </h1>
            <p className="mx-auto max-w-md text-lg text-[var(--ink-muted)]" style={{ fontFamily: "var(--font-jakarta)" }}>
              Start free in the cloud. Scale when you&apos;re ready.
            </p>
          </motion.div>

          {/* Plans grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan, i) => (
              <PlanCard key={plan.name} plan={plan} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--blue-border)] px-8 py-8 sm:px-12">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex gap-6 text-sm text-[var(--ink-muted)]" style={{ fontFamily: "var(--font-display)" }}>
            <Link href="/documentation" className="hover:text-[var(--ink)]">Docs</Link>
            <a href="#" className="hover:text-[var(--ink)]">GitHub</a>
            <a href="mailto:hello@tryclean.ai" className="hover:text-[var(--ink)]">Contact</a>
          </div>
          <span className="text-xs text-[var(--ink-muted)]" style={{ fontFamily: "var(--font-display)" }}>
            2026 Clean. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
