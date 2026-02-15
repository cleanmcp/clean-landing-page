"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4"
      style={{ background: "var(--cream)" }}
    >
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-(--ink) border-t-transparent" />
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/onboarding"
        signUpFallbackRedirectUrl="/onboarding"
      />
    </div>
  );
}
