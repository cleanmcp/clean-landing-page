"use client";

import { X, Zap, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature: "repos" | "members" | "apiKeys" | "searches";
  currentTier?: string;
}

const FEATURE_COPY = {
  repos: {
    title: "Repository limit reached",
    description: "You've used all the repositories on your current plan.",
  },
  members: {
    title: "Team member limit reached",
    description: "You've reached the maximum team members for your plan.",
  },
  apiKeys: {
    title: "API key limit reached",
    description: "You've created all the API keys available on your plan.",
  },
  searches: {
    title: "Search limit reached",
    description: "You've hit your daily search limit.",
  },
};

const PLANS = [
  {
    name: "Pro",
    price: "$20",
    period: "/mo",
    features: ["15 repositories", "5 team members", "20 API keys", "10,000 credits (~500 searches)", "Priority indexing"],
    accent: true,
  },
  {
    name: "Team",
    price: "$100",
    period: "/mo",
    features: ["Unlimited repositories", "15 team members", "Unlimited API keys", "50,000 credits (~2,500 searches)", "Private cloud + SLA"],
    accent: false,
  },
];

export function UpgradeModal({ open, onClose, feature, currentTier }: UpgradeModalProps) {
  const copy = FEATURE_COPY[feature];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative mx-4 w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-bg)] shadow-2xl"
          >
            {/* Header */}
            <div className="relative border-b border-[var(--dash-border)] bg-[var(--dash-surface)] px-8 py-6">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-[var(--dash-text-muted)] transition-colors hover:bg-[var(--dash-surface-hover)]"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--dash-accent)] text-white">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--dash-text)]">{copy.title}</h2>
                  <p className="text-sm text-[var(--dash-text-muted)]">{copy.description}</p>
                </div>
              </div>
            </div>

            {/* Plans */}
            <div className="grid gap-4 p-8 sm:grid-cols-2">
              {PLANS.map((plan) => {
                const isCurrent = currentTier?.toLowerCase() === plan.name.toLowerCase();
                return (
                  <div
                    key={plan.name}
                    className={`relative rounded-xl border-2 p-6 transition-all ${
                      plan.accent
                        ? "border-[var(--dash-accent)] shadow-lg shadow-[var(--dash-accent)]/10"
                        : "border-[var(--dash-border)]"
                    }`}
                  >
                    {plan.accent && (
                      <div className="absolute -top-3 left-4 rounded-full bg-[var(--dash-accent)] px-3 py-0.5 text-xs font-semibold text-white">
                        Most popular
                      </div>
                    )}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-[var(--dash-text)]">{plan.name}</h3>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-[var(--dash-text)]">{plan.price}</span>
                        <span className="text-sm text-[var(--dash-text-muted)]">{plan.period}</span>
                      </div>
                    </div>
                    <ul className="mb-6 space-y-2.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-[var(--dash-text-muted)]">
                          <Check className="h-4 w-4 flex-shrink-0 text-[var(--dash-accent)]" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {isCurrent ? (
                      <div className="rounded-xl bg-[var(--dash-bg)] px-4 py-2.5 text-center text-sm font-medium text-[var(--dash-text-muted)]">
                        Current plan
                      </div>
                    ) : (
                      <a
                        href="/dashboard/billing"
                        className={`block rounded-xl px-4 py-2.5 text-center text-sm font-medium transition-all hover:scale-[1.02] hover:shadow-md ${
                          plan.accent
                            ? "bg-[var(--dash-accent)] text-white"
                            : "border border-[var(--ink)] bg-[var(--ink)] text-white"
                        }`}
                      >
                        Upgrade to {plan.name}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--dash-border)] bg-[var(--dash-bg)] px-8 py-4 text-center text-xs text-[var(--dash-text-muted)]">
              All plans include a 14-day free trial. Cancel anytime.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
