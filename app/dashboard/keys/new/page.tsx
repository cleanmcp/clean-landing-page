"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Check, AlertTriangle, Key, Shield } from "lucide-react";
import { motion } from "framer-motion";

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

type ConfigTab = "claude-code" | "cursor" | "windsurf" | "gemini" | "cline" | "continue" | "claude-desktop" | "codex";

const CONFIG_TABS: { id: ConfigTab; label: string; file: string }[] = [
  { id: "claude-code", label: "Claude Code", file: ".mcp.json (project root)" },
  { id: "cursor", label: "Cursor", file: "~/.cursor/mcp.json" },
  { id: "windsurf", label: "Windsurf", file: "~/.codeium/windsurf/mcp_config.json" },
  { id: "gemini", label: "Gemini CLI", file: "~/.gemini/settings.json" },
  { id: "cline", label: "Cline", file: "VS Code MCP Settings" },
  { id: "continue", label: "Continue", file: "~/.continue/config.json" },
  { id: "claude-desktop", label: "Claude Desktop", file: "claude_desktop_config.json" },
  { id: "codex", label: "Codex", file: "~/.codex/config.toml" },
];

const SSE_URL = "https://api.tryclean.ai/mcp/sse";

function getMcpConfig(tab: ConfigTab, key: string, slug: string | null): string {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
  };
  if (slug) headers["X-Clean-Slug"] = slug;

  switch (tab) {
    case "claude-code":
      return JSON.stringify({ mcpServers: { clean: { type: "sse", url: SSE_URL, headers } } }, null, 2);

    case "cursor":
      return JSON.stringify({ mcpServers: { clean: { url: SSE_URL, headers } } }, null, 2);

    case "windsurf":
      return JSON.stringify({ mcpServers: { clean: { serverUrl: SSE_URL, headers } } }, null, 2);

    case "gemini":
      return JSON.stringify({ mcpServers: { clean: { url: SSE_URL, headers } } }, null, 2);

    case "cline":
      return JSON.stringify({ mcpServers: { clean: { url: SSE_URL, headers, disabled: false } } }, null, 2);

    case "continue":
      return JSON.stringify({ mcpServers: { clean: { type: "sse", url: SSE_URL, headers } } }, null, 2);

    case "claude-desktop": {
      const headerArgs = [`--header`, `Authorization:Bearer ${key}`];
      if (slug) headerArgs.push(`--header`, `X-Clean-Slug:${slug}`);
      return JSON.stringify({
        mcpServers: {
          clean: {
            command: "npx",
            args: ["-y", "mcp-remote", SSE_URL, ...headerArgs],
          },
        },
      }, null, 2);
    }

    case "codex": {
      const lines = [
        `[mcp_servers.clean]`,
        `command = "npx"`,
        `args = ["-y", "mcp-remote", ${JSON.stringify(SSE_URL)}, "--header", "Authorization:Bearer ${key}"${slug ? `, "--header", "X-Clean-Slug:${slug}"` : ""}]`,
      ];
      return lines.join("\n");
    }

    default:
      return JSON.stringify({ mcpServers: { clean: { type: "sse", url: SSE_URL, headers } } }, null, 2);
  }
}

export default function NewApiKeyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["search", "index"]);
  const [creating, setCreating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [configTab, setConfigTab] = useState<ConfigTab>("claude-code");
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

  async function copyConfig() {
    if (!generatedKey) return;
    try {
      const config = getMcpConfig(configTab, generatedKey, orgSlug);
      await navigator.clipboard.writeText(config);
      setCopiedConfig(true);
      setTimeout(() => setCopiedConfig(false), 2000);
    } catch {
      // clipboard API might not be available
    }
  }

  function handleDone() {
    router.push("/dashboard/keys");
  }

  // ── Success screen (replaces the form after key is created) ──
  if (generatedKey) {
    const config = getMcpConfig(configTab, generatedKey, orgSlug);
    const activeTab = CONFIG_TABS.find((t) => t.id === configTab) ?? CONFIG_TABS[0];

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      className="mx-auto w-full max-w-2xl space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#05DF72]/15">
            <Check className="h-5 w-5 text-[#05DF72]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[var(--dash-text)]">
              API Key Created
            </h1>
            <p className="text-sm text-[var(--dash-text-muted)]">
              Copy your key and config below
            </p>
          </div>
        </div>

        {/* Key card */}
        <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)]">
          <div className="flex items-center gap-2 border-b border-[var(--dash-border)] px-5 py-4">
            <Key className="h-4 w-4 text-[var(--dash-text-muted)]" />
            <span className="text-base font-semibold text-[var(--dash-text)]">Your API Key</span>
          </div>
          <div className="p-5">
            <div className="rounded-lg border border-[var(--dash-border)] bg-[var(--dash-bg)] px-4 py-3">
              <code className="block break-all font-mono text-[13px] leading-relaxed text-[var(--dash-text)]">
                {generatedKey}
              </code>
            </div>
            <button
              onClick={copyKey}
              className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                copied
                  ? "border border-[#05DF72]/30 bg-[#05DF72]/10 text-[#05DF72]"
                  : "border border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] hover:border-[var(--dash-border-strong)] hover:bg-[var(--dash-surface-hover)]"
              }`}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy key"}
            </button>
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-[#f59e0b]/10 px-3 py-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#f59e0b]" />
              <p className="text-xs leading-relaxed text-[#f59e0b]">
                Store this key securely. It will only be shown once.
              </p>
            </div>
          </div>
        </div>

        {/* MCP config card */}
        <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)]">
          <div className="flex items-center gap-2 border-b border-[var(--dash-border)] px-5 py-4">
            <Shield className="h-4 w-4 text-[var(--dash-text-muted)]" />
            <span className="text-base font-semibold text-[var(--dash-text)]">MCP Configuration</span>
          </div>

          {/* Agent tabs — pill style */}
          <div className="flex gap-1 overflow-x-auto border-b border-[var(--dash-border)] bg-[var(--dash-bg)] px-3 py-2">
            {CONFIG_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setConfigTab(tab.id); setCopiedConfig(false); }}
                className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  configTab === tab.id
                    ? "bg-[#1772E7] text-white"
                    : "text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] hover:bg-[var(--dash-surface)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Config content */}
          <div className="p-5">
            <p className="mb-3 text-sm text-[var(--dash-text-muted)]">
              Add to <code className="rounded-md bg-[var(--dash-bg)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--dash-text)]">{activeTab.file}</code>
              {configTab === "claude-desktop" || configTab === "codex" ? (
                <span className="ml-1 text-[#f59e0b]">(requires npx / Node.js installed)</span>
              ) : null}
            </p>
            <div className="overflow-hidden rounded-lg border border-[var(--dash-border)]">
              <pre className="overflow-x-auto bg-[var(--dash-bg)] p-4 font-mono text-[12px] leading-relaxed text-[var(--dash-text)]">
                {config}
              </pre>
            </div>
            <button
              onClick={copyConfig}
              className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                copiedConfig
                  ? "border border-[#05DF72]/30 bg-[#05DF72]/10 text-[#05DF72]"
                  : "border border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] hover:border-[var(--dash-border-strong)] hover:bg-[var(--dash-surface-hover)]"
              }`}
            >
              {copiedConfig ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedConfig ? "Copied!" : "Copy config"}
            </button>
          </div>
        </div>

        {/* Done */}
        <button
          onClick={handleDone}
          className="w-full rounded-lg bg-[#1772E7] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1565d0]"
        >
          Done
        </button>
      </motion.div>
    );
  }

  // ── Create key form ──
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto w-full max-w-2xl space-y-6"
    >
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/keys"
          className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-[var(--dash-text-muted)] transition-colors hover:bg-[var(--dash-surface-hover)] hover:text-[var(--dash-text)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-[var(--dash-text)]">
            Create API Key
          </h1>
          <p className="text-sm text-[var(--dash-text-muted)]">
            Generate a new API key for MCP access
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)]">
        <div className="border-b border-[var(--dash-border)] px-6 py-5">
          <h3 className="text-base font-semibold text-[var(--dash-text)]">Key Details</h3>
          <p className="mt-1 text-sm text-[var(--dash-text-muted)]">
            Choose a descriptive name and select the permissions for this key
          </p>
        </div>
        <div className="space-y-6 px-6 py-6">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-medium text-[var(--dash-text)]"
            >
              Key Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="e.g., CI/CD Pipeline, Local Development"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3.5 py-2.5 text-sm text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus:border-[#1772E7] focus:outline-none focus:ring-1 focus:ring-[#1772E7]/20"
            />
            <p className="text-sm text-[var(--dash-text-muted)]">
              A descriptive name to identify this key
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--dash-text)]">
              Permissions
            </label>
            <div className="grid gap-3">
              {AVAILABLE_SCOPES.map((scope) => (
                <div
                  key={scope.id}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
                    selectedScopes.includes(scope.id)
                      ? "border-[#1772E7] bg-[#1772E7]/5"
                      : "border-[var(--dash-border)] hover:bg-[var(--dash-surface-hover)]"
                  }`}
                  onClick={() => toggleScope(scope.id)}
                >
                  <div>
                    <div className="font-medium text-[var(--dash-text)]">
                      {scope.label}
                    </div>
                    <div className="text-sm text-[var(--dash-text-muted)]">
                      {scope.description}
                    </div>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-full border-2 ${
                      selectedScopes.includes(scope.id)
                        ? "border-[#1772E7] bg-[#1772E7]"
                        : "border-[var(--dash-border-strong)]"
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
            <label className="text-sm font-medium text-[var(--dash-text)]">
              Expiration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {EXPIRATION_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    expiration === opt.id
                      ? "border-[#1772E7] bg-[#1772E7]/5 text-[var(--dash-accent-light)]"
                      : "border-[var(--dash-border)] text-[var(--dash-text-muted)] hover:bg-[var(--dash-surface-hover)]"
                  }`}
                  onClick={() => setExpiration(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-[var(--dash-error)]">{error}</p>
          )}

          <button
            onClick={createKey}
            disabled={creating}
            className="w-full rounded-lg bg-[#1772E7] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1565d0] disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create API Key"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
