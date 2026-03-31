import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beta Service Agreement — Clean",
  description:
    "Beta Service Agreement for the Clean platform by Clean AI Labs, Inc.",
  alternates: {
    canonical: "https://www.tryclean.ai/beta-agreement",
  },
  openGraph: {
    title: "Beta Service Agreement — Clean",
    description: "Beta Service Agreement for the Clean platform by Clean AI Labs, Inc.",
    url: "https://www.tryclean.ai/beta-agreement",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.tryclean.ai" },
    { "@type": "ListItem", position: 2, name: "Beta Service Agreement", item: "https://www.tryclean.ai/beta-agreement" },
  ],
};

export default function BetaAgreementLayout({ children }: { children: React.ReactNode }) {
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
