import Link from "next/link";
import { AGENT_TIERS } from "@/lib/agent-tiers";
import { SubscribeButton } from "./subscribe-button";

export const metadata = {
  title: "Pricing — Clean Agent",
  description:
    "Clean Agent pricing. Starter at $15/mo, Pro at $50/mo, Enterprise on request.",
};

/**
 * Agent-product pricing page. Separate from /pricing-plan (the cloud/search
 * product). This is the URL the Electron PaywallScreen CTAs open in the
 * default browser.
 *
 * Design follows the agent app: zinc palette, no colored gradients, Geist
 * Mono for the brand mark.
 */
export default function AgentPricingPage({
  searchParams,
}: {
  searchParams: { canceled?: string; plan?: string };
}) {
  const canceled = searchParams?.canceled === "1";

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link
          href="/"
          className="font-mono text-lg font-medium tracking-tight text-white"
        >
          Clean
        </Link>
        <Link
          href="/dashboard"
          className="text-sm text-zinc-400 transition hover:text-zinc-100"
        >
          Dashboard
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Clean Agent
          </h1>
          <p className="mt-4 text-zinc-400">
            A desktop command center for AI-driven coding. Pick a plan to
            unlock the app. Bring your own model keys to go unmetered.
          </p>
          {canceled && (
            <p className="mt-6 inline-block rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
              Checkout canceled — no charge was made.
            </p>
          )}
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <TierCard
            tierKey="starter"
            highlighted={false}
          />
          <TierCard
            tierKey="pro"
            highlighted={true}
          />
          <TierCard
            tierKey="enterprise"
            highlighted={false}
          />
        </div>

        <p className="mt-12 text-center text-xs text-zinc-500">
          Hard cut-off at 100% of monthly allowance. Upgrade or wait for
          renewal. BYOK users are not metered.
        </p>
      </section>
    </main>
  );
}

function TierCard({
  tierKey,
  highlighted,
}: {
  tierKey: keyof typeof AGENT_TIERS;
  highlighted: boolean;
}) {
  const tier = AGENT_TIERS[tierKey];
  const priceLabel =
    tier.priceUsd === null ? "Custom" : `$${tier.priceUsd}`;
  const suffix = tier.priceUsd === null ? "tailored" : "/ month";

  return (
    <div
      className={
        "flex flex-col rounded-xl border p-6 " +
        (highlighted
          ? "border-zinc-400 bg-zinc-900"
          : "border-zinc-800 bg-zinc-900/50")
      }
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-white">{tier.label}</h2>
        {highlighted && (
          <span className="rounded-full border border-zinc-600 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-300">
            Most popular
          </span>
        )}
      </div>
      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold text-white">{priceLabel}</span>
        <span className="text-sm text-zinc-500">{suffix}</span>
      </div>
      <p className="mt-3 text-sm text-zinc-400">
        {tier.tokensPerMonth === -1
          ? "Unlimited tokens"
          : `${(tier.tokensPerMonth / 1_000_000).toLocaleString()}M billable tokens / month`}
      </p>
      <ul className="mt-6 space-y-2 text-sm text-zinc-300">
        {tier.features.map((feat) => (
          <li key={feat} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-zinc-500" />
            <span>{feat}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-8">
        {tierKey === "enterprise" ? (
          <a
            href="mailto:sales@tryclean.ai?subject=Clean%20Agent%20Enterprise"
            className="block w-full rounded-md border border-zinc-700 bg-zinc-900 py-2.5 text-center text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Contact sales
          </a>
        ) : (
          <SubscribeButton plan={tierKey} highlighted={highlighted} />
        )}
      </div>
    </div>
  );
}
