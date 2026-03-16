"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import RotatingText from "@/components/RotatingText";

/* ───────────────────────── asset paths ───────────────────────── */
const A = "/landing";

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
    <a href="/waitlist" className={`group relative inline-flex items-center h-[52px] rounded-[26px] text-white text-[17px] font-semibold tracking-tight pl-6 pr-[52px] transition-all duration-300 hover:scale-[1.02] ${className}`} style={{ background: "linear-gradient(180deg, #1A1A1A 0%, #000000 100%)", border: "2px solid rgba(255,255,255,1)", boxShadow: "0px 0px 0px 1px rgba(0,0,0,0.5), inset 0px 2px 10px rgba(255,255,255,0.7), inset 0px -2px 10px rgba(0,0,0,0.8)" }}>
      <span className="relative z-10" style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.5)" }}>Book a Demo</span>
      <span className="absolute right-[6px] top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-white size-10 transition-transform duration-300 group-hover:rotate-45 text-black" style={{ boxShadow: "0px 2px 5px rgba(0,0,0,0.2)" }}>
        <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>
      </span>
    </a>
  );
}

function BtnTryClean() {
  return (
    <a href="/waitlist" className="relative inline-flex items-center justify-center h-[56px] px-10 rounded-full text-white text-[20px] font-semibold tracking-tight transition-all duration-300 hover:scale-[1.02]" style={{ background: "linear-gradient(180deg, #7DC3FC 0%, #60B3F8 100%)", border: "4px solid #DCEFF8", boxShadow: "inset 0px 4px 10px rgba(255,255,255,0.8), inset 0px -3px 6px rgba(20,100,200,0.3)" }}>
      <span className="relative z-10" style={{ textShadow: "0px 1px 2px rgba(20,100,200,0.4)" }}>Try Clean Now</span>
    </a>
  );
}

function BtnJoinWaitlist({ className = "" }: { className?: string }) {
  return (
    <a href="/waitlist" className={`relative inline-flex items-center justify-center h-[52px] px-8 rounded-[26px] text-white text-[17px] font-semibold tracking-tight transition-all duration-300 hover:scale-[1.02] ${className}`} style={{ background: "linear-gradient(180deg, #79C0FF 0%, #3B92F3 100%)", border: "2px solid rgba(255,255,255,0.7)", boxShadow: "0px 2px 10px rgba(59,146,243,0.4), inset 0px 4px 12px 1px rgba(255,255,255,0.8), inset 0px -2px 6px rgba(0,50,150,0.3)" }}>
      <span className="relative z-10" style={{ textShadow: "0px 1px 2px rgba(0,60,150,0.5)" }}>Join Waitlist</span>
    </a>
  );
}

/* ───── Scroll Reveal Text Component ───── */
function ScrollRevealText({
  text,
  baseOverlayColor = "rgba(255,255,255,0.2)",
  activeColor = "#ffffff",
  className = "",
  style = {},
}: {
  text: string;
  baseOverlayColor?: string;
  activeColor?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end 50%"],
  });

  const words = text.split(" ");
  return (
    <h2 ref={containerRef} className={`flex flex-wrap justify-center gap-x-3 gap-y-1 ${className}`} style={style}>
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;
        // The opacity will animate from base (dark/inactive) to full based on scroll position crossing this word
        return (
          <Word key={i} progress={scrollYProgress} range={[start, end]} baseColor={baseOverlayColor} activeColor={activeColor}>
            {word}
          </Word>
        );
      })}
    </h2>
  );
}

function Word({ children, progress, range, baseColor, activeColor }: any) {
  const characters = children.split("");
  const amount = range[1] - range[0];
  const step = amount / children.length;
  return (
    <span className="relative inline-block whitespace-pre">
      <span className="absolute opacity-100" style={{ color: baseColor }}>
        {children}
      </span>
      {characters.map((char: string, i: number) => {
        const start = range[0] + i * step;
        const end = range[0] + (i + 1) * step;
        return (
          <Character key={i} progress={progress} range={[start, end]} activeColor={activeColor}>
            {char}
          </Character>
        );
      })}
    </span>
  );
}

function Character({ children, progress, range, activeColor }: any) {
  const opacity = useTransform(progress, range, [0, 1]);
  return (
    <motion.span className="inline-block relative z-10" style={{ opacity, color: activeColor }}>
      {children}
    </motion.span>
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

/* ───── Before / After Comparison ───── */
function TerminalMockup({ variant }: { variant: "before" | "after" }) {
  const isBefore = variant === "before";
  return (
    <div className="bg-[rgba(255,255,255,0.2)] border border-[rgba(255,255,255,0.1)] rounded-[20px] p-2.5 overflow-hidden">
      <div className="bg-[#0a0a0a] border border-[rgba(54,65,83,0.5)] rounded-lg w-[314px] h-[421px] overflow-hidden relative">
        {/* Header */}
        <div className="bg-[#111] border-b border-[#1e2939] h-[84px] px-3 pt-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#d1d5dc] tracking-tight" style={{ fontFamily: "var(--font-geist-sans)" }}>Claude Code</span>
            <span className="text-[10px] text-[#4a5565]" style={{ fontFamily: "var(--font-geist-sans)" }}>v2.1.39</span>
          </div>
          <p className="text-[10px] text-[#6a7282] mt-0.5" style={{ fontFamily: "var(--font-geist-sans)" }}>Sonnet 4.5 · Claude Pro</p>
          <p className="text-[10px] text-[#4a5565] mt-0.5" style={{ fontFamily: "var(--font-geist-sans)" }}>~/Documents/Code/clean/landing...</p>
          <p className="text-[10px] text-[rgba(255,137,3,0.7)] mt-0.5" style={{ fontFamily: "var(--font-geist-sans)" }}>Opus 4.6 is here · $50 free ex...</p>
        </div>
        {/* Terminal content */}
        <div className="px-3 py-4 text-[11px] leading-[18.7px] font-mono">
          <p className="text-white font-bold">&gt; fix lint errors</p>
          <p className="mt-2 text-[#d1d5dc]">● I&apos;ll fix the lint errors across the project.</p>
          {isBefore ? (
            <>
              <p className="mt-2 text-[#6a7282]">Read src/components/App.tsx</p>
              <p className="text-[#6a7282]">Read src/components/Header.tsx</p>
              <p className="text-[#6a7282]">Read src/utils/helpers.ts</p>
              <p className="text-[#6a7282]">Read src/hooks/useAuth.ts</p>
              <p className="text-[#6a7282]">Read package.json</p>
              <p className="text-[#6a7282]">Read tsconfig.json</p>
            </>
          ) : (
            <>
              <p className="mt-2 text-[#ff8904]">✦ Using Clean MCP context</p>
              <p className="mt-2 text-[#d1d5dc]">Found 3 lint errors.</p>
              <p className="text-[#6a7282]">Fixing...</p>
              <p className="mt-2 text-[#05df72]">✓ Fixed all 3 lint errors</p>
            </>
          )}
        </div>
        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-[#1e2939] px-3 py-2">
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-[#6a7282] font-mono">&gt;</span>
            <span className="text-[11px] text-[#99a1af] font-mono">_</span>
          </div>
          <p className="text-[9px] text-[#6a7282] mt-1" style={{ fontFamily: "var(--font-geist-sans)" }}>
            <span>?</span>
            <span className="text-[#4a5565]"> for shortcuts </span>
            <span className="text-[#ff6467]">Fast mode</span>
            <span className="text-[#4a5565]"> is now available · /fast to turn on</span>
          </p>
          <p className="text-[11px] text-[#99a1af] font-mono mt-1">{isBefore ? "97k" : "70k"} tokens used</p>
        </div>
      </div>
    </div>
  );
}

function DifferencesSection() {
  const [tab, setTab] = useState<"before" | "after">("before");
  const isBefore = tab === "before";
  return (
    <section className="relative bg-white py-3">
      <div className={`mx-3 rounded-[48px] overflow-hidden relative ${isBefore ? "bg-[#1c1c1c]" : "bg-[#E8F4FC]"}`} style={{ height: 705 }}>
        {/* Background */}
        {isBefore ? (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1704px] h-[766px] overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-[#1c1c1c]" />
            <div className="absolute inset-0 opacity-50 overflow-hidden">
              <img
                alt=""
                src={`${A}/dark-bg.png`}
                className="absolute max-w-none pointer-events-none"
                style={{ width: "169.65%", height: "226.58%", left: "-34.82%", top: "-126.58%" }}
              />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img
              alt=""
              src={`${A}/after-background.png`}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        )}
        {/* Watermark text */}
        {isBefore ? (
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
            <span className="text-[200px] font-bold tracking-[-4px] leading-none bg-clip-text text-transparent whitespace-nowrap bg-gradient-to-b from-white to-transparent opacity-50" style={{ fontFamily: "var(--font-jakarta)" }}>
              without clean
            </span>
          </div>
        ) : (
          <div className="absolute top-1/2 -translate-y-1/2" style={{ left: "calc(50% - 684px)" }}>
            <span className="text-[200px] font-bold tracking-[-4px] leading-none bg-clip-text text-transparent whitespace-nowrap" style={{ fontFamily: "var(--font-jakarta)", backgroundImage: "linear-gradient(180deg, #79c0ff 0%, rgba(121,192,255,0) 82.54%)" }}>
              after use clean
            </span>
          </div>
        )}
        {/* Toggle pill */}
        {isBefore ? (
          <div className="absolute left-1/2 -translate-x-1/2 top-[30px] z-20 flex items-center gap-4 backdrop-blur-sm bg-[rgba(255,255,255,0.11)] border border-[#5eb1ff] rounded-full pl-2.5 pr-6 py-2.5">
            <button onClick={() => setTab("before")} className="btn-gradient h-[46px] px-5 py-3 rounded-3xl text-base font-semibold tracking-tight text-white relative overflow-hidden" style={{ fontFamily: "var(--font-jakarta)" }}>
              Before Clean
              <span className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{ boxShadow: "inset 0px 10px 4px 0px rgba(255,255,255,0.25)" }} />
            </button>
            <button onClick={() => setTab("after")} className="text-white text-base font-semibold tracking-tight bg-transparent border-none cursor-pointer" style={{ fontFamily: "var(--font-jakarta)" }}>
              After Clean
            </button>
          </div>
        ) : (
          <div className="absolute left-1/2 -translate-x-1/2 top-[30px] z-20 flex items-center gap-4 backdrop-blur-sm bg-black border border-[#5eb1ff] rounded-full pl-6 pr-2.5 py-2.5">
            <button onClick={() => setTab("before")} className="text-white text-base font-semibold tracking-tight bg-transparent border-none cursor-pointer" style={{ fontFamily: "var(--font-jakarta)" }}>
              Before Clean
            </button>
            <button onClick={() => setTab("after")} className="btn-gradient h-[46px] px-5 py-3 rounded-3xl text-base font-semibold tracking-tight text-white relative overflow-hidden" style={{ fontFamily: "var(--font-jakarta)" }}>
              After Clean
              <span className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{ boxShadow: "inset 0px 10px 4px 0px rgba(255,255,255,0.25)" }} />
            </button>
          </div>
        )}
        {/* Terminal centered */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[31px] z-10">
          <div className="relative">
            {/* Glow behind terminal */}
            <div className="absolute -inset-4 blur-[50px] pointer-events-none" style={{ backgroundImage: isBefore
              ? "radial-gradient(circle, white 10%, #bce0ff 15%, #79c0ff 20%, #5eb1ff 30%, #3b92f3 45%, #2982ed 53%, #1772e7 60%)"
              : "radial-gradient(circle, rgba(255,255,255,0.8) 10%, rgba(188,224,255,0.5) 15%, rgba(121,192,255,0.3) 20%)"
            }} />
            <TerminalMockup variant={tab} />
          </div>
        </div>
      </div>
    </section>
  );
}

function OrbitSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "center center"],
  });
  const orbitRotate = useTransform(scrollYProgress, [0, 1], [30, 0]);

  /* Icon positions from Figma, relative to section center-x.
     Figma section = 1440×800. Icons positioned absolutely within that. */
  const iconClass = "absolute z-10 w-[80px] h-[80px] bg-white border-[8px] border-[#5eb1ff] rounded-full flex items-center justify-center -translate-x-1/2";

  return (
    <section ref={sectionRef} className="relative bg-black rounded-t-[48px] overflow-hidden" style={{ height: 800 }}>
      {/* Text */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 top-[140px] w-[1280px] text-center z-10"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <ScrollRevealText
          text="Enable your coding agents to collaborate seamlessly with a shared context."
          baseOverlayColor="rgba(255, 255, 255, 0.3)"
          activeColor="#ffffff"
          className="text-[56px] font-semibold text-center tracking-[-1.12px] leading-[normal] max-w-[800px] mx-auto justify-center"
          style={{ fontFamily: "var(--font-jakarta)" }}
        />
      </motion.div>

      {/* Bottom ellipse glow — Figma: top 670, 1432×316, centered */}
      <div className="absolute left-1/2 -translate-x-1/2 w-[1433px] h-[316px] pointer-events-none" style={{ top: 670 }}>
        <Image src={`${A}/orbit-ellipse.svg`} alt="" fill className="object-contain" />
      </div>

      {/* Orbit assembly — rotates 30° → 0° on scroll, pivoting from center bottom of the section */}
      <motion.div
        className="absolute inset-0"
        style={{ rotate: orbitRotate, transformOrigin: "50% 100%" }}
      >
        {/* Concentric rings — Figma: 786×690 at (318, 425) in 1440-wide section = centered at ~50% */}
        <div className="absolute left-1/2 -translate-x-1/2 w-[786px] h-[690px]" style={{ top: 425 }}>
          <Image src={`${A}/orbit-rings.svg`} alt="" fill className="object-contain" />
        </div>

        {/* Agent icons — Figma top-left positions with -translate-x/y-1/2 to center on arcs */}
        {/* Windsurf — top center, outermost arc */}
        <div className={iconClass} style={{ left: 'calc(50% - 8px)', top: 385 }}>
          <Image src={`${A}/orbit-agent-windsurf.svg`} alt="Windsurf" width={40} height={40} className="object-contain" />
        </div>
        {/* Cursor — left, 3rd arc */}
        <div className={iconClass} style={{ left: 'calc(50% - 236px)', top: 455 }}>
          <Image src={`${A}/orbit-agent-cursor.svg`} alt="Cursor" width={40} height={40} className="object-contain" />
        </div>
        {/* ChatGPT — right, 3rd arc */}
        <div className={iconClass} style={{ left: 'calc(50% + 218px)', top: 456 }}>
          <Image src={`${A}/orbit-agent-chatgpt.svg`} alt="ChatGPT" width={40} height={40} className="object-contain" />
        </div>
        {/* OpenAI — bottom left, outermost arc */}
        <div className={iconClass} style={{ left: 'calc(50% - 374px)', top: 643 }}>
          <Image src={`${A}/orbit-agent-openai.svg`} alt="OpenAI" width={40} height={40} className="object-contain" />
        </div>
        {/* Codex — bottom right, outermost arc */}
        <div className={iconClass} style={{ left: 'calc(50% + 358px)', top: 643 }}>
          <Image src={`${A}/orbit-agent-cursor.svg`} alt="Cursor" width={40} height={40} className="object-contain" />
        </div>

        {/* Clean App Icon — center bottom of arcs */}
        <div className="absolute left-1/2 -translate-x-1/2 z-20 w-[90px] h-[90px]" style={{ top: 641 }}>
          <Image src={`${A}/orbit-clean.svg`} alt="Clean" fill className="object-contain" />
        </div>
      </motion.div>
    </section>
  );
}

/* ───────────────────────── MAIN PAGE ─────────────────────────── */
export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white">

      {/* ═══════════ 1. HERO SECTION ═══════════ */}
      <section className="relative h-[1024px] w-full bg-white overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-3 rounded-[48px] overflow-hidden">
          <Image src={`${A}/hero-bg.png`} alt="" fill className="object-cover" priority />
          {/* 3D Glass logo */}
          <div className="absolute left-1/2 -translate-x-1/2 top-[402px] w-[962px] h-[950px]">
            <Image src={`${A}/glass-logo.png`} alt="" fill className="object-cover" />
          </div>
        </div>
        {/* Navbar */}
        <nav className="absolute top-[30px] left-[67px] right-[47px] flex items-center justify-between z-10">
          <div className="flex items-center gap-6 text-white text-base font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            <Link href="/pricing" className="hover:opacity-80">Pricing</Link>
            <Link href="/documentation" className="hover:opacity-80">Docs</Link>
            <Link href="/resources" className="hover:opacity-80">Resources</Link>
          </div>
          <Link href="/" className="flex items-center gap-0.5">
            <Image src={`${A}/clean-icon.svg`} alt="" width={24} height={24} />
            <span className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-jakarta)" }}>lean.ai</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/sign-in" className="text-base font-semibold text-white w-[120px] text-center">Sign In</Link>
            <a href="/waitlist" className="group relative inline-flex items-center h-[46px] rounded-full text-white text-[15px] font-semibold tracking-tight pl-5 pr-12 transition-all duration-300 hover:scale-[1.02]" style={{ background: "linear-gradient(180deg, #7DC3FC 0%, #BFE1FA 100%)", border: "3px solid #E8F4FC", boxShadow: "inset 0px 4px 6px rgba(255,255,255,1), 0px 2px 10px rgba(0,0,0,0.1), inset 0px -2px 4px rgba(100,160,240,0.5)" }}>
              <span className="relative z-10" style={{ textShadow: "0px 1px 1px rgba(255,255,255,0.7)", color: "white" }}>Join Waitlist</span>
              <span className="absolute right-[4px] top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-white size-8 transition-transform duration-300 group-hover:rotate-45" style={{ boxShadow: "0px 2px 4px rgba(0,0,0,0.1)" }}>
                <svg className="w-3.5 h-3.5 text-[#1772e7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>
              </span>
            </a>
          </div>
        </nav>
        {/* Hero content */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 top-[182px] flex flex-col items-center gap-6 w-[603px] z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex flex-col items-center">
            <p className="text-[32px] font-semibold text-white text-center tracking-tight" style={{ fontFamily: "var(--font-jakarta)" }}>
              Stop burning <em className="not-italic" style={{ fontFamily: "var(--font-display)" }}>tokens</em>
            </p>
            <p className="text-[64px] font-semibold text-white text-center tracking-tight leading-tight" style={{ fontFamily: "var(--font-jakarta)" }}>
              Sync context across
            </p>
            {/* Rotating large text */}
            <div className="h-[145px] flex items-center justify-center">
              <RotatingText
                texts={["agents", "engineers", "codebases"]}
                mainClassName="text-[140px] font-bold tracking-[-4px] inline-flex items-center justify-center"
                style={{ fontFamily: "var(--font-display)" }}
                elementLevelClassName="gradient-text-hero"
                staggerFrom="last"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-120%" }}
                staggerDuration={0.025}
                splitLevelClassName="overflow-hidden"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                rotationInterval={2500}
              />
            </div>
            <BtnBookDemo />
          </div>
          <p className="text-xl font-semibold text-white text-center tracking-tight" style={{ fontFamily: "var(--font-jakarta)" }}>
            Every agent synced. 50% less spend, 3x faster.
          </p>
        </motion.div>
      </section>

      {/* ═══════════ 2. PROBLEM SECTION ═══════════ */}
      <section className="relative bg-white py-3">
        <div className="mx-3 rounded-[48px] bg-[#1c1c1c] overflow-hidden relative" style={{ height: 705 }}>
          {/* Dark gradient bg */}
          <div className="absolute inset-0 opacity-50 overflow-hidden">
            <Image src={`${A}/dark-bg.png`} alt="" fill className="object-cover" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[1280px] flex items-center justify-between">
              {/* Left text */}
              <motion.div
                className="flex flex-col gap-6 max-w-[667px]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <SectionBadge icon="question-icon.svg" label={<>The <em style={{ fontFamily: "var(--font-display)" }}>Problem</em></>} variant="dark" />
                <h2 className="text-5xl font-semibold text-white leading-[60px] tracking-tight" style={{ fontFamily: "var(--font-jakarta)" }}>
                  Every agent <em className="not-italic" style={{ fontFamily: "var(--font-display)" }}>re-reads</em> your{"\n"}entire codebase. <em className="not-italic" style={{ fontFamily: "var(--font-display)" }}>Every time</em>.
                </h2>
              </motion.div>
              {/* Right chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 }}
              >
                <div className="relative">
                  <div className="absolute inset-0 blur-[50px] mix-blend-plus-lighter" style={{ backgroundImage: "radial-gradient(circle, white 10%, #bce0ff 15%, #79c0ff 20%, #5eb1ff 30%, #3b92f3 45%, #2982ed 53%, #1772e7 60%)" }} />
                  <div className="relative bg-white/20 border border-white/10 rounded-[20px] p-2.5 overflow-hidden">
                    <div className="bg-[#1a1a1a] rounded-2xl w-[448px] h-[408px] p-8 overflow-hidden">
                      <p className="text-[12px] text-white uppercase tracking-[0.6px] mb-6" style={{ fontFamily: "var(--font-jakarta)" }}>Avg. tokens burned per coding session</p>
                      {[
                        { label: "Claude Code", tokens: 250, pct: 100 },
                        { label: "Cursor", tokens: 200, pct: 80 },
                        { label: "Codex", tokens: 180, pct: 72 },
                        { label: "Windsurf", tokens: 170, pct: 68 },
                      ].map((item) => (
                        <div key={item.label} className="mb-4">
                          <div className="flex justify-between mb-1.5">
                            <span className="text-sm text-[#d1d5dc]" style={{ fontFamily: "var(--font-display)" }}>{item.label}</span>
                            <span className="text-sm text-white text-right" style={{ fontFamily: "var(--font-display)" }}>{item.tokens}k</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/10">
                            <motion.div
                              className="h-full rounded-full bg-white"
                              initial={{ width: 0 }}
                              whileInView={{ width: `${item.pct}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.8 }}
                            />
                          </div>
                        </div>
                      ))}
                      <div className="border-t border-[#1e2939] my-2" />
                      <p className="text-[10px] text-white uppercase tracking-[0.5px] mb-3" style={{ fontFamily: "var(--font-jakarta)" }}>With Clean</p>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-sm font-bold text-[#05df72]" style={{ fontFamily: "var(--font-display)" }}>Any agent</span>
                        <span className="text-sm text-[#05df72]" style={{ fontFamily: "var(--font-display)" }}>70k</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10">
                        <motion.div className="h-full rounded-full bg-[#05df72]" initial={{ width: 0 }} whileInView={{ width: "28%" }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.4 }} />
                      </div>
                      <p className="mt-5 text-xs text-white">Same models. <em style={{ fontFamily: "var(--font-display)" }}>Better results.</em> It&apos;s the context.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ 3. CONTEXT SECTION ═══════════ */}
      <section className="relative bg-white px-[68px] py-[169px]" style={{ height: 705 }}>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <div className="flex mb-4">
            <ScrollRevealText
              text="Every AI coding tool uses the same models."
              baseOverlayColor="rgba(28, 28, 28, 0.4)"
              activeColor="#1c1c1c"
              className="text-5xl font-semibold tracking-tight leading-[60px] justify-start"
              style={{ fontFamily: "var(--font-jakarta)" }}
            />
          </div>
          <div className="flex items-center gap-3 mb-8">
            <div className="flex -space-x-5">
              {["claude-frame.svg", "cursor-icon.png", "openai-icon.svg", "codex-frame.svg", "claude-frame.svg"].map((img, i) => (
                <div key={i} className="w-20 h-20 rounded-full bg-white border-8 border-[#5eb1ff] flex items-center justify-center overflow-hidden">
                  <Image src={`${A}/${img}`} alt="" width={40} height={40} className="object-contain" />
                </div>
              ))}
            </div>
            <ScrollRevealText
              text="The difference is context."
              baseOverlayColor="rgba(28, 28, 28, 0.4)"
              activeColor="#1c1c1c"
              className="text-5xl font-semibold tracking-tight m-0 justify-start"
              style={{ fontFamily: "var(--font-jakarta)" }}
            />
          </div>
          <div className="flex justify-start">
            <ScrollRevealText
              text="Without shared context, each agent burns through hundreds of thousands of tokens re-exploring code that another agent already understood."
              baseOverlayColor="rgba(28, 28, 28, 0.4)"
              activeColor="#1c1c1c"
              className="text-5xl font-semibold tracking-tight leading-[60px] max-w-[1304px] text-left justify-start"
              style={{ fontFamily: "var(--font-jakarta)" }}
            />
          </div>
        </motion.div>
      </section>

      {/* ═══════════ 4. ORBIT SECTION ═══════════ */}
      <OrbitSection />


      {/* ═══════════ 5. SOLUTION SECTION ═══════════ */}
      <section className="relative rounded-t-[48px] -mt-12 overflow-hidden bg-gradient-to-b from-[#e3f2fd] to-white" style={{ minHeight: 1466 }}>
        {/* "clean" watermark */}
        <div className="absolute top-[180px] left-0 right-0 flex justify-center pointer-events-none select-none">
          <span className="watermark-text text-[460px] font-bold tracking-[-12px] leading-none" style={{ fontFamily: "var(--font-jakarta)" }}>clean</span>
        </div>
        {/* Blue arc */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[480px] w-[2000px] h-[2000px] pointer-events-none">
          <Image src={`${A}/solution-arc.svg`} alt="" fill className="object-contain" />
        </div>
        {/* Clean app icon */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[290px] w-[180px] h-[180px] z-10 drop-shadow-[0_10px_30px_rgba(102,166,221,0.5)]">
          <Image src={`${A}/clean-app-icon.svg`} alt="" fill className="object-contain" />
        </div>
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center pt-[500px] px-[81px] w-[1280px] mx-auto gap-6">
          <SectionBadge icon="ai-idea-icon.svg" label={<>The <em style={{ fontFamily: "var(--font-display)" }}>Solutions</em></>} />
          <h2 className="text-[44px] font-semibold text-[#1c1c1c] text-center tracking-tight leading-[54px]" style={{ fontFamily: "var(--font-jakarta)" }}>
            One <span className="gradient-text-blue">MCP server</span> that pre-indexes your<br />codebase and <span className="text-[#66a6dd]">syncs context</span> across<br />every agent your team uses
          </h2>
          <div className="mt-6">
            <FlowDiagram step={3} />
          </div>
          <div className="flex flex-col items-center gap-1 mt-6">
            <p className="text-lg font-semibold text-[#79c0ff] uppercase" style={{ fontFamily: "var(--font-jakarta)" }}>
              See how clean <em style={{ fontFamily: "var(--font-display)" }}>works</em>
            </p>
            <div className="w-px h-5 bg-[#79c0ff]" />
          </div>
        </div>
      </section>

      {/* ═══════════ 6-8. STEPS SECTIONS ═══════════ */}
      {[
        { num: "01", label: "Connect Once", heading: "Point Clean\nat your codebase.", desc: "We index everything intelligently—structure, patterns, dependencies.", step: 1 as const, img: "step01-container.png" },
        { num: "02", label: "Use Any Agent", heading: "Claude, Cursor, Codex", desc: "—doesn't matter. They all tap into the same pre-built", step: 2 as const, img: "step02-container.png" },
        { num: "03", label: "Stay in Sync", heading: "With Team", desc: "Your whole team shares the same codebase understanding.\nNo more repeated explanations.", step: 3 as const, img: "step03-container.png" },
      ].map((s) => (
        <section key={s.num} className="relative bg-white py-3">
          <div className="mx-3 rounded-[48px] overflow-hidden relative" style={{ height: 705 }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[1280px] flex items-center justify-between">
                {/* Left — step content */}
                <motion.div
                  className="flex gap-12 items-stretch"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  {/* Step number + line */}
                  <div className="flex flex-col items-center gap-1 py-12">
                    <span className="text-lg font-semibold text-[#66a6dd] uppercase">{s.num}</span>
                    <div className="step-line flex-1 w-[3px] rounded-full" />
                    <span className="text-lg text-[#1c1c1c] opacity-10 uppercase">03</span>
                  </div>
                  {/* Text */}
                  <div className="flex flex-col gap-6 justify-center py-12 max-w-[531px]">
                    <span className="gradient-text-blue text-xl font-bold uppercase" style={{ fontFamily: "var(--font-display)" }}>{s.label}</span>
                    <h3 className="text-5xl font-bold text-[#1c1c1c] leading-[60px] whitespace-pre-line" style={{ fontFamily: "var(--font-jakarta)" }}>{s.heading}</h3>
                    <p className="text-lg text-[#8b949e] tracking-tight leading-[29px] whitespace-pre-line" style={{ fontFamily: "var(--font-jakarta)" }}>{s.desc}</p>
                    <BtnTryClean />
                  </div>
                </motion.div>
                {/* Right — flow diagram */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                >
                  <FlowDiagram step={s.step} />
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* ═══════════ 9. FEATURES SECTION ═══════════ */}
      <section className="relative bg-white py-24 overflow-hidden">
        {/* Graph decoration at top */}
        <div className="absolute top-[-29px] left-0 right-0 h-[262px] overflow-hidden opacity-30">
          {/* Placeholder for the line graph decoration */}
        </div>
        <div className="relative mx-auto max-w-[1280px] px-20">
          <motion.div
            className="flex flex-col items-center gap-3 mb-9"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <SectionBadge icon="rocket-icon.svg" label="Features" />
            <h2 className="text-5xl font-semibold text-[#1c1c1c] text-center tracking-tight" style={{ fontFamily: "var(--font-jakarta)" }}>
              Clean got all you need!
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 gap-7">
            {/* Card 1: Team Alignment */}
            <motion.div className="feature-card flex flex-col gap-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="feature-card__preview relative">
                <Image src={`${A}/feature-team.png`} alt="" fill className="object-cover rounded-[20px]" />
              </div>
              <div className="flex flex-col gap-3 p-3">
                <h3 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: "var(--font-jakarta)" }}>Team Alignment</h3>
                <p className="text-xl text-[#8b949e] tracking-tight leading-[1.2]" style={{ fontFamily: "var(--font-jakarta)" }}>Share context across your entire team. Everyone&apos;s agents speak the same language.</p>
              </div>
            </motion.div>

            {/* Card 2: One-time Setup */}
            <motion.div className="feature-card flex flex-col gap-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="feature-card__preview relative flex items-center justify-center">
                {/* Setup preview mockup */}
                <div className="bg-white rounded-xl shadow-[0_0_20px_rgba(121,192,255,0.5)] w-[406px] h-[140px] overflow-hidden p-4">
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
            </motion.div>

            {/* Card 3: Universal Compatibility */}
            <motion.div className="feature-card flex flex-col gap-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <div className="feature-card__preview relative flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-[0_0_20px_rgba(121,192,255,0.5)] w-[416px] h-[140px] overflow-hidden p-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent mix-blend-screen" />
                  <p className="text-xs font-semibold text-black/70 tracking-wide mb-3">Choose any agent</p>
                  <span className="absolute top-4 right-4 bg-[#09463f]/10 border border-black/10 rounded-full px-3 py-1 text-[10px] font-semibold text-[#09463f]">MCP</span>
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
            </motion.div>

            {/* Card 4: Synced Context */}
            <motion.div className="feature-card flex flex-col gap-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
              <div className="feature-card__preview relative flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-[0_0_20px_rgba(121,192,255,0.5)] w-[419px] h-[140px] overflow-hidden p-4">
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
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ 10. DIFFERENCES (BEFORE / AFTER) ═══════════ */}
      <DifferencesSection />

      {/* ═══════════ 11. IMPACT / STATS SECTION ═══════════ */}
      <section className="relative bg-white rounded-t-[48px] overflow-hidden" style={{ height: 917 }}>
        {/* Light gradient bg */}
        <div className="absolute inset-0 opacity-50 overflow-hidden" style={{ transform: "rotate(180deg)" }}>
          <Image src={`${A}/stats-bg.png`} alt="" fill className="object-cover" />
        </div>
        {/* "impact" watermark */}
        <div className="absolute left-[50px] top-[-16px]">
          <span className="watermark-text text-[400px] font-bold tracking-[-8px] leading-none" style={{ fontFamily: "var(--font-jakarta)" }}>impact</span>
        </div>
        {/* Stat cards */}
        <motion.div
          className="absolute left-[42px] top-[369px] right-[42px] flex gap-6 uppercase"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="stat-card flex-1 bg-[#1772e7] h-[506px] text-white">
            <span className="stat-number block text-[164px] font-bold leading-none tracking-[-13px]" style={{ fontFamily: "var(--font-jakarta)" }}>50%</span>
            <span className="absolute bottom-[17px] left-[17px] text-xl" style={{ fontFamily: "var(--font-jakarta)" }}>less token spend</span>
          </div>
          <div className="stat-card flex-1 bg-[#66a6dd] h-[506px] text-white">
            <span className="stat-number block text-[164px] font-bold leading-none tracking-[-13px]" style={{ fontFamily: "var(--font-jakarta)" }}>3x</span>
            <span className="absolute bottom-[17px] left-[17px] text-xl" style={{ fontFamily: "var(--font-jakarta)" }}>faster sessions</span>
          </div>
          <div className="stat-card flex-1 bg-white border border-[#5eb1ff] h-[506px] text-[#1772e7]">
            <span className="stat-number block text-[164px] font-bold leading-none" style={{ fontFamily: "var(--font-jakarta)" }}>1</span>
            <span className="absolute bottom-[17px] left-[17px] text-xl" style={{ fontFamily: "var(--font-jakarta)" }}>MCP to rule them all</span>
          </div>
        </motion.div>
      </section>

      {/* ═══════════ 11. CTA SECTION ═══════════ */}
      <section className="relative overflow-hidden" style={{ height: 1043, background: "radial-gradient(80% 100% at 0% 50%, rgba(0, 110, 255, 0.6) 0%, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 1) 100%)" }}>
        {/* Dark bg pattern */}
        <div className="absolute inset-0 opacity-50 overflow-hidden">
          <Image src={`${A}/cta-dark-bg.png`} alt="" fill className="object-cover" />
        </div>
        {/* 3D Glass logo */}
        <div className="absolute left-[-28px] top-[50px] w-[658px] h-[764px]">
          <Image src={`${A}/cta-glass-logo.png`} alt="" fill className="object-contain" />
        </div>
        {/* CTA content */}
        <motion.div
          className="absolute left-[720px] top-[276px] flex flex-col gap-8 w-[698px]"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-[80px] text-white leading-none tracking-[-3.2px]" style={{ fontFamily: "var(--font-jakarta)" }}>
            Ready to stop <em className="not-italic font-bold" style={{ fontFamily: "var(--font-display)" }}>burning</em> tokens?
          </h2>
          <p className="text-lg text-white" style={{ fontFamily: "var(--font-jakarta)" }}>Join teams saving thousands on AI agent costs every month.</p>
          <div className="flex gap-8">
            <BtnBookDemo />
            <BtnJoinWaitlist />
          </div>
        </motion.div>
      </section>

      {/* ═══════════ 12. FOOTER ═══════════ */}
      <footer className="relative bg-white rounded-t-[72px] overflow-hidden" style={{ height: 279 }}>
        {/* Footer gradient bg */}
        <div className="absolute inset-0 opacity-50 overflow-hidden" style={{ transform: "rotate(180deg)" }}>
          <Image src={`${A}/footer-bg.png`} alt="" fill className="object-cover" />
        </div>
        {/* "clean" gradient text */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[45px]">
          <span className="text-[176px] font-bold tracking-[-3.5px] bg-clip-text text-transparent leading-none" style={{
            fontFamily: "var(--font-jakarta)",
            backgroundImage: "radial-gradient(ellipse at center, #c7e5f3 0%, #79c0ff 32%, #118cff 77%, #063460 91%, #000 100%)"
          }}>clean</span>
        </div>
        {/* Footer nav */}
        <div className="absolute left-[57px] right-[57px] bottom-[51px] flex items-center justify-between">
          <div className="flex gap-6 text-base text-[#1c1c1c] tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            <Link href="/documentation" className="hover:opacity-70">Docs</Link>
            <a href="#" className="hover:opacity-70">GitHub</a>
            <a href="#" className="hover:opacity-70">Contact</a>
          </div>
          <span className="text-sm text-[#1c1c1c]" style={{ fontFamily: "var(--font-display)" }}>2026 Clean. All rights reserved.</span>
        </div>
      </footer>

    </div>
  );
}
