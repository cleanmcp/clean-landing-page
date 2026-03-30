import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Clean",
  description:
    "Learn how Clean AI Labs, Inc. collects, uses, and protects your information.",
  alternates: {
    canonical: "https://www.tryclean.ai/privacy",
  },
  openGraph: {
    title: "Privacy Policy — Clean",
    description:
      "Learn how Clean AI Labs, Inc. collects, uses, and protects your information.",
    url: "https://www.tryclean.ai/privacy",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.tryclean.ai" },
    { "@type": "ListItem", position: 2, name: "Privacy Policy", item: "https://www.tryclean.ai/privacy" },
  ],
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
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
