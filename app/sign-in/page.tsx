"use client";

import { useSignIn, useUser } from "@clerk/nextjs";
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

export default function SignInPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const { signIn, isLoaded, setActive } = useSignIn();
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userLoaded && user) {
      router.push("/dashboard");
    }
  }, [userLoaded, user, router]);

  if (!isLoaded || !userLoaded) return <Spinner />;
  if (user) return <Spinner />;

  const handleOAuth = async (strategy: OAuthStrategy) => {
    if (!signIn) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: redirectUrl || "/dashboard",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "OAuth sign-in failed";
      setError(message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    setError("");
    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push(redirectUrl || "/dashboard");
      } else {
        setError("Sign-in incomplete. Please try again.");
      }
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
            Welcome back
          </h1>
          <p className="mb-6 text-sm text-[var(--ink-muted)]">
            Sign in to your account to continue.
          </p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

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

          {/* Email / Password form */}
          <form onSubmit={handleSubmit}>
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
              className="mb-4 w-full rounded-xl border border-[var(--blue-border)] bg-[var(--blue-faint)]/30 px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] outline-none transition-all duration-200 focus:border-[var(--blue-dark)] focus:ring-2 focus:ring-[var(--blue-dark)]/10"
            />
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-[var(--ink)]">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-[var(--blue-dark)] transition-colors duration-200 hover:text-[var(--blue)]"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="mb-5 w-full rounded-xl border border-[var(--blue-border)] bg-[var(--blue-faint)]/30 px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] outline-none transition-all duration-200 focus:border-[var(--blue-dark)] focus:ring-2 focus:ring-[var(--blue-dark)]/10"
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-gradient w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--ink-muted)]">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-[var(--blue-dark)] underline underline-offset-2 transition-colors duration-200 hover:text-[var(--blue)]"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
