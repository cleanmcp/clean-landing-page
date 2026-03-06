"use client";

import { motion } from "framer-motion";
import { Check, Zap, Rocket, Building2 } from "lucide-react";
import Navbar from "@/components/Navbar";

type Plan = {
  name: string;
  price: string;
  period: string;
  icon: React.ReactNode;
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
    icon: <Zap className="h-4 w-4" />,
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
    price: "$12",
    period: "/ user / mo",
    icon: <Zap className="h-4 w-4" />,
    rows: [
      { label: "Hosting", value: "Cloud only" },
      { label: "Repos", value: "15" },
      { label: "Searches", value: "Unlimited" },
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
    price: "$30",
    period: "/ user / mo",
    icon: <Rocket className="h-4 w-4" />,
    rows: [
      { label: "Hosting", value: "Cloud + Self-host" },
      { label: "Repos", value: "Unlimited" },
      { label: "Searches", value: "Unlimited" },
      { label: "Team", value: "25 users" },
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
    icon: <Building2 className="h-4 w-4" />,
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
        className="btn-secondary block w-full rounded-xl py-3 text-center text-base font-medium"
      >
        {plan.ctaLabel}
      </a>
    ) : plan.ctaAction === "contact" ? (
      <a
        href="mailto:hello@tryclean.ai"
        className="btn-secondary block w-full rounded-xl py-3 text-center text-base font-medium"
      >
        {plan.ctaLabel} &rarr;
      </a>
    ) : (
      <form action="/api/stripe/purchase" method="POST">
        <input type="hidden" name="plan" value={plan.ctaAction} />
        <button
          type="submit"
          className="btn-primary w-full rounded-xl py-3 text-base font-medium"
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
          ? "border-[var(--accent)]/30 bg-white shadow-lg ring-1 ring-[var(--accent)]/10"
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

      {/* Plan badge */}
      <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-3 py-1">
        <span className="text-[var(--accent)]">{plan.icon}</span>
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--accent)]">
          {plan.name}
        </span>
      </div>

      {/* Price */}
      <div className="mb-6 border-b border-[var(--cream-dark)] pb-6">
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
          <div
            key={row.label}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-[var(--ink-muted)]">{row.label}</span>
            <span className="font-medium text-[var(--ink)]">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Features */}
      <ul className="mb-7 flex-1 space-y-2.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-2.5 text-[var(--ink-light)]">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10">
              <Check className="h-3 w-3 text-[var(--accent)]" strokeWidth={2.5} />
            </span>
            <span className="text-sm">{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div>
        {cta}
        <p className="mt-3 text-center text-xs text-[var(--ink-muted)]">
          {plan.note}
        </p>
      </div>
    </motion.div>
  );
}

export default function PricingPlanPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--cream)]">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] bg-[size:3rem_3rem]" />
      </div>

      <Navbar />

      <section className="px-5 pt-32 pb-24 sm:px-6 lg:px-12">
        <div className="mx-auto w-full max-w-6xl">
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
              Start free in the cloud. Scale when you&apos;re ready.
            </p>
          </motion.div>

          {/* Plans grid — 4 columns */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan, i) => (
              <PlanCard key={plan.name} plan={plan} index={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
