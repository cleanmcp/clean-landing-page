import React from "react";
import fs from "node:fs";
import pathMod from "node:path";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import LandingNavbar from "@/components/landing/LandingNavbar";
import { HeroAnimatedWrapper, HeroRotatingText } from "@/components/landing/HeroContent";
import OrbitSection from "@/components/landing/OrbitSection";
import MotionDiv from "@/components/landing/MotionDiv";
import TokenChart from "@/components/landing/TokenChart";
import TrustedByMarquee from "@/components/landing/TrustedByMarquee";

/* ───────────────────────── asset paths ───────────────────────── */
const A = "/landing";

/* ───────────────────── trusted-by logos (auto-discovered) ───── */
// Logos whose images already contain their brand name — no label needed
const TEXT_IN_IMAGE = new Set(["talunt", "leanmcp"]);
// Display names for logos (filename stem → label)
const DISPLAY_NAMES: Record<string, string> = {
  githired: "GitHired",
  jigsaw: "Jigsaw",
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
  title: "Clean — Your AI Coding Command Center",
  description:
    "Clean Agent is an AI coding command center for your desktop — chat, code, terminal, browser, and sub-agents in one app. Powered by Clean MCP, the same context layer you can use with Claude, Cursor, Codex, and Windsurf.",
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

function BtnJoinWaitlist({ className = "" }: { className?: string }) {
  return (
    <a href="/sign-up" className={`relative inline-flex items-center justify-center h-[52px] px-8 rounded-[26px] text-white text-[17px] font-semibold tracking-tight transition-all duration-300 hover:scale-[1.02] ${className}`} style={{ background: "linear-gradient(180deg, #79C0FF 0%, #3B92F3 100%)", border: "2px solid rgba(255,255,255,0.7)", boxShadow: "0px 2px 10px rgba(59,146,243,0.4), inset 0px 4px 12px 1px rgba(255,255,255,0.8), inset 0px -2px 6px rgba(0,50,150,0.3)" }}>
      <span className="relative z-10" style={{ textShadow: "0px 1px 2px rgba(0,60,150,0.5)" }}>Try Now</span>
    </a>
  );
}

function BtnDownloadMac({ className = "", href = "/sign-up?product=agent" }: { className?: string; href?: string }) {
  return (
    <a href={href} className={`group relative inline-flex items-center h-[52px] rounded-[26px] text-white text-[17px] font-semibold tracking-tight pl-6 pr-[52px] transition-all duration-300 hover:scale-[1.02] ${className}`} style={{ background: "linear-gradient(180deg, #1A1A1A 0%, #000000 100%)", border: "2px solid rgba(255,255,255,1)", boxShadow: "0px 0px 0px 1px rgba(0,0,0,0.5), inset 0px 2px 10px rgba(255,255,255,0.7), inset 0px -2px 10px rgba(0,0,0,0.8)" }}>
      <span className="relative z-10" style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.5)" }}>Download for Mac</span>
      <span className="absolute right-[6px] top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-white size-10 transition-transform duration-300 group-hover:translate-y-[calc(-50%+2px)] text-black" style={{ boxShadow: "0px 2px 5px rgba(0,0,0,0.2)" }}>
        <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l-7.5-7.5M12 19.5l7.5-7.5" /></svg>
      </span>
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
            {/* Eyebrow pill */}
            <div className="inline-flex items-center gap-2 mb-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/25 px-3 py-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-white tracking-[0.12em] uppercase" style={{ fontFamily: "var(--font-jakarta)" }}>
                NEW · Clean Agent
              </span>
            </div>
            <h1 className="text-[20px] sm:text-[26px] lg:text-[32px] font-semibold text-white text-center tracking-tight" style={{ fontFamily: "var(--font-jakarta)" }}>
              Your AI coding <em className="not-italic" style={{ fontFamily: "var(--font-display)" }}>command center</em>
            </h1>
            <p className="text-[32px] sm:text-[48px] lg:text-[64px] font-semibold text-white text-center tracking-tight leading-tight" style={{ fontFamily: "var(--font-jakarta)" }}>
              One app for
            </p>
            {/* Rotating large text — words chosen to fit "One app for ___" */}
            <HeroRotatingText texts={["coding", "testing", "research"]} />
            <div className="flex flex-col items-center gap-4">
              <BtnDownloadMac />
              <a href="#mcp" className="group text-sm sm:text-base font-semibold text-white/85 hover:text-white tracking-tight transition-colors flex items-center gap-1.5" style={{ fontFamily: "var(--font-jakarta)" }}>
                <span className="relative">
                  Already use Cursor or Claude? Try <em className="not-italic" style={{ fontFamily: "var(--font-display)" }}>Clean MCP</em>
                  <span className="absolute left-0 right-0 -bottom-0.5 h-px bg-white/0 group-hover:bg-white/70 transition-colors duration-300" />
                </span>
                <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-y-1 group-hover:animate-pulse">↓</span>
              </a>
            </div>
          </div>
        </HeroAnimatedWrapper>
      </section>

      {/* ═══════════ TRUSTED BY MARQUEE ═══════════ */}
      <TrustedByMarquee logos={trustedByLogos} />

      {/* ═══════════ AGENT DEMO — product screenshot ═══════════ */}
      <section className="relative bg-white py-3">
        <MotionDiv
          className="mx-2 sm:mx-3 rounded-[24px] sm:rounded-[36px] lg:rounded-[48px] overflow-hidden relative bg-[#1c1c1c]"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          {/* Dark gradient bg */}
          <div className="absolute inset-0 opacity-50 overflow-hidden">
            <Image src={`${A}/dark-bg.png`} alt="" fill className="object-cover" />
          </div>

          {/* Soft blue glow under the window */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[-220px] w-[1200px] h-[400px] blur-[140px] mix-blend-plus-lighter pointer-events-none" style={{ backgroundImage: "radial-gradient(ellipse, rgba(121,192,255,0.55) 0%, rgba(59,146,243,0.25) 40%, transparent 70%)" }} />

          {/* Content wrapper */}
          <div className="relative px-5 sm:px-10 pt-14 sm:pt-20 pb-0 flex flex-col items-center">
            <SectionBadge icon="rocket-icon.svg" label={<>The <em style={{ fontFamily: "var(--font-display)" }}>App</em></>} variant="dark" />
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-semibold text-white text-center leading-[1.15] tracking-tight max-w-[820px]" style={{ fontFamily: "var(--font-jakarta)" }}>
              From idea to merge — <em className="not-italic" style={{ fontFamily: "var(--font-display)" }}>without leaving</em> the app.
            </h2>
            <p className="mt-3 text-base sm:text-lg text-white/65 text-center max-w-[640px] tracking-tight" style={{ fontFamily: "var(--font-jakarta)" }}>
              Chat, terminal, file tree, in-app browser, sub-agents — one window.
            </p>

            {/* Window-chrome screenshot mock */}
            <div className="relative mt-10 sm:mt-14 w-full max-w-[1180px]">
              <div className="relative rounded-t-[16px] sm:rounded-t-[20px] overflow-hidden bg-[#0c0e12] border border-white/10 shadow-[0_30px_80px_rgba(23,114,231,0.35)]">
                {/* Title bar */}
                <div className="relative h-9 sm:h-10 bg-gradient-to-b from-[#15181d] to-[#0c0e12] border-b border-white/5 flex items-center px-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#ff5e57]" />
                    <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <span className="w-3 h-3 rounded-full bg-[#26ce4d]" />
                  </div>
                  <span className="absolute left-1/2 -translate-x-1/2 text-[11px] sm:text-xs text-white/45 tracking-tight" style={{ fontFamily: "var(--font-jakarta)" }}>
                    clean-agent — fix/oauth-callback · main
                  </span>
                </div>

                {/* App body — 3 panels */}
                <div className="grid grid-cols-[180px_1fr] sm:grid-cols-[210px_1fr_260px] h-[280px] sm:h-[420px] lg:h-[520px]">
                  {/* Sidebar */}
                  <div className="bg-[#0a0c10] border-r border-white/5 p-3 flex flex-col gap-2">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-white/40 px-2 mb-1" style={{ fontFamily: "var(--font-jakarta)" }}>Sessions</div>
                    {[
                      { name: "fix oauth callback", active: true },
                      { name: "audit billing routes", active: false },
                      { name: "add unit tests", active: false },
                      { name: "review #38", active: false },
                    ].map((s) => (
                      <div key={s.name} className={`px-2 py-1.5 rounded-md text-[11px] sm:text-[12px] truncate ${s.active ? "bg-[#1772e7]/20 text-white border border-[#5eb1ff]/30" : "text-white/55 hover:text-white/80"}`} style={{ fontFamily: "var(--font-jakarta)" }}>
                        {s.active && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#5eb1ff] mr-2 align-middle" />}
                        {s.name}
                      </div>
                    ))}
                    <div className="mt-auto px-2 py-1.5 rounded-md text-[11px] text-white/35" style={{ fontFamily: "var(--font-jakarta)" }}>
                      + new session
                    </div>
                  </div>

                  {/* Chat / main area */}
                  <div className="bg-[#0c0e12] p-4 sm:p-5 overflow-hidden flex flex-col gap-3">
                    {/* Agent message */}
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#1772e7] flex items-center justify-center text-[10px] font-bold text-white shrink-0">A</div>
                      <div className="flex-1">
                        <div className="text-[10px] text-white/40 mb-1" style={{ fontFamily: "var(--font-jakarta)" }}>Lead agent · Claude Sonnet 4.6</div>
                        <p className="text-[12px] sm:text-[13px] text-white/85 leading-[1.55] tracking-tight" style={{ fontFamily: "var(--font-jakarta)" }}>
                          Found the issue — the callback URL is missing a trailing slash. Spawning a sub-agent to patch <span className="text-[#79c0ff]">app/api/auth/callback/route.ts</span> and another to add a regression test.
                        </p>
                      </div>
                    </div>

                    {/* Sub-agent block */}
                    <div className="ml-8 rounded-lg border border-[#5eb1ff]/25 bg-[#0a0c10] p-3">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-white/45 mb-2" style={{ fontFamily: "var(--font-jakarta)" }}>
                        <span>Sub · patch callback</span>
                        <span className="text-[#26ce4d]">running</span>
                      </div>
                      <div className="font-mono text-[11px] text-white/70 leading-relaxed">
                        <span className="text-[#ff8a8a]">- redirect_uri: &quot;{`{base}/callback`}&quot;</span><br />
                        <span className="text-[#9be8b1]">+ redirect_uri: &quot;{`{base}/callback/`}&quot;</span>
                      </div>
                    </div>

                    {/* Tool approval bar */}
                    <div className="flex items-center justify-between rounded-lg bg-[#1772e7]/12 border border-[#5eb1ff]/30 px-3 py-2 text-[11px] text-white/85" style={{ fontFamily: "var(--font-jakarta)" }}>
                      <span>Apply diff to <span className="text-[#79c0ff]">app/api/auth/callback/route.ts</span> ?</span>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 rounded bg-white/10 text-white/70">Skip</span>
                        <span className="px-2 py-1 rounded bg-[#5eb1ff] text-[#0c0e12] font-semibold">Approve</span>
                      </div>
                    </div>

                    {/* Input */}
                    <div className="mt-auto rounded-xl bg-[#15181d] border border-white/8 px-3 py-2 flex items-center text-[11px] text-white/45" style={{ fontFamily: "var(--font-jakarta)" }}>
                      <span>Ask Clean Agent…</span>
                      <span className="ml-auto px-1.5 py-0.5 rounded bg-white/8 text-[10px]">⌘ ⏎</span>
                    </div>
                  </div>

                  {/* Right panel — file tree + checks */}
                  <div className="hidden sm:flex bg-[#0a0c10] border-l border-white/5 p-3 flex-col gap-3">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-white/40" style={{ fontFamily: "var(--font-jakarta)" }}>Files</div>
                    <div className="font-mono text-[11px] leading-[1.7] text-white/55">
                      <div className="text-white/35">src/</div>
                      <div className="pl-3">api/</div>
                      <div className="pl-6 text-[#79c0ff]">callback/</div>
                      <div className="pl-9 text-[#79c0ff] bg-[#1772e7]/15 rounded -ml-1 px-1 inline-block">route.ts</div>
                      <div className="pl-3">auth/</div>
                      <div className="pl-3">billing/</div>
                    </div>
                    <div className="mt-2 text-[10px] uppercase tracking-[0.12em] text-white/40" style={{ fontFamily: "var(--font-jakarta)" }}>Checks</div>
                    <div className="flex flex-col gap-1.5 text-[11px]" style={{ fontFamily: "var(--font-jakarta)" }}>
                      <div className="flex items-center gap-2 text-white/70"><span className="w-1.5 h-1.5 rounded-full bg-[#26ce4d]" /> lint</div>
                      <div className="flex items-center gap-2 text-white/70"><span className="w-1.5 h-1.5 rounded-full bg-[#26ce4d]" /> typecheck</div>
                      <div className="flex items-center gap-2 text-white/70"><span className="w-1.5 h-1.5 rounded-full bg-[#5eb1ff] animate-pulse" /> e2e · running</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reflection / fade at bottom */}
              <div className="absolute -bottom-px left-0 right-0 h-12 bg-gradient-to-b from-transparent to-[#1c1c1c]/80 pointer-events-none" />
            </div>
          </div>
        </MotionDiv>
      </section>

      {/* ═══════════ 2. CLEAN AGENT — FEATURE GRID ═══════════ */}
      <section id="agent" className="relative bg-white py-24 overflow-hidden">
        <div className="relative mx-auto max-w-[1280px] px-5 sm:px-10 lg:px-20">
          <MotionDiv
            className="flex flex-col items-center gap-3 mb-9"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <SectionBadge icon="rocket-icon.svg" label={<><em style={{ fontFamily: "var(--font-display)" }}>Clean Agent</em></>} />
            <h2 className="text-4xl sm:text-5xl font-semibold text-[#1c1c1c] text-center tracking-tight" style={{ fontFamily: "var(--font-jakarta)" }}>
              Four agents in <em className="not-italic" style={{ fontFamily: "var(--font-display)" }}>one app</em>.
            </h2>
            <p className="text-lg sm:text-xl text-[#8b949e] text-center max-w-[680px] tracking-tight" style={{ fontFamily: "var(--font-jakarta)" }}>
              Chat, code, browse, and test — without leaving the window.
            </p>
          </MotionDiv>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
            {/* Card 1 — QA Testing */}
            <MotionDiv className="feature-card flex flex-col gap-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="feature-card__preview relative flex items-center justify-center overflow-hidden">
                <div className="bg-white rounded-xl shadow-[0_0_20px_rgba(121,192,255,0.5)] w-full max-w-[420px] h-[140px] overflow-hidden p-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent mix-blend-screen pointer-events-none" />
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-[#aed8ff]" />
                    <span className="w-2 h-2 rounded-full bg-[#79c0ff]" />
                    <span className="w-2 h-2 rounded-full bg-[#5eb1ff]" />
                    <div className="ml-1 px-2 py-0.5 rounded bg-[#aed8ff]/50 border border-[#5eb1ff]/30 text-[10px] font-mono text-[#1772e7] truncate">your-app.com/checkout</div>
                    <span className="ml-auto text-[10px] font-semibold text-[#1772e7] uppercase tracking-wide">Checker</span>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <span className="bg-[#aed8ff]/50 border border-[#5eb1ff]/30 rounded-full px-2.5 py-1 text-[10px] font-semibold text-[#66a6dd] uppercase tracking-wide">✓ Login</span>
                    <span className="bg-[#79c0ff]/10 border border-[#79c0ff]/30 rounded-full px-2.5 py-1 text-[10px] font-semibold text-[#79c0ff] uppercase tracking-wide">2 issues</span>
                    <span className="bg-[#1772E7]/10 border border-black/10 rounded-full px-2.5 py-1 text-[10px] font-semibold text-[#1772E7] uppercase tracking-wide">▶ recording</span>
                  </div>
                  <div className="rounded bg-[#1c1c1c] text-[#aed8ff] text-[10px] font-mono px-3 py-2">▶  session.mp4 · 0:42</div>
                </div>
              </div>
              <div className="flex flex-col gap-3 p-3">
                <h3 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: "var(--font-jakarta)" }}>QA Testing</h3>
                <p className="text-xl text-[#8b949e] tracking-tight leading-[1.2]" style={{ fontFamily: "var(--font-jakarta)" }}>Set a goal. The Checker drives your app, records the session, and reports what broke — in plain English with video clips.</p>
              </div>
            </MotionDiv>

            {/* Card 2 — Deep Research */}
            <MotionDiv className="feature-card flex flex-col gap-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="feature-card__preview relative flex items-center justify-center overflow-hidden">
                <div className="bg-white rounded-xl shadow-[0_0_20px_rgba(121,192,255,0.5)] w-full max-w-[420px] h-[140px] overflow-hidden p-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent mix-blend-screen pointer-events-none" />
                  <div className="flex gap-1.5 mb-3">
                    <div className="px-2.5 py-1 rounded-md bg-[#aed8ff]/50 border border-[#5eb1ff]/30 text-[10px] font-mono text-[#1772e7] truncate max-w-[120px]">docs.clerk.com</div>
                    <div className="px-2.5 py-1 rounded-md bg-[#79c0ff]/10 border border-[#79c0ff]/30 text-[10px] font-mono text-[#66a6dd] truncate max-w-[120px]">github.com/...</div>
                    <div className="px-2.5 py-1 rounded-md bg-[#79c0ff]/10 border border-[#79c0ff]/30 text-[10px] font-mono text-[#66a6dd] truncate max-w-[110px]">stackoverflow</div>
                  </div>
                  <div className="bg-[#aed8ff]/30 border border-[#5eb1ff]/20 rounded-lg p-2.5">
                    <p className="text-[11px] text-black/75 leading-tight mb-1.5">&ldquo;The OAuth callback URL must match exactly — trailing slash matters.&rdquo;</p>
                    <p className="text-[10px] font-mono text-[#1772e7]">↳ docs.clerk.com/sso · cited 2 of 4</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 p-3">
                <h3 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: "var(--font-jakarta)" }}>Deep Research</h3>
                <p className="text-xl text-[#8b949e] tracking-tight leading-[1.2]" style={{ fontFamily: "var(--font-jakarta)" }}>An in-app browser the agent can read, click, and cite. No more pasting docs into chat.</p>
              </div>
            </MotionDiv>

            {/* Card 3 — Context Optimization */}
            <MotionDiv className="feature-card flex flex-col gap-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <div className="feature-card__preview relative flex items-center justify-center overflow-hidden">
                <div className="bg-white rounded-xl shadow-[0_0_20px_rgba(121,192,255,0.5)] w-full max-w-[420px] h-[140px] overflow-hidden p-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent mix-blend-screen pointer-events-none" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="font-mono text-[11px] leading-[1.65]">
                      <div className="text-black/45">src/</div>
                      <div className="text-black/45 pl-3">auth/</div>
                      <div className="bg-[#1772e7]/12 text-[#1772e7] font-semibold rounded pl-6 pr-2 -ml-1 inline-block">service.ts <span className="text-[9px] font-medium ml-1 text-[#66a6dd]">0.92 match</span></div>
                      <div className="text-black/25 pl-6">session.ts</div>
                      <div className="text-black/25 pl-6">types.ts</div>
                      <div className="text-black/25 pl-3">api/</div>
                    </div>
                    <div className="bg-[#aed8ff]/40 border border-[#5eb1ff]/30 rounded-lg p-2.5 self-start">
                      <p className="text-[10px] text-black/70 leading-tight">&ldquo;where does login cache user roles?&rdquo;</p>
                      <p className="mt-1.5 text-[9px] text-[#1772e7] font-mono">→ 1 file · 70k tokens</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 p-3">
                <h3 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: "var(--font-jakarta)" }}>Context Optimization</h3>
                <p className="text-xl text-[#8b949e] tracking-tight leading-[1.2]" style={{ fontFamily: "var(--font-jakarta)" }}>LanceDB semantic search and persistent memory. Every prompt gets the right code — not all of it.</p>
              </div>
            </MotionDiv>

            {/* Card 4 — Agent Delegation */}
            <MotionDiv className="feature-card flex flex-col gap-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
              <div className="feature-card__preview relative flex items-center justify-center overflow-hidden">
                <div className="bg-white rounded-xl shadow-[0_0_20px_rgba(121,192,255,0.5)] w-full max-w-[420px] h-[140px] overflow-hidden p-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent mix-blend-screen pointer-events-none" />
                  <div className="flex items-start gap-3">
                    {/* Lead agent — uses same blue chat-bubble style */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="w-8 h-8 rounded-full bg-[#66a6dd] flex items-center justify-center text-[11px] font-bold text-white">A</div>
                      <span className="text-[9px] font-semibold text-[#66a6dd] uppercase tracking-wide">Lead</span>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1">
                      <div className="bg-[#66a6dd] rounded-lg p-1.5 px-2.5 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-white">Sub · fix bug</span>
                        <span className="text-[9px] font-semibold text-[#aed8ff] uppercase tracking-wide">running</span>
                      </div>
                      <div className="bg-white border border-[#5eb1ff]/40 rounded-lg p-1.5 px-2.5 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-[#1c1c1c]">Sub · add tests</span>
                        <span className="text-[9px] font-semibold text-[#79c0ff] uppercase tracking-wide">queued</span>
                      </div>
                      <div className="bg-white border border-[#5eb1ff]/40 rounded-lg p-1.5 px-2.5 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-[#1c1c1c]">Sub · review</span>
                        <span className="text-[9px] font-semibold text-[#79c0ff] uppercase tracking-wide">queued</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#aed8ff]/50 border border-[#5eb1ff]/30 text-[10px] font-semibold text-[#1772e7] uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1772e7]" />
                    Approve sub-agent diffs
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 p-3">
                <h3 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: "var(--font-jakarta)" }}>Agent Delegation</h3>
                <p className="text-xl text-[#8b949e] tracking-tight leading-[1.2]" style={{ fontFamily: "var(--font-jakarta)" }}>Spawn sub-agents in parallel — each with their own session, terminal, and model. Approve tools, merge diffs, ship.</p>
              </div>
            </MotionDiv>
          </div>
        </div>
      </section>

      {/* ═══════════ 3. CLEAN MCP — CONDENSED PROBLEM + SOLUTION ═══════════ */}
      <section id="mcp" className="relative bg-white py-3">
        <div className="mx-2 sm:mx-3 rounded-[24px] sm:rounded-[36px] lg:rounded-[48px] bg-[#1c1c1c] overflow-hidden relative min-h-[705px] h-auto py-16 lg:py-0 lg:h-[705px]">
          {/* Dark gradient bg */}
          <div className="absolute inset-0 opacity-50 overflow-hidden">
            <Image src={`${A}/dark-bg.png`} alt="" fill className="object-cover" />
          </div>
          <div className="relative lg:absolute inset-0 flex items-center justify-center px-5 sm:px-10">
            <div className="w-full max-w-[1280px] flex flex-col lg:flex-row items-center lg:justify-between gap-10 lg:gap-8">
              {/* Left text + bullets + CTA */}
              <MotionDiv
                className="flex flex-col items-start gap-6 md:max-w-[550px] lg:max-w-[600px] xl:max-w-[690px]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <SectionBadge icon="question-icon.svg" label={<><em style={{ fontFamily: "var(--font-display)" }}>Clean MCP</em></>} variant="dark" />
                <h2 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-semibold text-white leading-[1.25] tracking-tight" style={{ fontFamily: "var(--font-jakarta)" }}>
                  One MCP server. <em className="not-italic" style={{ fontFamily: "var(--font-display)" }}>Every agent</em> in sync.
                </h2>
                <p className="text-base sm:text-lg text-white/70 tracking-tight leading-[1.55]" style={{ fontFamily: "var(--font-jakarta)" }}>
                  Index your codebase once. Claude, Cursor, Codex, Windsurf — and any MCP-compatible agent — share the same context. <span className="text-white">50% less spend, 3× faster sessions.</span>
                </p>
                <ul className="flex flex-col gap-2 text-base text-white/85" style={{ fontFamily: "var(--font-jakarta)" }}>
                  <li className="flex items-center gap-2"><span className="text-[#26ce4d]">✓</span> Index once, serve every agent</li>
                  <li className="flex items-center gap-2"><span className="text-[#26ce4d]">✓</span> Works with any MCP-compatible client</li>
                  <li className="flex items-center gap-2"><span className="text-[#26ce4d]">✓</span> Team-wide context sync</li>
                </ul>
                <div className="flex items-center gap-5 pt-2">
                  <BtnJoinWaitlist />
                  <a href="https://docs.tryclean.ai" target="_blank" rel="noopener noreferrer" className="text-base font-semibold text-white/85 hover:text-white tracking-tight transition-colors" style={{ fontFamily: "var(--font-jakarta)" }}>
                    How it <em className="not-italic" style={{ fontFamily: "var(--font-display)" }}>works</em> →
                  </a>
                </div>
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

      {/* ═══════════ 5. ORBIT SECTION (kept) ═══════════ */}
      <OrbitSection />


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
              Ready to ship{" "}
              <em className="font-bold italic" style={{ fontFamily: "var(--font-display)", marginRight: "0.25em" }}>faster</em>
              ?
            </h2>
            <p className="text-sm sm:text-lg text-white/80" style={{ fontFamily: "var(--font-jakarta)" }}>Pick the surface that fits how you work — full app or shared context layer.</p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-center">
              <BtnDownloadMac />
              <a href="/sign-up" className="relative inline-flex items-center justify-center h-[52px] px-8 rounded-[26px] text-white text-[17px] font-semibold tracking-tight transition-all duration-300 hover:scale-[1.02]" style={{ background: "linear-gradient(180deg, #79C0FF 0%, #3B92F3 100%)", border: "2px solid rgba(255,255,255,0.7)", boxShadow: "0px 2px 10px rgba(59,146,243,0.4), inset 0px 4px 12px 1px rgba(255,255,255,0.8), inset 0px -2px 6px rgba(0,50,150,0.3)" }}>
                <span className="relative z-10" style={{ textShadow: "0px 1px 2px rgba(0,60,150,0.5)" }}>Try Clean MCP</span>
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
