"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Loader2, CheckCircle2, XCircle, Users } from "lucide-react";

type InviteStatus = "loading" | "ready" | "accepting" | "accepted" | "error";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const [status, setStatus] = useState<InviteStatus>("ready");
  const [orgName, setOrgName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--dash-accent)]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#171717] p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--dash-accent)]/10">
            <Users className="h-6 w-6 text-[var(--dash-accent)]" />
          </div>
        </div>

        <h1 className="mb-2 text-center text-xl font-semibold text-[#fafafa]">
          Team Invite
        </h1>

        {status === "accepted" ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-green-500" />
            <p className="text-sm text-[#fafafa]">
              You&apos;ve joined <strong>{orgName}</strong>
            </p>
            <p className="mt-1 text-xs text-[#a1a1aa]">
              Redirecting to dashboard...
            </p>
          </div>
        ) : status === "error" ? (
          <div className="text-center">
            <XCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => setStatus("ready")}
              className="mt-4 text-sm font-medium text-[var(--dash-accent)] hover:underline"
            >
              Try again
            </button>
          </div>
        ) : !isSignedIn ? (
          <div className="text-center">
            <p className="mb-4 text-sm text-[#a1a1aa]">
              Sign in to accept this invite and join the team.
            </p>
            <SignInButton
              mode="redirect"
              forceRedirectUrl={`/invite/${token}`}
            >
              <button className="w-full rounded-xl bg-[var(--dash-accent)] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1565d8]">
                Sign in to continue
              </button>
            </SignInButton>
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-4 text-sm text-[#a1a1aa]">
              You&apos;ve been invited to join a team on Clean.
            </p>
            <button
              onClick={handleAccept}
              disabled={status === "accepting"}
              className="w-full rounded-xl bg-[var(--dash-accent)] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1565d8] disabled:opacity-50"
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
