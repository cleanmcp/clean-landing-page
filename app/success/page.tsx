"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function SuccessPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a]">
      {/* Background dot grid */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] bg-[size:3rem_3rem]" />
      </div>

      <Navbar />

      <section className="flex min-h-screen items-center justify-center px-5 pt-24 pb-16 sm:px-6">
        <motion.div
          className="w-full max-w-lg text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          {/* Minimal success badge */}
          <motion.div
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.1)] bg-[#171717] px-4 py-2 shadow-sm"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--dash-accent)]">
              <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-[#a1a1aa]">
              [ SUCCESS ]
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            className="mb-6 text-4xl font-normal leading-[1.1] tracking-tight text-[#fafafa] sm:text-5xl lg:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            You&apos;re <em>all set.</em>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            className="mb-10 text-lg leading-relaxed text-[#a1a1aa]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            Your subscription is active. Your team now has access to all plan features.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
          >
            <Link
              href="/dashboard"
              className="btn-primary inline-flex items-center gap-2 rounded-xl px-8 py-3 text-base font-medium"
            >
              Go to Dashboard →
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
