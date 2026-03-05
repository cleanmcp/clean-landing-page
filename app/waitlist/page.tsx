"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

export default function WaitlistPage() {
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

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--cream)] px-5">
      {/* Subtle background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] bg-[size:3rem_3rem]" />
      </div>

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
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)]/10"
            >
              <CheckCircle2 className="h-8 w-8 text-[var(--accent)]" />
            </motion.div>
            <h1
              className="mb-3 text-2xl font-normal"
              style={{ fontFamily: "var(--font-display)" }}
            >
              You&apos;re on the list!
            </h1>
            <p className="mb-8 text-[var(--ink-light)]">
              We&apos;ll send you an email when your spot is ready. Keep an eye on your inbox.
            </p>
            <Link
              href="/"
              className="text-sm font-medium text-[var(--accent)] hover:underline"
            >
              Back to homepage
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <Link
                href="/"
                className="mb-6 inline-block text-xl font-normal tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Clean
              </Link>
              <h1
                className="mb-3 text-3xl font-normal sm:text-4xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Join the waitlist
              </h1>
              <p className="text-[var(--ink-light)]">
                Get early access to Clean and start saving tokens across all your AI agents.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-sm font-medium text-[var(--ink)]"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-[var(--cream-dark)] bg-white px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] outline-none transition-all focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-[var(--ink)]"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-[var(--cream-dark)] bg-white px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] outline-none transition-all focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10"
                />
              </div>

              {status === "error" && (
                <p className="text-sm text-red-600">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium disabled:opacity-50"
              >
                {status === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Join Waitlist"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-[var(--ink-muted)]">
              Already have an account?{" "}
              <Link href="/sign-in" className="font-medium text-[var(--accent)] hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
