import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — Clean",
  description:
    "Get in touch with the Clean team. Questions about our MCP server for AI coding agents? We'd love to hear from you.",
  alternates: {
    canonical: "https://www.tryclean.ai/contact",
  },
  openGraph: {
    title: "Contact — Clean",
    description: "Get in touch with the Clean team.",
    url: "https://www.tryclean.ai/contact",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.tryclean.ai" },
    { "@type": "ListItem", position: 2, name: "Contact", item: "https://www.tryclean.ai/contact" },
  ],
};

export default function ContactLayout({
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
