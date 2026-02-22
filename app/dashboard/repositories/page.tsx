"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Progress } from "@/components/ui/progress";
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
  GitBranch,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Trash2,
  StopCircle,
  AlertTriangle,
} from "lucide-react";

interface JobInfo {
  current_phase: string | null;
  phase_progress: number;
  files_processed: number;
  files_total: number;
  entities_found: number;
  started_at: string | null;
  duration_seconds: number | null;
}

interface Repo {
  repo: string;
  branch: string | null;
  status: "cloning" | "indexing" | "ready" | "error";
  entity_count: number | null;
  last_indexed_at: string | null;
  error: string | null;
  job?: JobInfo;
}

interface RateTracker {
  lastFiles: number;
  lastEntities: number;
  lastTime: number;
  fileRate: number;
  entityRate: number;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600)
    return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

function formatEstimate(seconds: number): string {
  if (seconds < 60) return `~${Math.round(seconds)}s remaining`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `~${m}m ${s}s remaining`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `~${h}h ${m}m remaining`;
}

function formatPhase(phase: string | null): string {
  if (!phase) return "";
  const phases: Record<string, string> = {
    scanning: "Scanning files",
    parsing: "Parsing code",
    embedding: "Creating embeddings",
    computing_relations: "Computing relations",
    storing: "Storing index",
  };
  return phases[phase] || phase;
}

const POLL_ACTIVE = 3000;
const POLL_IDLE = 30000;

export default function ReposPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [repoInput, setRepoInput] = useState("");
  const [branchInput, setBranchInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  const rateTrackers = useRef<Map<string, RateTracker>>(new Map());

  const fetchRepos = useCallback(async () => {
    try {
      const res = await fetch("/api/repos");
      const data = await res.json();

      if (!res.ok) {
        setBackendError(data.error || "Cannot connect to indexing server");
        setRepos(data.repos || []);
      } else {
        setBackendError(null);
        setRepos(data.repos || []);
      }

      // Update rate trackers for active jobs
      const now = Date.now();
      for (const repo of (data.repos || []) as Repo[]) {
        if (
          repo.job &&
          (repo.status === "indexing" || repo.status === "cloning")
        ) {
          const tracker = rateTrackers.current.get(repo.repo);
          if (tracker) {
            const dt = (now - tracker.lastTime) / 1000;
            if (dt > 0.5) {
              const dFiles = repo.job.files_processed - tracker.lastFiles;
              const dEntities = repo.job.entities_found - tracker.lastEntities;
              const instantFileRate = dFiles / dt;
              const instantEntityRate = dEntities / dt;
              tracker.fileRate =
                tracker.fileRate > 0
                  ? tracker.fileRate * 0.7 + instantFileRate * 0.3
                  : instantFileRate;
              tracker.entityRate =
                tracker.entityRate > 0
                  ? tracker.entityRate * 0.7 + instantEntityRate * 0.3
                  : instantEntityRate;
              tracker.lastFiles = repo.job.files_processed;
              tracker.lastEntities = repo.job.entities_found;
              tracker.lastTime = now;
            }
          } else {
            rateTrackers.current.set(repo.repo, {
              lastFiles: repo.job.files_processed,
              lastEntities: repo.job.entities_found,
              lastTime: now,
              fileRate: 0,
              entityRate: 0,
            });
          }
        } else {
          rateTrackers.current.delete(repo.repo);
        }
      }
    } catch {
      setBackendError("Network error — cannot reach the dashboard server");
    } finally {
      setLoading(false);
    }
  }, []);

  // Smart polling: faster when active jobs exist, slower when idle
  useEffect(() => {
    fetchRepos();

    let intervalId: ReturnType<typeof setInterval>;

    function startPolling() {
      clearInterval(intervalId);
      const hasActive = repos.some(
        (r) => r.status === "cloning" || r.status === "indexing"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.trim()) return;

    const parts = repoInput.trim().split("/");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      setMessage({
        type: "error",
        text: "Invalid format. Use owner/repo (e.g., facebook/react)",
      });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo: repoInput.trim(),
          ...(branchInput.trim() ? { branch: branchInput.trim() } : {}),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: "success",
          text: data.message || "Repository queued for indexing",
        });
        setRepoInput("");
        setBranchInput("");
        fetchRepos();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to queue repository",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (repoName: string, branch: string | null) => {
    setActionInProgress(repoName);
    try {
      const res = await fetch("/api/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo: repoName,
          action: "cancel",
          ...(branch ? { branch } : {}),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "success",
          text: data.message || "Cancellation requested",
        });
        fetchRepos();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to cancel",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (repoName: string, branch: string | null) => {
    setActionInProgress(repoName);
    try {
      const branchParam = branch
        ? `&branch=${encodeURIComponent(branch)}`
        : "";
      const res = await fetch(
        `/api/repos?repo=${encodeURIComponent(repoName)}${branchParam}`,
        { method: "DELETE" }
      );

      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "success",
          text: data.message || "Repository deleted",
        });
        fetchRepos();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to delete",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setActionInProgress(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "cloning":
      case "indexing":
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
      case "cloning":
        return "Cloning...";
      case "indexing":
        return "Indexing...";
      default:
        return status;
    }
  };

  const renderProgress = (repo: Repo) => {
    if (!repo.job || repo.status === "ready" || repo.status === "error") {
      return null;
    }

    const { job } = repo;
    const tracker = rateTrackers.current.get(repo.repo);

    const fileProgressText =
      job.files_total > 0
        ? `${job.files_processed.toLocaleString()}/${job.files_total.toLocaleString()} files`
        : "";

    const durationText = job.duration_seconds
      ? formatDuration(job.duration_seconds)
      : "";

    let etaText = "";
    if (
      tracker &&
      tracker.fileRate > 0 &&
      job.files_total > 0 &&
      job.files_processed < job.files_total
    ) {
      const remaining =
        (job.files_total - job.files_processed) / tracker.fileRate;
      if (remaining > 0 && remaining < 86400) {
        etaText = formatEstimate(remaining);
      }
    }

    let speedText = "";
    if (tracker) {
      if (tracker.entityRate > 0) {
        speedText = `${Math.round(tracker.entityRate)} entities/sec`;
      } else if (tracker.fileRate > 0) {
        speedText = `${tracker.fileRate.toFixed(1)} files/sec`;
      }
    }

    return (
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-sm text-[var(--ink-muted)]">
          <span>
            {formatPhase(job.current_phase)}
            {fileProgressText && ` (${fileProgressText})`}
            {speedText && ` — ${speedText}`}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-[var(--ink-muted)]">
          <span>
            {durationText && `Elapsed: ${durationText}`}
            {etaText && ` · ${etaText}`}
          </span>
          {job.entities_found > 0 && (
            <span>{job.entities_found.toLocaleString()} entities found</span>
          )}
        </div>
        <Progress value={job.phase_progress} className="h-2" />
        <div className="text-right text-xs text-[var(--ink-muted)]">
          {Math.round(job.phase_progress)}%
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h2 className="text-2xl font-medium text-[var(--ink)]">
          Repositories
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Index GitHub repositories for semantic code search
        </p>
      </div>

      {/* Error banner */}
      {backendError && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-800">
              Cannot connect to indexing server
            </p>
            <p className="text-xs text-red-600">
              {backendError} — is the backend running?
            </p>
          </div>
        </div>
      )}

      {/* Add Repository */}
      <div className="rounded-xl border border-[var(--cream-dark)] bg-white py-6">
        <div className="px-6">
          <h3 className="font-semibold text-[var(--ink)]">Add Repository</h3>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Enter a public GitHub repository to index (e.g., facebook/react)
          </p>
        </div>
        <div className="mt-4 px-6">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              placeholder="owner/repo"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              className="max-w-sm flex-1 rounded-lg border border-[var(--cream-dark)] bg-white px-3.5 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              disabled={submitting}
            />
            <input
              type="text"
              placeholder="branch (optional)"
              value={branchInput}
              onChange={(e) => setBranchInput(e.target.value)}
              className="w-44 rounded-lg border border-[var(--cream-dark)] bg-white px-3.5 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={submitting || !repoInput.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-secondary)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Queuing...
                </>
              ) : (
                <>
                  <GitBranch className="h-4 w-4" />
                  Index Repository
                </>
              )}
            </button>
          </form>
          {message && (
            <p
              className={`mt-4 text-sm ${message.type === "error" ? "text-red-500" : "text-green-600"}`}
            >
              {message.text}
            </p>
          )}
        </div>
      </div>

      {/* Indexed Repositories */}
      <div className="rounded-xl border border-[var(--cream-dark)] bg-white py-6">
        <div className="flex items-center justify-between px-6">
          <div>
            <h3 className="font-semibold text-[var(--ink)]">
              Indexed Repositories
            </h3>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              {repos.length}{" "}
              {repos.length === 1 ? "repository" : "repositories"} total
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
        <div className="mt-4 px-6">
          {loading && repos.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--ink-muted)]" />
            </div>
          ) : repos.length === 0 ? (
            <div className="py-8 text-center text-[var(--ink-muted)]">
              No repositories indexed yet. Add one above to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {repos.map((repo) => (
                <div
                  key={`${repo.repo}@${repo.branch ?? ""}`}
                  className="rounded-lg border border-[var(--cream-dark)] p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(repo.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[var(--ink)]">
                            {repo.repo}
                          </p>
                          {repo.branch && (
                            <span className="rounded-full bg-[var(--cream-dark)] px-2 py-0.5 font-mono text-xs text-[var(--ink-muted)]">
                              {repo.branch}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--ink-muted)]">
                          {repo.status === "ready" &&
                          repo.entity_count !== null
                            ? `${repo.entity_count.toLocaleString()} functions indexed`
                            : repo.error
                              ? repo.error
                              : getStatusText(repo.status)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Cancel button */}
                      {(repo.status === "cloning" ||
                        repo.status === "indexing") && (
                        <button
                          onClick={() => handleCancel(repo.repo, repo.branch)}
                          disabled={actionInProgress === repo.repo}
                          className="inline-flex items-center gap-1 rounded-lg border border-[var(--cream-dark)] px-3 py-1.5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--cream-dark)] disabled:opacity-50"
                        >
                          {actionInProgress === repo.repo ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <StopCircle className="h-4 w-4" />
                              Cancel
                            </>
                          )}
                        </button>
                      )}

                      {/* Delete button */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="inline-flex items-center justify-center rounded-lg border border-[var(--cream-dark)] p-1.5 text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                            disabled={actionInProgress === repo.repo}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete Repository?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove{" "}
                              <strong>
                                {repo.repo}
                                {repo.branch ? ` (${repo.branch})` : ""}
                              </strong>{" "}
                              from the index and delete all associated data.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(repo.repo, repo.branch)}
                              className="bg-red-600 text-white hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          repo.status === "ready"
                            ? "bg-green-100 text-green-700"
                            : repo.status === "error"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {getStatusText(repo.status)}
                      </span>
                    </div>
                  </div>
                  {renderProgress(repo)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
