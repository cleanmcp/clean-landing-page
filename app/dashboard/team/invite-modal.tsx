"use client";

import { useState, useEffect } from "react";
import { X, Copy, Trash2, Link, Check } from "lucide-react";
import { toast } from "sonner";

interface Invite {
  id: string;
  token: string;
  inviteUrl: string;
  role: string;
  email: string | null;
  maxUses: number | null;
  useCount: number;
  expiresAt: string | null;
  createdAt: string;
}

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  isOwner: boolean;
}

export function InviteModal({ open, onClose, isOwner }: InviteModalProps) {
  const [role, setRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [expiresInDays, setExpiresInDays] = useState<string>("7");
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [existingInvites, setExistingInvites] = useState<Invite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  useEffect(() => {
    if (open) {
      setGeneratedUrl(null);
      setCopied(false);
      fetchInvites();
    }
  }, [open]);

  async function fetchInvites() {
    setLoadingInvites(true);
    try {
      const res = await fetch("/api/invites");
      const data = await res.json();
      setExistingInvites(data.invites ?? []);
    } catch {
      toast.error("Failed to load invites");
    } finally {
      setLoadingInvites(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          expiresInDays: expiresInDays === "never" ? null : Number(expiresInDays),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create invite");
        return;
      }
      setGeneratedUrl(data.invite.inviteUrl);
      fetchInvites();
      toast.success("Invite link created");
    } catch {
      toast.error("Failed to create invite");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRevoke(id: string) {
    try {
      const res = await fetch("/api/invites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        toast.error("Failed to revoke invite");
        return;
      }
      toast.success("Invite revoked");
      fetchInvites();
    } catch {
      toast.error("Failed to revoke invite");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative mx-4 w-full max-w-lg rounded-xl border border-[var(--cream-dark)] bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--ink)]">
            Invite members
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--ink-muted)] transition-colors hover:bg-[var(--cream-dark)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Generate new invite */}
        <div className="mb-6 rounded-lg border border-[var(--cream-dark)] bg-[var(--cream)] p-4">
          <div className="mb-3 flex items-center gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--ink-muted)]">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "MEMBER" | "ADMIN")}
                className="rounded-lg border border-[var(--cream-dark)] bg-white px-3 py-1.5 text-sm text-[var(--ink)]"
              >
                <option value="MEMBER">Member</option>
                {isOwner && <option value="ADMIN">Admin</option>}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--ink-muted)]">
                Expires
              </label>
              <select
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                className="rounded-lg border border-[var(--cream-dark)] bg-white px-3 py-1.5 text-sm text-[var(--ink)]"
              >
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="never">Never</option>
              </select>
            </div>
          </div>

          {generatedUrl ? (
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={generatedUrl}
                className="flex-1 rounded-lg border border-[var(--cream-dark)] bg-white px-3 py-2 text-sm text-[var(--ink)]"
              />
              <button
                onClick={() => handleCopy(generatedUrl)}
                className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-secondary)]"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-secondary)] disabled:opacity-50"
            >
              <Link className="h-4 w-4" />
              {generating ? "Generating..." : "Generate invite link"}
            </button>
          )}
        </div>

        {/* Existing invites */}
        <div>
          <h4 className="mb-2 text-sm font-medium text-[var(--ink)]">
            Active invites
          </h4>
          {loadingInvites ? (
            <div className="flex justify-center py-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            </div>
          ) : existingInvites.length === 0 ? (
            <p className="py-4 text-center text-sm text-[var(--ink-muted)]">
              No active invites
            </p>
          ) : (
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {existingInvites.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--cream-dark)] px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs font-mono text-[var(--ink-muted)]">
                        ...{inv.token.slice(-8)}
                      </span>
                      <span className="rounded bg-[var(--cream-dark)] px-1.5 py-0.5 text-xs font-medium text-[var(--ink-muted)]">
                        {inv.role}
                      </span>
                      {inv.maxUses && (
                        <span className="text-xs text-[var(--ink-muted)]">
                          {inv.useCount}/{inv.maxUses} uses
                        </span>
                      )}
                    </div>
                    {inv.expiresAt && (
                      <p className="text-xs text-[var(--ink-muted)]">
                        Expires{" "}
                        {new Date(inv.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(inv.inviteUrl)}
                      className="rounded p-1 text-[var(--ink-muted)] transition-colors hover:bg-[var(--cream-dark)]"
                      title="Copy link"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleRevoke(inv.id)}
                      className="rounded p-1 text-red-400 transition-colors hover:bg-red-50"
                      title="Revoke"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
