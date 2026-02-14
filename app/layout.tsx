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

  return <ClerkProvider>{body}</ClerkProvider>;
}
