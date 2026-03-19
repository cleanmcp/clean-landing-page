"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const A = "/landing";

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#79c0ff] border-t-transparent" />
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
    "w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-[15px] text-white placeholder:text-white/30 outline-none transition-all duration-300 focus:border-[#5eb1ff]/50 focus:bg-white/[0.07] focus:ring-1 focus:ring-[#5eb1ff]/20 backdrop-blur-sm";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Full-page dark background */}
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      <div className="absolute inset-0 opacity-40 overflow-hidden">
        <Image src={`${A}/dark-bg.png`} alt="" fill className="object-cover" />
      </div>

      {/* Radial glow behind card */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none opacity-30"
        style={{
          backgroundImage: "radial-gradient(circle, #79c0ff 0%, #3b92f3 25%, #1772e7 45%, transparent 70%)",
        }}
      />

      {/* Back link */}
      <Link
        href="/"
        className="absolute left-6 top-6 z-20 flex items-center gap-2.5 text-sm text-white/40 transition-colors hover:text-white/80"
        style={{ fontFamily: "var(--font-jakarta)" }}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back
      </Link>

      <motion.div
        className="relative z-10 w-full max-w-[460px] px-5"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {status === "success" ? (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full"
              style={{
                background: "linear-gradient(180deg, rgba(121,192,255,0.15) 0%, rgba(59,146,243,0.05) 100%)",
                border: "1px solid rgba(121,192,255,0.2)",
              }}
            >
              <svg className="h-9 w-9 text-[#79c0ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>
            <h1
              className="mb-3 text-3xl font-semibold tracking-tight text-white"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              You&apos;re on the <em className="not-italic" style={{ fontFamily: "var(--font-display)" }}>list</em>
            </h1>
            <p className="mb-10 text-base text-white/50 leading-relaxed" style={{ fontFamily: "var(--font-jakarta)" }}>
              We&apos;ll send you an email when your spot is ready.<br />Keep an eye on your inbox.
            </p>
            <Link
              href="/"
              className="group relative inline-flex items-center h-[48px] rounded-full text-white text-[15px] font-semibold tracking-tight pl-6 pr-12 transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: "linear-gradient(180deg, #79C0FF 0%, #3B92F3 100%)",
                border: "2px solid rgba(255,255,255,0.3)",
                boxShadow: "0px 2px 10px rgba(59,146,243,0.4), inset 0px 4px 12px 1px rgba(255,255,255,0.5), inset 0px -2px 6px rgba(0,50,150,0.3)",
              }}
            >
              <span className="relative z-10" style={{ textShadow: "0px 1px 2px rgba(0,60,150,0.5)" }}>Back to homepage</span>
              <span className="absolute right-[5px] top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-white size-8 transition-transform duration-300 group-hover:-rotate-45" style={{ boxShadow: "0px 2px 4px rgba(0,0,0,0.1)" }}>
                <svg className="w-3.5 h-3.5 text-[#1772e7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
              </span>
            </Link>
          </div>
        ) : (
          <>
            {/* Logo */}
            <div className="mb-10 text-center">
              <Link href="/" className="inline-flex items-center gap-0.5 mb-8">
                <Image src={`${A}/clean-icon.svg`} alt="" width={22} height={22} />
                <span className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-jakarta)" }}>lean.ai</span>
              </Link>
              <h1
                className="mb-3 text-[32px] sm:text-[40px] font-semibold tracking-tight text-white leading-tight"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                Join the <em className="not-italic" style={{ fontFamily: "var(--font-display)" }}>waitlist</em>
              </h1>
              <p className="text-base text-white/45 leading-relaxed" style={{ fontFamily: "var(--font-jakarta)" }}>
                {notApproved
                  ? "You're not on the approved list yet. Join below and we'll let you know when you're in."
                  : "Get early access to Clean and start saving tokens across all your AI agents."}
              </p>
            </div>

            {/* Glass card */}
            <div
              className="rounded-[24px] p-8 sm:p-9"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
                backdropFilter: "blur(24px)",
              }}
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium text-white/60" style={{ fontFamily: "var(--font-jakarta)" }}>
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
                    style={{ fontFamily: "var(--font-jakarta)" }}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-white/60" style={{ fontFamily: "var(--font-jakarta)" }}>
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
                    style={{ fontFamily: "var(--font-jakarta)" }}
                  />
                </div>

                {status === "error" && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300" style={{ fontFamily: "var(--font-jakarta)" }}>
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="group relative flex w-full items-center justify-center h-[52px] rounded-[26px] text-white text-[16px] font-semibold tracking-tight transition-all duration-300 hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
                  style={{
                    background: "linear-gradient(180deg, #79C0FF 0%, #3B92F3 100%)",
                    border: "3px solid rgba(255,255,255,0.5)",
                    boxShadow: "0px 2px 10px rgba(59,146,243,0.4), inset 0px 4px 12px 1px rgba(255,255,255,0.6), inset 0px -2px 6px rgba(0,50,150,0.3)",
                    fontFamily: "var(--font-jakarta)",
                  }}
                >
                  {status === "loading" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span style={{ textShadow: "0px 1px 2px rgba(0,60,150,0.5)" }}>Join Waitlist</span>
                  )}
                </button>
              </form>
            </div>

            <p className="mt-8 text-center text-sm text-white/30" style={{ fontFamily: "var(--font-jakarta)" }}>
              Already have an account?{" "}
              <Link href="/sign-in" className="font-medium text-[#79c0ff] transition-colors hover:text-[#aed8ff]">
                Sign in
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
