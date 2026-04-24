import React from "react";
import fs from "node:fs";
import pathMod from "node:path";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import LandingNavbar from "@/components/landing/LandingNavbar";
import { HeroAnimatedWrapper, HeroRotatingText } from "@/components/landing/HeroContent";
import ScrollRevealText from "@/components/landing/ScrollRevealText";
import OrbitSection from "@/components/landing/OrbitSection";
import DifferencesSection from "@/components/landing/DifferencesSection";
import MotionDiv from "@/components/landing/MotionDiv";
import TokenChart from "@/components/landing/TokenChart";
import ScrollStack, { ScrollStackItem } from "@/components/ScrollStack";
import TrustedByMarquee from "@/components/landing/TrustedByMarquee";

/* ───────────────────────── asset paths ───────────────────────── */
const A = "/landing";

/* ───────────────────── trusted-by logos (auto-discovered) ───── */
// Logos whose images already contain their brand name — no label needed
const TEXT_IN_IMAGE = new Set(["talunt", "leanmcp"]);
// Display names for logos (filename stem → label)
const DISPLAY_NAMES: Record<string, string> = {
  githired: "GitHired",
  leanmcp: "LeanMCP",
  matcap: "MatCap",
  quirk: "Quirk",
  "runway-avenue": "Runway Ave",
  ship: "Ship",
  talunt: "Talunt",
  tinyfish: "Tinyfish",
  tsenta: "Tsenta",
};

function getTrustedByLogos() {
  const dir = pathMod.join(process.cwd(), "public/landing/trusted-by");
  try {
    const files = fs
      .readdirSync(dir)
      .filter((f) => /\.(svg|png|webp|jpg|jpeg)$/i.test(f))
      .filter((f) => !f.startsWith("orca"))
      .sort();
    return files.map((f) => {
      const stem = f.replace(/\.[^.]+$/, "");
      return {
        src: `/landing/trusted-by/${f}`,
        alt: DISPLAY_NAMES[stem] ?? stem.replace(/[-_]/g, " "),
        name: TEXT_IN_IMAGE.has(stem) ? undefined : (DISPLAY_NAMES[stem] ?? stem),
      };
    });
  } catch {
    return [];
  }
}

/* ───────────────────────── page metadata ────────────────────── */
export const metadata: Metadata = {
  title: "Clean - One MCP. Every Agent Synced.",
  description:
    "Clean is an MCP server that indexes your codebase and syncs context across all your AI coding agents — Claude, Cursor, Codex, Windsurf — reducing token usage by up to 70%.",
  alternates: {
    canonical: "https://www.tryclean.ai",
  },
};

/* ───────────────────────── tiny reusable atoms ───────────────── */
function SectionBadge({ icon, label, variant = "light" }: { icon: string; label: React.ReactNode; variant?: "light" | "dark" }) {
  const bg = variant === "dark" ? "bg-transparent" : "bg-white/50";
  const text = variant === "dark" ? "text-white" : "text-[#1c1c1c]";
  return (
    <div className={`section-badge ${bg}`}>
      <span className="section-badge__icon">
        <Image src={`${A}/${icon}`} alt="" width={16} height={16} />
      </span>
      <span className={`font-semibold text-lg ${text}`} style={{ fontFamily: "var(--font-jakarta)" }}>
        {label}
      </span>
    </div>
  );
}

function BtnBookDemo({ className = "" }: { className?: string }) {
  return (
    <a href="/sign-up" className={`group relative inline-flex items-center h-[52px] rounded-[26px] text-white text-[17px] font-semibold tracking-tight pl-6 pr-[52px] transition-all duration-300 hover:scale-[1.02] ${className}`} style={{ background: "linear-gradient(180deg, #1A1A1A 0%, #000000 100%)", border: "2px solid rgba(255,255,255,1)", boxShadow: "0px 0px 0px 1px rgba(0,0,0,0.5), inset 0px 2px 10px rgba(255,255,255,0.7), inset 0px -2px 10px rgba(0,0,0,0.8)" }}>
      <span className="relative z-10" style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.5)" }}>Get Started for Free</span>
      <span className="absolute right-[6px] top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-white size-10 transition-transform duration-300 group-hover:rotate-45 text-black" style={{ boxShadow: "0px 2px 5px rgba(0,0,0,0.2)" }}>
        <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>
      </span>
    </a>
  );
}

function BtnTryClean() {
  return (
    <a href="/sign-up" className="relative inline-flex items-center justify-center h-[44px] md:h-[48px] lg:h-[56px] px-6 md:px-8 lg:px-10 rounded-full text-white text-[15px] md:text-[17px] lg:text-[20px] font-semibold tracking-tight transition-all duration-300 hover:scale-[1.02] whitespace-nowrap" style={{ background: "linear-gradient(180deg, #7DC3FC 0%, #60B3F8 100%)", border: "4px solid #DCEFF8", boxShadow: "inset 0px 4px 10px rgba(255,255,255,0.8), inset 0px -3px 6px rgba(20,100,200,0.3)" }}>
      <span className="relative z-10" style={{ textShadow: "0px 1px 2px rgba(20,100,200,0.4)" }}>Try Clean Now</span>
    </a>
  );
}

function BtnJoinWaitlist({ className = "" }: { className?: string }) {
  return (
    <a href="/sign-up" className={`relative inline-flex items-center justify-center h-[52px] px-8 rounded-[26px] text-white text-[17px] font-semibold tracking-tight transition-all duration-300 hover:scale-[1.02] ${className}`} style={{ background: "linear-gradient(180deg, #79C0FF 0%, #3B92F3 100%)", border: "2px solid rgba(255,255,255,0.7)", boxShadow: "0px 2px 10px rgba(59,146,243,0.4), inset 0px 4px 12px 1px rgba(255,255,255,0.8), inset 0px -2px 6px rgba(0,50,150,0.3)" }}>
      <span className="relative z-10" style={{ textShadow: "0px 1px 2px rgba(0,60,150,0.5)" }}>Try Now</span>
    </a>
  );
}

/* ───── Flow Diagram (reused in Solution + Steps) ───── */
function FlowDiagram({ step }: { step: 1 | 2 | 3 }) {
  const activeBelow = step >= 2;
  const activeAgents = step >= 3;
  const muted = "opacity-10";
  const lineColor = step === 1 ? "bg-[#a5d4ff]" : "bg-[#79c0ff]";

  return (
    <div className="flow-card">
      <div className="flow-inner h-[487px] w-[448px] p-0 relative">
        {/* Codebase node */}
        <div className={`absolute left-1/2 -translate-x-1/2 top-[80px] flex items-center gap-3 h-[46px] px-5 rounded-lg border-4 ${step >= 1 ? "border-[#5eb1ff]" : "border-[#c7e5f3]"}`}>
          <span className="h-2 w-2 rounded-full bg-[#1c1c1c]" />
          <span className="text-sm font-medium text-[#1c1c1c]" style={{ fontFamily: "var(--font-geist-sans)" }}>Your Codebase</span>
          <span className="font-mono text-[10px] text-[#21262d]">847 files</span>
        </div>
        {/* index connector */}
        <div className={`absolute left-1/2 -translate-x-1/2 top-[130px] w-1 h-6 ${step >= 1 ? lineColor : "bg-[#c7e5f3]"}`} />
        <span className="absolute left-[210px] top-[159px] text-[10px] text-[#21262d]" style={{ fontFamily: "var(--font-geist-sans)" }}>index</span>
        <div className={`absolute left-1/2 -translate-x-1/2 top-[177px] w-1 h-6 ${step >= 1 ? "bg-[#d2e9ff]" : "bg-[#c7e5f3]"}`} />
        {/* Clean MCP node */}
        <div className={`absolute left-1/2 -translate-x-1/2 top-[205px] w-[122px] h-[60px] rounded text-center ${step >= 1 ? "bg-[#79c0ff] border-4 border-[#5eb1ff]" : "bg-[#8b949e]/10"}`}>
          <span className="block mt-2 text-sm font-semibold text-white" style={{ fontFamily: "var(--font-geist-sans)" }}>Clean MCP</span>
          <span className="block text-[11px] text-white/80" style={{ fontFamily: "var(--font-geist-sans)" }}>cached · 2.4s</span>
        </div>
        {/* serve connector */}
        <div className={`absolute left-1/2 -translate-x-1/2 top-[270px] w-px h-6 ${activeBelow ? lineColor : `bg-[#8b949e] ${muted}`}`} />
        <span className={`absolute left-[211px] top-[299px] text-[10px] ${activeBelow ? "text-[#1c1c1c]" : `text-[#8b949e] ${muted}`}`} style={{ fontFamily: "var(--font-geist-sans)" }}>serve</span>
        <div className={`absolute left-1/2 -translate-x-1/2 top-[317px] w-px h-6 ${activeBelow ? "bg-[#79c0ff]" : `bg-[#8b949e] ${muted}`}`} />
        {/* Horizontal line */}
        <div className={`absolute left-[111px] right-[111px] top-[345px] h-px ${activeAgents ? "bg-[#79c0ff]" : `bg-[#8b949e] ${muted}`}`} />
        {/* Agent nodes */}
        {["Claude", "Cursor", "Codex", "Windsurf"].map((name, i) => {
          const positions = [126.3, 188.78, 250.02, 316.28];
          return (
            <div key={name} className="absolute" style={{ left: positions[i] }}>
              <div className={`w-px h-4 ${activeAgents ? "bg-[#79c0ff]" : `bg-[#8b949e] ${muted}`}`} style={{ position: "absolute", top: 346 }} />
              <div className={`w-2 h-2 rounded-full ${activeAgents ? "bg-[#bcdfff]" : `bg-[#8b949e] ${muted}`}`} style={{ position: "absolute", top: 364, left: -3.5 }} />
              <span className={`absolute text-[9px] font-medium ${activeAgents ? "text-[#1c1c1c]" : `text-[#8b949e] ${muted}`}`} style={{ top: 380, left: -10, fontFamily: "var(--font-geist-sans)" }}>{name}</span>
            </div>
          );
        })}
        {/* Token badge */}
        <div className={`absolute left-1/2 -translate-x-1/2 top-[417px] rounded-full px-4 py-2 ${activeAgents ? "bg-[rgba(121,192,255,0.1)]" : `bg-[#8b949e] ${muted}`}`}>
          <span className={`text-xs font-medium ${activeAgents ? "text-[#79c0ff]" : "text-[#8b949e]"}`} style={{ fontFamily: "var(--font-geist-sans)" }}>70k tokens each</span>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── JSON-LD ──────────────────────────── */
const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://www.tryclean.ai/#software",
  name: "Clean",
  url: "https://www.tryclean.ai",
  description:
    "An MCP server that indexes your codebase once and serves shared context to all your AI coding agents — Claude, Cursor, Codex, Windsurf — reducing token usage by up to 70%.",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web, Docker",
  featureList:
    "Codebase indexing, Context sync across AI agents, Token usage reduction, Claude integration, Cursor integration, Codex integration, Windsurf integration",
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "USD",
      url: "https://www.tryclean.ai/pricing-plan",
      availability: "https://schema.org/OnlineOnly",
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "14.99",
      priceCurrency: "USD",
      url: "https://www.tryclean.ai/pricing-plan",
      availability: "https://schema.org/OnlineOnly",
    },
    {
      "@type": "Offer",
      name: "Max",
      price: "29.99",
      priceCurrency: "USD",
      url: "https://www.tryclean.ai/pricing-plan",
      availability: "https://schema.org/OnlineOnly",
    },
  ],
  publisher: { "@id": "https://www.tryclean.ai/#organization" },
};

/* ───────────────────────── MAIN PAGE ─────────────────────────── */
export default function Home() {
  const trustedByLogos = getTrustedByLogos();

  return (
    <div className="relative min-h-screen bg-white" style={{ overflowX: 'clip' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <LandingNavbar />

      {/* ═══════════ 1. HERO SECTION ═══════════ */}
      <section className="relative h-[95svh] w-full bg-white overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-2 sm:inset-3 rounded-[24px] sm:rounded-[36px] lg:rounded-[48px] overflow-hidden">
          <Image src={`${A}/hero-bg.png`} alt="" fill className="object-cover" priority />
          {/* 3D Glass logo */}
          <div className="absolute left-1/2 -translate-x-1/2 top-[320px] sm:top-[420px] w-[500px] h-[500px] sm:w-[962px] sm:h-[950px]">
            <Image src={`${A}/glass-logo.png`} alt="" fill className="object-cover" sizes="(max-width: 640px) 500px, 962px" priority />
          </div>
        </div>
        {/* Navbar placeholder — actual navbar is fixed/sticky, rendered outside hero */}
        <div className="h-[60px] sm:h-[76px]" />
        {/* Hero content */}
        <HeroAnimatedWrapper>
          <div className="flex flex-col items-center">
            <h1 className="text-[20px] sm:text-[26px] lg:text-[32px] font-semibold text-white text-center tracking-tight" style={{ fontFamily: "var(--font-jakarta)" }}>
              Stop burning <em className="not-italic" style={{ fontFamily: "var(--font-display)" }}>tokens</em>
            </h1>
            <p className="text-[32px] sm:text-[48px] lg:text-[64px] font-semibold text-white text-center tracking-tight leading-tight" style={{ fontFamily: "var(--font-jakarta)" }}>
              Sync context across
            </p>
            {/* Rotating large text */}
            <HeroRotatingText />
            <BtnBookDemo />
          </div>
          <p className="text-base sm:text-xl font-semibold text-white text-center tracking-tight" style={{ fontFamily: "var(--font-jakarta)" }}>
            Every agent synced. 50% less spend, 3x faster.
          </p>
        </HeroAnimatedWrapper>
      </section>

      {/* ═══════════ TRUSTED BY MARQUEE ═══════════ */}
      <TrustedByMarquee logos={trustedByLogos} />

      {/* ═══════════ 2. PROBLEM SECTION ═══════════ */}
      <section className="relative bg-white py-3">
        <div className="mx-2 sm:mx-3 rounded-[24px] sm:rounded-[36px] lg:rounded-[48px] bg-[#1c1c1c] overflow-hidden relative min-h-[705px] h-auto py-16 lg:py-0 lg:h-[705px]">
          {/* Dark gradient bg */}
          <div className="absolute inset-0 opacity-50 overflow-hidden">
            <Image src={`${A}/dark-bg.png`} alt="" fill className="object-cover" />
          </div>
          <div className="relative lg:absolute inset-0 flex items-center justify-center px-5 sm:px-10">
            <div className="w-full max-w-[1280px] flex flex-col lg:flex-row items-center lg:justify-between gap-10 lg:gap-8">
              {/* Left text */}
              <MotionDiv
                className="flex flex-col items-start gap-6 md:max-w-[550px] lg:max-w-[600px] xl:max-w-[690px]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <SectionBadge icon="question-icon.svg" label={<>The <em style={{ fontFamily: "var(--font-display)" }}>Problem</em></>} variant="dark" />
                <h2 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-semibold text-white leading-[1.25] tracking-tight" style={{ fontFamily: "var(--font-jakarta)" }}>
                  Every agent <em className="not-italic" style={{ fontFamily: "var(--font-display)" }}>re-reads</em> your{"\n"}entire codebase. <em className="not-italic" style={{ fontFamily: "var(--font-display)" }}>Every time</em>.
                </h2>
              </MotionDiv>
              {/* Right chart */}
              <MotionDiv
                className="w-full max-w-[448px] lg:w-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 }}
              >
                <div className="relative">
                  <div className="absolute inset-0 blur-[50px] mix-blend-plus-lighter" style={{ backgroundImage: "radial-gradient(circle, white 10%, #bce0ff 15%, #79c0ff 20%, #5eb1ff 30%, #3b92f3 45%, #2982ed 53%, #1772e7 60%)" }} />
                  <div className="relative bg-white/20 border border-white/10 rounded-[20px] p-2.5 overflow-hidden">
                    <TokenChart />
                  </div>
                </div>
              </MotionDiv>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ 3. CONTEXT SECTION ═══════════ */}
      <section className="relative bg-white px-5 py-20 sm:px-10 sm:py-28 lg:px-[68px] lg:py-[169px]">
        <MotionDiv initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <div className="flex mb-4">
            <ScrollRevealText
              text="Every AI coding tool uses the same models."
              baseOverlayColor="rgba(28, 28, 28, 0.4)"
              activeColor="#1c1c1c"
              className="text-2xl sm:text-3xl lg:text-5xl font-semibold tracking-tight leading-[1.25] justify-start"
              style={{ fontFamily: "var(--font-jakarta)" }}
            />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8">
            <div className="flex -space-x-3 sm:-space-x-5">
              {["claude-icon.svg", "cursor-icon.svg", "antigravity-icon.png", "openai-icon.svg", "windsurf-icon.svg"].map((img, i) => (
                <div key={i} className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-white border-4 sm:border-6 lg:border-8 border-[#5eb1ff] flex items-center justify-center overflow-hidden">
                  <Image src={`${A}/${img}`} alt="" width={40} height={40} className="object-contain w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
                </div>
              ))}
            </div>
            <ScrollRevealText
              text="The difference is context."
              baseOverlayColor="rgba(28, 28, 28, 0.4)"
              activeColor="#1c1c1c"
              className="text-2xl sm:text-3xl lg:text-5xl font-semibold tracking-tight m-0 justify-start"
              style={{ fontFamily: "var(--font-jakarta)" }}
            />
          </div>
          <div className="flex justify-start">
            <ScrollRevealText
              text="Too much context wastes your money. Too little wastes your time. Clean saves exactly the right context—so every agent is fast, focused, and cheap to run."
              baseOverlayColor="rgba(28, 28, 28, 0.4)"
              activeColor="#1c1c1c"
              className="text-2xl sm:text-3xl lg:text-5xl font-semibold tracking-tight leading-[1.25] max-w-[1304px] text-left justify-start"
              style={{ fontFamily: "var(--font-jakarta)" }}
            />
          </div>
        </MotionDiv>
      </section>

      {/* ═══════════ 4. ORBIT SECTION ═══════════ */}
      <OrbitSection />


      {/* ═══════════ 5. SOLUTION SECTION ═══════════ */}
      <section className="relative rounded-t-[24px] sm:rounded-t-[36px] lg:rounded-t-[48px] -mt-12 overflow-hidden bg-white pb-12 sm:pb-0 sm:min-h-[1200px] lg:min-h-[1466px]">
        {/* Subtle light background image (rotated 180°, 50% opacity) */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[-54px] w-full h-full rotate-180 opacity-50 pointer-events-none">
          <Image src={`${A}/light-gradient-bg.png`} alt="" fill className="object-fit" />
        </div>
        {/* "clean" watermark — glassy, visible but subtle */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[17px] pointer-events-none select-none">
          <span className="text-[120px] sm:text-[300px] lg:text-[500px] font-bold tracking-[-4px] sm:tracking-[-10px] leading-none bg-clip-text text-transparent whitespace-nowrap opacity-50" style={{ fontFamily: "var(--font-jakarta)", backgroundImage: "linear-gradient(180deg, white 0%, rgba(255,255,255,0) 100%)" }}>clean</span>
        </div>
        {/* Glassy semicircle behind the arc */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[200px] sm:top-[30px] md:top-[57px] lg:top-[356px] w-full h-[880px] pointer-events-none hidden sm:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src={`${A}/solution-arc-glass.svg`} className="w-full h-full" />
        </div>
        {/* Blue arc ring */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[280px] sm:top-[100px] md:top-[150px] lg:top-[449px] w-full h-[763px] pointer-events-none hidden sm:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src={`${A}/solution-arc-ring.svg`} className="w-full h-full" />
        </div>
        {/* Inner edge blur — backdrop-blur clipped inside the arc, softening the inner rim */}
        <div className="absolute left-0 right-0 top-[650px] sm:top-[300px] md:top-[350px] lg:top-[650px] h-[808px] pointer-events-none backdrop-blur-[50px] hidden sm:block" style={{ maskImage: "linear-gradient(to bottom, transparent 0%, black 40%, black 85%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 40%, black 85%, transparent 100%)" }} />
        {/* Clean app icon */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[100px] md:top-[250px] sm:top-[200px] lg:top-[244px] w-[80px] h-[80px] sm:w-[120px] sm:h-[120px] lg:w-[157px] lg:h-[157px] z-10">
          <Image src={`${A}/clean-app-icon.svg`} alt="" fill className="object-contain" />
        </div>
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center md:pt-[400px] pt-[200px] sm:pt-[400px] lg:pt-[563px] w-full max-w-[1280px] mx-auto px-5 gap-6 sm:gap-9">
          <SectionBadge icon="ai-idea-icon.svg" label={<>The <em style={{ fontFamily: "var(--font-display)" }}>Solutions</em></>} />
          <h2 className="text-[24px] sm:text-[36px] md:text-[38px] lg:text-[48px] font-semibold text-[#1c1c1c] text-center leading-[1.25] w-full max-w-[894px]" style={{ fontFamily: "var(--font-jakarta)" }}>
            One{" "}
            <span className="text-[#66a6dd]">MCP server</span>
            {" "}that pre-indexes your codebase and{" "}
            <span className="text-[#66a6dd]">stores context</span>
            {" "}across every agent your team uses
          </h2>
          <div className="hidden md:block">
            <FlowDiagram step={3} />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-lg font-semibold text-[#79c0ff] uppercase" style={{ fontFamily: "var(--font-jakarta)" }}>
              See how clean <em style={{ fontFamily: "var(--font-display)" }}>works</em>
            </p>
            <div className="w-px h-5 bg-[#79c0ff]" />
          </div>
        </div>
      </section>

      {/* ═══════════ 6-8. STEPS SECTIONS (Sticky Stack) ═══════════ */}
      <ScrollStack>
        {[
          { num: "01", label: "Connect Once", heading: "Point Clean\nat your codebase.", desc: "We index everything intelligently—structure, patterns, dependencies.", step: 1 as const },
          { num: "02", label: "Use Any Agent", heading: "Claude, Cursor, Codex", desc: "—doesn't matter. They all tap into the same pre-built context, instantly.", step: 2 as const },
          { num: "03", label: "Stay in Sync", heading: "With Team", desc: "Your whole team shares the same codebase understanding.\nNo more repeated explanations.", step: 3 as const },
        ].map((s, i, arr) => (
          <ScrollStackItem key={s.num}>
            <div className="bg-transparent py-3">
              <div className="mx-2 sm:mx-3 rounded-[24px] sm:rounded-[36px] lg:rounded-[48px] overflow-hidden relative bg-[#f8fbff] min-h-[500px] sm:min-h-[600px] md:min-h-[705px] lg:min-h-[705px] h-auto">
                <div className="flex items-center justify-center py-12 md:py-0 md:absolute md:inset-0 px-5 sm:px-10">
                  <div className="w-full max-w-[1280px] flex flex-col md:flex-row items-start md:items-center md:justify-between gap-8">
                    {/* Left — step content */}
                    <div className="flex gap-6 sm:gap-12 items-stretch">
                      {/* Step number + line */}
                      <div className="flex flex-col items-center gap-1 py-6 sm:py-12">
                        <span className="text-lg font-semibold text-[#66a6dd] uppercase">{s.num}</span>
                        <div className="step-line flex-1 w-[3px] rounded-full" />
                        <span className="text-lg text-[#1c1c1c] opacity-10 uppercase">{arr[i + 1]?.num ?? s.num}</span>
                      </div>
                      {/* Text */}
                      <div className="flex flex-col gap-4 sm:gap-6 justify-center py-6 sm:py-12 max-w-[531px]">
                        <span className="gradient-text-blue text-xl font-bold uppercase whitespace-nowrap" style={{ fontFamily: "var(--font-display)" }}>{s.label}</span>
                        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1c1c1c] leading-[1.25] whitespace-pre-line" style={{ fontFamily: "var(--font-jakarta)" }}>{s.heading}</h3>
                        <p className="text-base sm:text-lg text-[#8b949e] tracking-tight leading-[29px] whitespace-pre-line" style={{ fontFamily: "var(--font-jakarta)" }}>{s.desc}</p>
                        {s.num === "03" && <BtnTryClean />}
                      </div>
                    </div>
                    {/* Right — flow diagram (hidden on mobile) */}
                    <div className="hidden md:block md:scale-[0.7] md:origin-right lg:scale-100">
                      <FlowDiagram step={s.step} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollStackItem>
        ))}
      </ScrollStack>

      {/* ═══════════ 9. FEATURES SECTION ═══════════ */}
      <section className="relative bg-white py-24 overflow-hidden">
        {/* Graph decoration at top */}
        <div className="absolute top-[-29px] left-0 right-0 h-[262px] overflow-hidden opacity-30">
          {/* Placeholder for the line graph decoration */}
        </div>
        <div className="relative mx-auto max-w-[1280px] px-5 sm:px-10 lg:px-20">
          <MotionDiv
            className="flex flex-col items-center gap-3 mb-9"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <SectionBadge icon="rocket-icon.svg" label="Features" />
            <h2 className="text-5xl font-semibold text-[#1c1c1c] text-center tracking-tight" style={{ fontFamily: "var(--font-jakarta)" }}>
              Everything you need
            </h2>
          </MotionDiv>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
            {/* Card 1: Team Alignment */}
            <MotionDiv className="feature-card flex flex-col gap-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="feature-card__preview relative">
                <Image src={`${A}/feature-team.png`} alt="" fill className="object-cover rounded-[20px]" />
              </div>
              <div className="flex flex-col gap-3 p-3">
                <h3 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: "var(--font-jakarta)" }}>Team Alignment</h3>
                <p className="text-xl text-[#8b949e] tracking-tight leading-[1.2]" style={{ fontFamily: "var(--font-jakarta)" }}>Share context across your entire team. Everyone&apos;s agents speak the same language.</p>
              </div>
            </MotionDiv>

            {/* Card 2: One-time Setup */}
            <MotionDiv className="feature-card flex flex-col gap-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="feature-card__preview relative flex items-center justify-center">
                {/* Setup preview mockup */}
                <div className="bg-white rounded-xl shadow-[0_0_20px_rgba(121,192,255,0.5)] w-full max-w-[406px] h-[140px] overflow-hidden p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-6 h-6 rounded-md bg-[#d1d5dc]" />
                    <div><div className="w-32 h-2 rounded bg-black/20 mb-1.5" /><div className="w-24 h-2 rounded bg-black/10" /></div>
                    <span className="ml-auto text-[10px] font-semibold text-[#5eb1ff] uppercase tracking-wide">Clean</span>
                  </div>
                  <div className="space-y-2">
                    <div className="w-40 h-2 rounded bg-black/10" />
                    <div className="w-44 h-2 rounded bg-black/10" />
                    <div className="w-36 h-2 rounded bg-black/10" />
                  </div>
                  <div className="mt-3 h-2 rounded bg-black/10 overflow-hidden"><div className="w-1/2 h-full rounded bg-[#c7e5f3]" /></div>
                </div>
              </div>
              <div className="flex flex-col gap-3 p-3">
                <h3 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: "var(--font-jakarta)" }}>One-time Setup</h3>
                <p className="text-xl text-[#8b949e] tracking-tight leading-[1.2]" style={{ fontFamily: "var(--font-jakarta)" }}>Configure once, benefit forever. Clean keeps your index fresh.</p>
              </div>
            </MotionDiv>

            {/* Card 3: Universal Compatibility */}
            <MotionDiv className="feature-card flex flex-col gap-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <div className="feature-card__preview relative flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-[0_0_20px_rgba(121,192,255,0.5)] w-full max-w-[416px] h-[140px] overflow-hidden p-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent mix-blend-screen" />
                  <p className="text-xs font-semibold text-black/70 tracking-wide mb-3">Choose any agent</p>
                  <span className="absolute top-4 right-4 bg-[#1772E7]/10 border border-black/10 rounded-full px-3 py-1 text-[10px] font-semibold text-[#1772E7]">MCP</span>
                  <div className="flex gap-6 my-3">
                    {[`${A}/claude-icon.svg`, `${A}/feature-cursor.png`, `${A}/feature-codex.png`, `${A}/windsurf-icon.svg`].map((ic, i) => (
                      <div key={i} className="w-[38px] h-[38px] rounded-[14px] bg-white/85 border border-black/8 shadow-lg flex items-center justify-center">
                        <Image src={ic} alt="" width={24} height={24} />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    {["shared context", "repo index", "memories"].map((t) => (
                      <span key={t} className="bg-white border border-black/10 rounded-full px-3 py-1 text-[10px] font-medium text-black/60">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 p-3">
                <h3 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: "var(--font-jakarta)" }}>Universal Compatibility</h3>
                <p className="text-xl text-[#8b949e] tracking-tight leading-[1.2]" style={{ fontFamily: "var(--font-jakarta)" }}>Works with Claude, Cursor, Codex, Windsurf, and any MCP-compatible agent.</p>
              </div>
            </MotionDiv>

            {/* Card 4: Synced Context */}
            <MotionDiv className="feature-card flex flex-col gap-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
              <div className="feature-card__preview relative flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-[0_0_20px_rgba(121,192,255,0.5)] w-full max-w-[419px] h-[140px] overflow-hidden p-4">
                  <div className="flex gap-2 mb-3">
                    <span className="bg-[#aed8ff]/50 border border-white/10 rounded-full px-2.5 py-1 text-[10px] font-semibold text-[#66a6dd] uppercase tracking-wide">shared context</span>
                    <span className="bg-[#79c0ff]/10 border border-[#79c0ff]/30 rounded-full px-2.5 py-1 text-[10px] font-semibold text-[#79c0ff] uppercase tracking-wide">auth/service.ts</span>
                  </div>
                  {/* Claude message */}
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <Image src={`${A}/claude-icon-sm.svg`} alt="" width={20} height={20} />
                    </div>
                    <div className="bg-[#66a6dd] rounded-lg p-2 flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-white">Claude</span>
                        <span className="text-[9px] font-semibold text-[#aed8ff] uppercase tracking-wide">same file</span>
                      </div>
                      <p className="text-[11px] text-white">&ldquo;AuthService already caches user roles; no need to re-fetch.&rdquo;</p>
                    </div>
                  </div>
                  {/* Cursor message */}
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 ml-8">
                      <Image src={`${A}/feature-cursor.png`} alt="" width={16} height={16} />
                    </div>
                    <div className="bg-[#66a6dd] rounded-lg p-2 flex-1">
                      <div className="flex justify-between">
                        <span className="text-[10px] text-white">Cursor</span>
                        <span className="text-[9px] font-semibold text-[#aed8ff] uppercase tracking-wide">shared context</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 p-3">
                <h3 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: "var(--font-jakarta)" }}>Synced Context</h3>
                <p className="text-xl text-[#8b949e] tracking-tight leading-[1.2]" style={{ fontFamily: "var(--font-jakarta)" }}>Every agent works from the same understanding. No more repeated codebase exploration.</p>
              </div>
            </MotionDiv>
          </div>
        </div>
      </section>

      {/* ═══════════ 10. DIFFERENCES (BEFORE / AFTER) ═══════════ */}
      <DifferencesSection />

      {/* ═══════════ 11. IMPACT / STATS SECTION ═══════════ */}
      <section className="relative bg-white rounded-t-[24px] sm:rounded-t-[36px] lg:rounded-t-[48px] overflow-hidden h-auto min-h-[600px] sm:min-h-[800px] lg:min-h-[917px] pb-12">
        {/* Light gradient bg */}
        <div className="absolute inset-0 opacity-50 overflow-hidden" style={{ transform: "rotate(180deg)" }}>
          <Image src={`${A}/stats-bg.png`} alt="" fill className="object-cover" />
        </div>
        {/* "impact" watermark */}
        <div className="absolute left-[20px] sm:left-[50px] top-[16px]">
          <span className="watermark-text text-[100px] sm:text-[250px] lg:text-[400px] font-bold tracking-[-4px] sm:tracking-[-8px] leading-none" style={{ fontFamily: "var(--font-jakarta)" }}>impact</span>
        </div>
        {/* Stat cards */}
        <MotionDiv
          className="relative sm:absolute left-0 sm:left-[42px] top-auto sm:top-[369px] right-0 sm:right-[42px] flex flex-col sm:flex-row gap-4 sm:gap-6 uppercase px-5 sm:px-0 pt-[150px] sm:pt-0"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="stat-card flex-1 bg-[#1772e7] h-[160px] sm:h-[300px] lg:h-[506px] text-white flex flex-col justify-between">
            <span className="stat-number block text-[48px] sm:text-[66px] lg:text-[120px] font-bold leading-none tracking-[-3px] sm:tracking-[-8px] lg:tracking-[-13px]" style={{ fontFamily: "var(--font-jakarta)" }}>50%</span>
            <span className="text-sm sm:text-xl" style={{ fontFamily: "var(--font-jakarta)" }}>less token spend</span>
          </div>
          <div className="stat-card flex-1 bg-[#66a6dd] h-[160px] sm:h-[300px] lg:h-[506px] text-white flex flex-col justify-between">
            <span className="stat-number block text-[48px] sm:text-[66px] lg:text-[120px] font-bold leading-none tracking-[-3px] sm:tracking-[-8px] lg:tracking-[-13px]" style={{ fontFamily: "var(--font-jakarta)" }}>3x</span>
            <span className="text-sm sm:text-xl" style={{ fontFamily: "var(--font-jakarta)" }}>faster sessions</span>
          </div>
          <div className="stat-card flex-1 bg-white border border-[#5eb1ff] h-[160px] sm:h-[300px] lg:h-[506px] text-[#1772e7] flex flex-col justify-between">
            <span className="stat-number block text-[48px] sm:text-[66px] lg:text-[120px] font-bold leading-none" style={{ fontFamily: "var(--font-jakarta)" }}>1</span>
            <span className="text-sm sm:text-xl" style={{ fontFamily: "var(--font-jakarta)" }}>MCP to rule them all</span>
          </div>
        </MotionDiv>
      </section>

      {/* ═══════════ 11. CTA + 12. FOOTER ═══════════ */}
      <div className="relative flex flex-col items-start">
        {/* CTA */}
        <section className="relative overflow-hidden w-full z-0 lg:min-h-[950px]" style={{ background: "linear-gradient(180deg, #000 0%, #666 100%)" }}>
          {/* V3 dark bg layer */}
          <div className="absolute inset-0 bg-black pointer-events-none" />
          {/* Intersect — large circular cutout shape on left */}
          <div className="absolute pointer-events-none hidden lg:block" style={{ left: '-51.5%', top: '2%', width: '138%', height: '210%' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src={`${A}/cta-intersect.svg`} className="w-full h-full" style={{ transform: "rotate(90deg) scaleY(-1)" }} />
          </div>
          {/* Small ellipse glow under glass logo */}
          <div className="absolute pointer-events-none hidden lg:block" style={{ left: '11.2%', top: '72.8%', width: '26.3%', height: '3.6%' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src={`${A}/cta-ellipse-glow.svg`} className="absolute w-full h-full" style={{ transform: "scale(2.2)" }} />
          </div>
          {/* 3D Glass logo — hidden on mobile */}
          <div className="absolute hidden lg:block" style={{ left: '-1.9%', top: '5.3%', width: '45.7%', height: '80.4%' }}>
            <Image src={`${A}/cta-glass-logo.png`} alt="" fill className="object-contain" />
          </div>
          {/* CTA content — centered on mobile, right-half on desktop */}
          <MotionDiv
            className="relative lg:absolute flex flex-col gap-5 sm:gap-8 z-10 px-5 sm:px-10 py-14 sm:py-20 lg:py-0 items-center lg:items-start text-center lg:text-left lg:left-[50%] lg:top-[29%] lg:w-[48.5%]"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-[28px] sm:text-[50px] lg:text-[80px] text-white leading-none tracking-[-1.5px] sm:tracking-[-2px] lg:tracking-[-3.2px]" style={{ fontFamily: "var(--font-jakarta)" }}>
              Ready to stop{" "}
              <em className="font-bold italic" style={{ fontFamily: "var(--font-display)", marginRight: "0.25em" }}>burning</em>
              tokens?
            </h2>
            <p className="text-sm sm:text-lg text-white/80" style={{ fontFamily: "var(--font-jakarta)" }}>Join teams saving thousands on AI agent costs every month.</p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-center">
              <a href="/sign-up" className="relative inline-flex items-center justify-center h-[52px] px-8 rounded-[26px] text-white text-[17px] font-semibold tracking-tight transition-all duration-300 hover:scale-[1.02]" style={{ background: "linear-gradient(180deg, #79C0FF 0%, #3B92F3 100%)", border: "2px solid rgba(255,255,255,0.7)", boxShadow: "0px 2px 10px rgba(59,146,243,0.4), inset 0px 4px 12px 1px rgba(255,255,255,0.8), inset 0px -2px 6px rgba(0,50,150,0.3)" }}>
                <span className="relative z-10" style={{ textShadow: "0px 1px 2px rgba(0,60,150,0.5)" }}>Get Started for Free</span>
              </a>
            </div>
          </MotionDiv>
        </section>

        {/* Footer — overlaps CTA by 279px */}
        <footer className="relative bg-white rounded-t-[36px] sm:rounded-t-[72px] overflow-hidden w-full h-auto min-h-[200px] sm:min-h-[340px] py-8 z-10">
          {/* Subtle background — flipped gradient image */}
          <div className="absolute left-1/2 -translate-x-1/2 w-[1820px] h-[731px] opacity-50 pointer-events-none" style={{ bottom: -440, transform: "translateX(-50%) rotate(180deg) scaleY(-1)" }}>
            <Image src={`${A}/footer-subtle-bg.jpg`} alt="" fill className="object-cover" />
          </div>
          {/* "clean" gradient text — hidden on mobile, visible on sm+ */}
          <div className="hidden sm:block absolute -translate-y-1/2 bg-clip-text text-transparent whitespace-nowrap pointer-events-none" style={{
            left: "calc(50% - 226px)",
            top: 156,
            fontFamily: "var(--font-jakarta)",
            fontSize: 176,
            fontWeight: 700,
            letterSpacing: "-3.52px",
            lineHeight: "normal",
            backgroundImage: "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 452 222' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%25' width='100%25' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(32.378 0.000005485 0.065033 210.94 0.000025164 111)'><stop stop-color='rgba(199,229,243,1)' offset='0'/><stop stop-color='rgba(160,211,249,1)' offset='0.15816'/><stop stop-color='rgba(121,192,255,1)' offset='0.31633'/><stop stop-color='rgba(108,185,255,1)' offset='0.64774'/><stop stop-color='rgba(62,162,255,1)' offset='0.7076'/><stop stop-color='rgba(39,151,255,1)' offset='0.73753'/><stop stop-color='rgba(17,140,255,1)' offset='0.76746'/><stop stop-color='rgba(12,105,191,1)' offset='0.8256'/><stop stop-color='rgba(8,70,128,1)' offset='0.88373'/><stop stop-color='rgba(6,52,96,1)' offset='0.9128'/><stop stop-color='rgba(4,35,64,1)' offset='0.94187'/><stop stop-color='rgba(2,17,32,1)' offset='0.97093'/><stop stop-color='rgba(1,9,16,1)' offset='0.98547'/><stop stop-color='rgba(0,0,0,1)' offset='1'/></radialGradient></defs></svg>\")",
            backgroundSize: "100% 100%",
          }}>
            clean
          </div>
          {/* Footer nav */}
          <div className="relative sm:absolute left-0 sm:left-1/2 sm:-translate-x-1/2 sm:bottom-6 flex flex-col items-center w-full max-w-[1326px] px-5 gap-3 mx-auto">
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-base text-[#1c1c1c] tracking-[-0.32px]" style={{ fontFamily: "var(--font-display)" }}>
              <a href="https://www.linkedin.com/company/cleanailabs" target="_blank" rel="noopener noreferrer" className="hover:opacity-70">LinkedIn</a>
              <Link href="/contact" className="hover:opacity-70">Contact</Link>
              <Link href="/privacy" className="hover:opacity-70">Privacy</Link>
              <Link href="/terms" className="hover:opacity-70">Terms</Link>
              <Link href="/beta-agreement" className="hover:opacity-70">Beta Agreement</Link>
            </div>
            <span className="text-sm text-[#1c1c1c]/60 leading-5" style={{ fontFamily: "var(--font-display)" }}>2026 Clean. All rights reserved.</span>
          </div>
        </footer>
      </div>

    </div>
  );
}
