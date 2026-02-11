"use client";

import { motion } from "framer-motion";

export default function Navbar() {
  return (
    <motion.nav
      className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-4 md:px-12"
      style={{ background: "var(--cream)" }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Logo */}
      <a href="/" className="flex items-center gap-2">
        <span
          className="text-2xl font-medium tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Clean
        </span>
      </a>

      {/* Nav Links */}
      <div className="hidden md:flex items-center gap-8">
        <a href="#pricing" className="text-sm font-medium text-[var(--ink-light)] transition-colors hover:text-[var(--ink)]">
          Pricing
        </a>
        <a href="#docs" className="text-sm font-medium text-[var(--ink-light)] transition-colors hover:text-[var(--ink)]">
          Docs
        </a>
        <a href="#resources" className="text-sm font-medium text-[var(--ink-light)] transition-colors hover:text-[var(--ink)]">
          Resources
        </a>
      </div>

      {/* CTA */}
      <div className="flex items-center gap-4">
        <a
          href="#demo"
          className="hidden text-sm font-medium text-[var(--ink-light)] transition-colors hover:text-[var(--ink)] sm:block"
        >
          Book a Demo
        </a>
        <a
          href="#get-started"
          className="btn-primary rounded-full px-5 py-2 text-sm font-medium"
        >
          Get Started
        </a>
      </div>
    </motion.nav>
  );
}
