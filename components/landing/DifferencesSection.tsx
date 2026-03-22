"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const A = "/landing";

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

export default function DifferencesSection() {
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
              <Image
                alt=""
                src={`${A}/dark-bg.png`}
                fill
                className="object-cover pointer-events-none"
                sizes="100vw"
              />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <Image
              alt=""
              src={`${A}/after-background.png`}
              fill
              className="object-cover"
              sizes="100vw"
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
