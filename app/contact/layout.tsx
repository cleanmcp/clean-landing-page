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

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
