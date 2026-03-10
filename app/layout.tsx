import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import IconSprite from "@/components/IconSprite";
import { ClerkProvider } from '@clerk/nextjs'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Clean - One MCP. Every Agent Synced.",
  description: "Stop burning tokens. Work with your team. One MCP to sync all your AI agents with 70% less spend.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const body = (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}
      >
        <IconSprite />
        {children}
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
          colorPrimary: "#09463f",
          colorBackground: "#F5F3EE",
          colorInputBackground: "#ffffff",
          colorInputText: "#1A1A1A",
          colorText: "#1A1A1A",
          colorTextSecondary: "#6B6B6B",
          colorNeutral: "#1A1A1A",
          colorDanger: "#dc2626",
          borderRadius: "0.5rem",
          fontFamily: "var(--font-geist-sans)",
        },
        elements: {
          card: "shadow-none border border-[#EAE6DE] bg-[#F5F3EE]",
          headerTitle: "font-medium text-[#1A1A1A]",
          headerSubtitle: "text-[#6B6B6B]",
          formButtonPrimary:
            "bg-[#09463f] hover:bg-[#0d5a51] text-white shadow-none",
          formFieldInput:
            "border-[#EAE6DE] bg-white focus:border-[#09463f] focus:ring-[#09463f]/20",
          footerActionLink: "text-[#09463f] hover:text-[#0d5a51]",
          navbarButton: "text-[#1A1A1A] hover:bg-[#EAE6DE]",
          navbarButtonIcon: "text-[#09463f]",
          profileSectionTitle: "text-[#1A1A1A] font-medium",
          badge: "bg-[#09463f]/10 text-[#09463f]",
        },
      }}
    >
      {body}
    </ClerkProvider>
  );
}
