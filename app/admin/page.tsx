"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, Loader2, Mail, ShieldX } from "lucide-react";

type WaitlistEntry = {
  id: string;
  name: string;
  email: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
};

export default function AdminPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "rejected">("all");

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/waitlist");
      if (res.status === 403) {
        setForbidden(true);
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEntries(data);
      setError("");
    } catch {
      setError("Failed to load waitlist");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: "accept" | "reject") {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/waitlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Action failed");
      await fetchEntries();
    } catch {
      setError("Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  if (forbidden) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <ShieldX className="mx-auto h-8 w-8 text-red-400" />
          <p className="mt-3 text-sm text-white/50">Access denied</p>
        </div>
      </div>
    );
  }

  if (loading && entries.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      </div>
    );
  }

  const filtered = filter === "all" ? entries : entries.filter((e) => e.status === filter);
  const counts = {
    all: entries.length,
    pending: entries.filter((e) => e.status === "pending").length,
    accepted: entries.filter((e) => e.status === "accepted").length,
    rejected: entries.filter((e) => e.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium text-white">Waitlist</h1>
            <p className="mt-1 text-sm text-white/40">
              Accept users to send them a sign-up link.
            </p>
          </div>
          <button
            onClick={() => fetchEntries()}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 transition-colors hover:border-white/20 hover:text-white/70"
          >
            Refresh
          </button>
        </div>

        {error && <p className="mb-4 text-center text-xs text-red-400">{error}</p>}

        {/* Filter tabs */}
        <div className="mb-6 flex gap-2">
          {(["all", "pending", "accepted", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-white text-black"
                  : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-xl border border-white/5">
            <p className="text-sm text-white/30">No entries</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4"
              >
                <div className="flex items-center gap-4">
                  {entry.status === "pending" && <Clock className="h-4 w-4 text-amber-400" />}
                  {entry.status === "accepted" && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                  {entry.status === "rejected" && <XCircle className="h-4 w-4 text-red-400" />}
                  <div>
                    <p className="text-sm font-medium text-white">{entry.name}</p>
                    <p className="flex items-center gap-1.5 text-xs text-white/40">
                      <Mail className="h-3 w-3" />
                      {entry.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/30">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>

                  {entry.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(entry.id, "accept")}
                        disabled={actionLoading === entry.id}
                        className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 transition-colors hover:bg-green-500/20 disabled:opacity-50"
                      >
                        {actionLoading === entry.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Accept"}
                      </button>
                      <button
                        onClick={() => handleAction(entry.id, "reject")}
                        disabled={actionLoading === entry.id}
                        className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white/40 transition-colors hover:bg-white/10 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {entry.status === "accepted" && (
                    <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400">
                      Accepted
                    </span>
                  )}
                  {entry.status === "rejected" && (
                    <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400">
                      Rejected
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
