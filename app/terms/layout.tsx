import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Clean",
  description:
    "Terms of Service for the Clean platform by Clean AI Labs, Inc.",
  alternates: {
    canonical: "https://www.tryclean.ai/terms",
  },
  openGraph: {
    title: "Terms of Service — Clean",
    description: "Terms of Service for the Clean platform by Clean AI Labs, Inc.",
    url: "https://www.tryclean.ai/terms",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.tryclean.ai" },
    { "@type": "ListItem", position: 2, name: "Terms of Service", item: "https://www.tryclean.ai/terms" },
  ],
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
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
