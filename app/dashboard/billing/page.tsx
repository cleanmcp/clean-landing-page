"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Download,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

interface Invoice {
  id: string;
  amount: number;
  status: string;
  date: string;
  pdf: string | null;
}

interface BillingData {
  tier: "free" | "pro" | "enterprise";
  licenseExpiresAt: string | null;
  licenseRevoked: boolean;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string | null;
  invoices: Invoice[];
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAmount(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function TierBadge({ tier }: { tier: BillingData["tier"] }) {
  const styles: Record<BillingData["tier"], string> = {
    free: "bg-[var(--cream-dark)] text-[var(--ink-muted)]",
    pro: "bg-[var(--accent)]/10 text-[var(--accent)]",
    enterprise: "bg-purple-50 text-purple-700",
  };
  const labels: Record<BillingData["tier"], string> = {
    free: "Free",
    pro: "Pro",
    enterprise: "Enterprise",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${styles[tier]}`}
    >
      {labels[tier]}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isPaid = status === "paid";
  const isOpen = status === "open";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
        isPaid
          ? "bg-green-50 text-green-700"
          : isOpen
            ? "bg-amber-50 text-amber-700"
            : "bg-[var(--cream-dark)] text-[var(--ink-muted)]"
      }`}
    >
      {status}
    </span>
  );
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBilling = useCallback(async () => {
    try {
      const res = await fetch("/api/billing");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error || "Failed to load billing information");
      }
    } catch {
      setError("Network error — could not load billing information");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  async function handleManageSubscription() {
    setPortalLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error || "Failed to open billing portal");
      }
    } catch {
      setError("Network error — could not open billing portal");
    } finally {
      setPortalLoading(false);
    }
  }

  const isFree = !data || data.tier === "free";

  return (
    <div className="max-w-3xl space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-medium text-[var(--ink)]">Billing</h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Manage your subscription and view payment history
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Current Plan card */}
      <div className="overflow-hidden rounded-lg border border-[var(--cream-dark)] bg-white">
        <div className="border-b border-[var(--cream-dark)] px-5 py-4">
          <h3 className="text-sm font-semibold text-[var(--ink)]">
            Current Plan
          </h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          </div>
        ) : (
          <div className="px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/10">
                  <ShieldCheck className="h-5 w-5 text-[var(--accent)]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-[var(--ink)] capitalize">
                      {data?.tier ?? "Free"} Plan
                    </span>
                    {data && <TierBadge tier={data.tier} />}
                  </div>
                  {data?.subscriptionStatus && (
                    <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                      Subscription:{" "}
                      <span className="font-medium capitalize">
                        {data.subscriptionStatus}
                      </span>
                    </p>
                  )}
                  {data?.licenseExpiresAt && (
                    <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                      License expires:{" "}
                      <span className="font-medium">
                        {formatDate(data.licenseExpiresAt)}
                      </span>
                    </p>
                  )}
                  {data?.licenseRevoked && (
                    <p className="mt-1 text-xs font-medium text-red-600">
                      License revoked
                    </p>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0">
                {isFree ? (
                  <a
                    href="mailto:hello@tryclean.ai?subject=Upgrade to Pro"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-secondary)]"
                  >
                    Upgrade to Pro
                  </a>
                ) : (
                  <button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--cream-dark)] bg-white px-4 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--cream-dark)] disabled:opacity-50"
                  >
                    {portalLoading ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Opening...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-3.5 w-3.5" />
                        Manage Subscription
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invoices table */}
      <div className="overflow-hidden rounded-lg border border-[var(--cream-dark)] bg-white">
        <div className="border-b border-[var(--cream-dark)] px-5 py-4">
          <h3 className="text-sm font-semibold text-[var(--ink)]">
            Payment History
          </h3>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            Recent invoices from your Stripe account
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          </div>
        ) : !data?.invoices.length ? (
          <div className="py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--cream-dark)]">
              <CreditCard className="h-6 w-6 text-[var(--ink-muted)]" />
            </div>
            <p className="mt-3 text-sm font-medium text-[var(--ink)]">
              No invoices yet
            </p>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
              Invoices will appear here once you subscribe to a paid plan
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--cream-dark)]">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-[var(--ink-muted)]">
                    Date
                  </th>
                  <th className="px-2 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-[var(--ink-muted)]">
                    Amount
                  </th>
                  <th className="px-2 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-[var(--ink-muted)]">
                    Status
                  </th>
                  <th className="w-[80px] px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-[var(--cream-dark)] transition-colors hover:bg-[var(--cream)]"
                  >
                    <td className="px-5 py-3 text-sm text-[var(--ink)]">
                      {formatDate(inv.date)}
                    </td>
                    <td className="px-2 py-3 text-sm font-medium text-[var(--ink)]">
                      {formatAmount(inv.amount)}
                    </td>
                    <td className="px-2 py-3">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-2 py-3 text-right">
                      {inv.pdf && (
                        <a
                          href={inv.pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-[var(--cream-dark)] px-2.5 py-1 text-xs font-medium text-[var(--ink-muted)] transition-colors hover:bg-[var(--cream-dark)] hover:text-[var(--ink)]"
                        >
                          <Download className="h-3 w-3" />
                          PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
