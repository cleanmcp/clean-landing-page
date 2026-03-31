import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import IconSprite from "@/components/IconSprite";
import PostHogProvider from "@/components/PostHogProvider";
import { ClerkProvider } from '@clerk/nextjs'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const zodiak = localFont({
  src: "../public/fonts/zodiak-variable.woff2",
  variable: "--font-display",
  weight: "100 900",
  style: "normal",
  display: "optional",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.tryclean.ai"),
  title: "Clean - One MCP. Every Agent Synced.",
  description:
    "Clean is an MCP server that indexes your codebase and syncs context across all your AI coding agents — Claude, Cursor, Codex, Windsurf — reducing token usage by up to 70%.",
  alternates: {
    canonical: "https://www.tryclean.ai",
  },
  openGraph: {
    title: "Clean - One MCP. Every Agent Synced.",
    description:
      "One MCP server to sync context across all your AI coding agents. 70% less token spend, 3x faster sessions.",
    url: "https://www.tryclean.ai",
    siteName: "Clean",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clean - One MCP. Every Agent Synced.",
    description:
      "One MCP server to sync context across all your AI coding agents. 70% less token spend, 3x faster sessions.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.tryclean.ai/#organization",
        name: "Clean",
        url: "https://www.tryclean.ai",
        description:
          "Clean builds an MCP server that indexes codebases and syncs context across AI coding agents, reducing token usage by up to 70%.",
        logo: {
          "@type": "ImageObject",
          url: "https://www.tryclean.ai/landing/clean-icon.svg",
        },
        sameAs: ["https://www.linkedin.com/company/cleanailabs"],
        contactPoint: {
          "@type": "ContactPoint",
          email: "hello@tryclean.ai",
          contactType: "customer support",
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://www.tryclean.ai/#website",
        url: "https://www.tryclean.ai",
        name: "Clean",
        publisher: { "@id": "https://www.tryclean.ai/#organization" },
      },
    ],
  };

  const body = (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${zodiak.variable} ${plusJakartaSans.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <IconSprite />
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );

  // ClerkProvider requires the publishable key which is only available at
  // runtime. During static generation (e.g. /_not-found) the key is missing,
  // so we render without the provider to avoid crashing the build.
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return body;
  }

  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#1772E7",
          colorBackground: "#111827",
          colorInputBackground: "#0B1120",
          colorInputText: "#E2E8F0",
          colorText: "#E2E8F0",
          colorTextSecondary: "#7C8DA4",
          colorNeutral: "#E2E8F0",
          colorDanger: "#ef4444",
          borderRadius: "0.5rem",
          fontFamily: "var(--font-jakarta), var(--font-geist-sans), system-ui, sans-serif",
        },
        elements: {
          card: "shadow-none border border-[#1E2A3A] bg-[#111827]",
          headerTitle: "font-medium text-[#E2E8F0]",
          headerSubtitle: "text-[#7C8DA4]",
          formButtonPrimary:
            "bg-[#1772E7] hover:bg-[#1565d8] text-white shadow-none",
          formFieldInput:
            "border-[#1E2A3A] bg-[#0B1120] focus:border-[#1772E7] focus:ring-[#1772E7]/20 text-[#E2E8F0]",
          footerActionLink: "text-[#1772E7] hover:text-[#5EB1FF]",
          navbarButton: "text-[#E2E8F0] hover:bg-[#1A2236]",
          navbarButtonIcon: "text-[#1772E7]",
          profileSectionTitle: "text-[#E2E8F0] font-medium",
          badge: "bg-[#1772E7]/10 text-[#5EB1FF]",
          userButtonPopoverCard: "bg-[#111827] border border-[#1E2A3A]",
          userButtonPopoverActions: "text-[#E2E8F0]",
          userButtonPopoverActionButton: "text-[#E2E8F0] hover:bg-[#1A2236]",
          userButtonPopoverFooter: "border-[#1E2A3A]",
        },
      }}
    >
      {body}
    </ClerkProvider>
  );
}
