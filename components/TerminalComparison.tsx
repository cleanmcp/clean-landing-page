"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

/* ── line definitions ─────────────────────────────────── */

interface Line {
  text: string;
  cls: string; // tailwind classes for color
  delay: number; // ms from cycle start
}

const WITHOUT: Line[] = [
  { text: "> fix lint errors", cls: "text-white font-bold", delay: 500 },
  { text: "\u00A0", cls: "", delay: 800 },
  {
    text: "\u25CF I'll fix the lint errors across the project.",
    cls: "text-gray-300",
    delay: 1000,
  },
  { text: "\u00A0", cls: "", delay: 1400 },
  { text: "  Read src/components/App.tsx", cls: "text-gray-500", delay: 1700 },
  {
    text: "  Read src/components/Header.tsx",
    cls: "text-gray-500",
    delay: 2000,
  },
  { text: "  Read src/utils/helpers.ts", cls: "text-gray-500", delay: 2300 },
  { text: "  Read src/hooks/useAuth.ts", cls: "text-gray-500", delay: 2600 },
  { text: "  Read package.json", cls: "text-gray-500", delay: 2900 },
  { text: "  Read tsconfig.json", cls: "text-gray-500", delay: 3200 },
  { text: "  Read .eslintrc.js", cls: "text-gray-500", delay: 3500 },
  { text: "\u00A0", cls: "", delay: 3800 },
  { text: "  Found 3 lint errors.", cls: "text-gray-300", delay: 4100 },
  { text: "  Fixing...", cls: "text-gray-500", delay: 4500 },
  { text: "\u00A0", cls: "", delay: 4900 },
  {
    text: "  \u2713 Fixed all 3 lint errors",
    cls: "text-green-400",
    delay: 5300,
  },
];

const WITH: Line[] = [
  { text: "> fix lint errors", cls: "text-white font-bold", delay: 500 },
  { text: "\u00A0", cls: "", delay: 800 },
  {
    text: "\u25CF I'll fix the lint errors across the project.",
    cls: "text-gray-300",
    delay: 1000,
  },
  { text: "\u00A0", cls: "", delay: 1400 },
  {
    text: "  \u2726 Using Clean MCP context",
    cls: "text-orange-400",
    delay: 1700,
  },
  { text: "\u00A0", cls: "", delay: 2100 },
  { text: "  Found 3 lint errors.", cls: "text-gray-300", delay: 2400 },
  { text: "  Fixing...", cls: "text-gray-500", delay: 2700 },
  { text: "\u00A0", cls: "", delay: 3000 },
  {
    text: "  \u2713 Fixed all 3 lint errors",
    cls: "text-green-400",
    delay: 3300,
  },
];

const LEFT_END = 5300;
const RIGHT_END = 3300;
const TOKEN_START = 1700;
const LEFT_TOKENS = 200;
const RIGHT_TOKENS = 70;
const CYCLE = 9500;

function tokens(
  elapsed: number,
  end: number,
  max: number
): number {
  if (elapsed < TOKEN_START) return 0;
  if (elapsed >= end) return max;
  return Math.round(((elapsed - TOKEN_START) / (end - TOKEN_START)) * max);
}

/* ── tiny pixel robot SVG ─────────────────────────────── */

function PixelRobot() {
  return (
    <svg
      width="14"
      height="12"
      viewBox="0 0 7 6"
      className="flex-shrink-0"
      style={{ imageRendering: "pixelated" }}
    >
      <rect x="3" y="0" width="1" height="1" fill="#f97316" />
      <rect x="1" y="1" width="5" height="2" fill="#f97316" />
      <rect x="2" y="2" width="1" height="1" fill="#0a0a0a" />
      <rect x="4" y="2" width="1" height="1" fill="#0a0a0a" />
      <rect x="1" y="3" width="5" height="2" fill="#f97316" />
      <rect x="1" y="5" width="2" height="1" fill="#f97316" />
      <rect x="4" y="5" width="2" height="1" fill="#f97316" />
    </svg>
  );
}

/* ── single terminal panel ────────────────────────────── */

function Panel({
  lines,
  elapsed,
  maxTokens,
  endTime,
}: {
  lines: Line[];
  elapsed: number;
  maxTokens: number;
  endTime: number;
}) {
  const visible = lines.filter((l) => l.delay <= elapsed);
  const tok = tokens(elapsed, endTime, maxTokens);
  const contentRef = useRef<HTMLDivElement>(null);

  // auto-scroll content to bottom as lines appear
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [visible.length]);

  return (
    <div className="flex flex-1 min-w-0 flex-col rounded-lg overflow-hidden border border-gray-700/50 bg-[#0A0A0A]">
      {/* ── header ── */}
      <div className="px-3 py-2 border-b border-gray-800 bg-[#111]">
        <div className="flex items-center gap-1.5 mb-0.5">
          <PixelRobot />
          <span className="text-[10px] font-bold text-gray-300 tracking-tight sm:text-[11px]">
            Claude Code
          </span>
          <span className="text-[9px] text-gray-600 sm:text-[10px]">v2.1.39</span>
        </div>
        <div className="text-[9px] text-gray-500 leading-relaxed sm:text-[10px]">
          Sonnet 4.5 &middot; Claude Pro
        </div>
        <div className="text-[9px] text-gray-600 leading-relaxed truncate sm:text-[10px]">
          ~/Documents/Code/clean/landing...
        </div>
        <div className="text-[9px] text-orange-400/70 leading-relaxed sm:text-[10px]">
          Opus 4.6 is here &middot; $50 free ex...
        </div>
      </div>

      {/* ── separator ── */}
      <div className="h-px bg-gray-800" />

      {/* ── content ── */}
      <div
        ref={contentRef}
        className="px-3 py-2 font-mono text-[9px] leading-[1.7] h-[200px] overflow-hidden sm:text-[11px] sm:h-[260px]"
      >
        {visible.map((line, i) => (
          <div key={i} className={line.cls}>
            {line.text}
          </div>
        ))}
      </div>

      {/* ── bottom bar ── */}
      <div className="px-3 py-2 border-t border-gray-800 mt-auto">
        <div className="font-mono text-[9px] text-gray-600 flex items-center gap-1 sm:text-[11px]">
          <span className="text-gray-500">&gt;</span>
          <span className="animate-pulse text-gray-400">_</span>
        </div>
        <div className="mt-1 text-[8px] text-gray-600 sm:text-[9px]">
          <span className="text-gray-500">?</span> for shortcuts{" "}
          <span className="text-red-400">Fast mode</span> is now available
          &middot; /fast to turn on
        </div>
        <div className="mt-1.5 font-mono text-[10px] text-gray-400 sm:text-[11px]">
          {tok > 0 ? `${tok}k tokens used` : "\u00A0"}
        </div>
      </div>
    </div>
  );
}

/* ── main comparison ──────────────────────────────────── */

export default function TerminalComparison() {
  const [elapsed, setElapsed] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const start = Date.now();

    const id = setInterval(() => {
      const dt = Date.now() - start;
      if (dt >= CYCLE) {
        clearInterval(id);
        // brief pause then restart
        setTimeout(() => {
          setElapsed(0);
          setCycle((c) => c + 1);
        }, 400);
        return;
      }
      setElapsed(dt);
    }, 80);

    return () => clearInterval(id);
  }, [cycle]);

  return (
    <motion.div
      key={cycle}
      className="flex gap-2 sm:gap-3"
      initial={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* left */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <span className="text-[9px] uppercase tracking-[0.15em] text-[var(--ink-muted)] text-center font-medium sm:text-[10px]">
          Without Clean
        </span>
        <Panel
          lines={WITHOUT}
          elapsed={elapsed}
          maxTokens={LEFT_TOKENS}
          endTime={LEFT_END}
        />
      </div>

      {/* right */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <span className="text-[9px] uppercase tracking-[0.15em] text-[var(--ink-muted)] text-center font-medium sm:text-[10px]">
          With Clean
        </span>
        <Panel
          lines={WITH}
          elapsed={elapsed}
          maxTokens={RIGHT_TOKENS}
          endTime={RIGHT_END}
        />
      </div>
    </motion.div>
  );
}
