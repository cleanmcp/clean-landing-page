"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Client button that hits /api/billing/checkout and redirects to Stripe.
 * Extracted so the parent page can stay server-rendered.
 */
export function SubscribeButton({
  plan,
  highlighted,
}: {
  plan: "starter" | "pro";
  highlighted: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (res.status === 401) {
        router.push(`/sign-in?redirect=/pricing&plan=${plan}`);
        return;
      }
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Checkout failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className={
          "block w-full rounded-md py-2.5 text-center text-sm font-medium transition " +
          (highlighted
            ? "bg-white text-zinc-950 hover:bg-zinc-200 disabled:opacity-60"
            : "border border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-60")
        }
      >
        {loading ? "Redirecting…" : `Start ${plan === "starter" ? "Starter" : "Pro"}`}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
