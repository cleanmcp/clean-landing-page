"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  GitBranch,
  ExternalLink,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Repo = {
  id: string;
  repoFullName: string;
  stack: string;
  branch: string;
  createdAt: string;
};

type SyncRun = {
  id: string;
  sourceRepoFullName: string;
  commitSha: string;
  branch: string;
  status: string;
  targetCount: number;
  completedCount: number;
  failedCount: number;
  error: string | null;
  createdAt: string;
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  repos: Repo[];
  runs: SyncRun[];
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

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [newRepo, setNewRepo] = useState("");
  const [newStack, setNewStack] = useState("");
  const [newBranch, setNewBranch] = useState("main");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/sync-projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
    // Poll for run status updates
    const hasActive = project?.runs.some(
      (r) => r.status === "pending" || r.status === "running"
    );
    const interval = setInterval(fetchProject, hasActive ? 5000 : 30000);
    return () => clearInterval(interval);
  }, [fetchProject, project?.runs.map((r) => r.status).join(",")]);

  async function handleAddRepo() {
    if (!newRepo.trim() || !newStack) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/sync-projects/${projectId}/repos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoFullName: newRepo.trim(),
          stack: newStack,
          branch: newBranch.trim() || "main",
        }),
      });
      if (res.ok) {
        setAddOpen(false);
        setNewRepo("");
        setNewStack("");
        setNewBranch("main");
        fetchProject();
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveRepo(repoId: string) {
    setDeleting(repoId);
    try {
      await fetch(`/api/sync-projects/${projectId}/repos/${repoId}`, {
        method: "DELETE",
      });
      fetchProject();
    } finally {
      setDeleting(null);
    }
  }

  async function handleDeleteProject() {
    await fetch(`/api/sync-projects/${projectId}`, { method: "DELETE" });
    router.push("/dashboard/cross-platform");
  }

  async function handleToggleActive() {
    if (!project) return;
    await fetch(`/api/sync-projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !project.active }),
    });
    fetchProject();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--dash-text-muted)]" />
      </div>
    );
  }

  if (!project) {
    return <div className="py-20 text-center text-[var(--dash-text-muted)]">Project not found</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push("/dashboard/cross-platform")}
          className="flex items-center gap-1 text-sm text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--dash-text)]">
              {project.name}
            </h1>
            {project.description && (
              <p className="mt-1 text-sm text-[var(--dash-text-muted)]">
                {project.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleToggleActive}>
              {project.active ? "Pause" : "Resume"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-[#ef4444] hover:text-[#ef4444]">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Project</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &quot;{project.name}&quot; and all its sync history. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteProject} className="bg-[#ef4444] hover:bg-[#dc2626]">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Repos Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-[var(--dash-text)]">
            Repositories ({project.repos.length})
          </h2>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Repo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Repository</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label htmlFor="repo">Repository (owner/name)</Label>
                  <Input
                    id="repo"
                    placeholder="e.g., myorg/my-app"
                    value={newRepo}
                    onChange={(e) => setNewRepo(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Stack</Label>
                  <Select value={newStack} onValueChange={setNewStack}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stack..." />
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
                <div>
                  <Label htmlFor="branch">Branch</Label>
                  <Input
                    id="branch"
                    placeholder="main"
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleAddRepo}
                  disabled={!newRepo.trim() || !newStack || adding}
                  className="w-full"
                >
                  {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Add Repository
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {project.repos.length === 0 ? (
          <Card className="flex flex-col items-center py-10 text-center border-dashed">
            <GitBranch className="h-8 w-8 text-[var(--dash-text-muted)] mb-3" />
            <p className="text-sm text-[var(--dash-text-muted)]">
              No repos yet. Add repos to start syncing features across platforms.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {project.repos.map((repo) => (
              <Card key={repo.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <GitBranch className="h-4 w-4 text-[var(--dash-text-muted)]" />
                  <span className="font-mono text-sm text-[var(--dash-text)]">
                    {repo.repoFullName}
                  </span>
                  <Badge
                    variant="secondary"
                    style={{
                      borderColor: STACK_COLORS[repo.stack] || "#888",
                      color: STACK_COLORS[repo.stack] || "#888",
                    }}
                  >
                    {STACKS.find((s) => s.value === repo.stack)?.label || repo.stack}
                  </Badge>
                  <span className="text-xs text-[var(--dash-text-muted)]">
                    {repo.branch}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveRepo(repo.id)}
                  disabled={deleting === repo.id}
                >
                  {deleting === repo.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-[var(--dash-text-muted)]" />
                  )}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Sync History */}
      <div>
        <h2 className="text-lg font-medium text-[var(--dash-text)] mb-4">
          Sync History
        </h2>
        {project.runs.length === 0 ? (
          <p className="text-sm text-[var(--dash-text-muted)] py-6 text-center">
            No syncs yet. Push a commit with &quot;clean-cp&quot; in the message to trigger a sync.
          </p>
        ) : (
          <div className="space-y-2">
            {project.runs.map((run, i) => (
              <motion.div
                key={run.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {statusIcon(run.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[var(--dash-text)]">
                            {run.sourceRepoFullName}
                          </span>
                          <a
                            href={`https://github.com/${run.sourceRepoFullName}/commit/${run.commitSha}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-mono text-[var(--dash-text-muted)] hover:text-[var(--dash-accent-light)]"
                          >
                            {run.commitSha.slice(0, 7)}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--dash-text-muted)]">
                          <span>{run.targetCount} target{run.targetCount !== 1 ? "s" : ""}</span>
                          {run.completedCount > 0 && (
                            <span className="text-[#05DF72]">{run.completedCount} done</span>
                          )}
                          {run.failedCount > 0 && (
                            <span className="text-[#ef4444]">{run.failedCount} failed</span>
                          )}
                          {run.error && (
                            <span className="text-[#ef4444]">{run.error}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-[var(--dash-text-muted)]">
                      {new Date(run.createdAt).toLocaleString()}
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
