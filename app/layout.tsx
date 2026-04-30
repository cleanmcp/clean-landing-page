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
  display: "swap",
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
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/onboarding"
      appearance={{
        variables: {
          colorPrimary: "#ffffff",
          colorBackground: "#0a0a0a",
          colorInputBackground: "#141414",
          colorInputText: "#fafafa",
          colorText: "#fafafa",
          colorTextSecondary: "#a1a1a1",
          colorNeutral: "#fafafa",
          colorDanger: "#ef4444",
          borderRadius: "0.5rem",
          fontFamily: "var(--font-jakarta), var(--font-geist-sans), system-ui, sans-serif",
        },
        elements: {
          card: "shadow-none border border-[#262626] bg-[#0a0a0a]",
          headerTitle: "font-medium text-[#fafafa]",
          headerSubtitle: "text-[#a1a1a1]",
          formButtonPrimary:
            "bg-white hover:bg-[#e5e5e5] text-black shadow-none",
          formFieldInput:
            "border-[#262626] bg-[#141414] focus:border-[#525252] focus:ring-[#525252]/20 text-[#fafafa]",
          footerActionLink: "text-[#a1a1a1] hover:text-white",
          navbarButton: "text-[#fafafa] hover:bg-[#1a1a1a]",
          navbarButtonIcon: "text-[#fafafa]",
          profileSectionTitle: "text-[#fafafa] font-medium",
          badge: "bg-[#262626] text-[#a1a1a1]",
          userButtonPopoverCard: "bg-[#0a0a0a] border border-[#262626]",
          userButtonPopoverActions: "text-[#fafafa]",
          userButtonPopoverActionButton: "text-[#fafafa] hover:bg-[#1a1a1a]",
          userButtonPopoverFooter: "border-[#262626]",
        },
      }}
    >
      {body}
    </ClerkProvider>
  );
}
