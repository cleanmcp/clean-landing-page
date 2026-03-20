"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Github,
  Check,
  Loader2,
  Lock,
  Globe,
  ArrowRight,
  Copy,
  RefreshCw,
  Search,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GitHubRepoInfo {
  id: number;
  fullName: string;
  name: string;
  owner: string;
  ownerAvatar: string;
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

interface CloudRepo {
  id: string;
  fullName: string;
  status: string;
  entityCount: number | null;
  lastIndexedAt: string | null;
  error: string | null;
}

interface OrgInfo {
  tier: string | null;
  hostingMode: string | null;
  slug: string;
}

type OnboardingStep = "connect-github" | "select-repos" | "indexing" | "mcp-config";

// ---------------------------------------------------------------------------
// Language colors
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// MCP Config
// ---------------------------------------------------------------------------

type ConfigTab = "claude-code" | "cursor" | "claude-desktop" | "antigravity" | "codex";

function getMcpConfig(tab: ConfigTab, apiKey: string, slug: string) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "X-Clean-Slug": slug,
  };

  if (tab === "claude-code") {
    return {
      mcpServers: {
        clean: {
          type: "sse",
          url: "https://api.tryclean.ai/mcp/sse",
          headers,
        },
      },
    };
  }
  if (tab === "cursor") {
    return {
      mcpServers: {
        clean: {
          type: "sse",
          url: "https://api.tryclean.ai/mcp/sse",
          headers,
        },
      },
    };
  }
  if (tab === "antigravity") {
    return {
      mcpServers: {
        clean: {
          serverUrl: "https://api.tryclean.ai/mcp",
          headers,
        },
      },
    };
  }
  if (tab === "codex") {
    return `[mcp_servers.clean]\nurl = "https://api.tryclean.ai/mcp"\n\n[mcp_servers.clean.http_headers]\nAuthorization = "Bearer ${apiKey}"\nX-Clean-Slug = "${slug}"\n`;
  }
  // claude-desktop
  return {
    mcpServers: {
      clean: {
        command: "npx",
        args: ["-y", "@tryclean/mcp-proxy"],
        env: {
          CLEAN_API_KEY: apiKey,
          CLEAN_SLUG: slug,
        },
      },
    },
  };
}

function formatMcpConfig(tab: ConfigTab, apiKey: string, slug: string): string {
  const config = getMcpConfig(tab, apiKey, slug);
  if (typeof config === "string") return config;
  return JSON.stringify(config, null, 2);
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function CloudOnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1772E7]" />
        </div>
      }
    >
      <CloudOnboardingContent />
    </Suspense>
  );
}

function CloudOnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<OnboardingStep>("connect-github");
  const [loading, setLoading] = useState(true);
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);

  // GitHub App state
  const [installUrl, setInstallUrl] = useState<string>("");
  const [installations, setInstallations] = useState<Installation[]>([]);

  // GitHub repos
  const [githubRepos, setGithubRepos] = useState<GitHubRepoInfo[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [reposLoading, setReposLoading] = useState(false);
  const [repoSearch, setRepoSearch] = useState("");
  const [repoLimit, setRepoLimit] = useState(3);

  // Cloud repos (indexing progress)
  const [cloudRepos, setCloudRepos] = useState<CloudRepo[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // MCP config
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [configTab, setConfigTab] = useState<ConfigTab>("claude-code");
  const [copied, setCopied] = useState<string | null>(null);

  const fetchGitHubStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/github/install");
      if (res.ok) {
        const data = await res.json();
        setInstallUrl(data.installUrl || "");
        setInstallations(data.installations || []);
        return data.connected as boolean;
      }
    } catch {}
    return false;
  }, []);

  const fetchGitHubRepos = useCallback(async () => {
    setReposLoading(true);
    try {
      const res = await fetch("/api/github/repos");
      if (res.ok) {
        const data = await res.json();
        setGithubRepos(data.repos || []);
        setInstallations(data.installations || []);
      }
    } catch {
      // silently fail
    } finally {
      setReposLoading(false);
    }
  }, []);

  // Load org info and determine starting step
  useEffect(() => {
    const requestedStep = searchParams.get("step") as OnboardingStep | null;

    (async () => {
      try {
        const [orgRes, installRes] = await Promise.all([
          fetch("/api/org"),
          fetch("/api/github/install"),
        ]);

        // Org info
        const orgData = orgRes.ok ? await orgRes.json() : null;
        if (orgData?.org) {
          const org = orgData.org as OrgInfo & { tier: string };
          setOrgInfo(org);
          const limits: Record<string, number> = { free: 3, pro: 15, max: Infinity, enterprise: Infinity };
          setRepoLimit(limits[org.tier ?? "free"] ?? 3);
        }

        // GitHub App installation status
        const installData = installRes.ok ? await installRes.json() : null;
        if (installData) {
          setInstallUrl(installData.installUrl || "");
          setInstallations(installData.installations || []);
        }

        let isConnected = installData?.connected ?? false;

        // If redirected from callback but connection not detected yet,
        // retry after a short delay (handles race condition / slow DB propagation)
        if (!isConnected && requestedStep === "select-repos") {
          await new Promise((r) => setTimeout(r, 1500));
          const retryRes = await fetch("/api/github/install");
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            if (retryData.connected) {
              isConnected = true;
              setInstallUrl(retryData.installUrl || "");
              setInstallations(retryData.installations || []);
            }
          }

          // If still not connected, try saving the installation via the
          // installation_id param that the callback may have passed through
          if (!isConnected) {
            const installationId = searchParams.get("installation_id");
            if (installationId) {
              try {
                const saveRes = await fetch("/api/github/install", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ installationId }),
                });
                if (saveRes.ok) {
                  // Re-check connection after saving
                  const recheck = await fetch("/api/github/install");
                  if (recheck.ok) {
                    const recheckData = await recheck.json();
                    if (recheckData.connected) {
                      isConnected = true;
                      setInstallUrl(recheckData.installUrl || "");
                      setInstallations(recheckData.installations || []);
                    }
                  }
                }
              } catch {
                // silently fail — user can retry from step 1
              }
            }
          }
        }

        if (isConnected) {
          // Fetch repos
          const ghRes = await fetch("/api/github/repos");
          if (ghRes.ok) {
            const ghData = await ghRes.json();
            setGithubRepos(ghData.repos || []);
          }

          if (requestedStep === "select-repos") {
            setStep("select-repos");
          } else {
            // Check for existing cloud repos
            const crRes = await fetch("/api/cloud-repos");
            if (crRes.ok) {
              const crData = await crRes.json();
              if (crData.repos?.length > 0) {
                setCloudRepos(crData.repos);
                const allDone = crData.repos.every(
                  (r: CloudRepo) => r.status === "ready" || r.status === "error"
                );
                setStep(allDone ? "mcp-config" : "indexing");
              } else {
                setStep("select-repos");
              }
            } else {
              setStep("select-repos");
            }
          }
        }
        // else: stay on connect-github
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams]);

  // Poll cloud repos during indexing
  useEffect(() => {
    if (step !== "indexing") return;

    const poll = async () => {
      try {
        const res = await fetch("/api/cloud-repos");
        if (res.ok) {
          const data = await res.json();
          setCloudRepos(data.repos || []);

          const allDone = data.repos.every(
            (r: CloudRepo) => r.status === "ready" || r.status === "error"
          );
          if (allDone && data.repos.length > 0) {
            setTimeout(() => setStep("mcp-config"), 1500);
          }
        }
      } catch {}
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [step]);

  // Auto-create API key when reaching MCP config step (check existing first)
  useEffect(() => {
    if (step !== "mcp-config" || apiKey) return;

    (async () => {
      try {
        // Check if an onboarding key already exists
        const listRes = await fetch("/api/keys");
        if (listRes.ok) {
          const listData = await listRes.json();
          const existing = (listData.keys ?? []).find(
            (k: { name: string; revokedAt: string | null }) =>
              k.name === "Cloud Onboarding Key" && !k.revokedAt
          );
          if (existing) {
            // Key exists but we can't show the raw key again — show prefix
            setApiKey(existing.keyPrefix + "...");
            return;
          }
        }

        // Create new key
        const res = await fetch("/api/keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Cloud Onboarding Key",
            scopes: ["search", "index"],
            expiresAt: null,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.key) setApiKey(data.key);
        }
      } catch {}
    })();
  }, [step, apiKey]);

  function handleInstallGitHubApp() {
    if (installUrl) {
      window.location.href = installUrl;
    }
  }

  function toggleRepo(fullName: string) {
    setSelectedRepos((prev) => {
      const next = new Set(prev);
      if (next.has(fullName)) {
        next.delete(fullName);
      } else if (next.size < repoLimit) {
        next.add(fullName);
      }
      return next;
    });
  }

  async function handleStartIndexing() {
    if (selectedRepos.size === 0) return;
    setSubmitting(true);
    setSubmitError(null);

    const reposToAdd = githubRepos
      .filter((r) => selectedRepos.has(r.fullName))
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
        const data = await res.json();
        // Immediately populate cloudRepos from the response so the indexing
        // step has something to show before the first poll completes
        if (data.repos?.length > 0) {
          setCloudRepos(
            data.repos.map((r: { id: string; fullName: string }) => ({
              id: r.id,
              fullName: r.fullName,
              status: "pending",
              entityCount: null,
              lastIndexedAt: null,
              error: null,
            }))
          );
        }
        setStep("indexing");
      } else {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.error || "Failed to start indexing. Please try again.");
      }
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1772E7]" />
      </div>
    );
  }

  const filteredRepos = githubRepos.filter(
    (r) =>
      r.fullName.toLowerCase().includes(repoSearch.toLowerCase()) ||
      (r.description?.toLowerCase().includes(repoSearch.toLowerCase()) ?? false)
  );

  // ---------------------------------------------------------------------------
  // Step indicator
  // ---------------------------------------------------------------------------

  const steps = [
    { id: "connect-github", label: "Connect GitHub" },
    { id: "select-repos", label: "Select Repos" },
    { id: "indexing", label: "Indexing" },
    { id: "mcp-config", label: "MCP Config" },
  ];

  const currentStepIdx = steps.findIndex((s) => s.id === step);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-[var(--dash-text)]">
          Set up Cloud Search
        </h2>
        <p className="mt-1 text-sm text-[var(--dash-text-muted)]">
          Connect your GitHub repos and get searching in minutes
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                i < currentStepIdx
                  ? "bg-green-100 text-green-700"
                  : i === currentStepIdx
                    ? "bg-[#1772E7] text-white"
                    : "bg-[var(--dash-border)] text-[var(--dash-text-muted)]"
              }`}
            >
              {i < currentStepIdx ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-xs font-medium ${
                i <= currentStepIdx
                  ? "text-[var(--dash-text)]"
                  : "text-[var(--dash-text-muted)]"
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div
                className={`h-px w-8 ${
                  i < currentStepIdx
                    ? "bg-green-300"
                    : "bg-[var(--dash-border)]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 1: Install GitHub App ── */}
      {step === "connect-github" && (
        <div className="rounded-xl border-2 border-[var(--dash-border)] bg-[var(--dash-surface)] p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1772E7]">
            <Github className="h-8 w-8 text-white" />
          </div>
          <h3 className="mt-5 text-xl font-semibold text-[var(--dash-text)]">
            Install the Clean GitHub App
          </h3>
          <p className="mt-2 text-sm text-[var(--dash-text-muted)]">
            Grant read-only access to your repositories.
            You choose exactly which repos to share.
          </p>
          <button
            onClick={handleInstallGitHubApp}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#1772E7] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1565d0]"
          >
            <Github className="h-4 w-4" />
            Install GitHub App
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          <p className="mt-4 text-sm text-[var(--dash-text-muted)]">
            We only read code — never write or modify your repos.
            Works with personal accounts and organizations.
          </p>
        </div>
      )}

      {/* ── Step 2: Select Repos ── */}
      {step === "select-repos" && (
        <div className="space-y-4">
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
                <h3 className="text-base font-semibold text-[var(--dash-text)]">
                  Select repositories to index
                </h3>
                <p className="mt-0.5 text-sm text-[var(--dash-text-muted)]">
                  {selectedRepos.size}/{repoLimit === Infinity ? "\u221E" : repoLimit} repos selected
                  {repoLimit !== Infinity && selectedRepos.size >= repoLimit && (
                    <span className="ml-2 text-amber-600">
                      — limit reached on your plan
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={fetchGitHubRepos}
                disabled={reposLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--dash-border)] px-3 py-1.5 text-xs font-medium text-[var(--dash-text)] hover:bg-[var(--dash-surface-hover)]"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${reposLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>

            {/* Search */}
            <div className="border-b border-[var(--dash-border)] px-5 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dash-text-muted)]" />
                <input
                  type="text"
                  placeholder="Search repositories..."
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  className="w-full rounded-lg border border-[var(--dash-border)] bg-[var(--dash-bg)] py-2 pl-9 pr-3 text-sm text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus:outline-none focus:ring-2 focus:ring-[#1772E7]"
                />
              </div>
            </div>

            {/* Repo list */}
            <div className="max-h-96 overflow-y-auto">
              {reposLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-[#1772E7]" />
                </div>
              ) : filteredRepos.length === 0 ? (
                <div className="py-12 text-center text-sm text-[var(--dash-text-muted)]">
                  {githubRepos.length === 0
                    ? "No repositories found. Make sure you granted access to at least one repo when installing the app."
                    : "No repos match your search."}
                </div>
              ) : (
                filteredRepos.map((repo) => {
                  const isSelected = selectedRepos.has(repo.fullName);
                  const isDisabled =
                    !isSelected && selectedRepos.size >= repoLimit;

                  return (
                    <button
                      key={repo.id}
                      onClick={() => !isDisabled && toggleRepo(repo.fullName)}
                      disabled={isDisabled}
                      className={`flex w-full items-center gap-3 border-b border-[var(--dash-border)] px-5 py-3 text-left transition-colors last:border-b-0 ${
                        isSelected
                          ? "bg-[#1772E7]/5"
                          : isDisabled
                            ? "cursor-not-allowed opacity-50"
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
                        {isSelected && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-[var(--dash-text)]">
                            {repo.fullName}
                          </span>
                          {repo.private ? (
                            <Lock className="h-3 w-3 text-[var(--dash-text-muted)]" />
                          ) : (
                            <Globe className="h-3 w-3 text-[var(--dash-text-muted)]" />
                          )}
                        </div>
                        {repo.description && (
                          <p className="mt-0.5 truncate text-xs text-[var(--dash-text-muted)]">
                            {repo.description}
                          </p>
                        )}
                      </div>

                      {repo.language && (
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                LANG_COLORS[repo.language] || "#888",
                            }}
                          />
                          <span className="text-xs text-[var(--dash-text-muted)]">
                            {repo.language}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Error */}
          {submitError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {submitError}
            </p>
          )}

          {/* Action */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-sm text-[var(--dash-text-muted)] hover:text-[var(--dash-text)]"
              >
                Skip for now
              </button>
              <a
                href={installUrl || "https://github.com/apps/clean-code-search/installations/new"}
                className="text-sm text-[var(--dash-text-muted)] hover:text-[var(--dash-text)]"
              >
                Add more repos on GitHub
              </a>
            </div>
            <button
              onClick={handleStartIndexing}
              disabled={selectedRepos.size === 0 || submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1772E7] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1565d0] disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Index {selectedRepos.size}{" "}
                  {selectedRepos.size === 1 ? "repo" : "repos"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {repoLimit !== Infinity && selectedRepos.size >= repoLimit && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center text-sm text-amber-800">
              You&apos;ve reached the {repoLimit}-repo limit on your plan.{" "}
              <button
                onClick={() => router.push("/dashboard/billing")}
                className="font-medium underline hover:no-underline"
              >
                Upgrade to Pro
              </button>{" "}
              for up to 15 repos.
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Indexing Progress ── */}
      {step === "indexing" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)]">
            <div className="border-b border-[var(--dash-border)] px-5 py-4">
              <h3 className="text-base font-semibold text-[var(--dash-text)]">
                Indexing your repositories
              </h3>
              <p className="mt-0.5 text-sm text-[var(--dash-text-muted)]">
                This usually takes 1-5 minutes per repo depending on size
              </p>
            </div>

            <div className="divide-y divide-[var(--dash-border)]">
              {cloudRepos.map((repo) => (
                <div key={repo.id} className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {repo.status === "ready" ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : repo.status === "error" ? (
                        <div className="h-5 w-5 rounded-full bg-red-100 p-1">
                          <div className="h-full w-full rounded-full bg-red-500" />
                        </div>
                      ) : (
                        <Loader2 className="h-5 w-5 animate-spin text-[#1772E7]" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-[var(--dash-text)]">
                          {repo.fullName}
                        </p>
                        <p className="text-xs text-[var(--dash-text-muted)]">
                          {repo.status === "ready"
                            ? `${repo.entityCount?.toLocaleString() ?? 0} entities indexed`
                            : repo.status === "error"
                              ? repo.error || "Indexing failed"
                              : repo.status === "cloning"
                                ? "Cloning repository..."
                                : repo.status === "indexing"
                                  ? "Parsing and embedding..."
                                  : "Waiting to start..."}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        repo.status === "ready"
                          ? "bg-green-100 text-green-700"
                          : repo.status === "error"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {repo.status === "ready"
                        ? "Done"
                        : repo.status === "error"
                          ? "Failed"
                          : "In progress"}
                    </span>
                  </div>
                  {(repo.status === "cloning" || repo.status === "indexing") && (
                    <div className="mt-3">
                      <Progress value={repo.status === "cloning" ? 20 : 60} className="h-1.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {cloudRepos.every((r) => r.status === "ready" || r.status === "error") &&
            cloudRepos.some((r) => r.status === "ready") && (
              <button
                onClick={() => setStep("mcp-config")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1772E7] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1565d0]"
              >
                Continue to MCP Config
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
        </div>
      )}

      {/* ── Step 4: MCP Config ── */}
      {step === "mcp-config" && (
        <div className="space-y-6">
          {/* Status banner */}
          {cloudRepos.some((r) => r.status === "ready") ? (
            <div className="flex items-center gap-3 rounded-xl border-2 border-green-200 bg-green-50 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Sparkles className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">
                  Your repos are indexed!
                </h3>
                <p className="text-sm text-green-700">
                  Add this config to your editor to start searching with Clean.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border-2 border-amber-200 bg-amber-50 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Sparkles className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900">
                  Indexing failed
                </h3>
                <p className="text-sm text-amber-700">
                  Your repos couldn&apos;t be indexed right now. You can retry from the{" "}
                  <button
                    onClick={() => router.push("/dashboard/repositories")}
                    className="font-medium underline hover:no-underline"
                  >
                    dashboard
                  </button>.
                  The MCP config below will work once indexing succeeds.
                </p>
              </div>
            </div>
          )}

          {/* API Key */}
          {apiKey && (
            <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)]">
              <div className="border-b border-[var(--dash-border)] px-5 py-3">
                <h3 className="text-base font-semibold text-[var(--dash-text)]">
                  Your API Key
                </h3>
                <p className="mt-0.5 text-sm text-[var(--dash-text-muted)]">
                  Store this securely — it won&apos;t be shown again
                </p>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 rounded-lg border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3 py-2.5">
                  <code className="flex-1 break-all font-mono text-xs text-[var(--dash-text)]">
                    {apiKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(apiKey, "key")}
                    className="shrink-0 text-[var(--dash-text-muted)] hover:text-[var(--dash-text)]"
                  >
                    {copied === "key" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MCP Config */}
          <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)]">
            <div className="border-b border-[var(--dash-border)] px-5 py-3">
              <h3 className="text-base font-semibold text-[var(--dash-text)]">
                MCP Configuration
              </h3>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap border-b border-[var(--dash-border)]">
              {(
                [
                  { id: "claude-code", label: "Claude Code" },
                  { id: "cursor", label: "Cursor" },
                  { id: "claude-desktop", label: "Claude Desktop" },
                  { id: "antigravity", label: "Antigravity" },
                  { id: "codex", label: "Codex" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setConfigTab(tab.id)}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                    configTab === tab.id
                      ? "border-b-2 border-[#1772E7] text-[#1772E7]"
                      : "text-[var(--dash-text-muted)] hover:text-[var(--dash-text)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5">
              <p className="mb-3 text-xs text-[var(--dash-text-muted)]">
                {configTab === "claude-code"
                  ? "Add to your Claude Code MCP settings:"
                  : configTab === "cursor"
                    ? "Add to ~/.cursor/mcp.json:"
                    : configTab === "antigravity"
                      ? "Add to ~/.gemini/antigravity/mcp_config.json:"
                      : configTab === "codex"
                        ? "Add to ~/.codex/config.toml:"
                        : "Add to your Claude Desktop config:"}
              </p>
              <div className="overflow-hidden rounded-lg border border-[var(--dash-border)]">
                <pre className="overflow-x-auto bg-[var(--dash-bg)] p-4 font-mono text-[12px] leading-relaxed text-[var(--dash-text)]">
                  {formatMcpConfig(configTab, apiKey || "clean_sk_prod_xxxxx", orgInfo?.slug || "your-org")}
                </pre>
              </div>
              <button
                onClick={() =>
                  copyToClipboard(
                    formatMcpConfig(configTab, apiKey || "clean_sk_prod_xxxxx", orgInfo?.slug || "your-org"),
                    "config"
                  )
                }
                className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  copied === "config"
                    ? "border border-green-200 bg-green-50 text-green-700"
                    : "border border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] hover:bg-[var(--dash-surface-hover)]"
                }`}
              >
                {copied === "config" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied === "config" ? "Copied!" : "Copy config"}
              </button>
            </div>
          </div>

          {/* Done button */}
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full rounded-lg bg-[#1772E7] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1565d0]"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
