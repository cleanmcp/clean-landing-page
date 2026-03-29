"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Github,
  Loader2,
  Check,
  Lock,
  Globe,
  Search,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

interface GitHubRepoInfo {
  id: number;
  fullName: string;
  name: string;
  private: boolean;
  defaultBranch: string;
  language: string | null;
  description: string | null;
  updatedAt: string;
  installationId: string | null;
}

interface Installation {
  id: string;
  accountLogin: string;
  accountAvatarUrl: string;
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  Java: "#b07219",
  Ruby: "#701516",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  PHP: "#4F5D95",
};

export default function AddReposPage() {
  const router = useRouter();

  const [repos, setRepos] = useState<GitHubRepoInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [installUrl, setInstallUrl] = useState("");
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [repoLimit, setRepoLimit] = useState(3);
  const [existingFullNames, setExistingFullNames] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [installRes, ghRes, crRes, orgRes] = await Promise.all([
        fetch("/api/github/install"),
        fetch("/api/github/repos"),
        fetch("/api/cloud-repos"),
        fetch("/api/org"),
      ]);

      if (installRes.ok) {
        const installData = await installRes.json();
        setConnected(installData.connected);
        setInstallUrl(installData.installUrl || "");
        setInstallations(installData.installations || []);
      }

      if (ghRes.ok) {
        const ghData = await ghRes.json();
        setRepos(ghData.repos || []);
        if (ghData.connected) setConnected(true);
      }

      if (crRes.ok) {
        const crData = await crRes.json();
        setExistingFullNames(new Set((crData.repos ?? []).map((r: { fullName: string }) => r.fullName)));
      }

      if (orgRes.ok) {
        const orgData = await orgRes.json();
        const tier = orgData.org?.tier ?? "free";
        const limits: Record<string, number> = { free: 3, pro: 15, max: Infinity, enterprise: Infinity };
        setRepoLimit(limits[tier] ?? 3);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [awaitingGitHub, setAwaitingGitHub] = useState(false);

  // Poll for GitHub connection while user is on GitHub in another tab
  useEffect(() => {
    if (!awaitingGitHub || connected) return;

    const poll = async () => {
      try {
        const res = await fetch("/api/github/install");
        if (res.ok) {
          const data = await res.json();
          if (data.connected) {
            setAwaitingGitHub(false);
            setConnected(true);
            setInstallations(data.installations || []);
            // Re-fetch repos now that we're connected
            fetchData();
          }
        }
      } catch {}
    };

    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [awaitingGitHub, connected, fetchData]);

  function handleInstallGitHubApp() {
    if (installUrl) {
      window.open(installUrl, "_blank");
      setAwaitingGitHub(true);
    }
  }

  function toggle(fullName: string) {
    if (existingFullNames.has(fullName)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(fullName)) {
        next.delete(fullName);
      } else if (existingCount + next.size < repoLimit) {
        next.add(fullName);
      }
      return next;
    });
  }

  async function handleAdd() {
    if (selected.size === 0) return;
    setSubmitting(true);
    setError(null);

    const reposToAdd = repos
      .filter((r) => selected.has(r.fullName))
      .map((r) => ({
        fullName: r.fullName,
        defaultBranch: r.defaultBranch,
        language: r.language,
        private: r.private,
        installationId: r.installationId ?? null,
      }));

    try {
      const res = await fetch("/api/cloud-repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repos: reposToAdd }),
      });

      if (res.ok) {
        router.push("/dashboard/repositories");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to add repos");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const existingCount = existingFullNames.size;
  const slotsLeft = Math.max(0, repoLimit - existingCount);
  const filtered = repos.filter(
    (r) =>
      r.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (r.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/repositories")}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--dash-text-muted)] hover:text-[var(--dash-text)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Repositories
        </button>
      </div>

      <div>
        <h2 className="text-3xl font-bold text-[var(--dash-text)]">Add Repositories</h2>
        <p className="mt-1 text-sm text-[var(--dash-text-muted)]">
          Select repos from your GitHub account to index.
        </p>
      </div>

      {/* Not connected — install GitHub App */}
      {!loading && !connected && (
        <div className="rounded-xl border-2 border-dashed border-[var(--dash-border)] bg-[var(--dash-surface)] p-8 text-center">
          <Github className="mx-auto h-10 w-10 text-[var(--dash-text-muted)]" />
          <h3 className="mt-3 text-base font-semibold text-[var(--dash-text)]">Install the Clean GitHub App</h3>
          <p className="mt-1 text-sm text-[var(--dash-text-muted)]">
            Grant read-only access so Clean can index your repositories.
          </p>
          <button
            onClick={handleInstallGitHubApp}
            disabled={awaitingGitHub}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1772E7] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1565d0] disabled:opacity-70"
            data-tutorial="install-github-app"
          >
            {awaitingGitHub ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Waiting for GitHub...
              </>
            ) : (
              <>
                <Github className="h-4 w-4" />
                Install GitHub App
                <ExternalLink className="h-3.5 w-3.5" />
              </>
            )}
          </button>
          {awaitingGitHub && (
            <p className="mt-2 text-sm text-[#1772E7]">
              Complete the installation on GitHub, then come back here.
            </p>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--dash-text-muted)]" />
        </div>
      )}

      {/* Repo picker */}
      {!loading && connected && (
        <>
          {/* Connected accounts */}
          {installations.length > 0 && (
            <div className="flex items-center gap-3 text-sm text-[var(--dash-text-muted)]">
              <span>Connected:</span>
              {installations.map((inst) => (
                <span
                  key={inst.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--dash-border)] bg-[var(--dash-surface)] px-3 py-1 text-xs font-medium text-[var(--dash-text)]"
                >
                  {inst.accountAvatarUrl && (
                    <img src={inst.accountAvatarUrl} alt="" className="h-4 w-4 rounded-full" />
                  )}
                  {inst.accountLogin}
                </span>
              ))}
              <a
                href={installUrl || "https://github.com/apps/clean-code-search/installations/new"}
                className="text-xs text-[#1772E7] hover:underline"
              >
                + Add another account
              </a>
            </div>
          )}

          <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)]">
            <div className="flex items-center justify-between border-b border-[var(--dash-border)] px-5 py-4">
              <div>
                <p className="text-sm font-medium text-[var(--dash-text)]">
                  {selected.size} selected
                  {repoLimit !== Infinity && (
                    <span className="ml-2 text-[var(--dash-text-muted)]">
                      · {slotsLeft} slot{slotsLeft !== 1 ? "s" : ""} remaining on your plan
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={fetchData}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--dash-border)] px-3 py-1.5 text-xs font-medium text-[var(--dash-text)] hover:bg-[var(--dash-surface-hover)]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>

            <div className="border-b border-[var(--dash-border)] px-5 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dash-text-muted)]" />
                <input
                  type="text"
                  placeholder="Search repositories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-[var(--dash-border)] bg-[var(--dash-bg)] py-2 pl-9 pr-3 text-sm text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus:outline-none focus:ring-2 focus:ring-[#1772E7]"
                />
              </div>
            </div>

            <div className="max-h-[28rem] overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="py-10 text-center text-sm text-[var(--dash-text-muted)]">
                  {repos.length === 0 ? "No repositories found." : "No repos match your search."}
                </p>
              ) : (
                filtered.map((repo) => {
                  const alreadyAdded = existingFullNames.has(repo.fullName);
                  const isSelected = alreadyAdded || selected.has(repo.fullName);
                  const atLimit = !isSelected && existingCount + selected.size >= repoLimit;
                  return (
                    <button
                      key={repo.id}
                      onClick={() => !alreadyAdded && !atLimit && toggle(repo.fullName)}
                      disabled={alreadyAdded || atLimit}
                      className={`flex w-full items-center gap-3 border-b border-[var(--dash-border)] px-5 py-3 text-left transition-colors last:border-b-0 ${
                        alreadyAdded
                          ? "cursor-default opacity-60"
                          : isSelected
                            ? "bg-[#1772E7]/5"
                            : atLimit
                              ? "cursor-not-allowed opacity-40"
                              : "hover:bg-[var(--dash-surface-hover)]"
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                          isSelected
                            ? "border-[#1772E7] bg-[#1772E7]"
                            : "border-[var(--dash-border)]"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-[var(--dash-text)]">
                            {repo.fullName}
                          </span>
                          {repo.private ? (
                            <Lock className="h-3 w-3 shrink-0 text-[var(--dash-text-muted)]" />
                          ) : (
                            <Globe className="h-3 w-3 shrink-0 text-[var(--dash-text-muted)]" />
                          )}
                        </div>
                        {repo.description && (
                          <p className="mt-0.5 truncate text-sm text-[var(--dash-text-muted)]">
                            {repo.description}
                          </p>
                        )}
                      </div>

                      {repo.language && !alreadyAdded && (
                        <div className="flex shrink-0 items-center gap-1.5">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: LANG_COLORS[repo.language] || "#888" }}
                          />
                          <span className="text-xs text-[var(--dash-text-muted)]">{repo.language}</span>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {!loading && connected && slotsLeft === 0 && selected.size === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You&apos;ve reached the repo limit on your plan.{" "}
          <button
            onClick={() => router.push("/dashboard/billing")}
            className="font-medium underline hover:no-underline"
          >
            Upgrade to add more
          </button>
        </div>
      )}

      {!loading && connected && (
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => router.push("/dashboard/repositories")}
            className="rounded-lg border border-[var(--dash-border)] px-4 py-2 text-sm font-medium text-[var(--dash-text)] hover:bg-[var(--dash-surface-hover)]"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={selected.size === 0 || submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1772E7] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1565d0] disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Index {selected.size || ""} {selected.size === 1 ? "repo" : selected.size > 1 ? "repos" : "repos"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
