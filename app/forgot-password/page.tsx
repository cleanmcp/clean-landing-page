"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const { signIn, isLoaded } = useSignIn();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1772E7] border-t-transparent" />
      </div>
    );
  }

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

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-[#0a0a0a]">
        <div className="w-full max-w-md text-center">
          <div className="rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#171717] p-8">
            <h1 className="mb-2 text-xl font-semibold text-[#fafafa]">Password reset</h1>
            <p className="mb-6 text-sm text-[#a1a1aa]">
              Your password has been updated successfully.
            </p>
            <Link
              href="/sign-in"
              className="inline-block rounded-xl bg-[#1772E7] px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.01] hover:shadow-md"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-[#0a0a0a]">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 block text-center">
          <span className="text-3xl font-normal tracking-tight text-[#fafafa]" style={{ fontFamily: "var(--font-display)" }}>
            Clean
          </span>
        </Link>

        <div className="rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#171717] p-8">
          <h1 className="mb-1 text-xl font-semibold text-[#fafafa]">
            Reset password
          </h1>
          <p className="mb-6 text-sm text-[#a1a1aa]">
            {step === "email"
              ? "Enter your email to receive a reset code."
              : "Enter the code sent to your email and your new password."}
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={handleSendCode}>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#a1a1aa]">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mb-4 w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#0a0a0a] px-4 py-3 text-sm text-[#fafafa] outline-none transition-all duration-200 focus:ring-2 focus:ring-[#1772E7]"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#1772E7] px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.01] hover:shadow-md disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send reset code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset}>
              <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-[#a1a1aa]">
                Reset code
              </label>
              <input
                id="code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="mb-4 w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#0a0a0a] px-4 py-3 text-sm text-[#fafafa] outline-none transition-all duration-200 focus:ring-2 focus:ring-[#1772E7]"
              />
              <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-[#a1a1aa]">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="mb-4 w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#0a0a0a] px-4 py-3 text-sm text-[#fafafa] outline-none transition-all duration-200 focus:ring-2 focus:ring-[#1772E7]"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#1772E7] px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.01] hover:shadow-md disabled:opacity-60"
              >
                {loading ? "Resetting…" : "Reset password"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-[#a1a1aa]">
          Remember your password?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-[#1772E7] underline underline-offset-2 transition-colors duration-200 hover:text-[#5EB1FF]"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
