"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { UpgradeModal } from "@/components/upgrade-modal";

interface JobProgress {
  phase: string;
  progress: number;
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

export default function CloudReposPage() {
  const router = useRouter();
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

  const fetchRepos = useCallback(async () => {
    try {
      const [crRes, ghRes, installRes] = await Promise.all([
        fetch("/api/cloud-repos"),
        fetch("/api/github/repos"),
        fetch("/api/github/install"),
      ]);

      if (crRes.ok) {
        const data = await crRes.json();
        setRepos(data.repos || []);
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
      const res = await fetch(`/api/cloud-repos?id=${encodeURIComponent(repoId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMessage({ type: "success", text: `${fullName} removed` });
        fetchRepos();
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
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "disconnected":
        return <WifiOff className="h-5 w-5 text-amber-500" />;
      case "paused":
        return <PauseCircle className="h-5 w-5 text-amber-500" />;
      case "cloning":
      case "indexing":
      case "pending":
        return (
          <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
        );
      default:
        return <Clock className="h-5 w-5 text-[var(--ink-muted)]" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ready":
        return "Indexed";
      case "error":
        return "Failed";
      case "disconnected":
        return "Disconnected";
      case "paused":
        return "Paused";
      case "cloning":
        return "Cloning...";
      case "indexing":
        return "Indexing...";
      case "pending":
        return "Pending...";
      default:
        return status;
    }
  };

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-medium text-[var(--ink)]">
            Repositories
          </h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Manage your indexed GitHub repositories
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasInstallation && (
            <button
              onClick={() => router.push("/dashboard/repositories/add")}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-secondary)]"
            >
              <Plus className="h-4 w-4" />
              Add Repos
            </button>
          )}
        </div>
      </div>

      {/* Connected accounts */}
      {installations.length > 0 && (
        <div className="flex items-center gap-3 text-sm text-[var(--ink-muted)]">
          <span>Connected:</span>
          {installations.map((inst) => (
            <span
              key={inst.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--cream-dark)] bg-white px-3 py-1 text-xs font-medium text-[var(--ink)]"
            >
              {inst.accountAvatarUrl && (
                <img src={inst.accountAvatarUrl} alt="" className="h-4 w-4 rounded-full" />
              )}
              {inst.accountLogin}
            </span>
          ))}
          <a
            href={installUrl || "https://github.com/apps/clean-code-search/installations/new"}
            className="text-xs text-[var(--accent)] hover:underline"
          >
            + Add another account
          </a>
        </div>
      )}

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-green-200 bg-green-50 text-green-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {repoLimit !== null && repos.length > repoLimit && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm text-amber-800">
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
        <div className="rounded-xl border-2 border-dashed border-[var(--cream-dark)] bg-white p-8 text-center">
          <Github className="mx-auto h-10 w-10 text-[var(--ink-muted)]" />
          <h3 className="mt-3 font-semibold text-[var(--ink)]">
            Connect GitHub to get started
          </h3>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Install the Clean GitHub App to access and index your repositories.
          </p>
          <button
            onClick={() => router.push("/dashboard/repositories/add")}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--ink)]/90"
          >
            <Github className="h-4 w-4" />
            Connect GitHub
          </button>
        </div>
      )}

      {/* Repo list */}
      {repos.length > 0 && (
        <div className="rounded-xl border border-[var(--cream-dark)] bg-white">
          <div className="flex items-center justify-between border-b border-[var(--cream-dark)] px-6 py-4">
            <div>
              <h3 className="font-semibold text-[var(--ink)]">
                Indexed Repositories
              </h3>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                {repos.length}{" "}
                {repos.length === 1 ? "repository" : "repositories"}
              </p>
            </div>
            <button
              onClick={fetchRepos}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--cream-dark)] px-3 py-1.5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--cream-dark)]"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>

          <div className="divide-y divide-[var(--cream-dark)]">
            {repos.map((repo) => (
              <div
                key={repo.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(repo.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[var(--ink)]">
                        {repo.fullName}
                      </p>
                      {repo.private ? (
                        <Lock className="h-3 w-3 text-[var(--ink-muted)]" />
                      ) : (
                        <Globe className="h-3 w-3 text-[var(--ink-muted)]" />
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
                          <span className="text-xs text-[var(--ink-muted)]">
                            {repo.language}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-[var(--ink-muted)]">
                      {repo.status === "ready" && repo.entityCount !== null
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
                    {repo.job && repo.job.progress > 0 && (
                      <div className="mt-1.5 h-1.5 w-48 overflow-hidden rounded-full bg-[var(--cream-dark)]">
                        <div
                          className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                          style={{ width: `${Math.min(repo.job.progress, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Re-index button */}
                  {(repo.status === "ready" || repo.status === "error") && (
                    <button
                      onClick={() => handleReindex(repo)}
                      disabled={actionInProgress === repo.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-[var(--cream-dark)] px-3 py-1.5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--cream-dark)] disabled:opacity-50"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Re-index
                    </button>
                  )}

                  {/* Delete button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="inline-flex items-center justify-center rounded-lg border border-[var(--cream-dark)] p-1.5 text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                        disabled={actionInProgress === repo.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Repository?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove{" "}
                          <strong>{repo.fullName}</strong> from your index and
                          delete all associated data. This action cannot be
                          undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(repo.id, repo.fullName)}
                          className="bg-red-600 text-white hover:bg-red-700"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Status badge */}
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      repo.status === "ready"
                        ? "bg-green-100 text-green-700"
                        : repo.status === "error"
                          ? "bg-red-100 text-red-700"
                          : repo.status === "disconnected" || repo.status === "paused"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {getStatusText(repo.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && repos.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--ink-muted)]" />
        </div>
      )}

      {!loading && repos.length === 0 && hasInstallation && (
        <div className="rounded-xl border border-[var(--cream-dark)] bg-white p-8 text-center">
          <p className="text-sm text-[var(--ink-muted)]">
            No repos indexed yet.{" "}
            <button
              onClick={() => router.push("/dashboard/repositories/add")}
              className="font-medium text-[var(--accent)] hover:underline"
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
    </div>
  );
}
