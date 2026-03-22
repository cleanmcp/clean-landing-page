import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Clean",
  description:
    "Simple, transparent pricing for Clean. Start free in the cloud with 3 repos and 50 searches/day. Scale to Pro or Max when you're ready.",
  alternates: {
    canonical: "https://www.tryclean.ai/pricing-plan",
  },
  openGraph: {
    title: "Pricing — Clean",
    description:
      "Simple, transparent pricing. Start free in the cloud. Scale when you're ready.",
    url: "https://www.tryclean.ai/pricing-plan",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
