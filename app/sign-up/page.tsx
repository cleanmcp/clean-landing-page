"use client";

import { useSignUp, useUser } from "@clerk/nextjs";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { OAuthStrategy } from "@clerk/types";

const A = "/landing";

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#79c0ff] border-t-transparent" />
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <SignUpContent />
    </Suspense>
  );
}

function SignUpContent() {
  const { signUp, isLoaded, setActive } = useSignUp();
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email-gate" | "details" | "verify">("email-gate");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userLoaded && user) {
      router.push("/dashboard");
    }
  }, [userLoaded, user, router]);

  if (!isLoaded || !userLoaded) return <Spinner />;
  if (user) return <Spinner />;

  const handleWaitlistCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const checkRes = await fetch("/api/waitlist/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const checkData = await checkRes.json();

      if (!checkData.accepted) {
        router.push("/waitlist?not_approved=1");
        return;
      }

      setStep("details");
    } catch {
      setError("Could not verify waitlist status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (strategy: OAuthStrategy) => {
    if (!signUp) return;
    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: redirectUrl || "/onboarding",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "OAuth sign-up failed";
      setError(message);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;
    setError("");
    setLoading(true);

    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string; longMessage?: string }[] };
      const message =
        clerkErr?.errors?.[0]?.longMessage ||
        clerkErr?.errors?.[0]?.message ||
        (err instanceof Error ? err.message : "Something went wrong");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;
    setError("");
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push(redirectUrl || "/onboarding");
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string; longMessage?: string }[] };
      const message =
        clerkErr?.errors?.[0]?.longMessage ||
        clerkErr?.errors?.[0]?.message ||
        (err instanceof Error ? err.message : "Invalid code");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-[15px] text-white placeholder:text-white/30 outline-none transition-all duration-300 focus:border-[#5eb1ff]/50 focus:bg-white/[0.07] focus:ring-1 focus:ring-[#5eb1ff]/20 backdrop-blur-sm";

  const headingText =
    step === "email-gate"
      ? "Get started"
      : step === "details"
        ? "Create your account"
        : "Verify your email";

  const headingItalic =
    step === "email-gate"
      ? "started"
      : step === "details"
        ? "account"
        : "email";

  const headingPrefix =
    step === "email-gate"
      ? "Get "
      : step === "details"
        ? "Create your "
        : "Verify your ";

  const subtitleText =
    step === "email-gate"
      ? "Enter your email to check access."
      : step === "details"
        ? "You're in! Set up your account."
        : `We sent a code to ${email}`;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Full-page dark background */}
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
        {/* Logo + heading */}
        <div className="mb-10 text-center">
          <Link href="/" className="inline-flex items-center gap-0.5 mb-8">
            <Image src={`${A}/clean-icon.svg`} alt="" width={22} height={22} />
            <span className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-jakarta)" }}>lean.ai</span>
          </Link>
          <h1
            className="mb-3 text-[32px] sm:text-[40px] font-semibold tracking-tight text-white leading-tight"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            {headingPrefix}<em className="not-italic" style={{ fontFamily: "var(--font-display)" }}>{headingItalic}</em>
          </h1>
          <p className="text-base text-white/45" style={{ fontFamily: "var(--font-jakarta)" }}>
            {subtitleText}
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
          {error && (
            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300" style={{ fontFamily: "var(--font-jakarta)" }}>
              {error}
            </div>
          )}

          {step === "email-gate" ? (
            <>
              <form onSubmit={handleWaitlistCheck} className="space-y-5">
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
                    autoFocus
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
                    {loading ? "Checking..." : "Continue"}
                  </span>
                </button>
              </form>

              <p className="mt-5 text-center text-xs text-white/30" style={{ fontFamily: "var(--font-jakarta)" }}>
                Don&apos;t have access yet?{" "}
                <Link href="/waitlist" className="font-medium text-[#79c0ff] transition-colors hover:text-[#aed8ff]">
                  Join the waitlist
                </Link>
              </p>
            </>
          ) : step === "details" ? (
            <>
              {/* GitHub OAuth */}
              <button
                type="button"
                onClick={() => handleOAuth("oauth_github")}
                className="mb-5 flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-[15px] font-medium text-white transition-all duration-300 hover:bg-white/10 hover:border-white/15 cursor-pointer"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Continue with GitHub
              </button>

              {/* Divider */}
              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/8" />
                <span className="text-xs font-medium text-white/25" style={{ fontFamily: "var(--font-jakarta)" }}>or</span>
                <div className="h-px flex-1 bg-white/8" />
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-5">
                {/* Locked email display */}
                <div
                  className="rounded-2xl border border-[#5eb1ff]/20 bg-[#5eb1ff]/5 px-5 py-3.5 text-[15px] text-[#79c0ff]"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  {email}
                </div>
                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-white/60" style={{ fontFamily: "var(--font-jakarta)" }}>
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    autoFocus
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
                    {loading ? "Sending code..." : "Create account"}
                  </span>
                </button>
              </form>

              <button
                type="button"
                onClick={() => { setStep("email-gate"); setError(""); setPassword(""); }}
                className="mt-4 w-full text-center text-xs font-medium text-white/30 transition-colors duration-200 hover:text-white/60 cursor-pointer"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                Use a different email
              </button>
            </>
          ) : (
            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label htmlFor="code" className="mb-2 block text-sm font-medium text-white/60" style={{ fontFamily: "var(--font-jakarta)" }}>
                  Verification code
                </label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter the code"
                  autoFocus
                  className={`tracking-[0.3em] text-center ${inputClass}`}
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
                  {loading ? "Verifying..." : "Verify"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => { setStep("details"); setCode(""); setError(""); }}
                className="w-full text-center text-sm font-medium text-white/30 transition-colors duration-200 hover:text-white/60 cursor-pointer"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                Back
              </button>
            </form>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-white/30" style={{ fontFamily: "var(--font-jakarta)" }}>
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-[#79c0ff] transition-colors duration-200 hover:text-[#aed8ff]"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
