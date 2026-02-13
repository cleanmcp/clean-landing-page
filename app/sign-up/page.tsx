"use client";

import { useSignUp } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OAuthStrategy } from "@clerk/types";

export default function SignUpPage() {
  const { signUp, isLoaded, setActive } = useSignUp();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"details" | "verify">("details");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--cream)" }}>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-(--ink) border-t-transparent" />
      </div>
    );
  }

  const handleOAuth = async (strategy: OAuthStrategy) => {
    if (!signUp) return;
    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
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
      await signUp.create({ emailAddress: email });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
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
        router.push("/dashboard");
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid code";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--cream)" }}
    >
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 block text-center">
          <span
            className="text-3xl font-normal tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Clean
          </span>
        </Link>

        <div
          className="rounded-2xl border p-8"
          style={{
            background: "var(--cream-light)",
            borderColor: "var(--cream-dark)",
          }}
        >
          <h1 className="mb-1 text-xl font-semibold" style={{ color: "var(--ink)" }}>
            Create your account
          </h1>
          <p className="mb-6 text-sm" style={{ color: "var(--ink-muted)" }}>
            {step === "details"
              ? "Get started with Clean today."
              : `We sent a code to ${email}`}
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {step === "details" ? (
            <>
              <button
                type="button"
                onClick={() => handleOAuth("oauth_github")}
                className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.01] hover:shadow-md"
                style={{
                  background: "var(--ink)",
                  color: "var(--cream)",
                  borderColor: "var(--ink)",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Continue with GitHub
              </button>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1" style={{ background: "var(--cream-dark)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--ink-muted)" }}>
                  or
                </span>
                <div className="h-px flex-1" style={{ background: "var(--cream-dark)" }} />
              </div>

              <form onSubmit={handleEmailSubmit}>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium"
                  style={{ color: "var(--ink-light)" }}
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mb-4 w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-2"
                  style={{
                    background: "var(--cream)",
                    borderColor: "var(--cream-dark)",
                    color: "var(--ink)",
                    // @ts-expect-error CSS custom property
                    "--tw-ring-color": "var(--accent)",
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.01] hover:shadow-md disabled:opacity-60"
                  style={{
                    background: "var(--accent)",
                    color: "var(--cream)",
                  }}
                >
                  {loading ? "Sending code…" : "Continue with email"}
                </button>
              </form>

            </>
          ) : (
            <form onSubmit={handleVerify}>
              <label
                htmlFor="code"
                className="mb-1.5 block text-sm font-medium"
                style={{ color: "var(--ink-light)" }}
              >
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
                className="mb-4 w-full rounded-xl border px-4 py-3 text-sm tracking-widest outline-none transition-all duration-200 focus:ring-2"
                style={{
                  background: "var(--cream)",
                  borderColor: "var(--cream-dark)",
                  color: "var(--ink)",
                  // @ts-expect-error CSS custom property
                  "--tw-ring-color": "var(--accent)",
                }}
              />
              <button
                type="submit"
                disabled={loading}
                className="mb-3 w-full rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.01] hover:shadow-md disabled:opacity-60"
                style={{
                  background: "var(--accent)",
                  color: "var(--cream)",
                }}
              >
                {loading ? "Verifying…" : "Verify"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("details");
                  setCode("");
                  setError("");
                }}
                className="w-full rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200"
                style={{ color: "var(--ink-muted)" }}
              >
                ← Back
              </button>
            </form>
          )}

          {/* Always render captcha mount point so Clerk can find it */}
          <div id="clerk-captcha" className="mt-3" />
        </div>

        <p className="mt-6 text-center text-sm" style={{ color: "var(--ink-muted)" }}>
          Already have an account?{" "}
          <a
            href="/sign-in"
            className="font-medium underline underline-offset-2 transition-colors duration-200 hover:text-(--ink)"
            style={{ color: "var(--accent)" }}
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
