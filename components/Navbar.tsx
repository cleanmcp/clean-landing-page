"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@/components/Icons";

interface NavbarProps {
  onWaitlistClick?: () => void;
}

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const DURATION = "500ms";

export default function Navbar({ onWaitlistClick }: NavbarProps) {
  const [compact, setCompact] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const handleScroll = useCallback(() => {
    const currentY = window.scrollY;
    const atTop = currentY < 30;
    const scrollingUp = currentY < lastScrollY.current - 4;
    const scrollingDown = currentY > lastScrollY.current + 4;

    if (atTop || scrollingUp) {
      setCompact(false);
    } else if (scrollingDown && currentY > 60) {
      setCompact(true);
    }

    lastScrollY.current = currentY;
    ticking.current = false;
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(handleScroll);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [handleScroll]);

  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-50"
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{
        padding: compact ? "10px max(16px, calc(50% - 190px))" : "0px 0px",
        transition: `padding ${DURATION} ${EASE}`,
      }}
    >
      <nav
        className="flex items-center justify-between"
        style={{
          padding: compact ? "10px 20px" : "16px 24px",
          borderRadius: compact ? 999 : 0,
          background: compact
            ? "rgba(245, 243, 238, 0.55)"
            : "rgba(245, 243, 238, 1)",
          backdropFilter: compact ? "blur(20px) saturate(1.4)" : "blur(0px)",
          WebkitBackdropFilter: compact
            ? "blur(20px) saturate(1.4)"
            : "blur(0px)",
          boxShadow: compact
            ? "0 6px 32px rgba(0,0,0,0.08), 0 1.5px 6px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(234,230,222,0.9)"
            : "0 0px 0px rgba(0,0,0,0), 0 0px 0px rgba(0,0,0,0), inset 0 0 0 1px rgba(234,230,222,0)",
          transition: `all ${DURATION} ${EASE}`,
        }}
      >
        {/* Logo */}
        <a href="/" className="group flex items-center whitespace-nowrap">
          <span
            className="text-2xl font-normal tracking-tight transition-colors duration-300 group-hover:text-[var(--accent)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Clean
          </span>
        </a>

        {/* CTA group */}
        <div className="flex items-center gap-4">
          {/* Book a Demo — collapses horizontally */}
          <a
            href="mailto:hello@tryclean.ai?subject=Demo%20Request"
            className="hidden sm:block text-sm font-medium text-[var(--ink-light)] hover:text-[var(--ink)] whitespace-nowrap"
            style={{
              opacity: compact ? 0 : 1,
              maxWidth: compact ? 0 : 120,
              overflow: "hidden",
              marginRight: compact ? -16 : 0,
              transition: `opacity 200ms ${EASE}, max-width ${DURATION} ${EASE}, margin ${DURATION} ${EASE}`,
            }}
          >
            Book a Demo
          </a>
          <button
            type="button"
            onClick={onWaitlistClick}
            className="btn-primary flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium whitespace-nowrap"
          >
            Join the waitlist
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </nav>
    </motion.div>
  );
}
