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

interface PlanOption {
  id: "pro" | "max" | "enterprise";
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

const PLANS: PlanOption[] = [
  {
    id: "pro",
    name: "Pro",
    price: "$14.99",
    period: "/mo",
    description: "For growing teams that need more power.",
    features: ["15 repositories", "1,000 searches/day", "5 team members", "Priority indexing"],
    highlighted: true,
  },
  {
    id: "max",
    name: "Max",
    price: "$29.99",
    period: "/mo",
    description: "For teams that need everything.",
    features: [
      "Unlimited repositories",
      "10,000 searches/day",
      "10 team members",
      "Self-hosting option",
      "SLA",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Dedicated infrastructure for your org.",
    features: ["Unlimited everything", "SSO & audit logs", "Dedicated support"],
  },
];

export function PlanPickerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(plan: PlanOption) {
    if (plan.id === "enterprise") {
      window.open("mailto:hello@tryclean.ai", "_self");
      return;
    }

    setLoadingPlan(plan.id);
    setError(null);

    const priceId =
      plan.id === "pro"
        ? process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
        : process.env.NEXT_PUBLIC_STRIPE_MAX_PRICE_ID;

    if (!priceId) {
      setError(`${plan.name} plan is not configured. Contact support.`);
      setLoadingPlan(null);
      return;
    }

    try {
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
      <DialogContent className="sm:max-w-[750px]">
        <DialogHeader>
          <DialogTitle>Upgrade your plan</DialogTitle>
          <DialogDescription>
            Choose a plan that fits your team.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-lg border p-4 ${
                plan.highlighted
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-2.5 left-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  Popular
                </span>
              )}
              <div className="mb-3">
                <h3 className="text-sm font-semibold">{plan.name}</h3>
                <div className="mt-1 flex items-baseline gap-0.5">
                  <span className="text-2xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-muted-foreground">
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <ul className="mb-4 flex-1 space-y-1.5">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                size="sm"
                variant={plan.highlighted ? "default" : "outline"}
                className="w-full"
                disabled={loadingPlan !== null}
                onClick={() => handleSelect(plan)}
              >
                {loadingPlan === plan.id ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Redirecting…
                  </>
                ) : plan.id === "enterprise" ? (
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
