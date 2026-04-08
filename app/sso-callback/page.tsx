"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4"
      style={{ background: "#0a0a0a" }}
    >
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1772E7] border-t-transparent" />
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/onboarding"
        signInForceRedirectUrl="/dashboard"
        signUpForceRedirectUrl="/onboarding"
      />
    </div>
  );
}
