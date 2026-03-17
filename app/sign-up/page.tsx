"use client";

import { useSignUp, useUser } from "@clerk/nextjs";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { OAuthStrategy } from "@clerk/types";

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--blue-dark)] border-t-transparent" />
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
    "w-full rounded-xl border border-[var(--blue-border)] bg-[var(--blue-faint)]/30 px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] outline-none transition-all duration-200 focus:border-[var(--blue-dark)] focus:ring-2 focus:ring-[var(--blue-dark)]/10";

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="mb-10 block text-center">
          <span
            className="text-3xl font-bold tracking-tight text-[var(--ink)]"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            clean<span className="text-[var(--blue-dark)]">.</span>
          </span>
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-[var(--blue-border)] bg-white p-8 shadow-[0_0_30px_rgba(174,216,255,0.15)]">
          <h1
            className="mb-1 text-2xl font-normal tracking-tight text-[var(--ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {step === "email-gate"
              ? "Get started"
              : step === "details"
                ? "Create your account"
                : "Verify your email"}
          </h1>
          <p className="mb-6 text-sm text-[var(--ink-muted)]">
            {step === "email-gate"
              ? "Enter your email to check access."
              : step === "details"
                ? "You're in! Set up your account."
                : `We sent a code to ${email}`}
          </p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {step === "email-gate" ? (
            <>
              <form onSubmit={handleWaitlistCheck}>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
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
                  className={`mb-4 ${inputClass}`}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gradient w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {loading ? "Checking..." : "Continue"}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-[var(--ink-muted)]">
                Don&apos;t have access yet?{" "}
                <Link href="/waitlist" className="font-medium text-[var(--blue-dark)] underline underline-offset-2">
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
                className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--ink)] bg-[var(--ink)] px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[var(--ink-secondary)]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Continue with GitHub
              </button>

              {/* Divider */}
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-[var(--blue-border)]" />
                <span className="text-xs font-medium text-[var(--ink-muted)]">or</span>
                <div className="h-px flex-1 bg-[var(--blue-border)]" />
              </div>

              <form onSubmit={handleEmailSubmit}>
                <div className="mb-4 rounded-xl border border-[var(--blue-border)] bg-[var(--blue-faint)]/30 px-4 py-3 text-sm text-[var(--ink)]">
                  {email}
                </div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
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
                  className={`mb-5 ${inputClass}`}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gradient w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {loading ? "Sending code..." : "Create account"}
                </button>
              </form>

              <button
                type="button"
                onClick={() => { setStep("email-gate"); setError(""); setPassword(""); }}
                className="mt-3 w-full text-center text-xs font-medium text-[var(--ink-muted)] transition-colors duration-200 hover:text-[var(--ink)]"
              >
                Use a different email
              </button>
            </>
          ) : (
            <form onSubmit={handleVerify}>
              <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
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
                className={`mb-5 tracking-widest ${inputClass}`}
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-gradient mb-3 w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("details"); setCode(""); setError(""); }}
                className="w-full rounded-xl px-4 py-3 text-sm font-medium text-[var(--ink-muted)] transition-colors duration-200 hover:text-[var(--ink)]"
              >
                Back
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-[var(--ink-muted)]">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-[var(--blue-dark)] underline underline-offset-2 transition-colors duration-200 hover:text-[var(--blue)]"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
