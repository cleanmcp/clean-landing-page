"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Github,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Trash2,
  Plus,
  Lock,
  Globe,
  WifiOff,
  PauseCircle,
  AlertTriangle,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { UpgradeModal } from "@/components/upgrade-modal";

interface JobProgress {
  phase: string;
  phase_progress: number;
  files_processed: number;
  files_total: number;
  entities_found: number;
}

interface CloudRepo {
  id: string;
  fullName: string;
  defaultBranch: string | null;
  language: string | null;
  private: boolean;
  status: string;
  entityCount: number | null;
  lastIndexedAt: string | null;
  error: string | null;
  createdAt: string;
  description?: string | null;
  source?: "github" | "mcp";
  job?: JobProgress | null;
}

interface Installation {
  id: string;
  accountLogin: string;
  accountAvatarUrl: string;
}

const POLL_ACTIVE = 3000;
const POLL_IDLE = 30000;

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  Java: "#b07219",
  Ruby: "#701516",
};

function formatDate(date: string | null) {
  if (!date) return "Never";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const URL_ERROR_MESSAGES: Record<string, string> = {
  installation_claimed:
    "This GitHub account is already connected to another organization. Each GitHub installation can only be linked to one organization at a time.",
  invalid_state:
    "The connection request expired or was invalid. Please try connecting again.",
};

export default function CloudReposPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [repos, setRepos] = useState<CloudRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasInstallation, setHasInstallation] = useState(false);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [installUrl, setInstallUrl] = useState("");
  const [repoLimit, setRepoLimit] = useState<number | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkId, setLinkId] = useState("");
  const [linking, setLinking] = useState(false);

  // Track recently deleted repos so polling doesn't re-add them before the
  // engine finishes processing the delete.
  const deletedRepos = useRef<Map<string, number>>(new Map());

  // Show error from URL params (e.g. after GitHub callback redirect)
  useEffect(() => {
    const errorCode = searchParams.get("error");
    if (errorCode && URL_ERROR_MESSAGES[errorCode]) {
      setMessage({ type: "error", text: URL_ERROR_MESSAGES[errorCode] });
      // Clean the error param from the URL without a navigation
      router.replace("/dashboard/repositories", { scroll: false });
    }
  }, [searchParams, router]);

  const fetchRepos = useCallback(async () => {
    try {
      const [crRes, ghRes, installRes] = await Promise.all([
        fetch("/api/cloud-repos"),
        fetch("/api/github/repos"),
        fetch("/api/github/install"),
      ]);

      if (crRes.ok) {
        const data = await crRes.json();
        // Expire stale entries (>30s) and filter out recently deleted repos
        const now = Date.now();
        for (const [name, ts] of deletedRepos.current) {
          if (now - ts > 30_000) deletedRepos.current.delete(name);
        }
        const filtered = ((data.repos || []) as CloudRepo[]).filter(
          (r) => !deletedRepos.current.has(r.fullName)
        );
        setRepos(filtered);
        setRepoLimit(data.repoLimit ?? null);
      }

      if (ghRes.ok) {
        const data = await ghRes.json();
        setHasInstallation(data.connected || (data.installations?.length ?? 0) > 0);
      }

      if (installRes.ok) {
        const data = await installRes.json();
        setInstallations(data.installations || []);
        setInstallUrl(data.installUrl || "");
        if (data.connected) setHasInstallation(true);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Smart polling
  useEffect(() => {
    fetchRepos();

    let intervalId: ReturnType<typeof setInterval>;

    function startPolling() {
      clearInterval(intervalId);
      const hasActive = repos.some(
        (r) =>
          r.status === "cloning" ||
          r.status === "indexing" ||
          r.status === "pending"
      );
      const interval = hasActive ? POLL_ACTIVE : POLL_IDLE;
      intervalId = setInterval(fetchRepos, interval);
    }

    startPolling();

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        fetchRepos();
        startPolling();
      } else {
        clearInterval(intervalId);
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchRepos, repos.map((r) => r.status).join(",")]);

  async function handleDelete(repoId: string, fullName: string) {
    setActionInProgress(repoId);
    try {
      const res = await fetch(`/api/cloud-repos?id=${encodeURIComponent(repoId)}&fullName=${encodeURIComponent(fullName)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        deletedRepos.current.set(fullName, Date.now());
        setRepos((prev) => prev.filter((r) => r.id !== repoId));
        setMessage({ type: "success", text: `${fullName} removed` });
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage({
          type: "error",
          text: data.error || "Failed to remove repo",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleReindex(repo: CloudRepo) {
    setActionInProgress(repo.id);
    try {
      const res = await fetch("/api/cloud-repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repos: [
            {
              fullName: repo.fullName,
              defaultBranch: repo.defaultBranch,
              language: repo.language,
              private: repo.private,
            },
          ],
        }),
      });
      if (res.ok) {
        setMessage({
          type: "success",
          text: `Re-indexing ${repo.fullName}...`,
        });
        fetchRepos();
      }
    } catch {
      setMessage({ type: "error", text: "Failed to re-index" });
    } finally {
      setActionInProgress(null);
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="h-5 w-5 text-[#05DF72]" />;
      case "error":
        return <XCircle className="h-5 w-5 text-[#ef4444]" />;
      case "disconnected":
        return <WifiOff className="h-5 w-5 text-[#f59e0b]" />;
      case "paused":
        return <PauseCircle className="h-5 w-5 text-[#f59e0b]" />;
      case "not_indexed":
        return <Clock className="h-5 w-5 text-[var(--dash-text-muted)]" />;
      case "cloning":
      case "indexing":
      case "pending":
        return (
          <Loader2 className="h-5 w-5 animate-spin text-[var(--dash-accent-light)]" />
        );
      default:
        return <Clock className="h-5 w-5 text-[var(--dash-text-muted)]" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ready": return "Indexed";
      case "error": return "Failed";
      case "disconnected": return "Disconnected";
      case "paused": return "Paused";
      case "not_indexed": return "Not indexed";
      case "cloning": return "Cloning...";
      case "indexing": return "Indexing...";
      case "pending": return "Pending...";
      default: return status;
    }
  };

  const getStatusBadge = (status: string) => {
    const text = getStatusText(status);
    const style = status === "ready"
      ? "bg-[#05DF72]/10 text-[#05DF72]"
      : status === "error"
        ? "bg-[#ef4444]/10 text-[#ef4444]"
        : status === "disconnected" || status === "paused"
          ? "bg-[#f59e0b]/10 text-[#f59e0b]"
          : status === "not_indexed"
            ? "bg-[var(--dash-text-muted)]/10 text-[var(--dash-text-muted)]"
            : "bg-[#1772E7]/10 text-[var(--dash-accent-light)]";
    return (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
        {text}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-none space-y-8"
    >
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--dash-text)]">
            Repositories
          </h1>
          <p className="mt-1 text-sm text-[var(--dash-text-muted)]">
            Manage your indexed repositories
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasInstallation && (
            <button
              onClick={() => router.push("/dashboard/repositories/add")}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1772E7] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1565d0]"
              data-tutorial="add-repos"
            >
              <Plus className="h-4 w-4" />
              Add Repos
            </button>
          )}
        </div>
      </div>

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
              <div className="h-1.5 w-1.5 rounded-full bg-[#05DF72]" />
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!confirm(`Disconnect GitHub account "${inst.accountLogin}"? Existing indexed repos will remain but you won't be able to add new ones from this account.`)) return;
                  try {
                    const res = await fetch(`/api/github/install?id=${encodeURIComponent(inst.id)}`, { method: "DELETE" });
                    if (res.ok) {
                      setInstallations((prev) => prev.filter((i) => i.id !== inst.id));
                      setMessage({ type: "success", text: `Disconnected ${inst.accountLogin}` });
                      fetchRepos();
                    } else {
                      const data = await res.json().catch(() => ({}));
                      setMessage({ type: "error", text: data.error || "Failed to disconnect" });
                    }
                  } catch {
                    setMessage({ type: "error", text: "Network error" });
                  }
                }}
                className="ml-0.5 text-[var(--dash-text-muted)] hover:text-[#ef4444] transition-colors"
                title="Disconnect"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <a
            href={installUrl || "https://github.com/apps/clean-code-search/installations/new"}
            className="text-xs text-[var(--dash-accent-light)] hover:underline"
          >
            + Add another account
          </a>
        </div>
      )}

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === "error"
              ? "border-[var(--dash-error)]/30 bg-[var(--dash-error)]/10 text-[var(--dash-error)]"
              : "border-[var(--dash-success)]/30 bg-[var(--dash-success)]/10 text-[var(--dash-success)]"
          }`}
        >
          {message.text}
        </div>
      )}

      {repoLimit !== null && repos.length > repoLimit && (
        <div className="flex items-center gap-3 rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-4 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-[#f59e0b]" />
          <div className="text-sm text-[#f59e0b]">
            <span className="font-medium">You&apos;re over your plan limit.</span>{" "}
            Your plan allows {repoLimit} {repoLimit === 1 ? "repo" : "repos"} but you have {repos.length}.{" "}
            {repos.filter((r) => r.status === "paused").length > 0 && (
              <>
                {repos.filter((r) => r.status === "paused").length}{" "}
                {repos.filter((r) => r.status === "paused").length === 1 ? "repo is" : "repos are"} paused.{" "}
              </>
            )}
            Remove repos or{" "}
            <button
              onClick={() => setShowUpgrade(true)}
              className="font-medium underline hover:no-underline"
            >
              upgrade your plan
            </button>{" "}
            to restore access.
          </div>
        </div>
      )}

      {!hasInstallation && !loading && (
        <div className="rounded-xl border-2 border-dashed border-[var(--dash-border)] bg-[var(--dash-surface)] p-8 text-center">
          <Github className="mx-auto h-10 w-10 text-[var(--dash-text-muted)]" />
          <h3 className="mt-3 text-base font-semibold text-[var(--dash-text)]">
            Connect GitHub to get started
          </h3>
          <p className="mt-1 text-sm text-[var(--dash-text-muted)]">
            Install the Clean GitHub App to access and index your repositories.
          </p>
          <button
            onClick={() => router.push("/dashboard/repositories/add")}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1772E7] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1565d0]"
            data-tutorial="connect-github"
          >
            <Github className="h-4 w-4" />
            Connect GitHub
          </button>

          <div className="mt-4">
            {!showLinkForm ? (
              <button
                onClick={() => setShowLinkForm(true)}
                className="text-xs text-[var(--dash-text-muted)] hover:text-[var(--dash-accent-light)] transition-colors"
              >
                Already installed? Link with installation ID
              </button>
            ) : (
              <div className="mx-auto mt-2 flex max-w-sm items-center gap-2">
                <input
                  type="text"
                  placeholder="Installation ID (from GitHub URL)"
                  value={linkId}
                  onChange={(e) => setLinkId(e.target.value)}
                  className="flex-1 rounded-lg border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3 py-2 text-sm text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus:border-[#1772E7] focus:outline-none"
                />
                <button
                  onClick={async () => {
                    if (!linkId.trim()) return;
                    setLinking(true);
                    try {
                      const res = await fetch("/api/github/install/link", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ installationId: linkId.trim() }),
                      });
                      const data = await res.json();
                      if (res.ok) {
                        setMessage({ type: "success", text: `Linked GitHub account: ${data.account}` });
                        setShowLinkForm(false);
                        setLinkId("");
                        fetchRepos();
                      } else {
                        setMessage({ type: "error", text: data.error || "Failed to link" });
                      }
                    } catch {
                      setMessage({ type: "error", text: "Network error" });
                    } finally {
                      setLinking(false);
                    }
                  }}
                  disabled={linking || !linkId.trim()}
                  className="rounded-lg bg-[#1772E7] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1565d0] disabled:opacity-50"
                >
                  {linking ? "Linking..." : "Link"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Repo list */}
      {repos.length > 0 && (
        <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)]">
          <div className="flex items-center justify-between border-b border-[var(--dash-border)] px-6 py-4">
            <div>
              <h3 className="text-base font-semibold text-[var(--dash-text)]">
                Indexed Repositories
              </h3>
              <p className="mt-0.5 text-sm text-[var(--dash-text-muted)]">
                {repos.length}{" "}
                {repos.length === 1 ? "repository" : "repositories"}
              </p>
            </div>
            <button
              onClick={fetchRepos}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--dash-border)] px-3 py-1.5 text-sm font-medium text-[var(--dash-text)] transition-colors hover:border-[var(--dash-border-strong)] hover:bg-[var(--dash-surface-hover)]"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>

          <div className="divide-y divide-[var(--dash-border)]">
            {repos.map((repo) => (
              <div
                key={repo.id}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[var(--dash-surface-hover)]"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(repo.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium font-mono text-[var(--dash-text)]">
                        {repo.fullName}
                      </p>
                      {repo.source !== "mcp" && (
                        repo.private ? (
                          <Lock className="h-3 w-3 text-[var(--dash-text-muted)]" />
                        ) : (
                          <Globe className="h-3 w-3 text-[var(--dash-text-muted)]" />
                        )
                      )}
                      {repo.language && (
                        <div className="flex items-center gap-1">
                          <div
                            className="h-2 w-2 rounded-full"
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
                    </div>
                    <p className="text-sm text-[var(--dash-text-muted)]">
                      {repo.status === "not_indexed"
                        ? "Saved but not yet indexed"
                        : repo.status === "ready" && repo.entityCount !== null
                          ? `${repo.entityCount.toLocaleString()} entities`
                          : repo.error
                            ? repo.error
                            : repo.job
                              ? `${repo.job.phase === "cloning" ? "Cloning" : "Indexing"}${repo.job.files_total > 0 ? ` · ${repo.job.files_processed}/${repo.job.files_total} files` : ""}${repo.job.entities_found > 0 ? ` · ${repo.job.entities_found} entities found` : ""}`
                              : getStatusText(repo.status)}
                      {repo.lastIndexedAt && repo.status === "ready" && (
                        <span className="ml-2">
                          · Last indexed {formatDate(repo.lastIndexedAt)}
                        </span>
                      )}
                    </p>
                    {repo.job && (repo.job.phase_progress ?? 0) > 0 && (
                      <div className="mt-1.5 h-1.5 w-48 overflow-hidden rounded-full bg-[var(--dash-bg)]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(repo.job.phase_progress ?? 0, 100)}%`,
                            background: "linear-gradient(90deg, #1772E7, #5EB1FF)",
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Index / Re-index button */}
                  {repo.status === "not_indexed" && (
                    <button
                      onClick={() => handleReindex(repo)}
                      disabled={actionInProgress === repo.id}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#1772E7] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#1565d0] disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Index
                    </button>
                  )}
                  {(repo.status === "ready" || repo.status === "error") && (
                    <button
                      onClick={() => handleReindex(repo)}
                      disabled={actionInProgress === repo.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-[var(--dash-border)] px-3 py-1.5 text-sm font-medium text-[var(--dash-text)] transition-colors hover:border-[var(--dash-border-strong)] hover:bg-[var(--dash-surface-hover)] disabled:opacity-50"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Re-index
                    </button>
                  )}

                  {/* Delete button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="inline-flex items-center justify-center rounded-lg border border-[var(--dash-border)] p-1.5 text-[var(--dash-text-muted)] transition-colors hover:bg-[#ef4444]/10 hover:text-[#ef4444] disabled:opacity-50"
                        disabled={actionInProgress === repo.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-[var(--dash-border)] bg-[var(--dash-surface)]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-[var(--dash-text)]">Remove Repository?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[var(--dash-text-muted)]">
                          This will remove{" "}
                          <strong className="text-[var(--dash-text)]">{repo.fullName}</strong> from your index and
                          delete all associated data. This action cannot be
                          undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] hover:bg-[var(--dash-surface-hover)]">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(repo.id, repo.fullName)}
                          className="bg-[#ef4444] text-white hover:bg-[#dc2626]"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Status badge */}
                  {getStatusBadge(repo.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && repos.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--dash-text-muted)]" />
        </div>
      )}

      {!loading && repos.length === 0 && hasInstallation && (
        <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-8 text-center">
          <p className="text-sm text-[var(--dash-text-muted)]">
            No repos indexed yet.{" "}
            <button
              onClick={() => router.push("/dashboard/repositories/add")}
              className="font-medium text-[var(--dash-accent-light)] hover:underline"
            >
              Select repos to index
            </button>
          </p>
        </div>
      )}
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="repos"
      />
    </motion.div>
  );
}
