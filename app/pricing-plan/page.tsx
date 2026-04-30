"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

const A = "/landing";

// ---------------------------------------------------------------------------
// Plan catalogs — kept here (client) so the page can render statically.
// Authoritative data lives in lib/agent-tiers.ts (server-only) and the cloud
// tier limits in lib/tier-limits.ts. Keep these in sync if prices change.
// ---------------------------------------------------------------------------

type Product = "agent" | "mcp";

type AgentTierKey = "starter" | "pro" | "enterprise";
type CloudCtaAction = "dashboard" | "pro" | "max" | "contact";

type AgentPlan = {
  product: "agent";
  key: AgentTierKey;
  name: string;
  price: string;
  period: string;
  rows: { label: string; value: string }[];
  features: string[];
  ctaLabel: string;
  highlighted: boolean;
  note: string;
};

type CloudPlan = {
  product: "mcp";
  key: string;
  name: string;
  price: string;
  period: string;
  rows: { label: string; value: string }[];
  features: string[];
  ctaLabel: string;
  ctaAction: CloudCtaAction;
  highlighted: boolean;
  note: string;
};

const agentPlans: AgentPlan[] = [
  {
    product: "agent",
    key: "starter",
    name: "Starter",
    price: "$15",
    period: "/ mo",
    rows: [
      { label: "Tokens", value: "1.5M / mo" },
      { label: "Seats", value: "1 user" },
      { label: "BYOK", value: "Unmetered" },
      { label: "Platform", value: "macOS" },
    ],
    features: ["All Clean Agent features", "Single user", "Bring your own keys (unmetered)"],
    ctaLabel: "Start Starter",
    highlighted: false,
    note: "Cancel anytime.",
  },
  {
    product: "agent",
    key: "pro",
    name: "Pro",
    price: "$50",
    period: "/ mo",
    rows: [
      { label: "Tokens", value: "7M / mo" },
      { label: "Seats", value: "1 user" },
      { label: "BYOK", value: "Unmetered" },
      { label: "Models", value: "Priority access" },
    ],
    features: ["Everything in Starter", "Priority model access", "Larger context windows"],
    ctaLabel: "Go Pro",
    highlighted: true,
    note: "Cancel anytime.",
  },
  {
    product: "agent",
    key: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "tailored to your team",
    rows: [
      { label: "Tokens", value: "Custom" },
      { label: "Seats", value: "Unlimited" },
      { label: "Auth", value: "SSO / SAML" },
      { label: "Billing", value: "Invoicing · net-30" },
    ],
    features: ["Everything in Pro", "SSO / SAML", "Invoicing + net-30", "Dedicated support"],
    ctaLabel: "Contact sales",
    highlighted: false,
    note: "Let's build something together.",
  },
];

const mcpPlans: CloudPlan[] = [
  {
    product: "mcp",
    key: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    rows: [
      { label: "Searches", value: "10/mo" },
      { label: "Repos", value: "2" },
      { label: "Team", value: "1 user" },
      { label: "Hosting", value: "Cloud only" },
    ],
    features: ["Search", "Index", "Community support"],
    ctaLabel: "Get Started Free",
    ctaAction: "dashboard",
    highlighted: false,
    note: "No credit card required.",
  },
  {
    product: "mcp",
    key: "pro",
    name: "Pro",
    price: "$20",
    period: "/ mo",
    rows: [
      { label: "Searches", value: "500/mo" },
      { label: "Repos", value: "15" },
      { label: "Team", value: "5 users" },
      { label: "Hosting", value: "Cloud only" },
    ],
    features: ["Everything in Free", "Priority indexing", "Usage dashboard"],
    ctaLabel: "Subscribe to Pro",
    ctaAction: "pro",
    highlighted: true,
    note: "Cancel anytime.",
  },
  {
    product: "mcp",
    key: "max",
    name: "Max",
    price: "$100",
    period: "/ mo",
    rows: [
      { label: "Searches", value: "5,000/mo" },
      { label: "Repos", value: "Unlimited" },
      { label: "Team", value: "10 users" },
      { label: "Hosting", value: "Cloud + Self-host" },
    ],
    features: ["Everything in Pro", "Private cloud", "SLA", "Priority support"],
    ctaLabel: "Subscribe to Max",
    ctaAction: "max",
    highlighted: false,
    note: "Cancel anytime.",
  },
  {
    product: "mcp",
    key: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "tailored to your org",
    rows: [
      { label: "Searches", value: "Unlimited" },
      { label: "Repos", value: "Unlimited" },
      { label: "Team", value: "Unlimited" },
      { label: "Hosting", value: "Dedicated infra" },
    ],
    features: ["Everything in Max", "SSO", "Audit logs", "Dedicated support"],
    ctaLabel: "Contact Us",
    ctaAction: "contact",
    highlighted: false,
    note: "Let's build something together.",
  },
];

// ---------------------------------------------------------------------------
// CTAs (one per product)
// ---------------------------------------------------------------------------

function AgentCta({ plan }: { plan: AgentPlan }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (plan.key === "enterprise") {
    return (
      <a
        href="mailto:sales@tryclean.ai?subject=Clean%20Agent%20Enterprise"
        className="block w-full rounded-[20px] border border-white/10 bg-white/5 py-3.5 text-center text-[15px] font-semibold text-white transition-all duration-300 hover:bg-white/10 hover:border-white/20"
        style={{ fontFamily: "var(--font-jakarta)" }}
      >
        {plan.ctaLabel} &rarr;
      </a>
    );
  }

  async function onClick() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.key }),
      });
      if (res.status === 401) {
        window.location.href = `/sign-in?redirect=/pricing-plan&plan=${plan.key}`;
        return;
      }
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setErr(data.error ?? "Checkout failed");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="w-full h-[48px] rounded-[24px] text-[15px] font-semibold text-white transition-all duration-300 hover:scale-[1.01] cursor-pointer disabled:opacity-60 disabled:cursor-wait"
        style={{
          background: "linear-gradient(180deg, #79C0FF 0%, #3B92F3 100%)",
          border: "3px solid rgba(255,255,255,0.4)",
          boxShadow: "0px 2px 10px rgba(59,146,243,0.4), inset 0px 4px 12px 1px rgba(255,255,255,0.6), inset 0px -2px 6px rgba(0,50,150,0.3)",
          fontFamily: "var(--font-jakarta)",
          textShadow: "0px 1px 2px rgba(0,60,150,0.5)",
        }}
      >
        {loading ? "Redirecting…" : `${plan.ctaLabel} →`}
      </button>
      {err && <p className="text-xs text-red-400" style={{ fontFamily: "var(--font-jakarta)" }}>{err}</p>}
    </div>
  );
}

function CloudCta({ plan }: { plan: CloudPlan }) {
  if (plan.ctaAction === "dashboard") {
    return (
      <a
        href="/dashboard"
        className="block w-full rounded-[20px] border border-white/10 bg-white/5 py-3.5 text-center text-[15px] font-semibold text-white transition-all duration-300 hover:bg-white/10 hover:border-white/20"
        style={{ fontFamily: "var(--font-jakarta)" }}
      >
        {plan.ctaLabel}
      </a>
    );
  }
  if (plan.ctaAction === "contact") {
    return (
      <a
        href="mailto:hello@tryclean.ai"
        className="block w-full rounded-[20px] border border-white/10 bg-white/5 py-3.5 text-center text-[15px] font-semibold text-white transition-all duration-300 hover:bg-white/10 hover:border-white/20"
        style={{ fontFamily: "var(--font-jakarta)" }}
      >
        {plan.ctaLabel} &rarr;
      </a>
    );
  }
  return (
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
}

// ---------------------------------------------------------------------------
// Card (shared visual; unchanged from previous design)
// ---------------------------------------------------------------------------

function PlanCard({ plan, index }: { plan: AgentPlan | CloudPlan; index: number }) {
  const isHighlighted = plan.highlighted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.08 + index * 0.08 }}
      className={`relative flex flex-col rounded-[24px] p-7 ${
        isHighlighted ? "ring-1 ring-[#5eb1ff]/30" : ""
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

      <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#5eb1ff]/20 bg-[#79c0ff]/8 px-3.5 py-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#79c0ff]" style={{ fontFamily: "var(--font-jakarta)" }}>
          {plan.name}
        </span>
      </div>

      <div className="mb-6 border-b border-white/8 pb-6">
        <div className="flex flex-col gap-1">
          <span className="text-4xl font-bold tracking-tight text-white sm:text-5xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            {plan.price}
          </span>
          <span className="text-sm text-white/35 whitespace-normal" style={{ fontFamily: "var(--font-jakarta)" }}>
            {plan.period}
          </span>
        </div>
      </div>

      <div className="mb-6 space-y-3">
        {plan.rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <span className="text-white/40" style={{ fontFamily: "var(--font-jakarta)" }}>{row.label}</span>
            <span className="font-medium text-white/80" style={{ fontFamily: "var(--font-jakarta)" }}>{row.value}</span>
          </div>
        ))}
      </div>

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

      <div>
        {plan.product === "agent" ? <AgentCta plan={plan} /> : <CloudCta plan={plan} />}
        <p className="mt-3 text-center text-xs text-white/25" style={{ fontFamily: "var(--font-jakarta)" }}>{plan.note}</p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Tab switcher
// ---------------------------------------------------------------------------

function TabSwitcher({ active, onChange }: { active: Product; onChange: (p: Product) => void }) {
  return (
    <div className="mx-auto mb-12 flex w-fit items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur-md">
      {(["agent", "mcp"] as const).map((p) => {
        const isActive = active === p;
        const label = p === "agent" ? "Clean Agent" : "Clean MCP";
        const sub = p === "agent" ? "Desktop app" : "Context layer";
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className="relative flex flex-col items-start gap-0.5 px-5 py-2.5 sm:px-7 sm:py-3 rounded-full transition-colors duration-300"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            {isActive && (
              <motion.span
                layoutId="pricing-tab-bg"
                className="absolute inset-0 rounded-full"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                style={{
                  background: "linear-gradient(180deg, rgba(121,192,255,0.18) 0%, rgba(59,146,243,0.06) 100%)",
                  border: "1px solid rgba(94,177,255,0.35)",
                  boxShadow: "0 4px 20px rgba(59,146,243,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
              />
            )}
            <span className={`relative z-10 text-[14px] sm:text-[15px] font-semibold transition-colors ${isActive ? "text-white" : "text-white/60 hover:text-white/85"}`}>
              {label}
            </span>
            <span className={`relative z-10 text-[10px] sm:text-[11px] uppercase tracking-[0.12em] transition-colors ${isActive ? "text-[#79c0ff]" : "text-white/35"}`}>
              {sub}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PricingPlanPage() {
  const [product, setProduct] = useState<Product>("agent");
  const plans = product === "agent" ? agentPlans : mcpPlans;
  const gridCols = product === "agent" ? "lg:grid-cols-3" : "lg:grid-cols-4";

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
          <span className="text-2xl font-bold tracking-tight text-white" style={{ fontFamily: "var(--font-jakarta)" }}>
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
            href="/sign-up"
            className="group relative inline-flex items-center h-[40px] rounded-full text-white text-[14px] font-semibold tracking-tight pl-5 pr-10 transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: "linear-gradient(180deg, #7DC3FC 0%, #BFE1FA 100%)",
              border: "3px solid #E8F4FC",
              boxShadow: "inset 0px 4px 6px rgba(255,255,255,1), 0px 2px 10px rgba(0,0,0,0.1), inset 0px -2px 4px rgba(100,160,240,0.5)",
              fontFamily: "var(--font-jakarta)",
            }}
          >
            <span className="relative z-10" style={{ textShadow: "0px 1px 1px rgba(255,255,255,0.7)", color: "white" }}>Try Now</span>
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
            className="mb-10 text-center"
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
            <p className="mx-auto max-w-xl text-lg text-white/45" style={{ fontFamily: "var(--font-jakarta)" }}>
              Two products, two purchases. Pick the one that fits — or both.
            </p>
          </motion.div>

          {/* Tab switcher */}
          <TabSwitcher active={product} onChange={setProduct} />

          {/* Plans grid — animated tab switch */}
          <AnimatePresence mode="wait">
            <motion.div
              key={product}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className={`grid gap-5 sm:grid-cols-2 ${gridCols}`}
            >
              {plans.map((plan, i) => (
                <PlanCard key={`${plan.product}-${plan.key}`} plan={plan} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Product-specific footnote */}
          <p className="mt-12 text-center text-xs text-white/40" style={{ fontFamily: "var(--font-jakarta)" }}>
            {product === "agent"
              ? "Hard cut-off at 100% of monthly allowance. Upgrade or wait for renewal. BYOK users are not metered."
              : "All cloud plans include indexing, search, and the universal MCP server. Cancel anytime."}
          </p>
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
