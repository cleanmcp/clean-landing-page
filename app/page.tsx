"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import RotatingText from "@/components/RotatingText";
import ScrollStack, { ScrollStackItem } from "@/components/ScrollStack";

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
    <a href="/waitlist" className="relative inline-flex items-center justify-center h-[44px] md:h-[48px] lg:h-[56px] px-6 md:px-8 lg:px-10 rounded-full text-white text-[15px] md:text-[17px] lg:text-[20px] font-semibold tracking-tight transition-all duration-300 hover:scale-[1.02] whitespace-nowrap" style={{ background: "linear-gradient(180deg, #7DC3FC 0%, #60B3F8 100%)", border: "4px solid #DCEFF8", boxShadow: "inset 0px 4px 10px rgba(255,255,255,0.8), inset 0px -3px 6px rgba(20,100,200,0.3)" }}>
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

/* ───── Sticky Glass Navbar ───── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between transition-all duration-500 px-4 py-3 sm:px-8 sm:py-4 lg:px-[67px] lg:py-[30px]"
        initial={false}
        animate={scrolled ? {
          paddingLeft: 48,
          paddingRight: 48,
          paddingTop: 12,
          paddingBottom: 12,
        } : undefined}
      >
        {/* Glass background — fades in on scroll */}
        <motion.div
          className="absolute inset-0 rounded-b-[24px] border-b border-white/20 pointer-events-none"
          style={{
            backdropFilter: scrolled ? "blur(24px) saturate(1.6)" : "none",
            WebkitBackdropFilter: scrolled ? "blur(24px) saturate(1.6)" : "none",
            background: scrolled
              ? "linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.25) 100%)"
              : "transparent",
            boxShadow: scrolled
              ? "0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.08)"
              : "none",
            opacity: scrolled ? 1 : 0,
            transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        {/* Center — logo */}
        <Link href="/" className="relative z-10 flex items-center gap-0.5">
          <Image src={`${A}/clean-icon.svg`} alt="" width={24} height={24} />
          <span className="text-lg sm:text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-jakarta)" }}>lean.ai</span>
        </Link>

        {/* Right — actions */}
        <div className="relative z-10 flex items-center gap-2 sm:gap-6">
          <Link href="/sign-in" className="text-sm sm:text-base font-semibold text-white hover:opacity-80 transition-opacity">Sign In</Link>
          <a href="/waitlist" className="group relative inline-flex items-center h-[40px] sm:h-[46px] rounded-full text-white text-[13px] sm:text-[15px] font-semibold tracking-tight pl-4 sm:pl-5 pr-10 sm:pr-12 transition-all duration-300 hover:scale-[1.02]" style={{ background: "linear-gradient(180deg, #7DC3FC 0%, #BFE1FA 100%)", border: "3px solid #E8F4FC", boxShadow: "inset 0px 4px 6px rgba(255,255,255,1), 0px 2px 10px rgba(0,0,0,0.1), inset 0px -2px 4px rgba(100,160,240,0.5)" }}>
            <span className="relative z-10" style={{ textShadow: "0px 1px 1px rgba(255,255,255,0.7)", color: "white" }}>Join Waitlist</span>
            <span className="absolute right-[4px] top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-white size-7 sm:size-8 transition-transform duration-300 group-hover:rotate-45" style={{ boxShadow: "0px 2px 4px rgba(0,0,0,0.1)" }}>
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#1772e7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>
            </span>
          </a>
        </div>
      </motion.nav>
    </>
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

function Word({ children, progress, range, baseColor, activeColor }: { children: string; progress: MotionValue<number>; range: [number, number]; baseColor: string; activeColor: string }) {
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

function Character({ children, progress, range, activeColor }: { children: string; progress: MotionValue<number>; range: [number, number]; activeColor: string }) {
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
    <div className={`rounded-[20px] p-2.5 overflow-hidden ${isBefore ? "bg-[rgba(255,255,255,0.2)] border border-[rgba(255,255,255,0.1)]" : "bg-[rgba(0,0,0,0.15)] border border-[rgba(94,177,255,0.3)] shadow-[0_0_30px_rgba(59,146,243,0.15)]"}`}>
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
          <p className="text-[11px] text-[#99a1af] font-mono mt-1">{isBefore ? "140k" : "70k"} tokens used</p>
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
      <div className={`mx-2 sm:mx-3 rounded-[24px] sm:rounded-[36px] lg:rounded-[48px] overflow-hidden relative ${isBefore ? "bg-[#1c1c1c]" : "bg-[#E8F4FC]"} min-h-[550px] sm:min-h-[650px] lg:min-h-[705px]`} style={{ height: 705 }}>
        {/* Background */}
        {isBefore ? (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-[#1c1c1c]" />
            <div className="absolute inset-0 opacity-50 overflow-hidden">
              <img
                alt=""
                src={`${A}/dark-bg.png`}
                className="absolute max-w-none pointer-events-none object-cover"
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
            <span className="text-[80px] sm:text-[140px] lg:text-[200px] font-bold tracking-[-2px] sm:tracking-[-4px] leading-none bg-clip-text text-transparent whitespace-nowrap bg-gradient-to-b from-white to-transparent opacity-50" style={{ fontFamily: "var(--font-jakarta)", wordSpacing: "0.75em" }}>
              before clean
            </span>
          </div>
        ) : (
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
            <span className="text-[80px] sm:text-[140px] lg:text-[200px] font-bold tracking-[-2px] sm:tracking-[-4px] leading-none bg-clip-text text-transparent whitespace-nowrap" style={{ fontFamily: "var(--font-jakarta)", backgroundImage: "linear-gradient(180deg, #79c0ff 0%, rgba(121,192,255,0) 82.54%)", wordSpacing: "0.95em" }}>
              after clean
            </span>
          </div>
        )}
        {/* Toggle pill */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[30px] z-20 flex items-center p-1.5 backdrop-blur-md bg-black/40 border border-white/20 rounded-full w-[280px] sm:w-[360px] h-[52px] sm:h-[64px]">
          <div className="relative flex w-full h-full items-center">
            {/* Animated Background Highlight */}
            <motion.div
              className="absolute h-full rounded-full btn-gradient"
              animate={{
                x: isBefore ? 0 : "100%",
                width: "50%"
              }}
              transition={{ type: "tween", duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* Buttons */}
            <button
              onClick={() => setTab("before")}
              className={`relative z-10 flex-1 h-full text-base font-semibold tracking-tight transition-colors duration-300 ${isBefore ? "text-white" : "text-white/60"} flex items-center justify-center cursor-pointer`}
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Before Clean
            </button>
            <button
              onClick={() => setTab("after")}
              className={`relative z-10 flex-1 h-full text-base font-semibold tracking-tight transition-colors duration-300 ${!isBefore ? "text-white" : "text-white/60"} flex items-center justify-center cursor-pointer`}
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              After Clean
            </button>
          </div>
        </div>
        {/* Terminal centered */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[31px] z-10">
          <div className="relative">
            {/* Glow behind terminal */}
            <div className="absolute -inset-4 blur-[50px] pointer-events-none" style={{
              backgroundImage: isBefore
                ? "radial-gradient(circle, white 10%, #bce0ff 15%, #79c0ff 20%, #5eb1ff 30%, #3b92f3 45%, #2982ed 53%, #1772e7 60%)"
                : "radial-gradient(circle, white 10%, #d2e9ff 15%, #aed8ff 20%, #79c0ff 30%, #5eb1ff 50%, #79c0ff 70%)"
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
  const orbitRotate = useTransform(scrollYProgress, [0, 1], [15, 0]);

  const iconClass = "absolute z-10 w-[80px] h-[80px] bg-white border-[8px] border-[#5eb1ff] rounded-full flex items-center justify-center -translate-x-1/2";

  return (
    <section ref={sectionRef} className="relative bg-black rounded-t-[24px] sm:rounded-t-[36px] lg:rounded-t-[48px] overflow-hidden h-[500px] sm:h-[600px] lg:h-[800px]">
      {/* Text — lives outside the scale wrapper so it sizes independently */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 top-[40px] sm:top-[60px] lg:top-[140px] w-full max-w-[1280px] px-5 text-center z-10"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <ScrollRevealText
          text="Enable your coding agents to collaborate seamlessly with a shared context."
          baseOverlayColor="rgba(255, 255, 255, 0.3)"
          activeColor="#ffffff"
          className="text-[24px] sm:text-[36px] lg:text-[56px] font-semibold text-center tracking-[-1.12px] leading-[1.2] sm:leading-[normal] max-w-[340px] sm:max-w-[600px] lg:max-w-[800px] mx-auto justify-center"
          style={{ fontFamily: "var(--font-jakarta)" }}
        />
      </motion.div>

      {/* Orbit visuals — scale wrapper only around the orbit, not the text */}
      <div
        className="absolute bottom-[8px] left-1/2 -translate-x-1/2 w-[1440px] h-[800px] scale-[0.65] sm:scale-[0.8] lg:scale-100"
        style={{ transformOrigin: "50% 100%" }}
      >
        {/* Radial glow behind the rings */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[236px] w-[994px] h-[564px] pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src={`${A}/orbit-glow.svg`} className="w-full h-full" />
        </div>

        {/* Bottom ellipse glow */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[1440px] h-[223px] pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src={`${A}/orbit-ellipse-glow.svg`} className="w-full h-full" />
        </div>

        {/* Orbit assembly */}
        <motion.div
          className="absolute inset-0"
          style={{ rotate: orbitRotate, transformOrigin: "50% 80%" }}
        >
          <div className="absolute left-1/2 -translate-x-1/2 w-[786px] h-[690px]" style={{ top: 425 }}>
            <Image src={`${A}/orbit-rings.svg`} alt="" fill className="object-contain" />
          </div>

          <div className={iconClass} style={{ left: 'calc(50% - 8px)', top: 385 }}>
            <Image src={`${A}/claude-icon.svg`} alt="Claude" width={40} height={40} className="object-contain" />
          </div>
          <div className={iconClass} style={{ left: 'calc(50% - 236px)', top: 455 }}>
            <Image src={`${A}/cursor-icon.svg`} alt="Cursor" width={40} height={40} className="object-contain" />
          </div>
          <div className={iconClass} style={{ left: 'calc(50% + 218px)', top: 456 }}>
            <Image src={`${A}/antigravity-icon.png`} alt="ChatGPT" width={40} height={40} className="object-contain" />
          </div>
          <div className={iconClass} style={{ left: 'calc(50% - 374px)', top: 643 }}>
            <Image src={`${A}/windsurf-icon.svg`} alt="Windsurf" width={40} height={40} className="object-contain" />
          </div>
          <div className={iconClass} style={{ left: 'calc(50% + 358px)', top: 643 }}>
            <Image src={`${A}/openai-icon.svg`} alt="OpenAI" width={40} height={40} className="object-contain" />
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 z-20 w-[90px] h-[90px]" style={{ top: 641 }}>
            <Image src={`${A}/orbit-clean.svg`} alt="Clean" fill className="object-contain" />
          </div>

        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────── MAIN PAGE ─────────────────────────── */
export default function Home() {
  return (
    <div className="relative min-h-screen bg-white" style={{ overflowX: 'clip' }}>
      <Navbar />

      {/* ═══════════ 1. HERO SECTION ═══════════ */}
      <section className="relative h-[600px] sm:h-[800px] lg:h-[1024px] w-full bg-white overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-2 sm:inset-3 rounded-[24px] sm:rounded-[36px] lg:rounded-[48px] overflow-hidden">
          <Image src={`${A}/hero-bg.png`} alt="" fill className="object-cover" priority />
          {/* 3D Glass logo */}
          <div className="absolute left-1/2 -translate-x-1/2 top-[320px] sm:top-[420px] w-[500px] h-[500px] sm:w-[962px] sm:h-[950px]">
            <Image src={`${A}/glass-logo.png`} alt="" fill className="object-cover" />
          </div>
        </div>
        {/* Navbar placeholder — actual navbar is fixed/sticky, rendered outside hero */}
        <div className="h-[60px] sm:h-[76px]" />
        {/* Hero content */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 top-[120px] sm:top-[150px] lg:top-[182px] flex flex-col items-center gap-4 sm:gap-6 w-full max-w-[603px] px-5 z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex flex-col items-center">
            <p className="text-[20px] sm:text-[26px] lg:text-[32px] font-semibold text-white text-center tracking-tight" style={{ fontFamily: "var(--font-jakarta)" }}>
              Stop burning <em className="not-italic" style={{ fontFamily: "var(--font-display)" }}>tokens</em>
            </p>
            <p className="text-[32px] sm:text-[48px] lg:text-[64px] font-semibold text-white text-center tracking-tight leading-tight" style={{ fontFamily: "var(--font-jakarta)" }}>
              Sync context across
            </p>
            {/* Rotating large text */}
            <div className="h-[80px] sm:h-[120px] lg:h-[165px] flex items-end justify-center overflow-hidden min-w-[320px] sm:min-w-[540px] lg:min-w-[750px]">
              <RotatingText
                texts={["agents", "engineers", "codebases"]}
                mainClassName="text-[60px] sm:text-[100px] lg:text-[140px] font-bold tracking-[-2px] sm:tracking-[-4px] inline-flex items-center justify-center"
                style={{ fontFamily: "var(--font-display)" }}
                elementLevelClassName="gradient-text-hero"
                staggerFrom="last"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-100%" }}
                staggerDuration={0.025}
                splitLevelClassName="overflow-hidden"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                rotationInterval={2500}
              />
            </div>
            <BtnBookDemo />
          </div>
          <p className="text-base sm:text-xl font-semibold text-white text-center tracking-tight" style={{ fontFamily: "var(--font-jakarta)" }}>
            Every agent synced. 50% less spend, 3x faster.
          </p>
        </motion.div>
      </section>

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
              <motion.div
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
              </motion.div>
              {/* Right chart */}
              <motion.div
                className="w-full max-w-[448px] lg:w-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 }}
              >
                <div className="relative">
                  <div className="absolute inset-0 blur-[50px] mix-blend-plus-lighter" style={{ backgroundImage: "radial-gradient(circle, white 10%, #bce0ff 15%, #79c0ff 20%, #5eb1ff 30%, #3b92f3 45%, #2982ed 53%, #1772e7 60%)" }} />
                  <div className="relative bg-white/20 border border-white/10 rounded-[20px] p-2.5 overflow-hidden">
                    <div className="bg-[#1a1a1a] rounded-2xl w-full h-auto p-6 sm:p-8 overflow-hidden">
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
      <section className="relative bg-white px-5 py-20 sm:px-10 sm:py-28 lg:px-[68px] lg:py-[169px]">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
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
              text="Without shared context, each agent burns through hundreds of thousands of tokens re-exploring code that another agent already understood."
              baseOverlayColor="rgba(28, 28, 28, 0.4)"
              activeColor="#1c1c1c"
              className="text-2xl sm:text-3xl lg:text-5xl font-semibold tracking-tight leading-[1.25] max-w-[1304px] text-left justify-start"
              style={{ fontFamily: "var(--font-jakarta)" }}
            />
          </div>
        </motion.div>
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
            <span className="text-[#66a6dd]">syncs context</span>
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
          { num: "02", label: "Use Any Agent", heading: "Claude, Cursor, Codex", desc: "—doesn't matter. They all tap into the same pre-built", step: 2 as const },
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
                        <BtnTryClean />
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
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
            </motion.div>

            {/* Card 3: Universal Compatibility */}
            <motion.div className="feature-card flex flex-col gap-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
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
            </motion.div>

            {/* Card 4: Synced Context */}
            <motion.div className="feature-card flex flex-col gap-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
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
            </motion.div>
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
        <motion.div
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
        </motion.div>
      </section>

      {/* ═══════════ 11. CTA + 12. FOOTER ═══════════ */}
      <div className="relative flex flex-col items-start">
        {/* CTA */}
        <section className="relative overflow-hidden w-full z-0 lg:min-h-[950px]" style={{ background: "linear-gradient(180deg, #000 0%, #666 100%)" }}>
          {/* V3 dark bg layer */}
          <div className="absolute inset-0 bg-black pointer-events-none" />
          {/* Intersect — large circular cutout shape on left */}
          <div className="absolute pointer-events-none hidden lg:block" style={{ left: '-51.5%', top: '2%', width: '138%', height: '210%' }}>
            <img alt="" src={`${A}/cta-intersect.svg`} className="w-full h-full" style={{ transform: "rotate(90deg) scaleY(-1)" }} />
          </div>
          {/* Small ellipse glow under glass logo */}
          <div className="absolute pointer-events-none hidden lg:block" style={{ left: '11.2%', top: '72.8%', width: '26.3%', height: '3.6%' }}>
            <img alt="" src={`${A}/cta-ellipse-glow.svg`} className="absolute w-full h-full" style={{ transform: "scale(2.2)" }} />
          </div>
          {/* 3D Glass logo — hidden on mobile */}
          <div className="absolute hidden lg:block" style={{ left: '-1.9%', top: '5.3%', width: '45.7%', height: '80.4%' }}>
            <Image src={`${A}/cta-glass-logo.png`} alt="" fill className="object-contain" />
          </div>
          {/* CTA content — centered on mobile, right-half on desktop */}
          <motion.div
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
              <BtnBookDemo />
              <BtnJoinWaitlist />
            </div>
          </motion.div>
        </section>

        {/* Footer — overlaps CTA by 279px */}
        <footer className="relative bg-white rounded-t-[36px] sm:rounded-t-[72px] overflow-hidden w-full h-auto min-h-[200px] sm:min-h-[279px] py-8 z-10">
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
          <div className="relative sm:absolute left-0 sm:left-1/2 sm:-translate-x-1/2 sm:top-[207px] flex flex-col sm:flex-row items-center sm:justify-between w-full max-w-[1326px] px-5 gap-4 sm:gap-0 mx-auto">
            <div className="flex gap-6 text-base text-[#1c1c1c] tracking-[-0.32px]" style={{ fontFamily: "var(--font-display)" }}>
              <a href="https://www.linkedin.com/company/cleanailabs" target="_blank" rel="noopener noreferrer" className="hover:opacity-70">LinkedIn</a>
              <Link href="/contact" className="hover:opacity-70">Contact</Link>
            </div>
            <span className="text-sm text-[#1c1c1c] leading-5" style={{ fontFamily: "var(--font-display)" }}>2026 Clean. All rights reserved.</span>
          </div>
        </footer>
      </div>

    </div>
  );
}
