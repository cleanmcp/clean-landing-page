"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

const mockKeys = [
  {
    name: "Production API Key",
    key: "clean_sk_prod_***************",
    created: "2025-01-15",
    lastUsed: "2025-02-11",
  },
  {
    name: "Development API Key",
    key: "clean_sk_dev_***************",
    created: "2025-01-10",
    lastUsed: "2025-02-10",
  },
];

export default function KeysPage() {
  // Tunnel state
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [tunnelResult, setTunnelResult] = useState<{
    hostname: string;
    url: string;
    token: string;
    tunnelId: string;
    dnsRecordId: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  async function handleGenerateTunnel() {
    if (!slug.trim()) return;
    setLoading(true);
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
      setLoading(false);
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

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-10">
      {/* API Keys Section */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-medium text-[var(--ink)]">API Keys</h2>
          <button className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-secondary)]">
            Create API Key
          </button>
        </div>

        <div className="space-y-4">
          {mockKeys.map((keyData, i) => (
            <div
              key={i}
              className="rounded-lg border border-[var(--cream-dark)] bg-white p-4"
            >
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <h3 className="mb-1 text-sm font-medium text-[var(--ink)]">
                    {keyData.name}
                  </h3>
                  <p className="font-mono text-xs text-[var(--ink-muted)]">
                    {keyData.key}
                  </p>
                </div>
                <button className="rounded-lg border border-[var(--cream-dark)] px-3 py-1 text-xs font-medium text-[var(--ink)] transition-colors hover:bg-[var(--cream-dark)]">
                  Revoke
                </button>
              </div>
              <div className="flex gap-4 text-xs text-[var(--ink-muted)]">
                <span>Created: {keyData.created}</span>
                <span>Last used: {keyData.lastUsed}</span>
              </div>
            </div>
          ))}
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
            disabled={loading || !slug.trim()}
            className="whitespace-nowrap rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-secondary)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating..." : "Generate"}
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
                onCopy={() => copy(tunnelResult.url, "url")}
                isCopied={copied === "url"}
              />
              <TunnelField
                label="MCP Endpoint"
                value={`${tunnelResult.url}/mcp/sse`}
                onCopy={() =>
                  copy(`${tunnelResult.url}/mcp/sse`, "mcp")
                }
                isCopied={copied === "mcp"}
              />
              <TunnelField
                label="Tunnel Token"
                value={tunnelResult.token}
                onCopy={() => copy(tunnelResult.token, "token")}
                isCopied={copied === "token"}
              />
              <TunnelField
                label="Tunnel ID"
                value={tunnelResult.tunnelId}
                onCopy={() => copy(tunnelResult.tunnelId, "tid")}
                isCopied={copied === "tid"}
                small
              />
              <TunnelField
                label="DNS Record ID"
                value={tunnelResult.dnsRecordId}
                onCopy={() => copy(tunnelResult.dnsRecordId, "dnsid")}
                isCopied={copied === "dnsid"}
                small
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
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

