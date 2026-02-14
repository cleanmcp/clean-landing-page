"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Key, GitBranch, Zap, Search } from "lucide-react";
import { GlowCard } from "@/components/dashboard/glow-card";

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

interface AuditEntry {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  createdAt: string;
  user: { name: string | null; email: string | null } | null;
}

interface OrgData {
  apiKeyCount: number;
  members: Array<{
    user: { name: string | null; email: string | null };
  }>;
}

function formatAction(action: string): string {
  const map: Record<string, string> = {
    "key.created": "Created API key",
    "key.revoked": "Revoked API key",
    "repo.indexed": "Indexed repository",
    "repo.deleted": "Deleted repository",
    auth_failure: "Auth failure",
  };
  return map[action] || action;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const statsConfig = [
  { key: "keys", label: "API KEYS", icon: Key },
  { key: "repos", label: "REPOSITORIES", icon: GitBranch },
  { key: "searches", label: "SEARCHES", icon: Search },
  { key: "tokens", label: "TOKENS SAVED", icon: Zap },
] as const;

export default function DashboardPage() {
  const { user } = useUser();
  const firstName = user?.firstName || "there";

  const [stats, setStats] = useState<SearchStats | null>(null);
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [repoCount, setRepoCount] = useState<number | null>(null);
  const [repoError, setRepoError] = useState(false);
  const [activity, setActivity] = useState<AuditEntry[]>([]);

  useEffect(() => {
    // Fetch all dashboard data in parallel
    Promise.allSettled([
      fetch("/api/stats")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d && d.totalSearches !== undefined) setStats(d); }),
      fetch("/api/org")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d && d.id) setOrgData(d); }),
      fetch("/api/repos")
        .then((r) => {
          if (!r.ok) {
            setRepoError(true);
            return { repos: [] };
          }
          return r.json();
        })
        .then((d) => setRepoCount(d.repos?.length ?? 0)),
    ]);

    // Fetch recent activity from audit logs via stats endpoint
    // The activity is available through the org endpoint indirectly,
    // but for now we'll derive it from the stats we have
  }, []);

  const statValues = {
    keys: {
      value: orgData ? String(orgData.apiKeyCount) : "\u2014",
      sub: "Active keys",
    },
    repos: {
      value:
        repoError
          ? "\u2014"
          : repoCount !== null
            ? String(repoCount)
            : "\u2014",
      sub: repoError ? "Backend unreachable" : "Indexed",
    },
    searches: {
      value: stats ? stats.totalSearches.toLocaleString() : "\u2014",
      sub: stats ? `${stats.searchesThisWeek} this week` : "No data",
    },
    tokens: {
      value: stats
        ? `~${stats.totalTokensSaved.toLocaleString()}`
        : "\u2014",
      sub: stats ? "Via TOON format" : "No data",
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
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  {data.sub}
                </p>
              </div>
            </GlowCard>
          );
        })}
      </div>

      {/* Two-column cards */}
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
            {stats && stats.recentSearches.length > 0 ? (
              <div className="space-y-2">
                {stats.recentSearches.map((s) => (
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
                {activity.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start justify-between gap-3 rounded-md p-2.5 transition-colors hover:bg-[var(--cream)]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--ink)]">
                        {formatAction(a.action)}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                        {a.user?.name || a.user?.email || "System"}
                        {a.resourceId ? ` \u2014 ${a.resourceId}` : ""}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-[11px] text-[var(--ink-muted)]">
                      {timeAgo(a.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-[var(--ink-muted)]">
                <Zap
                  className="mx-auto mb-2 h-10 w-10 text-[var(--ink-muted)]/25"
                  strokeWidth={1.5}
                />
                <p className="text-sm">No recent activity</p>
                <p className="mt-0.5 text-xs">
                  Activity will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
