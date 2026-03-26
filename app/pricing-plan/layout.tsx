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

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.tryclean.ai" },
    { "@type": "ListItem", position: 2, name: "Pricing", item: "https://www.tryclean.ai/pricing-plan" },
  ],
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
