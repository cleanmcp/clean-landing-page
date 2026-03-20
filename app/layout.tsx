import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
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
        className={`${geistSans.variable} ${geistMono.variable} ${zodiak.variable} ${plusJakartaSans.variable} antialiased`}
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
