"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  Plus,
  Key,
  Trash2,
  AlertTriangle,
  RefreshCw,
  WifiOff,
  Clock,
  FolderGit2,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface OrgToken {
  id: string;
  name: string;
  lastSeenAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

interface EngineStatus {
  connected: boolean;
  orgSlug?: string;
  connectedAt?: string;
  lastHeartbeat?: {
    uptime: number;
    repos: number;
    searches_total: number;
  } | null;
}

interface OrgInfo {
  slug: string;
  licenseKey: string | null;
}

function formatDate(date: string | null) {
  if (!date) return "Never";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatRelative(date: string | null) {
  if (!date) return "Never";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function KeysPage() {
  // API Keys state
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [revokeDialog, setRevokeDialog] = useState<{
    open: boolean;
    key: ApiKey | null;
  }>({ open: false, key: null });
  const [revoking, setRevoking] = useState(false);

  // Engine status state
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
  const [engineLoading, setEngineLoading] = useState(true);

  // Org tokens state
  const [orgTokens, setOrgTokens] = useState<OrgToken[]>([]);
  const [tokensLoading, setTokensLoading] = useState(true);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [tokenName, setTokenName] = useState("");
  const [generateDialog, setGenerateDialog] = useState(false);
  const [revokeTokenDialog, setRevokeTokenDialog] = useState<{
    open: boolean;
    token: OrgToken | null;
  }>({ open: false, token: null });
  const [revokingToken, setRevokingToken] = useState(false);

  // Org info state
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);
  const [generatingLicense, setGeneratingLicense] = useState(false);

  // Shared state
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEngineStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/engine-status");
      if (res.ok) {
        const data = await res.json();
        setEngineStatus(data);
      }
    } catch {
      // silently fail
    } finally {
      setEngineLoading(false);
    }
  }, []);

  const fetchOrgTokens = useCallback(async () => {
    try {
      const res = await fetch("/api/org-tokens");
      if (res.ok) {
        const data = await res.json();
        setOrgTokens(data.tokens);
      }
    } catch {
      // silently fail
    } finally {
      setTokensLoading(false);
    }
  }, []);

  const fetchOrg = useCallback(async () => {
    try {
      const res = await fetch("/api/org");
      if (res.ok) {
        const data = await res.json();
        setOrgInfo({
          slug: data.org.slug,
          licenseKey: data.org.licenseKey ?? null,
        });
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchKeys();
    fetchEngineStatus();
    fetchOrgTokens();
    fetchOrg();
  }, [fetchEngineStatus, fetchOrgTokens, fetchOrg]);

  // Refresh engine status every 30s
  useEffect(() => {
    const interval = setInterval(fetchEngineStatus, 30_000);
    return () => clearInterval(interval);
  }, [fetchEngineStatus]);

  async function fetchKeys() {
    try {
      const res = await fetch("/api/keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys);
      }
    } catch {
      // silently fail
    } finally {
      setKeysLoading(false);
    }
  }

  async function revokeKey(id: string) {
    setRevoking(true);
    try {
      const res = await fetch(`/api/keys/${id}`, { method: "DELETE" });
      if (res.ok) {
        setKeys(keys.filter((k) => k.id !== id));
      }
    } catch {
      // silently fail
    } finally {
      setRevoking(false);
      setRevokeDialog({ open: false, key: null });
    }
  }

  function copyToClipboard(text: string, label?: string) {
    navigator.clipboard.writeText(text);
    if (label) {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    }
  }

  async function handleGenerateToken() {
    setGeneratingToken(true);
    setError(null);
    try {
      const res = await fetch("/api/org-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tokenName || "default" }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewToken(data.token);
        setTokenName("");
        setGenerateDialog(false);
        await fetchOrgTokens();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to generate token");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setGeneratingToken(false);
    }
  }

  async function handleRevokeToken(id: string) {
    setRevokingToken(true);
    try {
      const res = await fetch(`/api/org-tokens/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchOrgTokens();
        fetchEngineStatus();
      }
    } catch {
      // silently fail
    } finally {
      setRevokingToken(false);
      setRevokeTokenDialog({ open: false, token: null });
    }
  }

  async function handleGenerateLicense() {
    setGeneratingLicense(true);
    setError(null);
    try {
      const res = await fetch("/api/license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "pro", months: 12 }),
      });
      if (res.ok) {
        await Promise.all([fetchOrg(), fetchOrgTokens()]);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to generate license");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setGeneratingLicense(false);
    }
  }

  const activeTokens = orgTokens.filter((t) => !t.revokedAt);

  return (
    <div className="space-y-10 max-w-6xl">
      {/* API Keys Section */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-medium text-[var(--ink)]">
              API Keys
            </h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Manage API keys for accessing the Clean MCP server
            </p>
          </div>
          <Link
            href="/dashboard/keys/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-secondary)]"
          >
            <Plus className="h-4 w-4" />
            Create Key
          </Link>
        </div>

        <div className="mt-6 rounded-lg border border-[var(--cream-dark)] bg-white">
          <div className="border-b border-[var(--cream-dark)] p-5 pb-3">
            <h3 className="text-sm font-semibold text-[var(--ink)]">
              Active Keys
            </h3>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
              Keys are shown with a prefix only. The full key is shown once when
              created.
            </p>
          </div>

          {keysLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            </div>
          ) : keys.length === 0 ? (
            <div className="py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                <Key className="h-6 w-6 text-[var(--accent)]/60" />
              </div>
              <p className="mt-3 text-sm font-medium text-[var(--ink)]">
                No API keys yet
              </p>
              <p className="mb-4 mt-0.5 text-xs text-[var(--ink-muted)]">
                Create your first key to get started
              </p>
              <Link
                href="/dashboard/keys/new"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--cream-dark)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--cream-dark)]"
              >
                <Plus className="h-3.5 w-3.5" />
                Create your first key
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--cream-dark)]">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-[var(--ink-muted)]">
                      Name
                    </th>
                    <th className="px-2 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-[var(--ink-muted)]">
                      Key
                    </th>
                    <th className="px-2 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-[var(--ink-muted)]">
                      Scopes
                    </th>
                    <th className="px-2 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-[var(--ink-muted)]">
                      Last Used
                    </th>
                    <th className="px-2 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-[var(--ink-muted)]">
                      Created
                    </th>
                    <th className="px-2 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-[var(--ink-muted)]">
                      Expires
                    </th>
                    <th className="w-[60px]" />
                  </tr>
                </thead>
                <tbody>
                  {keys.map((key) => (
                    <tr
                      key={key.id}
                      className="border-b border-[var(--cream-dark)] transition-colors hover:bg-[var(--cream)]"
                    >
                      <td className="px-5 py-3 text-sm font-medium text-[var(--ink)]">
                        {key.name}
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-1.5">
                          <code className="rounded bg-[var(--cream-dark)] px-2 py-1 font-mono text-xs text-[var(--ink)]">
                            {key.keyPrefix}...
                          </code>
                          <button
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-muted)] transition-colors hover:bg-[var(--cream-dark)] hover:text-[var(--ink)]"
                            onClick={() => copyToClipboard(key.keyPrefix)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex gap-1">
                          {key.scopes.map((scope) => (
                            <span
                              key={scope}
                              className="inline-flex rounded-full bg-[var(--cream-dark)] px-2 py-0.5 text-[11px] font-medium text-[var(--ink)]"
                            >
                              {scope}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-2 py-3 text-sm text-[var(--ink-muted)]">
                        {formatDate(key.lastUsedAt)}
                      </td>
                      <td className="px-2 py-3 text-sm text-[var(--ink-muted)]">
                        {formatDate(key.createdAt)}
                      </td>
                      <td className="px-2 py-3 text-sm text-[var(--ink-muted)]">
                        {key.expiresAt ? formatDate(key.expiresAt) : "Never"}
                      </td>
                      <td className="px-2 py-3">
                        <button
                          className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-muted)] transition-colors hover:bg-red-50 hover:text-red-600"
                          onClick={() =>
                            setRevokeDialog({ open: true, key })
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--cream-dark)]" />

      {/* Engine Connection Status */}
      <div>
        <h2 className="mb-1 text-2xl font-medium text-[var(--ink)]">
          Engine Connection
        </h2>
        <p className="mb-6 text-sm text-[var(--ink-muted)]">
          Status of your self-hosted Clean engine
        </p>

        {engineLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          </div>
        ) : engineStatus?.connected ? (
          <div className="overflow-hidden rounded-lg border border-[var(--cream-dark)] bg-white">
            <div className="flex items-center gap-2 border-b border-[var(--cream-dark)] px-4 py-3">
              <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
              <span className="text-sm font-semibold text-[var(--ink)]">
                Connected
              </span>
              {engineStatus.orgSlug && (
                <span className="text-xs text-[var(--ink-muted)]">
                  via {engineStatus.orgSlug}.tryclean.ai
                </span>
              )}
            </div>
            {engineStatus.lastHeartbeat && (
              <div className="grid grid-cols-3 divide-x divide-[var(--cream-dark)] px-1">
                <div className="flex items-center gap-2 px-4 py-3">
                  <Clock className="h-4 w-4 text-[var(--ink-muted)]" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                      Uptime
                    </p>
                    <p className="text-sm font-medium text-[var(--ink)]">
                      {formatUptime(engineStatus.lastHeartbeat.uptime)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-3">
                  <FolderGit2 className="h-4 w-4 text-[var(--ink-muted)]" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                      Repos
                    </p>
                    <p className="text-sm font-medium text-[var(--ink)]">
                      {engineStatus.lastHeartbeat.repos}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-3">
                  <Search className="h-4 w-4 text-[var(--ink-muted)]" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                      Searches
                    </p>
                    <p className="text-sm font-medium text-[var(--ink)]">
                      {engineStatus.lastHeartbeat.searches_total}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[var(--cream-dark)] bg-white">
            <div className="flex items-center gap-2 px-4 py-3">
              <WifiOff className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-semibold text-[var(--ink-muted)]">
                Not connected
              </span>
            </div>
            <div className="border-t border-[var(--cream-dark)] px-4 py-3">
              <p className="text-xs text-[var(--ink-muted)]">
                Run the installer below to set up and connect your self-hosted engine.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--cream-dark)]" />

      {/* Org Tokens Section */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-medium text-[var(--ink)]">
              Org Tokens
            </h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Tokens that authenticate your engine to the gateway
            </p>
          </div>
          <button
            onClick={() => setGenerateDialog(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-secondary)]"
          >
            <Plus className="h-4 w-4" />
            Generate Token
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Newly generated token (shown once) */}
        {newToken && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="mb-2 text-sm font-medium text-green-800">
              Token generated successfully. Copy it now — it won&apos;t be shown again.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded-md bg-white px-3 py-2 font-mono text-xs text-green-900">
                {newToken}
              </code>
              <button
                onClick={() => copyToClipboard(newToken, "new-token")}
                className={`flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  copied === "new-token"
                    ? "border-green-300 bg-green-100 text-green-700"
                    : "border-green-200 bg-white text-green-800 hover:bg-green-100"
                }`}
              >
                {copied === "new-token" ? (
                  <>
                    <Check className="h-3 w-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy
                  </>
                )}
              </button>
              <button
                onClick={() => setNewToken(null)}
                className="rounded-md border border-green-200 bg-white px-3 py-1.5 text-xs font-medium text-green-800 hover:bg-green-100"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 rounded-lg border border-[var(--cream-dark)] bg-white">
          {tokensLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            </div>
          ) : activeTokens.length === 0 ? (
            <div className="py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--cream-dark)]">
                <Key className="h-6 w-6 text-[var(--ink-muted)]" />
              </div>
              <p className="mt-3 text-sm font-medium text-[var(--ink)]">
                No org tokens
              </p>
              <p className="mb-4 mt-0.5 text-xs text-[var(--ink-muted)]">
                Generate a token to connect your self-hosted engine
              </p>
              <button
                onClick={() => setGenerateDialog(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--cream-dark)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--cream-dark)]"
              >
                <Plus className="h-3.5 w-3.5" />
                Generate your first token
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--cream-dark)]">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-[var(--ink-muted)]">
                      Name
                    </th>
                    <th className="px-2 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-[var(--ink-muted)]">
                      Last Seen
                    </th>
                    <th className="px-2 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-[var(--ink-muted)]">
                      Created
                    </th>
                    <th className="w-[60px]" />
                  </tr>
                </thead>
                <tbody>
                  {activeTokens.map((token) => (
                    <tr
                      key={token.id}
                      className="border-b border-[var(--cream-dark)] transition-colors hover:bg-[var(--cream)]"
                    >
                      <td className="px-5 py-3 text-sm font-medium text-[var(--ink)]">
                        {token.name}
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-1.5">
                          {token.lastSeenAt ? (
                            <>
                              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                              <span className="text-sm text-[var(--ink-muted)]">
                                {formatRelative(token.lastSeenAt)}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-[var(--ink-muted)]">
                              Never
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-3 text-sm text-[var(--ink-muted)]">
                        {formatDate(token.createdAt)}
                      </td>
                      <td className="px-2 py-3">
                        <button
                          className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-muted)] transition-colors hover:bg-red-50 hover:text-red-600"
                          onClick={() =>
                            setRevokeTokenDialog({ open: true, token })
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--cream-dark)]" />

      {/* Setup Instructions */}
      <div>
        <h2 className="mb-1 text-2xl font-medium text-[var(--ink)]">
          Setup
        </h2>
        <p className="mb-6 text-sm text-[var(--ink-muted)]">
          Install and connect your self-hosted Clean engine
        </p>

        {!orgInfo?.licenseKey ? (
          <div className="rounded-lg border border-[var(--cream-dark)] bg-white py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--cream-dark)]">
              <Key className="h-6 w-6 text-[var(--ink-muted)]" />
            </div>
            <p className="mt-3 text-sm font-medium text-[var(--ink)]">
              No license key
            </p>
            <p className="mb-4 mt-0.5 text-xs text-[var(--ink-muted)]">
              Generate a license to enable self-hosted deployment
            </p>
            <button
              onClick={handleGenerateLicense}
              disabled={generatingLicense}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-secondary)] disabled:opacity-50"
            >
              {generatingLicense ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Generate License
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[var(--cream-dark)] bg-white">
            <div className="space-y-5 p-4">
              {/* Step 1: Run the command */}
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                  Step 1 — Run the installer
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-md bg-[var(--cream)] px-3 py-2 font-mono text-[13px] leading-relaxed text-[var(--ink)]">
                    npx @tryclean/create
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard("npx @tryclean/create", "cmd")
                    }
                    className={`flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                      copied === "cmd"
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-[var(--cream-dark)] bg-white text-[var(--ink)] hover:bg-[var(--cream-dark)]"
                    }`}
                  >
                    {copied === "cmd" ? (
                      <>
                        <Check className="h-3 w-3" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Step 2: Paste license key when prompted */}
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                  Step 2 — Paste your license key when prompted
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all rounded-md bg-[var(--cream)] px-3 py-2 font-mono text-xs leading-relaxed text-[var(--ink)]">
                    {orgInfo.licenseKey}
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(orgInfo.licenseKey!, "license")
                    }
                    className={`flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                      copied === "license"
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-[var(--cream-dark)] bg-white text-[var(--ink)] hover:bg-[var(--cream-dark)]"
                    }`}
                  >
                    {copied === "license" ? (
                      <>
                        <Check className="h-3 w-3" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-[var(--ink-muted)]">
                  The installer will automatically provision your org token and
                  configure the gateway connection.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Revoke API Key Dialog */}
      <Dialog
        open={revokeDialog.open}
        onOpenChange={(open) => setRevokeDialog({ open, key: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Revoke API Key
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke{" "}
              <strong>{revokeDialog.key?.name}</strong>? This action cannot be
              undone. Any applications using this key will lose access
              immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setRevokeDialog({ open: false, key: null })}
              className="rounded-lg border border-[var(--cream-dark)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--cream-dark)]"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                revokeDialog.key && revokeKey(revokeDialog.key.id)
              }
              disabled={revoking}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {revoking ? "Revoking..." : "Revoke Key"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Org Token Dialog */}
      <Dialog
        open={revokeTokenDialog.open}
        onOpenChange={(open) =>
          setRevokeTokenDialog({ open, token: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Revoke Org Token
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke{" "}
              <strong>{revokeTokenDialog.token?.name}</strong>? Any engine using
              this token will be disconnected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() =>
                setRevokeTokenDialog({ open: false, token: null })
              }
              className="rounded-lg border border-[var(--cream-dark)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--cream-dark)]"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                revokeTokenDialog.token &&
                handleRevokeToken(revokeTokenDialog.token.id)
              }
              disabled={revokingToken}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {revokingToken ? "Revoking..." : "Revoke Token"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Token Dialog */}
      <Dialog
        open={generateDialog}
        onOpenChange={(open) => {
          setGenerateDialog(open);
          if (!open) setTokenName("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Org Token</DialogTitle>
            <DialogDescription>
              Create a new token for your engine to authenticate with the
              gateway. The token will only be shown once.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
              Token Name
            </label>
            <input
              type="text"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="e.g. production, staging"
              className="w-full rounded-lg border border-[var(--cream-dark)] px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                setGenerateDialog(false);
                setTokenName("");
              }}
              className="rounded-lg border border-[var(--cream-dark)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--cream-dark)]"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateToken}
              disabled={generatingToken}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-secondary)] disabled:opacity-50"
            >
              {generatingToken ? (
                <>
                  <RefreshCw className="mr-1.5 inline h-3.5 w-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
