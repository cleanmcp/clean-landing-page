"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  RefreshCw,
  ChevronRight,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  GitBranch,
  Zap,
  GitPullRequest,
  Search,
  Check,
  Github,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type SyncProject = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  repoCount: number;
  latestRun: {
    status: string;
    createdAt: string;
    sourceRepoFullName: string;
  } | null;
};

type GitHubRepo = {
  id: number;
  fullName: string;
  name: string;
  owner: string;
  ownerAvatar: string;
  private: boolean;
  language: string | null;
};

const STACKS = [
  { value: "nextjs", label: "Next.js" },
  { value: "electron", label: "Electron" },
  { value: "react-native", label: "React Native" },
  { value: "swift", label: "Swift / iOS" },
  { value: "flutter", label: "Flutter" },
  { value: "python", label: "Python" },
  { value: "go", label: "Go" },
  { value: "other", label: "Other" },
];

const STACK_COLORS: Record<string, string> = {
  nextjs: "#000",
  electron: "#47848F",
  "react-native": "#61DAFB",
  swift: "#F05138",
  flutter: "#02569B",
  python: "#3572A5",
  go: "#00ADD8",
};

const statusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-[#05DF72]" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-[#ef4444]" />;
    case "partial_failure":
      return <AlertCircle className="h-4 w-4 text-[#f59e0b]" />;
    case "pending":
    case "running":
      return <Loader2 className="h-4 w-4 animate-spin text-[var(--dash-accent-light)]" />;
    default:
      return null;
  }
};

// ---------------------------------------------------------------------------
// Onboarding wizard (shown when user has no projects)
// ---------------------------------------------------------------------------

type OnboardingRepo = { fullName: string; stack: string };

function OnboardingWizard({ onComplete }: { onComplete: (projectId: string) => void }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Step 2: Create project
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  // Step 3: Add repos
  const [githubConnected, setGithubConnected] = useState<boolean | null>(null);
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
  const [repoSearch, setRepoSearch] = useState("");
  const [selectedRepos, setSelectedRepos] = useState<OnboardingRepo[]>([]);
  const [addingRepos, setAddingRepos] = useState(false);

  // Check GitHub connection on mount — mirror how repositories page does it
  useEffect(() => {
    Promise.all([
      fetch("/api/github/repos").then((r) => r.json()),
      fetch("/api/github/install").then((r) => r.json()),
    ])
      .then(([reposData, installData]) => {
        const connected =
          reposData.connected ||
          (installData.installations?.length ?? 0) > 0 ||
          installData.connected;
        setGithubConnected(connected);
        setGithubRepos(reposData.repos ?? []);
      })
      .catch(() => setGithubConnected(false));
  }, []);

  const TOTAL_STEPS = 4;

  function goNext() {
    setDirection(1);
    setStep((s) => s + 1);
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => s - 1);
  }

  async function handleCreateProject() {
    if (!projectName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/sync-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName.trim(),
          description: projectDesc.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedProjectId(data.project.id);
        goNext();
      }
    } finally {
      setCreating(false);
    }
  }

  function toggleRepo(fullName: string) {
    setSelectedRepos((prev) => {
      const existing = prev.find((r) => r.fullName === fullName);
      if (existing) return prev.filter((r) => r.fullName !== fullName);
      return [...prev, { fullName, stack: "" }];
    });
  }

  function setRepoStack(fullName: string, stack: string) {
    setSelectedRepos((prev) =>
      prev.map((r) => (r.fullName === fullName ? { ...r, stack } : r))
    );
  }

  async function handleAddRepos() {
    if (!createdProjectId || selectedRepos.length < 2) return;
    if (selectedRepos.some((r) => !r.stack)) return;
    setAddingRepos(true);
    try {
      await Promise.all(
        selectedRepos.map((r) =>
          fetch(`/api/sync-projects/${createdProjectId}/repos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              repoFullName: r.fullName,
              stack: r.stack,
              branch: "main",
            }),
          })
        )
      );
      goNext();
    } finally {
      setAddingRepos(false);
    }
  }

  const filteredRepos = githubRepos.filter((r) =>
    r.fullName.toLowerCase().includes(repoSearch.toLowerCase())
  );

  const allStacksSet = selectedRepos.length >= 2 && selectedRepos.every((r) => r.stack);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-[var(--dash-text-muted)]">
            Step {step + 1} of {TOTAL_STEPS}
          </span>
        </div>
        <div className="h-[2px] rounded-full bg-[var(--dash-border)]">
          <motion.div
            className="h-full rounded-full bg-[#1772E7]"
            initial={false}
            animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: direction * 32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -32 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {/* Step 0: How it works */}
          {step === 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-[var(--dash-text)] mb-2">
                Cross-Platform Sync
              </h2>
              <p className="text-sm text-[var(--dash-text-muted)] mb-8">
                Ship features to every platform at once. Here&apos;s how it works:
              </p>
              <div className="space-y-4">
                {[
                  {
                    icon: <GitBranch className="h-5 w-5" />,
                    title: "Group your repos",
                    desc: "Add your web, desktop, and mobile repos into a sync project.",
                  },
                  {
                    icon: <Zap className="h-5 w-5" />,
                    title: 'Push with "clean-cp"',
                    desc: 'Implement a feature in one repo and include "clean-cp" in your commit message.',
                  },
                  {
                    icon: <RefreshCw className="h-5 w-5" />,
                    title: "Claude Code translates",
                    desc: "An AI agent reads the diff and implements the same feature in every sibling repo.",
                  },
                  {
                    icon: <GitPullRequest className="h-5 w-5" />,
                    title: "Review PRs",
                    desc: "Each target repo gets a PR with the translated code, ready for review.",
                  },
                ].map((item, i) => (
                  <Card key={i} className="flex items-start gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1772E7]/10 text-[#1772E7]">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-[var(--dash-text)]">
                        {item.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-[var(--dash-text-muted)]">
                        {item.desc}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Create project */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-semibold text-[var(--dash-text)] mb-2">
                Create a sync project
              </h2>
              <p className="text-sm text-[var(--dash-text-muted)] mb-8">
                A project groups the repos that share the same features across platforms.
              </p>
              <div className="space-y-5">
                <div className="space-y-2 text-white">
                  <Label htmlFor="ob-name" className="text-white">Project Name</Label>
                  <Input
                    id="ob-name"
                    placeholder="e.g., MyApp Cross-Platform"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2 text-white">
                  <Label htmlFor="ob-desc" className="text-white">
                    Description (optional)
                  </Label>
                  <Input
                    id="ob-desc"
                    placeholder="Syncs web, desktop, and mobile"
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Add repos */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-semibold text-[var(--dash-text)] mb-2">
                Add your repos
              </h2>
              <p className="text-sm text-[var(--dash-text-muted)] mb-6">
                Select at least 2 repos and assign each a platform stack.
              </p>

              {githubConnected === null ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--dash-text-muted)]" />
                </div>
              ) : !githubConnected ? (
                <Card className="flex flex-col items-center py-10 text-center border-dashed">
                  <Github className="h-8 w-8 text-[var(--dash-text-muted)] mb-3" />
                  <p className="text-sm text-[var(--dash-text-muted)] max-w-sm">
                    Connect your GitHub App first to select repos. Go to{" "}
                    <a
                      href="/dashboard/onboarding"
                      className="text-[#1772E7] underline underline-offset-2"
                    >
                      Cloud Setup
                    </a>{" "}
                    to install it, then come back.
                  </p>
                </Card>
              ) : (
                <>
                  {/* Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dash-text-muted)]" />
                    <Input
                      className="pl-9"
                      placeholder="Search repos..."
                      value={repoSearch}
                      onChange={(e) => setRepoSearch(e.target.value)}
                    />
                  </div>

                  {/* Repo list */}
                  <div className="max-h-[320px] space-y-1.5 overflow-y-auto pr-1">
                    {filteredRepos.map((repo) => {
                      const selected = selectedRepos.find(
                        (r) => r.fullName === repo.fullName
                      );
                      return (
                        <div
                          key={repo.id}
                          className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                            selected
                              ? "border-[#1772E7] bg-[#1772E7]/5"
                              : "border-[var(--dash-border)] hover:border-[var(--dash-text-muted)]/40"
                          }`}
                          onClick={() => toggleRepo(repo.fullName)}
                        >
                          <div
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                              selected
                                ? "border-[#1772E7] bg-[#1772E7]"
                                : "border-[var(--dash-border)]"
                            }`}
                          >
                            {selected && (
                              <Check className="h-3 w-3 text-white" strokeWidth={3} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-[var(--dash-text)] truncate block">
                              {repo.fullName}
                            </span>
                            {repo.language && (
                              <span className="text-xs text-[var(--dash-text-muted)]">
                                {repo.language}
                              </span>
                            )}
                          </div>
                          {selected && (
                            <div
                              className="shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Select
                                value={selected.stack}
                                onValueChange={(v) =>
                                  setRepoStack(repo.fullName, v)
                                }
                              >
                                <SelectTrigger className="h-8 w-[140px] text-xs">
                                  <SelectValue placeholder="Stack..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {STACKS.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                      {s.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {filteredRepos.length === 0 && (
                      <p className="py-8 text-center text-sm text-[var(--dash-text-muted)]">
                        No repos found.
                      </p>
                    )}
                  </div>

                  {/* Selected summary */}
                  {selectedRepos.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedRepos.map((r) => (
                        <Badge
                          key={r.fullName}
                          variant="secondary"
                          className="gap-1"
                          style={
                            r.stack
                              ? {
                                  borderColor:
                                    STACK_COLORS[r.stack] || "#888",
                                  color: STACK_COLORS[r.stack] || "#888",
                                }
                              : undefined
                          }
                        >
                          {r.fullName.split("/")[1]}
                          {r.stack && (
                            <>
                              {" "}
                              &middot;{" "}
                              {STACKS.find((s) => s.value === r.stack)?.label}
                            </>
                          )}
                        </Badge>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 3: Ready */}
          {step === 3 && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#05DF72]/10">
                <CheckCircle className="h-8 w-8 text-[#05DF72]" />
              </div>
              <h2 className="text-2xl font-semibold text-[var(--dash-text)] mb-2">
                You&apos;re all set!
              </h2>
              <p className="text-sm text-[var(--dash-text-muted)] mb-8 max-w-md mx-auto">
                Your sync project is ready. To trigger a cross-platform sync,
                push a commit to any of your project&apos;s repos with{" "}
                <code className="rounded bg-[var(--dash-surface)] px-1.5 py-0.5 text-xs font-mono text-[#1772E7]">
                  clean-cp
                </code>{" "}
                in the commit message.
              </p>
              <Card className="mx-auto max-w-md text-left p-4 space-y-3">
                <p className="text-xs font-medium text-[var(--dash-text-muted)] uppercase tracking-wider">
                  Example
                </p>
                <div className="rounded-lg bg-[var(--dash-surface)] p-3 font-mono text-sm text-[var(--dash-text)]">
                  <span className="text-[var(--dash-text-muted)]">$</span> git
                  commit -m &quot;feat: add dark mode{" "}
                  <span className="text-[#1772E7]">clean-cp</span>&quot;
                  <br />
                  <span className="text-[var(--dash-text-muted)]">$</span> git
                  push
                </div>
                <p className="text-xs text-[var(--dash-text-muted)]">
                  Claude Code will read the diff, generate a plan, and open PRs
                  on every sibling repo in the project.
                </p>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="mt-10 flex items-center justify-between">
        <button
          onClick={goBack}
          disabled={step === 0}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--dash-text-muted)] transition-colors hover:text-[var(--dash-text)] disabled:invisible"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {step === 0 && (
          <Button onClick={goNext} className="gap-2">
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}

        {step === 1 && (
          <Button
            onClick={handleCreateProject}
            disabled={!projectName.trim() || creating}
            className="gap-2"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Create &amp; Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        )}

        {step === 2 && (
          <Button
            onClick={handleAddRepos}
            disabled={!allStacksSet || addingRepos}
            className="gap-2"
          >
            {addingRepos ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Add Repos &amp; Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        )}

        {step === 3 && createdProjectId && (
          <Button
            onClick={() => onComplete(createdProjectId)}
            className="gap-2"
          >
            Go to Project
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function CrossPlatformPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<SyncProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/sync-projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/sync-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        setCreateOpen(false);
        setNewName("");
        setNewDesc("");
        router.push(`/dashboard/cross-platform/${data.project.id}`);
      }
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--dash-text-muted)]" />
      </div>
    );
  }

  // Show onboarding wizard when no projects exist
  if (projects.length === 0) {
    return (
      <div className="py-8">
        <OnboardingWizard
          onComplete={(projectId) =>
            router.push(`/dashboard/cross-platform/${projectId}`)
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--dash-text)]">
            Cross-Platform Sync
          </h1>
          <p className="mt-1 text-sm text-[var(--dash-text-muted)]">
            Keep features in sync across repos. Push with &quot;clean-cp&quot; in the commit message to trigger.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Sync Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., MyApp Cross-Platform"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div>
                <Label htmlFor="desc">Description (optional)</Label>
                <Input
                  id="desc"
                  placeholder="Syncs web, desktop, and mobile"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="w-full"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Create Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {projects.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card
              className="flex items-center justify-between p-5 cursor-pointer hover:border-[var(--dash-accent-light)] transition-colors"
              onClick={() => router.push(`/dashboard/cross-platform/${project.id}`)}
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-[var(--dash-surface)] flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 text-[var(--dash-accent-light)]" />
                </div>
                <div>
                  <h3 className="font-medium text-[var(--dash-text)]">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--dash-text-muted)]">
                    <span>{project.repoCount} repo{project.repoCount !== 1 ? "s" : ""}</span>
                    {project.latestRun && (
                      <>
                        <span>-</span>
                        <span className="flex items-center gap-1">
                          {statusIcon(project.latestRun.status)}
                          Last sync {new Date(project.latestRun.createdAt).toLocaleDateString()}
                        </span>
                      </>
                    )}
                    {!project.active && (
                      <span className="text-[#f59e0b]">Paused</span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-[var(--dash-text-muted)]" />
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
