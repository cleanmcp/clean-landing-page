"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const A = "/landing";

export default function LandingNavbar() {
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
          <Link href="/pricing-plan" className="text-sm sm:text-base font-semibold text-white hover:opacity-80 transition-opacity">Pricing</Link>
          <Link href="/sign-in" className="text-sm sm:text-base font-semibold text-white hover:opacity-80 transition-opacity">Sign In</Link>
          <a href="/sign-up" className="group relative inline-flex items-center h-[40px] sm:h-[46px] rounded-full text-white text-[13px] sm:text-[15px] font-semibold tracking-tight pl-4 sm:pl-5 pr-10 sm:pr-12 transition-all duration-300 hover:scale-[1.02]" style={{ background: "linear-gradient(180deg, #7DC3FC 0%, #BFE1FA 100%)", border: "3px solid #E8F4FC", boxShadow: "inset 0px 4px 6px rgba(255,255,255,1), 0px 2px 10px rgba(0,0,0,0.1), inset 0px -2px 4px rgba(100,160,240,0.5)" }}>
            <span className="relative z-10" style={{ textShadow: "0px 1px 1px rgba(255,255,255,0.7)", color: "white" }}>Try Now</span>
            <span className="absolute right-[4px] top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-white size-7 sm:size-8 transition-transform duration-300 group-hover:rotate-45" style={{ boxShadow: "0px 2px 4px rgba(0,0,0,0.1)" }}>
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#1772e7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>
            </span>
          </a>
        </div>
      </motion.nav>
    </>
  );
}
