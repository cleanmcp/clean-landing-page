"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Key, GitBranch, Zap, Search, Activity, Rocket, Terminal, Copy, Check, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { GlowCard } from "@/components/dashboard/glow-card";
import { Progress } from "@/components/ui/progress";
import type { ActivityItem } from "@/app/api/dashboard/activity/route";
import type { TokenSavingsStats } from "@/app/api/dashboard/stats/route";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SearchStats {
  totalSearches: number;
  totalTokensSaved: number;
  searchesThisWeek: number;
  recentSearches: Array<{
    id: string;
    repo: string;
    query: string;
    resultCount: number;
    tokensSaved: number;
    durationMs: number;
    createdAt: string;
  }>;
}

interface OrgData {
  apiKeyCount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Relative timestamp: "just now", "2m ago", "1h ago", "3d ago" */
function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/** Human-readable label for an audit-log action + metadata. */
function formatActivityItem(item: ActivityItem): {
  label: string;
  sub: string;
} {
  const meta = item.metadata ?? {};
  const keyName = item.apiKeyName ? `'${item.apiKeyName}'` : "API key";
  const actorName =
    item.user?.name || item.user?.email || (item.apiKeyName ? item.apiKeyName : "System");

  switch (item.action) {
    case "repo.index_started": {
      const repo = (meta.repo as string) || item.resourceId || "unknown repo";
      return { label: `Indexing started for ${repo}`, sub: actorName };
    }
    case "repo.index_completed": {
      const repo = (meta.repo as string) || item.resourceId || "unknown repo";
      const entities =
        typeof meta.entityCount === "number"
          ? ` — ${meta.entityCount.toLocaleString()} entities`
          : "";
      return { label: `${repo} indexed${entities}`, sub: actorName };
    }
    case "repo.index_failed": {
      const repo = (meta.repo as string) || item.resourceId || "unknown repo";
      return { label: `Indexing failed for ${repo}`, sub: actorName };
    }
    case "repo.indexed":
      return {
        label: `Repository indexed${item.resourceId ? `: ${item.resourceId}` : ""}`,
        sub: actorName,
      };
    case "repo.deleted":
      return {
        label: `Repository deleted${item.resourceId ? `: ${item.resourceId}` : ""}`,
        sub: actorName,
      };
    case "key.created":
      return { label: `API key ${keyName} created`, sub: actorName };
    case "key.revoked":
      return { label: `API key ${keyName} revoked`, sub: actorName };
    case "auth_failure":
      return { label: "Authentication failure", sub: actorName };
    default:
      return { label: item.action.replace(/[._]/g, " "), sub: actorName };
  }
}

/** Format large numbers compactly: 1234567 → "1.2M", 12345 → "12.3k" */
function compactNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

/** Percentage reduction: how much smaller b is vs a. Returns 0–100 clamped. */
function pctReduction(a: number, b: number): number {
  if (!a || a <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round(((a - b) / a) * 100)));
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type Period = "7d" | "30d" | "all";

const periodLabels: Record<Period, string> = {
  "7d": "7d",
  "30d": "30d",
  all: "All time",
};

function PeriodSelector({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div className="flex gap-1 rounded-md border border-[var(--cream-dark)] bg-[var(--cream)] p-0.5">
      {(Object.keys(periodLabels) as Period[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
            value === p
              ? "bg-white text-[var(--ink)] shadow-sm"
              : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
          }`}
        >
          {periodLabels[p]}
        </button>
      ))}
    </div>
  );
}

function TokenSavingsCard() {
  const [period, setPeriod] = useState<Period>("30d");
  const [stats, setStats] = useState<TokenSavingsStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(
    async (p: Period) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard/stats?period=${p}`);
        if (res.ok) {
          const data: TokenSavingsStats = await res.json();
          setStats(data);
        }
      } catch {
        // silently ignore — empty state shown
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchStats(period);
  }, [period, fetchStats]);

  const hasPrecisionData =
    stats != null &&
    stats.totalSourceFileChars != null &&
    stats.totalSnippetChars != null &&
    stats.totalSourceFileChars > 0;

  const hasToonData = stats != null && stats.totalJsonChars > 0;
  const hasAnyData = hasPrecisionData || hasToonData;

  const precisionPct = hasPrecisionData
    ? pctReduction(stats!.totalSourceFileChars!, stats!.totalSnippetChars!)
    : 0;
  const toonPct =
    hasToonData ? pctReduction(stats!.totalJsonChars, stats!.totalToonChars) : 0;

  return (
    <div className="rounded-lg border border-[var(--cream-dark)] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--cream-dark)] p-5 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--ink)]">Token Savings</h3>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            Estimated context reduction per search — approximate (chars/4)
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="p-4">
        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-md bg-[var(--cream)]"
              />
            ))}
          </div>
        ) : !hasAnyData ? (
          <div className="py-10 text-center text-[var(--ink-muted)]">
            <Zap
              className="mx-auto mb-2 h-10 w-10 text-[var(--ink-muted)]/25"
              strokeWidth={1.5}
            />
            <p className="text-sm">No searches yet</p>
            <p className="mt-0.5 text-xs">
              Token savings will appear here as you use the search API
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Totals row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md bg-[var(--cream)] px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--ink-muted)]">
                  Est. tokens saved
                </p>
                <p className="mt-0.5 text-xl font-bold text-[var(--ink)]">
                  ~{compactNum(stats!.totalTokensSaved)}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
                  {stats!.totalSearches.toLocaleString()} searches
                </p>
              </div>
              <div className="rounded-md bg-[var(--cream)] px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--ink-muted)]">
                  Chars saved
                </p>
                <p className="mt-0.5 text-xl font-bold text-[var(--ink)]">
                  {compactNum(stats!.totalCharsSaved)}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
                  via TOON format
                </p>
              </div>
            </div>

            {/* Search precision savings (snippet vs full file) */}
            {hasPrecisionData && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[var(--ink)]">
                    Search precision
                  </span>
                  <span className="text-[11px] font-semibold text-[var(--accent)]">
                    {precisionPct}% smaller
                  </span>
                </div>
                <Progress value={precisionPct} className="h-1.5" />
                <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
                  Snippets ({compactNum(stats!.totalSnippetChars!)} chars) vs full
                  files ({compactNum(stats!.totalSourceFileChars!)} chars)
                </p>
              </div>
            )}

            {/* TOON compression savings */}
            {hasToonData && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[var(--ink)]">
                    TOON compression
                  </span>
                  <span className="text-[11px] font-semibold text-[var(--accent)]">
                    {toonPct}% smaller
                  </span>
                </div>
                <Progress value={toonPct} className="h-1.5" />
                <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
                  TOON format ({compactNum(stats!.totalToonChars)} chars) vs JSON (
                  {compactNum(stats!.totalJsonChars)} chars)
                </p>
              </div>
            )}

            <p className="text-[10px] text-[var(--ink-muted)]/70">
              Token counts are estimated at 1 token per 4 characters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Setup Card — first-time experience
// ---------------------------------------------------------------------------

interface OrgInfo {
  id: string;
  name: string;
  tier: string | null;
  licenseKey: string | null;
  licenseRevoked: boolean | null;
}

type SetupPhase = "loading" | "choose-plan" | "provisioning" | "license-ready" | "done";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["3 repositories", "1 team member", "Community support"],
    cta: "Start Free",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    period: "/month",
    features: ["25 repositories", "10 team members", "Priority support", "Advanced analytics"],
    cta: "Subscribe",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: ["Unlimited repositories", "Unlimited members", "Dedicated support", "SSO & audit logs"],
    cta: "Contact Sales",
    popular: false,
  },
];

function SetupCard({ onComplete }: { onComplete: (licenseKey: string, tier: string) => void }) {
  const [phase, setPhase] = useState<SetupPhase>("loading");
  const [orgTier, setOrgTier] = useState<string | null>(null);
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedLicense, setCopiedLicense] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const setup = params.get("setup");

    // If returning from Stripe checkout, auto-provision
    if (setup === "complete" && sessionId) {
      setPhase("provisioning");
      fetch("/api/stripe/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.licenseKey) {
            setLicenseKey(data.licenseKey);
            setOrgTier(data.tier || "pro");
            setPhase("license-ready");
            // Clean up URL
            window.history.replaceState({}, "", "/dashboard");
          } else {
            setPhase("choose-plan");
          }
        })
        .catch(() => setPhase("choose-plan"));
      return;
    }

    // Normal load — check if org has license or paid tier
    fetch("/api/org")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.org) {
          setPhase("choose-plan");
          return;
        }
        const org = data.org as OrgInfo;
        const hasPaidPlan = org.tier === "pro" || org.tier === "enterprise";
        if (hasPaidPlan || (org.licenseKey && !org.licenseRevoked)) {
          setPhase("done");
        } else {
          setPhase("choose-plan");
        }
      })
      .catch(() => setPhase("choose-plan"));
  }, []);

  async function handleFreePlan() {
    setActionLoading(true);
    try {
      const res = await fetch("/api/stripe/free", { method: "POST" });
      const data = await res.json();
      if (data.licenseKey) {
        setLicenseKey(data.licenseKey);
        setOrgTier("free");
        setPhase("license-ready");
      }
    } catch {
      // fallback
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePaidPlan(planId: string) {
    if (planId === "enterprise") {
      window.open("mailto:hello@tryclean.ai?subject=Clean Enterprise", "_blank");
      return;
    }

    setActionLoading(true);
    try {
      const priceId = planId === "pro" ? process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID : "";
      if (!priceId) {
        alert("Stripe price ID not configured.");
        setActionLoading(false);
        return;
      }
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // fallback
    } finally {
      setActionLoading(false);
    }
  }

  function copyToClipboard(text: string, type: "command" | "license") {
    navigator.clipboard.writeText(text);
    if (type === "command") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopiedLicense(true);
      setTimeout(() => setCopiedLicense(false), 2000);
    }
  }

  // Auto-dismiss setup card 8 seconds after license is ready
  useEffect(() => {
    if (phase === "license-ready" && licenseKey) {
      const timer = setTimeout(() => {
        onComplete(licenseKey, orgTier || "free");
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [phase, licenseKey, orgTier, onComplete]);

  if (phase === "loading" || phase === "done") return null;

  if (phase === "provisioning") {
    return (
      <div className="flex items-center justify-center gap-3 rounded-xl border-2 border-[var(--accent)]/20 bg-white p-8">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
        <span className="text-sm text-[var(--ink-muted)]">Setting up your account...</span>
      </div>
    );
  }

  if (phase === "choose-plan") {
    return (
      <div className="rounded-xl border-2 border-[var(--accent)]/20 bg-white p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/10">
            <Rocket className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--ink)]">Get started with Clean</h3>
            <p className="text-sm text-[var(--ink-muted)]">Choose a plan to get your license key and start indexing.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-xl border p-5 transition-all ${
                plan.popular
                  ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/10"
                  : "border-[var(--cream-dark)]"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[10px] font-semibold text-white">
                  Popular
                </span>
              )}
              <h4 className="text-sm font-semibold text-[var(--ink)]">{plan.name}</h4>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[var(--ink)]">{plan.price}</span>
                {plan.period && <span className="text-xs text-[var(--ink-muted)]">{plan.period}</span>}
              </div>
              <ul className="mt-4 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-[var(--ink-light)]">
                    <Check className="h-3 w-3 text-[var(--accent)]" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => plan.id === "free" ? handleFreePlan() : handlePaidPlan(plan.id)}
                disabled={actionLoading}
                className={`mt-4 flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                  plan.popular
                    ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-secondary)]"
                    : "border border-[var(--cream-dark)] text-[var(--ink)] hover:bg-[var(--cream)]"
                }`}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : plan.cta}
                {!actionLoading && <ArrowRight className="h-3 w-3" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // license-ready phase — shown briefly after provisioning, then auto-dismissed
  const installCommand = "npx @tryclean/create";
  const tierLabel = orgTier === "free" ? "Free" : orgTier === "pro" ? "Pro" : "Enterprise";

  return (
    <div className="rounded-xl border-2 border-green-200 bg-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <Sparkles className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--ink)]">You&apos;re all set!</h3>
            <p className="text-sm text-[var(--ink-muted)]">
              {tierLabel} plan active. Run this command to install Clean.
            </p>
          </div>
        </div>
        <button
          onClick={() => { onComplete(licenseKey || "", orgTier || "free"); }}
          className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]"
        >
          Dismiss
        </button>
      </div>

      {/* Single install command — license is baked in */}
      <div className="rounded-lg bg-[var(--ink)] p-4">
        <div className="mb-2 flex items-center gap-2">
          <Terminal className="h-4 w-4 text-green-400" />
          <span className="text-xs font-medium text-gray-400">Install Clean</span>
        </div>
        <div className="flex items-center justify-between rounded-md bg-black/30 px-3 py-2">
          <code className="text-sm text-green-400">{installCommand}</code>
          <button
            onClick={() => copyToClipboard(installCommand, "command")}
            className="ml-2 text-gray-500 hover:text-white"
          >
            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* License key — collapsible detail */}
      <div className="mt-3 rounded-lg border border-[var(--cream-dark)] bg-[var(--cream)] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span className="text-xs text-[var(--ink-muted)]">License key</span>
          </div>
          <button
            onClick={() => licenseKey && copyToClipboard(licenseKey, "license")}
            className="flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
          >
            {copiedLicense ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
          </button>
        </div>
        <code className="mt-1 block truncate text-[11px] text-[var(--ink-light)]">
          {licenseKey || "..."}
        </code>
        <p className="mt-1.5 text-[11px] text-[var(--ink-muted)]">
          The installer will ask for this key. You can also find it in Billing.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------

const statsConfig = [
  { key: "keys", label: "API KEYS", icon: Key },
  { key: "repos", label: "REPOSITORIES", icon: GitBranch },
  { key: "searches", label: "SEARCHES", icon: Search },
  { key: "tokens", label: "TOKENS SAVED", icon: Zap },
] as const;

const ACTIVITY_POLL_MS = 30_000;

export default function DashboardPage() {
  const { user } = useUser();
  const firstName = user?.firstName || "there";

  const [searchStats, setSearchStats] = useState<SearchStats | null>(null);
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [repoCount, setRepoCount] = useState<number | null>(null);
  const [repoError, setRepoError] = useState(false);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [showSetup, setShowSetup] = useState(true);
  const [hasLicense, setHasLicense] = useState<boolean | null>(null);

  // Fetch activity (used for initial load and polling)
  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/activity");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.activity)) {
          setActivity(data.activity);
        }
      }
    } catch {
      // silently ignore polling errors
    }
  }, []);

  useEffect(() => {
    // Fetch all dashboard data on mount
    Promise.allSettled([
      fetch("/api/stats")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d && d.totalSearches !== undefined) setSearchStats(d);
        }),
      fetch("/api/org")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.org) {
            setOrgData({ apiKeyCount: d.apiKeyCount ?? 0 });
            // Has license if licenseKey exists OR tier is paid (licenseKey may be hidden for non-owners)
            const hasPaidPlan = d.org.tier === "pro" || d.org.tier === "enterprise";
            setHasLicense(hasPaidPlan || (!!d.org.licenseKey && !d.org.licenseRevoked));
          }
        }),
      fetch("/api/repos")
        .then((r) => {
          if (!r.ok) {
            setRepoError(true);
            return { repos: [] };
          }
          return r.json();
        })
        .then((d) => setRepoCount(d.repos?.length ?? 0)),
      fetch("/api/dashboard/activity")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (Array.isArray(d?.activity)) setActivity(d.activity);
        }),
    ]);

    // Poll activity every 30 seconds
    const interval = setInterval(fetchActivity, ACTIVITY_POLL_MS);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  const statValues = {
    keys: {
      value: orgData ? String(orgData.apiKeyCount) : "\u2014",
      sub: "Active keys",
    },
    repos: {
      value: repoError
        ? "\u2014"
        : repoCount !== null
          ? String(repoCount)
          : "\u2014",
      sub: repoError ? "Backend unreachable" : "Indexed",
    },
    searches: {
      value: searchStats ? searchStats.totalSearches.toLocaleString() : "\u2014",
      sub: searchStats ? `${searchStats.searchesThisWeek} this week` : "No data",
    },
    tokens: {
      value: searchStats
        ? `~${searchStats.totalTokensSaved.toLocaleString()}`
        : "\u2014",
      sub: searchStats ? "Via TOON format" : "No data",
    },
  };

  return (
    <div className="max-w-6xl space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-medium text-[var(--ink)]">
          Welcome back, {firstName}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Here&apos;s an overview of your account activity.
        </p>
      </div>

      {/* First-time setup card — only when explicitly no license */}
      {hasLicense === false && showSetup && (
        <SetupCard onComplete={() => { setShowSetup(false); setHasLicense(true); }} />
      )}

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsConfig.map((s) => {
          const data = statValues[s.key];
          const Icon = s.icon;
          return (
            <GlowCard
              key={s.key}
              className="rounded-lg border border-[var(--cream-dark)] bg-white"
            >
              <div className="relative p-5">
                <div className="absolute bottom-0 left-0 top-0 w-[3px] rounded-l-lg bg-[var(--accent)]" />
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-semibold tracking-widest text-[var(--ink-muted)]">
                    {s.label}
                  </span>
                  <Icon
                    className="h-4 w-4 text-[var(--accent)]/60"
                    strokeWidth={2}
                  />
                </div>
                <div className="text-2xl font-bold tracking-tight text-[var(--ink)]">
                  {data.value}
                </div>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">{data.sub}</p>
              </div>
            </GlowCard>
          );
        })}
      </div>

      {/* Two-column cards — row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Searches */}
        <div className="rounded-lg border border-[var(--cream-dark)] bg-white">
          <div className="border-b border-[var(--cream-dark)] p-5 pb-3">
            <h3 className="text-sm font-semibold text-[var(--ink)]">
              Recent Searches
            </h3>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
              Latest code searches across your repositories
            </p>
          </div>
          <div className="p-4">
            {searchStats && searchStats.recentSearches.length > 0 ? (
              <div className="space-y-2">
                {searchStats.recentSearches.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-start justify-between gap-3 rounded-md p-2.5 transition-colors hover:bg-[var(--cream)]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--ink)]">
                        {s.query}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                        {s.repo} &middot; {s.resultCount} results &middot;{" "}
                        {s.durationMs}ms
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-[11px] text-[var(--ink-muted)]">
                      {timeAgo(s.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-[var(--ink-muted)]">
                <Search
                  className="mx-auto mb-2 h-10 w-10 text-[var(--ink-muted)]/25"
                  strokeWidth={1.5}
                />
                <p className="text-sm">No searches yet</p>
                <p className="mt-0.5 text-xs">
                  Use the API or MCP to search code
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg border border-[var(--cream-dark)] bg-white">
          <div className="border-b border-[var(--cream-dark)] p-5 pb-3">
            <h3 className="text-sm font-semibold text-[var(--ink)]">
              Recent Activity
            </h3>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
              Latest account and API activity
            </p>
          </div>
          <div className="p-4">
            {activity.length > 0 ? (
              <div className="space-y-2">
                {activity.map((a) => {
                  const { label, sub } = formatActivityItem(a);
                  return (
                    <div
                      key={a.id}
                      className="flex items-start justify-between gap-3 rounded-md p-2.5 transition-colors hover:bg-[var(--cream)]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--ink)]">
                          {label}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                          {sub}
                        </p>
                      </div>
                      <span className="whitespace-nowrap text-[11px] text-[var(--ink-muted)]">
                        {timeAgo(a.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center text-[var(--ink-muted)]">
                <Activity
                  className="mx-auto mb-2 h-10 w-10 text-[var(--ink-muted)]/25"
                  strokeWidth={1.5}
                />
                <p className="text-sm">No recent activity</p>
                <p className="mt-0.5 text-xs">
                  Repository indexing and key events will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Token Savings Card — full width below the two-column row */}
      <TokenSavingsCard />
    </div>
  );
}
