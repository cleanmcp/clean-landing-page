"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Copy, Check, Plus, Key, Trash2, AlertTriangle } from "lucide-react";
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

function formatDate(date: string | null) {
  if (!date) return "Never";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Tunnel state types
interface TunnelResult {
  hostname: string;
  url: string;
  token: string;
  tunnelId: string;
  dnsRecordId: string;
}

function TunnelField({
  label,
  value,
  onCopy,
  isCopied,
  small,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  isCopied: boolean;
  small?: boolean;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <div
          className={`flex-1 break-all rounded-md bg-[var(--cream)] px-3 py-2 font-mono leading-relaxed text-[var(--ink)] ${
            small ? "text-xs" : "text-[13px]"
          }`}
        >
          {value}
        </div>
        <button
          onClick={onCopy}
          className={`flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
            isCopied
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-[var(--cream-dark)] bg-white text-[var(--ink)] hover:bg-[var(--cream-dark)]"
          }`}
        >
          {isCopied ? (
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
  );
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

  // Tunnel state
  const [slug, setSlug] = useState("");
  const [tunnelLoading, setTunnelLoading] = useState(false);
  const [tunnelResult, setTunnelResult] = useState<TunnelResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

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

  async function handleGenerateTunnel() {
    if (!slug.trim()) return;
    setTunnelLoading(true);
    setError(null);
    setTunnelResult(null);
    setDeleted(false);

    try {
      const res = await fetch("/api/tunnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgSlug: slug.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Failed (${res.status})`);
      } else {
        setTunnelResult(data.tunnel);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setTunnelLoading(false);
    }
  }

  async function handleDeleteTunnel() {
    if (!tunnelResult) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/tunnel", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tunnelId: tunnelResult.tunnelId,
          dnsRecordId: tunnelResult.dnsRecordId,
        }),
      });
      if (res.ok) {
        setDeleted(true);
        setTunnelResult(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to delete");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setDeleting(false);
    }
  }

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

      {/* Cloudflare Tunnel Section */}
      <div>
        <h2 className="mb-1 text-2xl font-medium text-[var(--ink)]">
          Cloudflare Tunnel
        </h2>
        <p className="mb-6 text-sm text-[var(--ink-muted)]">
          Generate a Cloudflare Tunnel for an org. Creates{" "}
          <code className="rounded bg-[var(--cream-dark)] px-1.5 py-0.5 font-mono text-xs">
            name.tryclean.ai
          </code>
        </p>

        {/* Input + Button */}
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            placeholder="org-slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value.replace(/[^a-z0-9-]/g, ""));
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleGenerateTunnel()}
            className="max-w-xs flex-1 rounded-lg border border-[var(--cream-dark)] bg-white px-3.5 py-2.5 font-mono text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <button
            onClick={handleGenerateTunnel}
            disabled={tunnelLoading || !slug.trim()}
            className="whitespace-nowrap rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-secondary)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {tunnelLoading ? "Creating..." : "Generate"}
          </button>
        </div>

        {/* Preview */}
        {slug.trim() && !tunnelResult && (
          <p className="mb-4 text-sm text-[var(--ink-muted)]">
            Will create:{" "}
            <strong className="text-[var(--ink)]">
              https://{slug.trim().toLowerCase()}.tryclean.ai
            </strong>
          </p>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Deleted success */}
        {deleted && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Tunnel deleted successfully.
          </div>
        )}

        {/* Tunnel Result */}
        {tunnelResult && (
          <div className="overflow-hidden rounded-lg border border-[var(--cream-dark)] bg-white">
            <div className="flex items-center justify-between border-b border-[var(--cream-dark)] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
                <span className="text-sm font-semibold text-[var(--ink)]">
                  Tunnel Created
                </span>
              </div>
              <button
                onClick={handleDeleteTunnel}
                disabled={deleting}
                className="rounded-md border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>

            <div className="space-y-4 p-4">
              <TunnelField
                label="URL"
                value={tunnelResult.url}
                onCopy={() => copyToClipboard(tunnelResult.url, "url")}
                isCopied={copied === "url"}
              />
              <TunnelField
                label="MCP Endpoint"
                value={`${tunnelResult.url}/mcp/sse`}
                onCopy={() =>
                  copyToClipboard(`${tunnelResult.url}/mcp/sse`, "mcp")
                }
                isCopied={copied === "mcp"}
              />
              <TunnelField
                label="Tunnel Token"
                value={tunnelResult.token}
                onCopy={() => copyToClipboard(tunnelResult.token, "token")}
                isCopied={copied === "token"}
              />
              <TunnelField
                label="Tunnel ID"
                value={tunnelResult.tunnelId}
                onCopy={() => copyToClipboard(tunnelResult.tunnelId, "tid")}
                isCopied={copied === "tid"}
                small
              />
              <TunnelField
                label="DNS Record ID"
                value={tunnelResult.dnsRecordId}
                onCopy={() =>
                  copyToClipboard(tunnelResult.dnsRecordId, "dnsid")
                }
                isCopied={copied === "dnsid"}
                small
              />
            </div>
          </div>
        )}
      </div>

      {/* Revoke Confirmation Dialog */}
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
    </div>
  );
}
