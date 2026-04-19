"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  Search,
  Key,
  GitBranch,
  Users,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UsageMetric {
  used: number | null;
  limit: number | null;
}

interface UsageData {
  tier: string;
  repos: UsageMetric;
  seats: UsageMetric;
  apiKeys: UsageMetric;
  searches: UsageMetric;
  storage: UsageMetric;
  creditBalance: number;
  creditsPerSearch: number;
  creditGrantMonthly: number;
  creditPeriodEnd: string | null;
}

interface BillingData {
  tier: "free" | "pro" | "max" | "enterprise";
  licenseExpiresAt: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string | null;
}

interface StatsData {
  totalSearches: number;
  totalTokensSaved: number;
  totalCharsSaved: number;
  searchesThisWeek: number;
  topRepos: Array<{ repo: string; count: number }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const },
  }),
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const tierLabels: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  max: "Max",
  enterprise: "Enterprise",
};

const tierColors: Record<string, string> = {
  free: "bg-[var(--dash-text-muted)]/20 text-[var(--dash-text-muted)]",
  pro: "bg-[var(--dash-accent)]/15 text-[var(--dash-accent-light)]",
  max: "bg-blue-500/15 text-blue-400",
  enterprise: "bg-purple-500/15 text-purple-400",
};

function UsageBarCard({
  label,
  icon: Icon,
  used,
  limit,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  used: number | null;
  limit: number | null;
}) {
  if (used === null) return null;

  const isUnlimited = limit === null;
  const pct = isUnlimited ? 0 : limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isWarning = !isUnlimited && pct >= 80;
  const isCritical = !isUnlimited && pct >= 95;

  const barColor = isCritical
    ? "var(--dash-error)"
    : isWarning
      ? "var(--dash-warning)"
      : undefined; // undefined = use gradient

  return (
    <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[var(--dash-text-muted)]" strokeWidth={1.5} />
          <span className="text-sm font-medium text-[var(--dash-text)]">{label}</span>
        </div>
        {!isUnlimited && (
          <span className="text-xs text-[var(--dash-text-muted)]">
            {Math.round(pct)}%
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
      <span
        className="text-4xl font-bold text-[var(--dash-text)]"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        {used.toLocaleString()}
      </span>
        <span className="text-lg text-[var(--dash-text-muted)]">/</span>
        <span
          className="text-lg text-[var(--dash-text-muted)]"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          {isUnlimited ? "∞" : limit!.toLocaleString()}
        </span>
      </div>

      {!isUnlimited && (
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--dash-bg)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: barColor ?? "linear-gradient(90deg, #1772E7, #5EB1FF)",
            }}
          />
        </div>
      )}
    </div>
  );
}


function SearchesRemainingCard({
  creditBalance,
  creditsPerSearch,
  creditGrantMonthly,
  creditPeriodEnd,
  searchesThisMonth,
}: {
  creditBalance: number;
  creditsPerSearch: number;
  creditGrantMonthly: number;
  creditPeriodEnd: string | null;
  searchesThisMonth: number;
}) {
  const unlimited = creditGrantMonthly === -1 || creditsPerSearch === 0;
  const searchesRemaining = unlimited
    ? null
    : creditsPerSearch > 0
      ? Math.floor(Math.max(0, creditBalance) / creditsPerSearch)
      : 0;
  const totalSearchesInGrant = unlimited
    ? null
    : creditsPerSearch > 0
      ? Math.floor(creditGrantMonthly / creditsPerSearch)
      : 0;
  const pctUsed =
    unlimited || !totalSearchesInGrant
      ? 0
      : Math.min(100, Math.max(0, 100 - (searchesRemaining! / totalSearchesInGrant) * 100));

  return (
    <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-[var(--dash-text-muted)]" strokeWidth={1.5} />
            <span className="text-sm font-medium text-[var(--dash-text)]">Searches remaining</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className="text-5xl font-bold text-[var(--dash-text)]"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {unlimited ? "∞" : (searchesRemaining ?? 0).toLocaleString()}
            </span>
            {!unlimited && totalSearchesInGrant != null && (
              <span className="text-lg text-[var(--dash-text-muted)]" style={{ fontFamily: "var(--font-geist-mono)" }}>
                / {totalSearchesInGrant.toLocaleString()}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-[var(--dash-text-muted)]">
            {unlimited
              ? "Unlimited on your current plan"
              : creditPeriodEnd
                ? `Resets ${formatDate(creditPeriodEnd)}`
                : `${creditBalance.toLocaleString()} credits at ${creditsPerSearch}/search`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-[var(--dash-text-muted)]">This month</p>
          <p
            className="mt-1 text-2xl font-semibold text-[var(--dash-text)]"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            {searchesThisMonth.toLocaleString()}
          </p>
          <p className="text-xs text-[var(--dash-text-muted)]">logged searches</p>
        </div>
      </div>

      {!unlimited && totalSearchesInGrant != null && totalSearchesInGrant > 0 && (
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--dash-bg)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pctUsed}%`,
              background: "linear-gradient(90deg, #1772E7, #5EB1FF)",
            }}
          />
        </div>
      )}
    </div>
  );
}


// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function UsagePage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  // Fetch all data on mount
  useEffect(() => {
    Promise.allSettled([
      fetch("/api/usage")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d) setUsage(d); }),
      fetch("/api/billing")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d) setBilling(d); }),
      fetch("/api/stats")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d) setStats(d); }),
    ]).finally(() => setLoading(false));
  }, []);

  const tier = billing?.tier ?? usage?.tier ?? "free";
  const isFree = tier === "free";

  // Compute total token savings across top repos for percentage
  const totalRepoSearches = stats?.topRepos.reduce((s, r) => s + r.count, 0) ?? 0;

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } catch {
      // ignore
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--dash-accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-none space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--dash-text)]">Usage</h1>
        <p className="mt-1 text-sm text-[var(--dash-text-muted)]">
          Resource consumption and plan limits
        </p>
      </div>

      {/* Section 1: Plan Overview */}
      <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}>
        <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--dash-accent-glow)]">
                <BarChart3 className="h-6 w-6 text-[var(--dash-accent-light)]" strokeWidth={1.5} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-[var(--dash-text)]">
                    {tierLabels[tier] ?? tier} Plan
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${tierColors[tier] ?? tierColors.free}`}
                  >
                    {tierLabels[tier] ?? tier}
                  </span>
                </div>
                {billing?.subscriptionStatus && (
                  <p className="mt-0.5 text-sm text-[var(--dash-text-muted)]">
                    Status:{" "}
                    <span className="font-medium capitalize">
                      {billing.subscriptionStatus}
                    </span>
                    {billing.licenseExpiresAt && (
                      <span className="ml-2">
                        · Renews {formatDate(billing.licenseExpiresAt)}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isFree && (
                <Link
                  href="/dashboard/billing"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--dash-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1565d8]"
                >
                  Upgrade
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              )}
              {!isFree && (
                <button
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--dash-border)] bg-[var(--dash-surface)] px-4 py-2 text-sm font-medium text-[var(--dash-text)] transition-colors hover:border-[var(--dash-border-strong)] hover:bg-[var(--dash-surface-hover)] disabled:opacity-50"
                >
                  {portalLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Opening...
                    </>
                  ) : (
                    "Manage Plan"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Section 2: Searches remaining (credit-based, primary) */}
      {usage && (
        <motion.div custom={1} initial="hidden" animate="visible" variants={fadeUp}>
          <SearchesRemainingCard
            creditBalance={usage.creditBalance}
            creditsPerSearch={usage.creditsPerSearch}
            creditGrantMonthly={usage.creditGrantMonthly}
            creditPeriodEnd={usage.creditPeriodEnd}
            searchesThisMonth={usage.searches.used ?? 0}
          />
        </motion.div>
      )}

      {/* Section 3: Usage Bars */}
      {usage && (
        <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp}>
          <div className="grid gap-4 sm:grid-cols-2">
            <UsageBarCard
              label="API Keys"
              icon={Key}
              used={usage.apiKeys.used}
              limit={usage.apiKeys.limit}
            />
            <UsageBarCard
              label="Repositories"
              icon={GitBranch}
              used={usage.repos.used}
              limit={usage.repos.limit}
            />
            <UsageBarCard
              label="Team Members"
              icon={Users}
              used={usage.seats.used}
              limit={usage.seats.limit}
            />
          </div>
        </motion.div>
      )}

      {/* Section 3: Usage by Repository */}
      {stats && stats.topRepos.length > 0 && (
        <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}>
          <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)]">
            <div className="flex items-center gap-3 border-b border-[var(--dash-border)] px-5 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--dash-accent-glow)]">
                <GitBranch className="h-4 w-4 text-[var(--dash-accent-light)]" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--dash-text)]">
                  Usage by Repository
                </h3>
                <p className="text-sm text-[var(--dash-text-muted)]">
                  Search volume per indexed repository
                </p>
              </div>
            </div>

            <div className="overflow-x-auto p-4">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm font-semibold text-[var(--dash-text-muted)]">
                    <th className="pb-3 pl-3">Repository</th>
                    <th className="pb-3 text-right">Searches</th>
                    <th className="pb-3 pr-3 text-right">% of Total</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {stats.topRepos.map((repo) => {
                    const pct =
                      totalRepoSearches > 0
                        ? Math.round((repo.count / totalRepoSearches) * 100)
                        : 0;
                    return (
                      <tr
                        key={repo.repo}
                        className="border-t border-[var(--dash-border)] transition-colors hover:bg-[var(--dash-surface-hover)]"
                      >
                        <td className="py-3 pl-3">
                          <span
                            className="font-medium text-[var(--dash-text)]"
                            style={{ fontFamily: "var(--font-geist-mono)" }}
                          >
                            {repo.repo}
                          </span>
                        </td>
                        <td
                          className="py-3 text-right text-[var(--dash-text)]"
                          style={{ fontFamily: "var(--font-geist-mono)" }}
                        >
                          {repo.count.toLocaleString()}
                        </td>
                        <td className="py-3 pr-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-[var(--dash-bg)] sm:block">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  background: "linear-gradient(90deg, #1772E7, #5EB1FF)",
                                }}
                              />
                            </div>
                            <span
                              className="text-[var(--dash-text-muted)]"
                              style={{ fontFamily: "var(--font-geist-mono)" }}
                            >
                              {pct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
