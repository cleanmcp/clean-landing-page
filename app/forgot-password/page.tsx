"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const A = "/landing";

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#79c0ff] border-t-transparent" />
    </div>
  );
}

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-[15px] text-white placeholder:text-white/30 outline-none transition-all duration-300 focus:border-[#5eb1ff]/50 focus:bg-white/[0.07] focus:ring-1 focus:ring-[#5eb1ff]/20 backdrop-blur-sm";

export default function ForgotPasswordPage() {
  const { signIn, isLoaded } = useSignIn();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isLoaded) return <Spinner />;

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    setError("");
    setLoading(true);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setStep("code");
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string; longMessage?: string }[] };
      setError(
        clerkErr?.errors?.[0]?.longMessage ||
        clerkErr?.errors?.[0]?.message ||
        "Failed to send reset code"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    setError("");
    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });
      if (result.status === "complete") {
        setSuccess(true);
      } else {
        setError("Reset incomplete. Please try again.");
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string; longMessage?: string }[] };
      setError(
        clerkErr?.errors?.[0]?.longMessage ||
        clerkErr?.errors?.[0]?.message ||
        "Failed to reset password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      <div className="absolute inset-0 opacity-40 overflow-hidden">
        <Image src={`${A}/dark-bg.png`} alt="" fill className="object-cover" />
      </div>

      {/* Radial glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none opacity-25"
        style={{
          backgroundImage: "radial-gradient(circle, #79c0ff 0%, #3b92f3 25%, #1772e7 45%, transparent 70%)",
        }}
      />

      {/* Back link */}
      <Link
        href="/sign-in"
        className="absolute left-6 top-6 z-20 flex items-center gap-2.5 text-sm text-white/40 transition-colors hover:text-white/80"
        style={{ fontFamily: "var(--font-jakarta)" }}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to sign in
      </Link>

      <motion.div
        className="relative z-10 w-full max-w-[460px] px-5"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Logo */}
        <div className="mb-10 text-center">
          <Link href="/" className="inline-flex items-center gap-0.5 mb-8">
            <Image src={`${A}/clean-icon.svg`} alt="" width={22} height={22} />
            <span className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-jakarta)" }}>lean.ai</span>
          </Link>

          {success ? (
            <>
              <h1
                className="mb-3 text-[32px] sm:text-[40px] font-semibold tracking-tight text-white leading-tight"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                Password <em className="not-italic" style={{ fontFamily: "var(--font-display)" }}>reset</em>
              </h1>
              <p className="text-base text-white/45" style={{ fontFamily: "var(--font-jakarta)" }}>
                Your password has been updated successfully.
              </p>
            </>
          ) : (
            <>
              <h1
                className="mb-3 text-[32px] sm:text-[40px] font-semibold tracking-tight text-white leading-tight"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                {step === "email" ? (
                  <>Forgot <em className="not-italic" style={{ fontFamily: "var(--font-display)" }}>password?</em></>
                ) : (
                  <>Reset <em className="not-italic" style={{ fontFamily: "var(--font-display)" }}>password</em></>
                )}
              </h1>
              <p className="text-base text-white/45" style={{ fontFamily: "var(--font-jakarta)" }}>
                {step === "email"
                  ? "Enter your email and we'll send you a reset code."
                  : "Enter the code sent to your email and choose a new password."}
              </p>
            </>
          )}
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
          {success ? (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#79c0ff]/10 ring-1 ring-[#79c0ff]/20">
                <svg className="h-6 w-6 text-[#79c0ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mb-6 text-sm text-white/50" style={{ fontFamily: "var(--font-jakarta)" }}>
                You can now sign in with your new password.
              </p>
              <Link
                href="/sign-in"
                className="group relative inline-flex w-full items-center justify-center h-[52px] rounded-[26px] text-white text-[16px] font-semibold tracking-tight transition-all duration-300 hover:scale-[1.01]"
                style={{
                  background: "linear-gradient(180deg, #79C0FF 0%, #3B92F3 100%)",
                  border: "3px solid rgba(255,255,255,0.5)",
                  boxShadow: "0px 2px 10px rgba(59,146,243,0.4), inset 0px 4px 12px 1px rgba(255,255,255,0.6), inset 0px -2px 6px rgba(0,50,150,0.3)",
                  fontFamily: "var(--font-jakarta)",
                }}
              >
                <span style={{ textShadow: "0px 1px 2px rgba(0,60,150,0.5)" }}>Sign in</span>
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300" style={{ fontFamily: "var(--font-jakarta)" }}>
                  {error}
                </div>
              )}

              {step === "email" ? (
                <form onSubmit={handleSendCode} className="space-y-5">
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-white/60" style={{ fontFamily: "var(--font-jakarta)" }}>
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputClass}
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative flex w-full items-center justify-center h-[52px] rounded-[26px] text-white text-[16px] font-semibold tracking-tight transition-all duration-300 hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
                    style={{
                      background: "linear-gradient(180deg, #79C0FF 0%, #3B92F3 100%)",
                      border: "3px solid rgba(255,255,255,0.5)",
                      boxShadow: "0px 2px 10px rgba(59,146,243,0.4), inset 0px 4px 12px 1px rgba(255,255,255,0.6), inset 0px -2px 6px rgba(0,50,150,0.3)",
                      fontFamily: "var(--font-jakarta)",
                    }}
                  >
                    <span style={{ textShadow: "0px 1px 2px rgba(0,60,150,0.5)" }}>
                      {loading ? "Sending…" : "Send reset code"}
                    </span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleReset} className="space-y-5">
                  <div>
                    <label htmlFor="code" className="mb-2 block text-sm font-medium text-white/60" style={{ fontFamily: "var(--font-jakarta)" }}>
                      Reset code
                    </label>
                    <input
                      id="code"
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className={inputClass}
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    />
                  </div>
                  <div>
                    <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-white/60" style={{ fontFamily: "var(--font-jakarta)" }}>
                      New password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      className={inputClass}
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative flex w-full items-center justify-center h-[52px] rounded-[26px] text-white text-[16px] font-semibold tracking-tight transition-all duration-300 hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
                    style={{
                      background: "linear-gradient(180deg, #79C0FF 0%, #3B92F3 100%)",
                      border: "3px solid rgba(255,255,255,0.5)",
                      boxShadow: "0px 2px 10px rgba(59,146,243,0.4), inset 0px 4px 12px 1px rgba(255,255,255,0.6), inset 0px -2px 6px rgba(0,50,150,0.3)",
                      fontFamily: "var(--font-jakarta)",
                    }}
                  >
                    <span style={{ textShadow: "0px 1px 2px rgba(0,60,150,0.5)" }}>
                      {loading ? "Resetting…" : "Reset password"}
                    </span>
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {!success && (
          <p className="mt-8 text-center text-sm text-white/30" style={{ fontFamily: "var(--font-jakarta)" }}>
            Remember your password?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-[#79c0ff] transition-colors duration-200 hover:text-[#aed8ff]"
            >
              Sign in
            </Link>
          </p>
        )}
      </motion.div>
    </div>
  );
}
