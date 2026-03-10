"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Check, AlertTriangle, Key, Shield } from "lucide-react";

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
      <div className="max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <Check className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-medium text-[var(--ink)]">
              API Key Created
            </h1>
            <p className="text-sm text-[var(--ink-muted)]">
              Copy your key and config below
            </p>
          </div>
        </div>

        {/* Key card */}
        <div className="rounded-xl border border-[var(--cream-dark)] bg-white">
          <div className="flex items-center gap-2 border-b border-[var(--cream-dark)] px-5 py-3">
            <Key className="h-4 w-4 text-[var(--ink-muted)]" />
            <span className="text-sm font-semibold text-[var(--ink)]">Your API Key</span>
          </div>
          <div className="p-5">
            <div className="rounded-lg border border-[var(--cream-dark)] bg-[var(--cream)] px-4 py-3">
              <code className="block break-all font-mono text-[13px] leading-relaxed text-[var(--ink)]">
                {generatedKey}
              </code>
            </div>
            <button
              onClick={copyKey}
              className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                copied
                  ? "border border-green-200 bg-green-50 text-green-700"
                  : "border border-[var(--cream-dark)] bg-white text-[var(--ink)] hover:bg-[var(--cream)]"
              }`}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy key"}
            </button>
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-xs leading-relaxed text-amber-800">
                Store this key securely. It will only be shown once.
              </p>
            </div>
          </div>
        </div>

        {/* MCP config card */}
        <div className="rounded-xl border border-[var(--cream-dark)] bg-white">
          <div className="flex items-center gap-2 border-b border-[var(--cream-dark)] px-5 py-3">
            <Shield className="h-4 w-4 text-[var(--ink-muted)]" />
            <span className="text-sm font-semibold text-[var(--ink)]">MCP Configuration</span>
          </div>

          {/* Agent tabs — scrollable row */}
          <div className="flex overflow-x-auto border-b border-[var(--cream-dark)]">
            {CONFIG_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setConfigTab(tab.id); setCopiedConfig(false); }}
                className={`shrink-0 px-4 py-2.5 text-sm font-medium transition-colors ${
                  configTab === tab.id
                    ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Config content */}
          <div className="p-5">
            <p className="mb-3 text-xs text-[var(--ink-muted)]">
              Add to <code className="rounded bg-[var(--cream)] px-1.5 py-0.5 font-mono text-[11px]">{activeTab.file}</code>
              {configTab === "claude-desktop" || configTab === "codex" ? (
                <span className="ml-1 text-amber-600">(requires npx / Node.js installed)</span>
              ) : null}
            </p>
            <div className="overflow-hidden rounded-lg border border-[var(--cream-dark)]">
              <pre className="overflow-x-auto bg-[var(--cream)] p-4 font-mono text-[12px] leading-relaxed text-[var(--ink)]">
                {config}
              </pre>
            </div>
            <button
              onClick={copyConfig}
              className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                copiedConfig
                  ? "border border-green-200 bg-green-50 text-green-700"
                  : "border border-[var(--cream-dark)] bg-white text-[var(--ink)] hover:bg-[var(--cream)]"
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
          className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-secondary)]"
        >
          Done
        </button>
      </div>
    );
  }

  // ── Create key form ──
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
    </div>
  );
}
