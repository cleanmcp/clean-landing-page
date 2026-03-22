"use client";

import { motion } from "framer-motion";

const items = [
  { label: "Claude Code", tokens: 250, pct: 100 },
  { label: "Cursor", tokens: 200, pct: 80 },
  { label: "Codex", tokens: 180, pct: 72 },
  { label: "Windsurf", tokens: 170, pct: 68 },
];

export default function TokenChart() {
  return (
    <div className="bg-[#1a1a1a] rounded-2xl w-full h-auto p-6 sm:p-8 overflow-hidden">
      <p className="text-[12px] text-white uppercase tracking-[0.6px] mb-6" style={{ fontFamily: "var(--font-jakarta)" }}>Avg. tokens burned per coding session</p>
      {items.map((item) => (
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
  );
}
