"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Copy, Check, AlertTriangle, Key } from "lucide-react";

const AVAILABLE_SCOPES = [
  {
    id: "search",
    label: "Search",
    description: "Search indexed repositories",
  },
  {
    id: "index",
    label: "Index",
    description: "Index new repositories",
  },
  {
    id: "admin",
    label: "Admin",
    description: "Full administrative access",
  },
];

const EXPIRATION_OPTIONS = [
  { id: "never", label: "Never" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "1y", label: "1 year" },
];

export default function NewApiKeyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["search", "index"]);
  const [creating, setCreating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [expiration, setExpiration] = useState<string>("never");
  const [error, setError] = useState<string | null>(null);
  const [orgSlug, setOrgSlug] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/org")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data?.org?.slug) setOrgSlug(data.org.slug); })
      .catch(() => {});
  }, []);

  function toggleScope(scope: string) {
    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scope));
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  }

  async function createKey() {
    if (!name.trim()) {
      setError("Please enter a key name");
      return;
    }
    if (selectedScopes.length === 0) {
      setError("Please select at least one scope");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const expiresAt = expiration === "never" ? null
        : new Date(Date.now() + ({
            "30d": 30 * 86400000,
            "90d": 90 * 86400000,
            "1y": 365 * 86400000,
          }[expiration] ?? 0)).toISOString();

      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          scopes: selectedScopes,
          expiresAt,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedKey(data.key);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create key");
      }
    } catch {
      setError("Failed to create key");
    } finally {
      setCreating(false);
    }
  }

  async function copyKey() {
    if (generatedKey) {
      try {
        await navigator.clipboard.writeText(generatedKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // clipboard API might not be available
      }
    }
  }

  function handleDone() {
    router.push("/dashboard/keys");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/keys"
          className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--cream-dark)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-medium text-[var(--ink)]">
            Create API Key
          </h1>
          <p className="text-sm text-[var(--ink-muted)]">
            Generate a new API key for MCP access
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--cream-dark)] bg-white">
        <div className="border-b border-[var(--cream-dark)] px-6 py-5">
          <h3 className="font-semibold text-[var(--ink)]">Key Details</h3>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Choose a descriptive name and select the permissions for this key
          </p>
        </div>
        <div className="space-y-6 px-6 py-6">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-medium text-[var(--ink)]"
            >
              Key Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="e.g., CI/CD Pipeline, Local Development"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[var(--cream-dark)] bg-white px-3.5 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <p className="text-sm text-[var(--ink-muted)]">
              A descriptive name to identify this key
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--ink)]">
              Permissions
            </label>
            <div className="grid gap-3">
              {AVAILABLE_SCOPES.map((scope) => (
                <div
                  key={scope.id}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
                    selectedScopes.includes(scope.id)
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-[var(--cream-dark)] hover:bg-[var(--cream)]"
                  }`}
                  onClick={() => toggleScope(scope.id)}
                >
                  <div>
                    <div className="font-medium text-[var(--ink)]">
                      {scope.label}
                    </div>
                    <div className="text-sm text-[var(--ink-muted)]">
                      {scope.description}
                    </div>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-full border-2 ${
                      selectedScopes.includes(scope.id)
                        ? "border-[var(--accent)] bg-[var(--accent)]"
                        : "border-[var(--cream-dark)]"
                    }`}
                  >
                    {selectedScopes.includes(scope.id) && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--ink)]">
              Expiration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {EXPIRATION_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    expiration === opt.id
                      ? "border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]"
                      : "border-[var(--cream-dark)] text-[var(--ink-muted)] hover:bg-[var(--cream)]"
                  }`}
                  onClick={() => setExpiration(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            onClick={createKey}
            disabled={creating}
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-secondary)] disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create API Key"}
          </button>
        </div>
      </div>

      {/* Generated Key Dialog */}
      <Dialog open={!!generatedKey} onOpenChange={(open) => { if (!open) handleDone(); }}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-[var(--accent)]" />
              API Key Created
            </DialogTitle>
            <DialogDescription>
              Copy your API key now. You won&apos;t be able to see it again!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <div className="rounded-md border border-[var(--cream-dark)] bg-[var(--cream)] p-3">
                <code className="block break-all font-mono text-xs leading-relaxed text-[var(--ink)]">
                  {generatedKey}
                </code>
              </div>
              <button
                onClick={copyKey}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--cream-dark)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--cream-dark)]"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied!" : "Copy key"}
              </button>
            </div>

            <div className="flex items-start gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-xs text-[var(--ink-muted)]">
                <span className="font-medium text-amber-600">
                  Store this key securely.
                </span>{" "}
                It will only be shown once.
              </p>
            </div>

            <details className="rounded-md border border-[var(--cream-dark)] bg-[var(--cream)]">
              <summary className="cursor-pointer p-3 text-xs font-medium text-[var(--ink)]">
                MCP config for Claude Code
              </summary>
              <div className="border-t border-[var(--cream-dark)]">
                <pre className="overflow-x-auto bg-white p-2.5 text-[11px] leading-relaxed text-[var(--ink)]">
                  {JSON.stringify({
                    mcpServers: {
                      clean: {
                        type: "sse",
                        url: "https://api.tryclean.ai/mcp/sse",
                        headers: {
                          Authorization: `Bearer ${generatedKey}`,
                          ...(orgSlug ? { "X-Clean-Slug": orgSlug } : {}),
                        },
                      },
                    },
                  }, null, 2)}
                </pre>
                <div className="border-t border-[var(--cream-dark)] p-2">
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(JSON.stringify({
                          mcpServers: {
                            clean: {
                              type: "sse",
                              url: "https://api.tryclean.ai/mcp/sse",
                              headers: {
                                Authorization: `Bearer ${generatedKey}`,
                                ...(orgSlug ? { "X-Clean-Slug": orgSlug } : {}),
                              },
                            },
                          },
                        }, null, 2));
                        setCopiedConfig(true);
                        setTimeout(() => setCopiedConfig(false), 2000);
                      } catch {
                        // clipboard API might not be available
                      }
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium text-[var(--ink)] transition-colors hover:bg-[var(--cream-dark)]"
                  >
                    {copiedConfig ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copiedConfig ? "Copied!" : "Copy config"}
                  </button>
                </div>
              </div>
            </details>
          </div>

          <DialogFooter>
            <button
              onClick={handleDone}
              className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-secondary)]"
            >
              Done
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
