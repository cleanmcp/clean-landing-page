"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Loader2, CheckCircle2, XCircle, Users } from "lucide-react";

type InviteStatus = "loading" | "ready" | "accepting" | "accepted" | "error";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const [status, setStatus] = useState<InviteStatus>("loading");
  const [orgName, setOrgName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setStatus("ready");
      return;
    }
    // Auto-check if invite is valid once signed in
    setStatus("ready");
  }, [isLoaded, isSignedIn]);

  async function handleAccept() {
    setStatus("accepting");
    setError(null);

    try {
      const res = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "already_member") {
          router.push("/dashboard");
          return;
        }
        setError(data.message || data.error || "Failed to accept invite");
        setStatus("error");
        return;
      }

      setOrgName(data.orgName);
      setStatus("accepted");
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--cream)]">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--cream)] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--cream-dark)] bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/10">
            <Users className="h-6 w-6 text-[var(--accent)]" />
          </div>
        </div>

        <h1 className="mb-2 text-center text-xl font-semibold text-[var(--ink)]">
          Team Invite
        </h1>

        {status === "accepted" ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-green-500" />
            <p className="text-sm text-[var(--ink)]">
              You&apos;ve joined <strong>{orgName}</strong>
            </p>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">
              Redirecting to dashboard...
            </p>
          </div>
        ) : status === "error" ? (
          <div className="text-center">
            <XCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => setStatus("ready")}
              className="mt-4 text-sm font-medium text-[var(--accent)] hover:underline"
            >
              Try again
            </button>
          </div>
        ) : !isSignedIn ? (
          <div className="text-center">
            <p className="mb-4 text-sm text-[var(--ink-muted)]">
              Sign in to accept this invite and join the team.
            </p>
            <SignInButton
              mode="redirect"
              forceRedirectUrl={`/invite/${token}`}
            >
              <button className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-secondary)]">
                Sign in to continue
              </button>
            </SignInButton>
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-4 text-sm text-[var(--ink-muted)]">
              You&apos;ve been invited to join a team on Clean.
            </p>
            <button
              onClick={handleAccept}
              disabled={status === "accepting"}
              className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-secondary)] disabled:opacity-50"
            >
              {status === "accepting" ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              ) : (
                "Accept Invite"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
