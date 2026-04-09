"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Key,
  GitBranch,
  Zap,
  Search,
  Activity,
  Rocket,
  Check,
  ArrowRight,
  Loader2,
  Plus,
  Clock,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

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

function compactNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Token Savings (Overview chart) — shadcn interactive area chart
// ---------------------------------------------------------------------------

const tokenChartConfig = {
  original: {
    label: "Original (JSON)",
    color: "var(--chart-1)",
  },
  compressed: {
    label: "Compressed (TOON)",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

type Period = "7d" | "30d" | "all";

function fillDateGaps(
  data: { date: string; original: number; compressed: number }[],
  period: Period
): { date: string; original: number; compressed: number }[] {
  if (data.length === 0) return [];

  const lookup = new Map(data.map((d) => [d.date, d]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let startDate: Date;
  const endDate = new Date(today);

  if (period === "7d") {
    startDate = new Date(today.getTime() - 6 * 86400000);
  } else if (period === "30d") {
    startDate = new Date(today.getTime() - 29 * 86400000);
  } else {
    // "all" — go from earliest data point, but ensure at least 14 days of range
    const sorted = data.map((d) => d.date).sort();
    const earliest = new Date(sorted[0]);
    const minStart = new Date(today.getTime() - 13 * 86400000);
    startDate = earliest < minStart ? earliest : minStart;
  }

  const filled: { date: string; original: number; compressed: number }[] = [];
  const cur = new Date(startDate);
  while (cur <= endDate) {
    const key = cur.toISOString().slice(0, 10);
    const existing = lookup.get(key);
    filled.push(existing ?? { date: key, original: 0, compressed: 0 });
    cur.setDate(cur.getDate() + 1);
  }
  return filled;
}

function compactAxis(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function TokenSavingsCard() {
  const [period, setPeriod] = useState<Period>("30d");
  const [stats, setStats] = useState<TokenSavingsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchStats = useCallback(async (p: Period) => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/dashboard/stats?period=${p}`);
      if (res.ok) {
        const data: TokenSavingsStats = await res.json();
        setStats(data);
      } else {
        const text = await res.text();
        console.error(`[dashboard/stats] API ${res.status}: ${text.slice(0, 120)}`);
        setFetchError("error");
      }
    } catch (err) {
      console.error("[dashboard/stats] Fetch error:", err);
      setFetchError("error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(period);
  }, [period, fetchStats]);

  const hasData = stats != null && Array.isArray(stats.daily) && stats.daily.length > 0;

  const rawChartData = hasData
    ? stats!.daily.map((d) => ({
        date: d.date,
        original: d.jsonChars,
        compressed: d.toonChars,
      }))
    : [];

  const chartData = hasData ? fillDateGaps(rawChartData, period) : [];

  // Summary stats
  const totalOriginal = hasData ? stats!.totalJsonChars : 0;
  const totalCompressed = hasData ? stats!.totalToonChars : 0;
  const savingsPercent =
    totalOriginal > 0
      ? Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100)
      : 0;

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle className="text-base font-semibold">Token Savings</CardTitle>
          <CardDescription>
            Context size before & after TOON compression
          </CardDescription>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Select period"
          >
            <SelectValue placeholder="Last 30 days" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="30d" className="rounded-lg">Last 30 days</SelectItem>
            <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
            <SelectItem value="all" className="rounded-lg">All time</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : fetchError ? (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-destructive">Failed to load chart data</p>
            <p className="mt-1 text-xs text-muted-foreground">Please try refreshing the page</p>
          </div>
        ) : !hasData ? (
          <div className="py-12 text-center">
            <Zap className="mx-auto mb-3 h-10 w-10 text-muted-foreground/25" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">No searches yet</p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              Token savings will appear here as you use the search API
            </p>
          </div>
        ) : (
          <>
            {/* Summary row */}
            <div className="mb-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Original</p>
                <p className="text-lg font-semibold tabular-nums">{compactNum(totalOriginal)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Compressed</p>
                <p className="text-lg font-semibold tabular-nums">{compactNum(totalCompressed)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saved</p>
                <p className="text-lg font-semibold tabular-nums text-emerald-500">{savingsPercent}%</p>
              </div>
            </div>

            <ChartContainer
              config={tokenChartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fillOriginal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-original)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-original)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="fillCompressed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-compressed)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-compressed)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={48}
                  tickFormatter={compactAxis}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }}
                      indicator="dot"
                    />
                  }
                />
                <Area
                  dataKey="original"
                  type="monotone"
                  fill="url(#fillOriginal)"
                  stroke="var(--color-original)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
                <Area
                  dataKey="compressed"
                  type="monotone"
                  fill="url(#fillCompressed)"
                  stroke="var(--color-compressed)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </>
        )}
      </CardContent>
    </Card>
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
    features: ["2 repos", "1 user", "10 searches/mo", "Cloud only"],
    cta: "Start Free",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$20",
    period: "/mo",
    features: ["15 repos", "5 users", "500 searches/mo", "Priority indexing"],
    cta: "Subscribe",
    popular: true,
  },
  {
    id: "max",
    name: "Max",
    price: "$100",
    period: "/mo",
    features: ["Unlimited repos", "10 users", "5,000 searches/mo", "Private cloud + SLA"],
    cta: "Subscribe",
    popular: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: ["Unlimited everything", "SSO + audit logs", "Dedicated infra", "Dedicated support"],
    cta: "Contact Sales",
    popular: false,
  },
];

function SetupCard({ onComplete }: { onComplete: () => void }) {
  const router = useRouter();
  const [phase, setPhase] = useState<SetupPhase>("loading");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const setup = params.get("setup");

    if (setup === "complete" && sessionId) {
      setPhase("provisioning");
      fetch("/api/stripe/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, hostingMode: "cloud" }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.licenseKey || data.success) {
            onComplete();
            window.history.replaceState({}, "", "/dashboard");
            router.push("/dashboard/onboarding");
          } else {
            setPhase("choose-plan");
          }
        })
        .catch(() => setPhase("choose-plan"));
      return;
    }

    fetch("/api/org")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.org) {
          setPhase("choose-plan");
          return;
        }
        const org = data.org as OrgInfo & { hostingMode?: string };
        const hasPaidPlan = org.tier === "pro" || org.tier === "max" || org.tier === "enterprise";
        const isCloud = org.hostingMode === "cloud";
        if (isCloud || hasPaidPlan || (org.licenseKey && !org.licenseRevoked)) {
          setPhase("done");
          onComplete();
        } else {
          setPhase("choose-plan");
        }
      })
      .catch(() => setPhase("choose-plan"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFreePlan() {
    setLoadingPlan("free");
    try {
      const res = await fetch("/api/stripe/free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostingMode: "cloud" }),
      });
      const data = await res.json();
      if (data.licenseKey || data.success) {
        onComplete();
        router.push("/dashboard/onboarding");
        return;
      }
    } catch {
      // fallback
    } finally {
      setLoadingPlan(null);
    }
  }

  async function handlePaidPlan(planId: string) {
    if (planId === "enterprise") {
      window.open("mailto:hello@tryclean.ai?subject=Clean Enterprise", "_blank");
      return;
    }

    setLoadingPlan(planId);
    try {
      const priceId =
        planId === "pro" ? process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID :
        planId === "max" ? process.env.NEXT_PUBLIC_STRIPE_MAX_PRICE_ID : "";
      if (!priceId) {
        alert("Stripe price ID not configured.");
        setLoadingPlan(null);
        return;
      }
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, hostingMode: "cloud" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // fallback
    } finally {
      setLoadingPlan(null);
    }
  }

  if (phase === "loading" || phase === "done") return null;

  if (phase === "provisioning") {
    return (
      <Card className="border-l-4 border-l-primary">
        <CardContent className="flex items-center justify-center gap-3 py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Setting up your account...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Rocket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Get started with Clean</CardTitle>
            <p className="text-sm text-muted-foreground">Choose a plan to start indexing your repos.</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-xl border p-5 transition-all ${
                plan.popular
                  ? "border-primary ring-1 ring-primary/20"
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2.5 left-4" variant="default">
                  Popular
                </Badge>
              )}
              <h4 className="text-base font-semibold">{plan.name}</h4>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold tabular-nums">{plan.price}</span>
                {plan.period && (
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                )}
              </div>
              <ul className="mt-4 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-3 w-3 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => plan.id === "free" ? handleFreePlan() : handlePaidPlan(plan.id)}
                disabled={loadingPlan !== null}
                variant={plan.popular ? "default" : "outline"}
                size="sm"
                className="mt-4 w-full"
              >
                {loadingPlan === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : plan.cta}
                {loadingPlan !== plan.id && <ArrowRight className="ml-1 h-3 w-3" />}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------

const statsConfig = [
  { key: "keys", label: "API Keys", icon: Key },
  { key: "repos", label: "Repositories", icon: GitBranch },
  { key: "searches", label: "Total Searches", icon: Search },
  { key: "tokens", label: "Tokens Saved", icon: Zap },
] as const;

const ACTIVITY_POLL_MS = 30_000;

export default function DashboardPage() {
  const { user } = useUser();
  const firstName = user?.firstName || "there";

  const [searchStats, setSearchStats] = useState<SearchStats | null>(null);
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [repoCount, setRepoCount] = useState<number | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [showSetup, setShowSetup] = useState(true);
  const [hasLicense, setHasLicense] = useState<boolean | null>(null);

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
      // silently ignore
    }
  }, []);

  useEffect(() => {
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
            const hasPaidPlan = d.org.tier === "pro" || d.org.tier === "max" || d.org.tier === "enterprise";
            const isCloud = d.org.hostingMode === "cloud";
            setHasLicense(isCloud || hasPaidPlan || (!!d.org.licenseKey && !d.org.licenseRevoked));
          }
        }),
      fetch("/api/cloud-repos")
        .then((r) => (r.ok ? r.json() : { repos: [] }))
        .then((d) => setRepoCount(d.repos?.length ?? 0)),
      fetch("/api/dashboard/activity")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (Array.isArray(d?.activity)) setActivity(d.activity);
        }),
    ]);

    const interval = setInterval(fetchActivity, ACTIVITY_POLL_MS);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  const statValues = {
    keys: {
      value: orgData ? String(orgData.apiKeyCount) : "—",
      sub: "Active keys",
    },
    repos: {
      value: repoCount !== null ? String(repoCount) : "—",
      sub: "Cloud repos",
    },
    searches: {
      value: searchStats ? searchStats.totalSearches.toLocaleString() : "—",
      sub: searchStats ? `${searchStats.searchesThisWeek} this week` : "No data yet",
    },
    tokens: {
      value: searchStats ? `~${searchStats.totalTokensSaved.toLocaleString()}` : "—",
      sub: searchStats ? "Via TOON format" : "No data yet",
    },
  };

  return (
    <div className="space-y-4">
      {/* Page Header — matches shadcn-admin: text-2xl font-bold tracking-tight */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
        <Button size="sm" asChild>
          <Link href="/dashboard/keys/new">
            <Plus className="mr-1 h-4 w-4" />
            New Key
          </Link>
        </Button>
      </div>

      {/* Setup card */}
      {hasLicense === false && showSetup && (
        <SetupCard onComplete={() => { setShowSetup(false); setHasLicense(true); }} />
      )}

      {/* Tabs — matches shadcn-admin Dashboard pattern */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Row 1: Stat Cards — exact shadcn-admin pattern */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statsConfig.map((s) => {
              const data = statValues[s.key];
              const Icon = s.icon;
              return (
                <Card key={s.key}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-semibold">
                      {s.label}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">{data.value}</div>
                    <p className="text-sm text-muted-foreground">
                      {data.sub}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Row 2: Chart (col-span-4) + Recent Searches (col-span-3) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <div className="lg:col-span-4">
              <TokenSavingsCard />
            </div>
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Recent Searches</CardTitle>
                <CardDescription>
                  Latest code searches across your repositories.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {searchStats && searchStats.recentSearches.length > 0 ? (
                  <div className="space-y-4">
                    {searchStats.recentSearches.slice(0, 6).map((s) => (
                      <div key={s.id} className="flex items-center">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                          <Search className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="ml-4 min-w-0 flex-1 space-y-1">
                          <p className="truncate text-sm font-medium leading-none">
                            {s.query}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {s.repo}
                          </p>
                        </div>
                        <div className="ml-auto text-right">
                          <p className="text-sm font-medium tabular-nums">
                            ~{compactNum(s.tokensSaved)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {s.durationMs}ms
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground/25" strokeWidth={1.5} />
                    <p className="text-sm font-medium text-muted-foreground">Try asking Clean...</p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2 px-4">
                      {[
                        "Which API endpoints are accessible without authentication?",
                        "What happens when checkout fails after payment succeeds?",
                        "What parts of the codebase would break if we renamed the User table?",
                      ].map((tip) => (
                        <span
                          key={tip}
                          className="inline-block rounded-lg bg-muted/50 border border-border/50 px-3 py-1.5 text-xs text-muted-foreground leading-relaxed"
                        >
                          &ldquo;{tip}&rdquo;
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground/50">
                      Use these prompts with any MCP-compatible agent
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              <CardDescription>
                Latest account and API events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activity.length > 0 ? (
                <div className="space-y-4">
                  {activity.map((a) => {
                    const { label, sub } = formatActivityItem(a);
                    return (
                      <div key={a.id} className="flex items-center">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="ml-4 min-w-0 flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">{label}</p>
                          <p className="text-sm text-muted-foreground">{sub}</p>
                        </div>
                        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {timeAgo(a.createdAt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Activity className="mx-auto mb-3 h-10 w-10 text-muted-foreground/25" strokeWidth={1.5} />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                  <p className="mt-1 text-sm text-muted-foreground/70">
                    Repository indexing and key events will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
