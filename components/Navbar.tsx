"use client";

import { motion } from "framer-motion";

const navItems = [
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "#docs" },
  { label: "Resources", href: "#resources" },
];

export default function Navbar() {
  return (
    <motion.nav
      className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-4 md:px-12"
      style={{
        background: "var(--cream)",
        borderBottom: "1px solid transparent",
      }}
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Logo */}
      <motion.a
        href="/"
        className="group flex items-center gap-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <span
          className="text-2xl font-normal tracking-tight transition-colors duration-300 group-hover:text-[var(--accent)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Clean
        </span>
      </motion.a>

      {/* Nav Links */}
      <div className="hidden md:flex items-center gap-8">
        {navItems.map((item, i) => (
          <motion.a
            key={item.href}
            href={item.href}
            className="group relative text-sm font-medium text-[var(--ink-light)] transition-colors duration-300 hover:text-[var(--ink)]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.2 + i * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {item.label}
            <span className="absolute -bottom-1 left-0 h-px w-0 bg-[var(--accent)] transition-all duration-300 group-hover:w-full" />
          </motion.a>
        ))}
      </div>

      {/* CTA */}
      <div className="flex items-center gap-4">
        <motion.a
          href="#demo"
          className="hidden text-sm font-medium text-[var(--ink-light)] transition-colors duration-300 hover:text-[var(--ink)] sm:block"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: 0.45,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          Book a Demo
        </motion.a>
        <motion.a
          href="#get-started"
          className="btn-primary rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.6,
            delay: 0.5,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          Get Started
        </motion.a>
      </div>
    </motion.nav>
  );
}

