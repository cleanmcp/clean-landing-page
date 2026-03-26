import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join the Waitlist — Clean",
  description:
    "Get early access to Clean — the MCP server that syncs context across all your AI coding agents and reduces token usage by up to 70%.",
  alternates: {
    canonical: "https://www.tryclean.ai/waitlist",
  },
  openGraph: {
    title: "Join the Waitlist — Clean",
    description:
      "Get early access to Clean and start saving tokens across all your AI agents.",
    url: "https://www.tryclean.ai/waitlist",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.tryclean.ai" },
    { "@type": "ListItem", position: 2, name: "Waitlist", item: "https://www.tryclean.ai/waitlist" },
  ],
};

export default function WaitlistLayout({
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
