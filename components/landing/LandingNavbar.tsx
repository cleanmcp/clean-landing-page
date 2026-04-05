"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const A = "/landing";

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between transition-[padding] duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] px-3 pt-[18px] pb-3 sm:px-8 sm:py-4 lg:px-[67px] lg:py-[30px] ${scrolled ? "lg:!px-12 lg:!py-3" : ""}`}
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

        {/* Mobile: centered logo + hamburger on right */}
        <div className="relative z-10 flex w-full items-center justify-center lg:hidden">
          {/* Spacer to balance the hamburger */}
          <div className="w-9" />
          <div className="flex-1 flex justify-center">
            <Link href="/" className="flex items-center gap-0.5">
              <Image src={`${A}/clean-icon.svg`} alt="" width={22} height={22} />
              <span className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-jakarta)" }}>lean</span>
            </Link>
          </div>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:text-white transition-colors"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" strokeWidth={2} /> : <Menu className="h-5 w-5" strokeWidth={2} />}
          </button>
        </div>

        {/* Desktop: logo left, links right */}
        <Link href="/" className="relative z-10 hidden items-center gap-0.5 lg:flex">
          <Image src={`${A}/clean-icon.svg`} alt="" width={24} height={24} />
          <span className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-jakarta)" }}>lean</span>
        </Link>

        <div className="relative z-10 hidden items-center gap-6 lg:flex">
          <a href="https://discord.gg/f7fA4aze9F" target="_blank" rel="noopener noreferrer" className="text-base font-semibold text-white hover:opacity-80 transition-opacity">Discord</a>
          <a href="https://docs.tryclean.ai" target="_blank" rel="noopener noreferrer" className="text-base font-semibold text-white hover:opacity-80 transition-opacity">Docs</a>
          <Link href="/pricing-plan" className="text-base font-semibold text-white hover:opacity-80 transition-opacity">Pricing</Link>
          <Link href="/sign-in" className="text-base font-semibold text-white hover:opacity-80 transition-opacity">Sign In</Link>
          <Link href="/sign-up" className="group relative inline-flex items-center h-[46px] rounded-full text-white text-[15px] font-semibold tracking-tight pl-5 pr-12 transition-all duration-300 hover:scale-[1.02]" style={{ background: "linear-gradient(180deg, #7DC3FC 0%, #BFE1FA 100%)", border: "3px solid #E8F4FC", boxShadow: "inset 0px 4px 6px rgba(255,255,255,1), 0px 2px 10px rgba(0,0,0,0.1), inset 0px -2px 4px rgba(100,160,240,0.5)" }}>
            <span className="relative z-10" style={{ textShadow: "0px 1px 1px rgba(255,255,255,0.7)", color: "white" }}>Start Now</span>
            <span className="absolute right-[4px] top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-white size-8 transition-transform duration-300 group-hover:rotate-45" style={{ boxShadow: "0px 2px 4px rgba(0,0,0,0.1)" }}>
              <svg className="w-3.5 h-3.5 text-[#1772e7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>
            </span>
          </Link>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
            />
            {/* Menu panel */}
            <motion.div
              className="fixed top-[52px] sm:top-[60px] left-0 right-0 z-50 mx-4 sm:mx-8 rounded-2xl border border-white/15 p-5 lg:hidden"
              style={{
                background: "linear-gradient(180deg, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.7) 100%)",
                backdropFilter: "blur(24px) saturate(1.6)",
                WebkitBackdropFilter: "blur(24px) saturate(1.6)",
                boxShadow: "0 16px 48px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="flex flex-col gap-1">
                <a
                  href="https://discord.gg/f7fA4aze9F"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-4 py-3 text-base font-semibold text-white/90 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Discord
                </a>
                <a
                  href="https://docs.tryclean.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-4 py-3 text-base font-semibold text-white/90 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Docs
                </a>
                <Link
                  href="/pricing-plan"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-4 py-3 text-base font-semibold text-white/90 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Pricing
                </Link>
                <Link
                  href="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-4 py-3 text-base font-semibold text-white/90 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <div className="mt-2">
                  <Link
                    href="/sign-up"
                    onClick={() => setMobileOpen(false)}
                    className="group relative flex items-center justify-center h-[46px] rounded-full text-white text-[15px] font-semibold tracking-tight transition-all duration-300"
                    style={{
                      background: "linear-gradient(180deg, #7DC3FC 0%, #BFE1FA 100%)",
                      border: "3px solid #E8F4FC",
                      boxShadow: "inset 0px 4px 6px rgba(255,255,255,1), 0px 2px 10px rgba(0,0,0,0.1), inset 0px -2px 4px rgba(100,160,240,0.5)",
                    }}
                  >
                    <span className="relative z-10" style={{ textShadow: "0px 1px 1px rgba(255,255,255,0.7)", color: "white" }}>Start Now</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
