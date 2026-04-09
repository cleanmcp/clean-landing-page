"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CATEGORIES,
  PROMPT_TIPS,
  ANTI_PATTERNS,
  type PromptCategory,
} from "@/lib/prompt-tips";

function PromptCard({ prompt, index }: { prompt: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="prompt-card group"
    >
      <p
        className="text-lg sm:text-xl text-[#1c1c1c] leading-snug tracking-tight"
        style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}
      >
        &ldquo;{prompt}&rdquo;
      </p>
    </motion.div>
  );
}

export default function PromptTipsSection() {
  const [active, setActive] = useState<PromptCategory>("behavior");
  const tips = PROMPT_TIPS.filter((t) => t.category === active);

  return (
    <section className="relative bg-white py-3">
      <div className="mx-2 sm:mx-3 rounded-[24px] sm:rounded-[36px] lg:rounded-[48px] overflow-hidden bg-[#f8fbff] py-16 sm:py-24 lg:py-32">
        {/* Header */}
        <div className="mx-auto max-w-[1280px] px-5 sm:px-10 lg:px-20 flex flex-col items-center gap-8">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1c1c1c] text-center tracking-tight max-w-[800px]"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Ask how your codebase{" "}
            <em style={{ fontFamily: "var(--font-display)" }}>behaves</em>, not
            what it&apos;s called.
          </h2>

          {/* Tab bar */}
          <div className="relative flex items-center p-1.5 bg-white border border-[#AED8FF]/40 rounded-full overflow-x-auto max-w-full">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActive(cat.id)}
                className={`relative z-10 whitespace-nowrap px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-semibold tracking-tight transition-colors duration-200 rounded-full cursor-pointer ${
                  active === cat.id
                    ? "text-white"
                    : "text-[#8b949e] hover:text-[#1c1c1c]"
                }`}
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                {active === cat.id && (
                  <motion.div
                    layoutId="prompt-tab-highlight"
                    className="absolute inset-0 rounded-full bg-[#1c1c1c]"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
                <span className="relative z-10">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Prompt cards grid */}
          <div className="w-full min-h-[280px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {tips.map((tip, i) => (
                  <PromptCard key={tip.id} prompt={tip.prompt} index={i} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Anti-patterns strip */}
        <div className="mt-16 sm:mt-20 mx-4 sm:mx-6 lg:mx-10 rounded-[16px] sm:rounded-[24px] bg-[#1c1c1c] p-6 sm:p-8 lg:p-10">
          <p
            className="text-sm font-semibold text-[#8b949e] uppercase tracking-wider mb-6"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Grep vs. Clean
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {ANTI_PATTERNS.map((ap, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  <span className="shrink-0 text-[#ff6467] text-xs font-bold font-mono mt-0.5">
                    ✗
                  </span>
                  <p className="text-sm text-[#6a7282] font-mono leading-relaxed">
                    {ap.grep}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="shrink-0 text-[#05df72] text-xs font-bold font-mono mt-0.5">
                    ✓
                  </span>
                  <p className="text-sm text-[#79c0ff] font-mono leading-relaxed">
                    &ldquo;{ap.clean}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
