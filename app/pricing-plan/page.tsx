"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

const A = "/landing";

type Plan = {
  name: string;
  price: string;
  period: string;
  credits: string;
  searchesEquiv: string;
  rows: { label: string; value: string }[];
  features: string[];
  ctaLabel: string;
  ctaAction: "dashboard" | "pro" | "team" | "contact";
  note: string;
  highlighted: boolean;
};

const plans: Plan[] = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    credits: "1,000",
    searchesEquiv: "~50 searches",
    rows: [
      { label: "Credits / mo", value: "1,000" },
      { label: "Searches", value: "~50" },
      { label: "Repos", value: "3" },
      { label: "Team", value: "1 user" },
      { label: "Hosting", value: "Cloud only" },
    ],
    features: ["Search", "Index", "Community support"],
    ctaLabel: "Get Started Free",
    ctaAction: "dashboard",
    note: "No credit card required.",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$20",
    period: "/ mo",
    credits: "10,000",
    searchesEquiv: "~500 searches",
    rows: [
      { label: "Credits / mo", value: "10,000" },
      { label: "Searches", value: "~500" },
      { label: "Repos", value: "15" },
      { label: "Team", value: "5 users" },
      { label: "Hosting", value: "Cloud only" },
    ],
    features: ["Everything in Free", "Priority indexing", "Usage dashboard"],
    ctaLabel: "Subscribe to Pro",
    ctaAction: "pro",
    note: "Cancel anytime.",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$75",
    period: "/ mo",
    credits: "50,000",
    searchesEquiv: "~2,500 searches",
    rows: [
      { label: "Credits / mo", value: "50,000" },
      { label: "Searches", value: "~2,500" },
      { label: "Repos", value: "Unlimited" },
      { label: "Team", value: "15 users" },
      { label: "Hosting", value: "Cloud + Self-host" },
    ],
    features: ["Everything in Pro", "Private cloud", "SLA", "Priority support"],
    ctaLabel: "Subscribe to Team",
    ctaAction: "team",
    note: "Cancel anytime.",
    highlighted: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "tailored to your org",
    credits: "Unlimited",
    searchesEquiv: "Unlimited searches",
    rows: [
      { label: "Credits / mo", value: "Unlimited" },
      { label: "Searches", value: "Unlimited" },
      { label: "Repos", value: "Unlimited" },
      { label: "Team", value: "Unlimited" },
      { label: "Hosting", value: "Dedicated infra" },
    ],
    features: ["Everything in Team", "SSO", "Audit logs", "Dedicated support"],
    ctaLabel: "Contact Us",
    ctaAction: "contact",
    note: "Let's build something together.",
    highlighted: false,
  },
];

function PlanCard({ plan, index }: { plan: Plan; index: number }) {
  const isHighlighted = plan.highlighted;

  const cta =
    plan.ctaAction === "dashboard" ? (
      <a
        href="/dashboard"
        className="block w-full rounded-[20px] border border-white/10 bg-white/5 py-3.5 text-center text-[15px] font-semibold text-white transition-all duration-300 hover:bg-white/10 hover:border-white/20"
        style={{ fontFamily: "var(--font-jakarta)" }}
      >
        {plan.ctaLabel}
      </a>
    ) : plan.ctaAction === "contact" ? (
      <a
        href="mailto:hello@tryclean.ai"
        className="block w-full rounded-[20px] border border-white/10 bg-white/5 py-3.5 text-center text-[15px] font-semibold text-white transition-all duration-300 hover:bg-white/10 hover:border-white/20"
        style={{ fontFamily: "var(--font-jakarta)" }}
      >
        {plan.ctaLabel} &rarr;
      </a>
    ) : (
      <form action="/api/stripe/purchase" method="POST">
        <input type="hidden" name="plan" value={plan.ctaAction} />
        <button
          type="submit"
          className="w-full h-[48px] rounded-[24px] text-[15px] font-semibold text-white transition-all duration-300 hover:scale-[1.01] cursor-pointer"
          style={{
            background: "linear-gradient(180deg, #79C0FF 0%, #3B92F3 100%)",
            border: "3px solid rgba(255,255,255,0.4)",
            boxShadow: "0px 2px 10px rgba(59,146,243,0.4), inset 0px 4px 12px 1px rgba(255,255,255,0.6), inset 0px -2px 6px rgba(0,50,150,0.3)",
            fontFamily: "var(--font-jakarta)",
            textShadow: "0px 1px 2px rgba(0,60,150,0.5)",
          }}
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
      className={`relative flex flex-col rounded-[24px] p-7 ${
        isHighlighted
          ? "ring-1 ring-[#5eb1ff]/30"
          : ""
      }`}
      style={{
        background: isHighlighted
          ? "linear-gradient(180deg, rgba(94,177,255,0.1) 0%, rgba(59,146,243,0.03) 100%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        border: isHighlighted
          ? "1px solid rgba(94,177,255,0.2)"
          : "1px solid rgba(255,255,255,0.08)",
        boxShadow: isHighlighted
          ? "0 8px 40px rgba(59,146,243,0.12), inset 0 1px 0 rgba(255,255,255,0.08)"
          : "0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)",
        backdropFilter: "blur(24px)",
      }}
    >
      {isHighlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span
            className="rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white"
            style={{
              background: "linear-gradient(180deg, #79C0FF 0%, #3B92F3 100%)",
              border: "2px solid rgba(255,255,255,0.4)",
              boxShadow: "0px 2px 8px rgba(59,146,243,0.4), inset 0px 2px 6px rgba(255,255,255,0.5)",
              textShadow: "0px 1px 2px rgba(0,60,150,0.5)",
              fontFamily: "var(--font-jakarta)",
            }}
          >
            Most Popular
          </span>
        </div>
      )}

      {/* Plan name badge */}
      <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#5eb1ff]/20 bg-[#79c0ff]/8 px-3.5 py-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#79c0ff]" style={{ fontFamily: "var(--font-jakarta)" }}>
          {plan.name}
        </span>
      </div>

      {/* Price */}
      <div className="mb-2">
        <div className="flex flex-col gap-1">
          <span
            className="text-4xl font-bold tracking-tight text-white sm:text-5xl leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {plan.price}
          </span>
          <span className="text-sm text-white/35 whitespace-normal" style={{ fontFamily: "var(--font-jakarta)" }}>
            {plan.period}
          </span>
        </div>
      </div>

      {/* Credits callout */}
      <div className="mb-6 border-b border-white/8 pb-6">
        <div className="rounded-xl bg-white/5 border border-white/8 px-4 py-3 mt-2">
          <span className="block text-lg font-bold text-[#79c0ff]" style={{ fontFamily: "var(--font-jakarta)" }}>
            {plan.credits} credits
          </span>
          <span className="text-xs text-white/40" style={{ fontFamily: "var(--font-jakarta)" }}>
            {plan.searchesEquiv} &middot; 1 search = 20 credits
          </span>
        </div>
      </div>

      {/* Spec rows */}
      <div className="mb-6 space-y-3">
        {plan.rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <span className="text-white/40" style={{ fontFamily: "var(--font-jakarta)" }}>{row.label}</span>
            <span className="font-medium text-white/80" style={{ fontFamily: "var(--font-jakarta)" }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Features */}
      <ul className="mb-7 flex-1 space-y-3">
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-2.5 text-white/50">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#79c0ff]/15">
              <svg className="h-3 w-3 text-[#79c0ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </span>
            <span className="text-sm" style={{ fontFamily: "var(--font-jakarta)" }}>{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div>
        {cta}
        <p className="mt-3 text-center text-xs text-white/25" style={{ fontFamily: "var(--font-jakarta)" }}>{plan.note}</p>
      </div>
    </motion.div>
  );
}

export default function PricingPlanPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Dark background */}
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      <div className="absolute inset-0 opacity-40 overflow-hidden">
        <Image src={`${A}/dark-bg.png`} alt="" fill className="object-cover" />
      </div>

      {/* Large radial glow behind cards */}
      <div
        className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1000px] pointer-events-none opacity-20"
        style={{
          backgroundImage: "radial-gradient(ellipse, #79c0ff 0%, #3b92f3 20%, #1772e7 40%, transparent 70%)",
        }}
      />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-12">
        <Link href="/" className="flex items-center gap-0.5">
          <Image src={`${A}/clean-icon.svg`} alt="" width={22} height={22} />
          <span
            className="text-2xl font-bold tracking-tight text-white"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            lean.ai
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/sign-in"
            className="text-sm font-medium text-white/40 transition-colors hover:text-white/80"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Sign In
          </Link>
          <a
            href="/waitlist"
            className="group relative inline-flex items-center h-[40px] rounded-full text-white text-[14px] font-semibold tracking-tight pl-5 pr-10 transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: "linear-gradient(180deg, #7DC3FC 0%, #BFE1FA 100%)",
              border: "3px solid #E8F4FC",
              boxShadow: "inset 0px 4px 6px rgba(255,255,255,1), 0px 2px 10px rgba(0,0,0,0.1), inset 0px -2px 4px rgba(100,160,240,0.5)",
              fontFamily: "var(--font-jakarta)",
            }}
          >
            <span className="relative z-10" style={{ textShadow: "0px 1px 1px rgba(255,255,255,0.7)", color: "white" }}>Join Waitlist</span>
            <span className="absolute right-[4px] top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-white size-7 transition-transform duration-300 group-hover:rotate-45" style={{ boxShadow: "0px 2px 4px rgba(0,0,0,0.1)" }}>
              <svg className="w-3 h-3 text-[#1772e7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>
            </span>
          </a>
        </div>
      </nav>

      <section className="relative z-10 px-5 pt-16 pb-24 sm:px-6 lg:px-12">
        <div className="mx-auto w-full max-w-6xl">
          {/* Header */}
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Badge */}
            <div className="mx-auto mb-6 w-fit inline-flex items-center gap-3 rounded-full border-2 border-[#1772e7] px-3 py-2.5 bg-transparent backdrop-blur-sm">
              <span className="flex items-center justify-center rounded-full bg-[#1772e7] p-1">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <span className="font-semibold text-lg text-white" style={{ fontFamily: "var(--font-jakarta)" }}>
                Pricing
              </span>
            </div>

            <h1
              className="mb-4 text-[36px] sm:text-[48px] lg:text-[64px] font-semibold leading-[1.1] tracking-tight text-white"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Pay for what you{" "}
              <em className="not-italic" style={{ fontFamily: "var(--font-display)" }}>use.</em>
            </h1>
            <p className="mx-auto max-w-lg text-lg text-white/45" style={{ fontFamily: "var(--font-jakarta)" }}>
              Simple credits-based pricing. One search costs 20 credits.
              <br />
              Start free, scale as you grow.
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
      <footer className="relative z-10 border-t border-white/8 px-8 py-8 sm:px-12">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-6 text-sm text-white/30" style={{ fontFamily: "var(--font-display)" }}>
            <a href="https://www.linkedin.com/company/cleanailabs" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">LinkedIn</a>
            <Link href="/contact" className="hover:text-white/60 transition-colors">Contact</Link>
          </div>
          <span className="text-xs text-white/25" style={{ fontFamily: "var(--font-display)" }}>
            2026 Clean. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
