import { DollarSign } from "lucide-react";

export default function BillingPage() {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-medium text-[var(--ink)]">
        Billing & Usage
      </h2>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-[var(--cream-dark)] bg-white p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
            Current Period
          </p>
          <p className="text-2xl font-bold text-[var(--ink)]">$24.50</p>
          <p className="text-xs text-[var(--ink-muted)]">
            Feb 1 - Feb 28, 2026
          </p>
        </div>
        <div className="rounded-lg border border-[var(--cream-dark)] bg-white p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
            Tokens Used
          </p>
          <p className="text-2xl font-bold text-[var(--ink)]">1.2M</p>
          <p className="text-xs text-[var(--ink-muted)]">
            70% less than without Clean
          </p>
        </div>
        <div className="rounded-lg border border-[var(--cream-dark)] bg-white p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
            Active Agents
          </p>
          <p className="text-2xl font-bold text-[var(--ink)]">5</p>
          <p className="text-xs text-[var(--ink-muted)]">All synced</p>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--cream-dark)] bg-white p-6">
        <h3 className="mb-4 text-lg font-medium text-[var(--ink)]">
          Payment Method
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-14 items-center justify-center rounded border border-[var(--cream-dark)] bg-[var(--cream)]">
            <DollarSign className="h-5 w-5 text-[var(--ink-muted)]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--ink)]">
              •••• •••• •••• 4242
            </p>
            <p className="text-xs text-[var(--ink-muted)]">
              Expires 12/2027
            </p>
          </div>
          <button className="ml-auto rounded-lg border border-[var(--cream-dark)] px-3 py-1.5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--cream-dark)]">
            Update
          </button>
        </div>
      </div>
    </div>
  );
}

