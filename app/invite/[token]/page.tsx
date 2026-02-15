"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Users } from "lucide-react";

interface InviteInfo {
  valid: boolean;
  reason: string | null;
  orgName: string;
  orgSlug: string;
  role: string;
}

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const token = params.token as string;

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/invites/info?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error && !data.orgName) {
          setError(data.error);
        } else {
          setInfo(data);
        }
      })
      .catch(() => setError("Failed to load invite."))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleAccept() {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to accept invite.");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setAccepting(false);
    }
  }

  if (loading || !isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--cream)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  if (error && !info) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--cream)]">
        <div className="mx-4 w-full max-w-md rounded-xl border border-[var(--cream-dark)] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <Users className="h-6 w-6 text-red-500" />
          </div>
          <h1 className="mb-2 text-xl font-semibold text-[var(--ink)]">
            Invalid Invite
          </h1>
          <p className="text-sm text-[var(--ink-muted)]">{error}</p>
        </div>
      </div>
    );
  }

  if (info && !info.valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--cream)]">
        <div className="mx-4 w-full max-w-md rounded-xl border border-[var(--cream-dark)] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
            <Users className="h-6 w-6 text-amber-500" />
          </div>
          <h1 className="mb-2 text-xl font-semibold text-[var(--ink)]">
            Invite Unavailable
          </h1>
          <p className="text-sm text-[var(--ink-muted)]">{info.reason}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--cream)]">
      <div className="mx-4 w-full max-w-md rounded-xl border border-[var(--cream-dark)] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/10">
          <Users className="h-6 w-6 text-[var(--accent)]" />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-[var(--ink)]">
          Join {info?.orgName}
        </h1>
        <p className="mb-6 text-sm text-[var(--ink-muted)]">
          You&apos;ve been invited to join as{" "}
          <span className="font-medium text-[var(--ink)]">
            {info?.role}
          </span>
        </p>

        {error && (
          <p className="mb-4 text-sm text-red-600">{error}</p>
        )}

        {!user ? (
          <div className="flex flex-col gap-2">
            <a
              href={`/sign-up?redirect_url=/invite/${token}`}
              className="inline-block w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-[var(--accent-secondary)]"
            >
              Sign up to join
            </a>
            <a
              href={`/sign-in?redirect_url=/invite/${token}`}
              className="inline-block w-full rounded-lg border border-[var(--cream-dark)] px-4 py-2.5 text-center text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--cream-dark)]"
            >
              Already have an account? Sign in
            </a>
          </div>
        ) : (
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-secondary)] disabled:opacity-50"
          >
            {accepting ? "Joining..." : "Join team"}
          </button>
        )}
      </div>
    </div>
  );
}
