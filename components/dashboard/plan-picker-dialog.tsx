"use client";

import { useState } from "react";
import { Check, Loader2, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Cloud = search / indexing product.  Agent = the Electron desktop app.
// Both share one Stripe account + webhook but are distinct products in our DB.
type Product = "cloud" | "agent";

interface PlanOption {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  action: "cloud-checkout" | "agent-checkout" | "contact";
}

const CLOUD_PLANS: PlanOption[] = [
  {
    id: "pro",
    name: "Pro",
    price: "$20",
    period: "/mo",
    description: "For growing teams that need more power.",
    features: ["15 repositories", "500 searches/mo", "5 team members", "Priority indexing"],
    highlighted: true,
    action: "cloud-checkout",
  },
  {
    id: "max",
    name: "Max",
    price: "$100",
    period: "/mo",
    description: "For teams that need everything.",
    features: [
      "Unlimited repositories",
      "5,000 searches/mo",
      "10 team members",
      "Self-hosting option",
      "SLA",
    ],
    action: "cloud-checkout",
  },
  {
    id: "cloud-enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Dedicated infrastructure for your org.",
    features: ["Unlimited everything", "SSO & audit logs", "Dedicated support"],
    action: "contact",
  },
];

const AGENT_PLANS: PlanOption[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$15",
    period: "/mo",
    description: "For individual tinkering and light daily work.",
    features: [
      "1.5M billable tokens / month",
      "All Clean Agent features",
      "Single user",
      "BYOK — unmetered",
    ],
    action: "agent-checkout",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$50",
    period: "/mo",
    description: "For daily drivers and larger tasks.",
    features: [
      "7M billable tokens / month",
      "Priority model access",
      "Larger context windows",
      "BYOK — unmetered",
    ],
    highlighted: true,
    action: "agent-checkout",
  },
  {
    id: "agent-enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Custom allowance, SSO, invoicing.",
    features: ["Unlimited tokens", "SSO / SAML", "Invoicing + net-30", "Dedicated support"],
    action: "contact",
  },
];

export function PlanPickerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [product, setProduct] = useState<Product>("cloud");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const plans = product === "cloud" ? CLOUD_PLANS : AGENT_PLANS;

  async function handleSelect(plan: PlanOption) {
    setError(null);

    if (plan.action === "contact") {
      window.open(
        product === "agent"
          ? "mailto:sales@tryclean.ai?subject=Clean%20Agent%20Enterprise"
          : "mailto:hello@tryclean.ai",
        "_self",
      );
      return;
    }

    setLoadingPlan(plan.id);

    try {
      if (plan.action === "agent-checkout") {
        // Agent checkout uses the plan name (starter/pro) — the server maps it
        // to a Stripe price ID via env vars.
        const res = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: plan.id }),
        });
        if (res.ok) {
          const { url } = await res.json();
          window.open(url, "_self");
        } else {
          const json = await res.json().catch(() => ({}));
          setError(json.error || "Failed to start checkout");
          setLoadingPlan(null);
        }
        return;
      }

      // Cloud checkout uses priceId directly (existing flow).
      const priceId =
        plan.id === "pro"
          ? process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
          : process.env.NEXT_PUBLIC_STRIPE_MAX_PRICE_ID;

      if (!priceId) {
        setError(`${plan.name} plan is not configured. Contact support.`);
        setLoadingPlan(null);
        return;
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      if (res.ok) {
        const { url } = await res.json();
        window.open(url, "_self");
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error || "Failed to start checkout");
        setLoadingPlan(null);
      }
    } catch {
      setError("Network error — could not start checkout");
      setLoadingPlan(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark text-foreground sm:max-w-[780px]">
        <DialogHeader>
          <DialogTitle>Upgrade your plan</DialogTitle>
          <DialogDescription>
            Choose a plan that fits your team.
          </DialogDescription>
        </DialogHeader>

        {/* Product toggle — Cloud (search/indexing) vs Agent (desktop app).
            Both share one Stripe account, but subscriptions are tracked
            separately in our DB. */}
        <div className="inline-flex self-start rounded-lg border border-border/60 bg-muted/30 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setProduct("cloud")}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              product === "cloud"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Clean Cloud
          </button>
          <button
            type="button"
            onClick={() => setProduct("agent")}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              product === "agent"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Clean Agent
          </button>
        </div>

        <p className="-mt-1 text-xs text-muted-foreground">
          {product === "cloud"
            ? "Search and indexing for your codebase."
            : "Desktop command center for AI coding. Required to unlock the Clean Agent app."}
        </p>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-xl border-2 p-5 transition-all ${
                plan.highlighted
                  ? "border-primary bg-primary/5 shadow-[0_0_24px_-4px] shadow-primary/20"
                  : "border-border/60 bg-muted/30"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  Popular
                </span>
              )}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground">{plan.name}</h3>
                <div className="mt-1.5 flex items-baseline gap-0.5">
                  <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-muted-foreground">
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <ul className="mb-5 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-xs text-foreground/70"
                  >
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                size="sm"
                variant={plan.highlighted ? "default" : "secondary"}
                className="w-full"
                disabled={loadingPlan !== null}
                onClick={() => handleSelect(plan)}
              >
                {loadingPlan === plan.id ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Redirecting…
                  </>
                ) : plan.action === "contact" ? (
                  <>
                    <Mail className="mr-1.5 h-3.5 w-3.5" />
                    Contact Us
                  </>
                ) : (
                  `Subscribe to ${plan.name}`
                )}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
