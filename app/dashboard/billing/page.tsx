"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Download,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { PlanPickerDialog } from "@/components/dashboard/plan-picker-dialog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Invoice {
  id: string;
  amount: number;
  status: string;
  date: string;
  pdf: string | null;
}

interface BillingData {
  tier: "free" | "pro" | "team" | "enterprise";
  licenseExpiresAt: string | null;
  licenseRevoked: boolean;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string | null;
  invoices: Invoice[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const },
  }),
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const tierLabels: Record<BillingData["tier"], string> = {
  free: "Free",
  pro: "Pro",
  max: "Max",
  enterprise: "Enterprise",
};

const tierColors: Record<BillingData["tier"], string> = {
  free: "bg-[var(--dash-text-muted)]/20 text-[var(--dash-text-muted)]",
  pro: "bg-[var(--dash-accent)]/15 text-[var(--dash-accent-light)]",
  max: "bg-blue-500/15 text-blue-400",
  enterprise: "bg-purple-500/15 text-purple-400",
};

function TierBadge({ tier }: { tier: BillingData["tier"] }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${tierColors[tier]}`}
    >
      {tierLabels[tier]}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isPaid = status === "paid";
  const isOpen = status === "open";
  const isDraft = status === "draft";

  const style = isPaid
    ? "text-[var(--dash-success)]"
    : isOpen
      ? "text-[var(--dash-warning)]"
      : isDraft
        ? "text-[var(--dash-text-muted)]"
        : "text-[var(--dash-error)]";

  const dotStyle = isPaid
    ? "bg-[var(--dash-success)]"
    : isOpen
      ? "bg-[var(--dash-warning)]"
      : isDraft
        ? "bg-[var(--dash-text-muted)]"
        : "bg-[var(--dash-error)]";

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium capitalize ${style}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyle}`} />
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBilling = useCallback(async () => {
    try {
      const res = await fetch("/api/billing");
      if (res.ok) {
        setData(await res.json());
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
    <div className="w-full max-w-none space-y-8">
      <PlanPickerDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--dash-text)]">Billing</h1>
        <p className="mt-1 text-sm text-[var(--dash-text-muted)]">
          Manage your subscription and view payment history
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-[var(--dash-error)]/30 bg-[var(--dash-error)]/10 px-4 py-3 text-sm text-[var(--dash-error)]">
          {error}
        </div>
      )}

      {/* Current Plan card */}
      <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}>
        <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)]">
          <div className="border-b border-[var(--dash-border)] px-5 py-4">
            <h3 className="text-base font-semibold text-[var(--dash-text)]">
              Current Plan
            </h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--dash-accent)] border-t-transparent" />
            </div>
          ) : (
            <div className="px-5 py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--dash-accent-glow)]">
                    <ShieldCheck className="h-5 w-5 text-[var(--dash-accent-light)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold capitalize text-[var(--dash-text)]">
                        {data?.tier ?? "Free"} Plan
                      </span>
                      {data && <TierBadge tier={data.tier} />}
                    </div>
                    {data?.subscriptionStatus && (
                      <p className="mt-0.5 text-sm text-[var(--dash-text-muted)]">
                        Status:{" "}
                        <span className="font-medium capitalize">
                          {data.subscriptionStatus}
                        </span>
                      </p>
                    )}
                    {data?.licenseExpiresAt && (
                      <p className="mt-0.5 text-sm text-[var(--dash-text-muted)]">
                        Renews:{" "}
                        <span className="font-medium">
                          {formatDate(data.licenseExpiresAt)}
                        </span>
                      </p>
                    )}
                    {data?.licenseRevoked && (
                      <p className="mt-1 text-sm font-medium text-[var(--dash-error)]">
                        License revoked
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {isFree ? (
                    <button
                      onClick={() => setUpgradeOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--dash-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1565d8]"
                    >
                      Upgrade Plan
                    </button>
                  ) : (
                    <button
                      onClick={handleManageSubscription}
                      disabled={portalLoading}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--dash-border)] bg-[var(--dash-surface)] px-4 py-2 text-sm font-medium text-[var(--dash-text)] transition-colors hover:border-[var(--dash-border-strong)] hover:bg-[var(--dash-surface-hover)] disabled:opacity-50"
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
      </motion.div>

      {/* Invoice history */}
      <motion.div custom={1} initial="hidden" animate="visible" variants={fadeUp}>
        <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)]">
          <div className="border-b border-[var(--dash-border)] px-5 py-4">
            <h3 className="text-base font-semibold text-[var(--dash-text)]">
              Payment History
            </h3>
            <p className="mt-0.5 text-sm text-[var(--dash-text-muted)]">
              Recent invoices from your Stripe account
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--dash-accent)] border-t-transparent" />
            </div>
          ) : !data?.invoices.length ? (
            <div className="py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--dash-bg)]">
                <CreditCard className="h-6 w-6 text-[var(--dash-text-muted)]" />
              </div>
              <p className="mt-3 text-sm font-medium text-[var(--dash-text)]">
                No invoices yet
              </p>
              <p className="mt-0.5 text-sm text-[var(--dash-text-muted)]">
                Invoices will appear here once you subscribe to a paid plan
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--dash-border)]">
                    <th className="px-5 py-3 text-left text-sm font-semibold text-[var(--dash-text-muted)]">
                      Date
                    </th>
                    <th className="px-3 py-3 text-left text-sm font-semibold text-[var(--dash-text-muted)]">
                      Amount
                    </th>
                    <th className="px-3 py-3 text-left text-sm font-semibold text-[var(--dash-text-muted)]">
                      Status
                    </th>
                    <th className="w-[80px] px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b border-[var(--dash-border)] transition-colors hover:bg-[var(--dash-surface-hover)]"
                    >
                      <td className="px-5 py-3 text-sm text-[var(--dash-text)]">
                        {formatDate(inv.date)}
                      </td>
                      <td
                        className="px-3 py-3 text-sm font-medium text-[var(--dash-text)]"
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        {formatAmount(inv.amount)}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-3 py-3 text-right">
                        {inv.pdf && (
                          <a
                            href={inv.pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-[var(--dash-border)] px-2.5 py-1 text-xs font-medium text-[var(--dash-text-muted)] transition-colors hover:border-[var(--dash-border-strong)] hover:text-[var(--dash-text)]"
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
      </motion.div>
    </div>
  );
}
