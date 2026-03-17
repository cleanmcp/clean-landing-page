"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--blue-dark)] border-t-transparent" />
    </div>
  );
}

export default function WaitlistPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <WaitlistContent />
    </Suspense>
  );
}

function WaitlistContent() {
  const searchParams = useSearchParams();
  const notApproved = searchParams.get("not_approved") === "1";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--blue-border)] bg-[var(--blue-faint)]/30 px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] outline-none transition-all duration-200 focus:border-[var(--blue-dark)] focus:ring-2 focus:ring-[var(--blue-dark)]/10";

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-white px-5">
      {/* Back link */}
      <Link
        href="/"
        className="absolute left-6 top-6 flex items-center gap-2 text-sm text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {status === "success" ? (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--blue-dark)]/10"
            >
              <CheckCircle2 className="h-8 w-8 text-[var(--blue-dark)]" />
            </motion.div>
            <h1
              className="mb-3 text-2xl font-normal tracking-tight text-[var(--ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              You&apos;re on the list!
            </h1>
            <p className="mb-8 text-[var(--ink-muted)]">
              We&apos;ll send you an email when your spot is ready. Keep an eye on your inbox.
            </p>
            <Link
              href="/"
              className="text-sm font-medium text-[var(--blue-dark)] hover:underline"
            >
              Back to homepage
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <Link
                href="/"
                className="mb-6 inline-block text-2xl font-bold tracking-tight text-[var(--ink)]"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                clean<span className="text-[var(--blue-dark)]">.</span>
              </Link>
              <h1
                className="mb-3 text-3xl font-normal tracking-tight text-[var(--ink)] sm:text-4xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Join the waitlist
              </h1>
              <p className="text-[var(--ink-muted)]">
                {notApproved
                  ? "You're not on the approved list yet. Join below and we'll let you know when you're in."
                  : "Get early access to Clean and start saving tokens across all your AI agents."}
              </p>
            </div>

            {/* Card */}
            <div className="rounded-2xl border border-[var(--blue-border)] bg-white p-8 shadow-[0_0_30px_rgba(174,216,255,0.15)]">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className={inputClass}
                  />
                </div>

                {status === "error" && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {status === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Join Waitlist"
                  )}
                </button>
              </form>
            </div>

            <p className="mt-6 text-center text-xs text-[var(--ink-muted)]">
              Already have an account?{" "}
              <Link href="/sign-in" className="font-medium text-[var(--blue-dark)] hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
