"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-2xl font-bold text-[var(--dash-text)]">
        Something went wrong
      </h2>
      <p className="text-sm text-[var(--dash-text-muted)]">
        {error.message || "An unexpected error occurred"}
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-[#1772E7] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1565d0]"
      >
        Try again
      </button>
    </div>
  );
}
