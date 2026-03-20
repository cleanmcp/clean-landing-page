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
import { motion } from "framer-motion";
import CloudReposPage from "./cloud-repos";

interface JobInfo {
  current_phase: string | null;
  phase_progress: number | null;
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
  return <CloudReposPage />;
}

function SelfHostedReposPage() {
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
        return <CheckCircle className="h-5 w-5 text-[#05DF72]" />;
      case "error":
        return <XCircle className="h-5 w-5 text-[#ef4444]" />;
      case "cloning":
      case "indexing":
        return (
          <Loader2 className="h-5 w-5 animate-spin text-[var(--dash-accent-light)]" />
        );
      default:
        return <Clock className="h-5 w-5 text-[var(--dash-text-muted)]" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const text = status === "ready" ? "Indexed" : status === "error" ? "Failed" : status === "cloning" ? "Cloning..." : status === "indexing" ? "Indexing..." : status;
    const style = status === "ready"
      ? "bg-[#05DF72]/10 text-[#05DF72]"
      : status === "error"
        ? "bg-[#ef4444]/10 text-[#ef4444]"
        : "bg-[#1772E7]/10 text-[var(--dash-accent-light)]";
    return (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
        {text}
      </span>
    );
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
        <div className="flex items-center justify-between text-sm text-[var(--dash-text-muted)]">
          <span>
            {formatPhase(job.current_phase)}
            {fileProgressText && ` (${fileProgressText})`}
            {speedText && ` — ${speedText}`}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-[var(--dash-text-muted)]">
          <span>
            {durationText && `Elapsed: ${durationText}`}
            {etaText && ` · ${etaText}`}
          </span>
          {job.entities_found > 0 && (
            <span>{job.entities_found.toLocaleString()} entities found</span>
          )}
        </div>
        <Progress value={job.phase_progress ?? 0} className="h-2" />
        <div className="text-right text-xs text-[var(--dash-text-muted)]" style={{ fontFamily: "var(--font-geist-mono)" }}>
          {Math.round(job.phase_progress ?? 0)}%
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-none space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold text-[var(--dash-text)]">
          Repositories
        </h1>
        <p className="mt-1 text-sm text-[var(--dash-text-muted)]">
          Index GitHub repositories for semantic code search
        </p>
      </div>

      {/* Error banner */}
      {backendError && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--dash-error)]/30 bg-[var(--dash-error)]/10 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--dash-error)]" />
          <div>
            <p className="text-sm font-medium text-[var(--dash-error)]">
              Cannot connect to indexing server
            </p>
            <p className="text-sm text-[var(--dash-error)]/70">
              {backendError} — is the backend running?
            </p>
          </div>
        </div>
      )}

      {/* Add Repository */}
      <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-6">
        <h3 className="text-base font-semibold text-[var(--dash-text)]">Add Repository</h3>
        <p className="mt-1 text-sm text-[var(--dash-text-muted)]">
          Enter a public GitHub repository to index (e.g., facebook/react)
        </p>
        <div className="mt-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              placeholder="owner/repo"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              className="max-w-sm flex-1 rounded-lg border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3.5 py-2.5 text-sm text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus:border-[#1772E7] focus:outline-none focus:ring-1 focus:ring-[#1772E7]/20"
              disabled={submitting}
            />
            <input
              type="text"
              placeholder="branch (optional)"
              value={branchInput}
              onChange={(e) => setBranchInput(e.target.value)}
              className="w-44 rounded-lg border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3.5 py-2.5 text-sm text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus:border-[#1772E7] focus:outline-none focus:ring-1 focus:ring-[#1772E7]/20"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={submitting || !repoInput.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1772E7] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1565d0] disabled:cursor-not-allowed disabled:opacity-50"
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
              className={`mt-4 text-sm ${message.type === "error" ? "text-[var(--dash-error)]" : "text-[var(--dash-success)]"}`}
            >
              {message.text}
            </p>
          )}
        </div>
      </div>

      {/* Indexed Repositories */}
      <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)]">
        <div className="flex items-center justify-between border-b border-[var(--dash-border)] px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-[var(--dash-text)]">
              Indexed Repositories
            </h3>
            <p className="mt-0.5 text-sm text-[var(--dash-text-muted)]">
              {repos.length}{" "}
              {repos.length === 1 ? "repository" : "repositories"} total
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
        <div className="p-6">
          {loading && repos.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--dash-text-muted)]" />
            </div>
          ) : repos.length === 0 ? (
            <div className="py-8 text-center text-[var(--dash-text-muted)]">
              No repositories indexed yet. Add one above to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {repos.map((repo) => (
                <div
                  key={`${repo.repo}@${repo.branch ?? ""}`}
                  className="rounded-xl border border-[var(--dash-border)] p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(repo.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium font-mono text-[var(--dash-text)]">
                            {repo.repo}
                          </p>
                          {repo.branch && (
                            <span className="rounded-full bg-[var(--dash-surface-hover)] px-2 py-0.5 font-mono text-xs text-[var(--dash-text-muted)]">
                              {repo.branch}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--dash-text-muted)]">
                          {repo.status === "ready" &&
                          repo.entity_count !== null
                            ? `${repo.entity_count.toLocaleString()} functions indexed`
                            : repo.error
                              ? repo.error
                              : repo.status === "cloning" ? "Cloning..." : repo.status === "indexing" ? "Indexing..." : repo.status}
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
                          className="inline-flex items-center gap-1 rounded-lg border border-[var(--dash-border)] px-3 py-1.5 text-sm font-medium text-[var(--dash-text)] transition-colors hover:border-[var(--dash-border-strong)] hover:bg-[var(--dash-surface-hover)] disabled:opacity-50"
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
                            className="inline-flex items-center justify-center rounded-lg border border-[var(--dash-border)] p-1.5 text-[var(--dash-text-muted)] transition-colors hover:bg-[#ef4444]/10 hover:text-[#ef4444] disabled:opacity-50"
                            disabled={actionInProgress === repo.repo}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-[var(--dash-border)] bg-[var(--dash-surface)]">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-[var(--dash-text)]">
                              Delete Repository?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-[var(--dash-text-muted)]">
                              This will remove{" "}
                              <strong className="text-[var(--dash-text)]">
                                {repo.repo}
                                {repo.branch ? ` (${repo.branch})` : ""}
                              </strong>{" "}
                              from the index and delete all associated data.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] hover:bg-[var(--dash-surface-hover)]">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(repo.repo, repo.branch)}
                              className="bg-[#ef4444] text-white hover:bg-[#dc2626]"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      {getStatusBadge(repo.status)}
                    </div>
                  </div>
                  {renderProgress(repo)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
