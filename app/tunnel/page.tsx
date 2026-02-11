"use client";

import { useState } from "react";

export default function TunnelPage() {
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
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

  async function handleGenerate() {
    if (!slug.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
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
        setResult(data.tunnel);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!result) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/tunnel", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tunnelId: result.tunnelId,
          dnsRecordId: result.dnsRecordId,
        }),
      });
      if (res.ok) {
        setDeleted(true);
        setResult(null);
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
    <div
      style={{
        minHeight: "100vh",
        background: "#F5F3EE",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 520 }}>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "#1A1A1A",
            marginBottom: 4,
          }}
        >
          Create Tunnel
        </h1>
        <p style={{ color: "#6B6B6B", fontSize: 14, marginBottom: 32 }}>
          Generate a Cloudflare Tunnel for an org. Creates{" "}
          <code
            style={{
              background: "#EAE6DE",
              padding: "2px 6px",
              borderRadius: 4,
              fontSize: 13,
              fontFamily: "var(--font-geist-mono), monospace",
            }}
          >
            name.tryclean.ai
          </code>
        </p>

        {/* Input + Button */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            placeholder="org-slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value.replace(/[^a-z0-9-]/g, ""));
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #EAE6DE",
              background: "#fff",
              fontSize: 15,
              fontFamily: "var(--font-geist-mono), monospace",
              outline: "none",
              color: "#1A1A1A",
            }}
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !slug.trim()}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: loading ? "#6B6B6B" : "#09463f",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading || !slug.trim() ? "not-allowed" : "pointer",
              opacity: !slug.trim() ? 0.5 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "Creating..." : "Generate"}
          </button>
        </div>

        {/* Preview */}
        {slug.trim() && !result && (
          <p style={{ color: "#6B6B6B", fontSize: 13, marginBottom: 16 }}>
            Will create:{" "}
            <strong style={{ color: "#1A1A1A" }}>
              https://{slug.trim().toLowerCase()}.tryclean.ai
            </strong>
          </p>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {/* Deleted */}
        {deleted && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#166534",
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            Tunnel deleted successfully.
          </div>
        )}

        {/* Result */}
        {result && (
          <div
            style={{
              borderRadius: 10,
              border: "1px solid #EAE6DE",
              background: "#fff",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid #EAE6DE",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#22c55e",
                    boxShadow: "0 0 6px rgba(34,197,94,0.5)",
                  }}
                />
                <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>
                  Tunnel Created
                </span>
              </div>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: "5px 12px",
                  borderRadius: 6,
                  border: "1px solid #fecaca",
                  background: deleting ? "#f5f5f5" : "#fff",
                  color: "#dc2626",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: deleting ? "not-allowed" : "pointer",
                }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>

            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
              <Field
                label="URL"
                value={result.url}
                onCopy={() => copy(result.url, "url")}
                copied={copied === "url"}
              />
              <Field
                label="MCP Endpoint"
                value={`${result.url}/mcp/sse`}
                onCopy={() => copy(`${result.url}/mcp/sse`, "mcp")}
                copied={copied === "mcp"}
              />
              <Field
                label="Tunnel Token"
                value={result.token}
                onCopy={() => copy(result.token, "token")}
                copied={copied === "token"}
                mono
              />
              <Field
                label="Tunnel ID"
                value={result.tunnelId}
                onCopy={() => copy(result.tunnelId, "tid")}
                copied={copied === "tid"}
                mono
                small
              />
              <Field
                label="DNS Record ID"
                value={result.dnsRecordId}
                onCopy={() => copy(result.dnsRecordId, "dnsid")}
                copied={copied === "dnsid"}
                mono
                small
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onCopy,
  copied,
  mono,
  small,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
  mono?: boolean;
  small?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "#6B6B6B",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 6,
            background: "#F5F3EE",
            fontSize: small ? 12 : 13,
            fontFamily: mono
              ? "var(--font-geist-mono), monospace"
              : "var(--font-geist-mono), monospace",
            color: "#1A1A1A",
            wordBreak: "break-all",
            lineHeight: 1.5,
          }}
        >
          {value}
        </div>
        <button
          onClick={onCopy}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid #EAE6DE",
            background: copied ? "#f0fdf4" : "#fff",
            color: copied ? "#166534" : "#4A4A4A",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
