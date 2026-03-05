"use client";

import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const navItems = [
  { label: "Pricing", href: "pricing-plan" },
  { label: "Docs", href: "#docs" },
  { label: "Resources", href: "#resources" },
];

export default function Navbar() {
  const [condensed, setCondensed] = useState(false);
  const { scrollY } = useScroll();
  const lastDirectionChangeY = useRef(0);
  const lastDirection = useRef<"up" | "down">("up");
  const prevScrollY = useRef(0);

  useEffect(() => {
    prevScrollY.current = window.scrollY;
    lastDirectionChangeY.current = window.scrollY;
    if (window.scrollY > 80) setCondensed(true);
  }, []);

  useMotionValueEvent(scrollY, "change", (current) => {
    const prev = prevScrollY.current;
    const direction = current > prev ? "down" : "up";

    if (direction !== lastDirection.current) {
      lastDirectionChangeY.current = prev;
      lastDirection.current = direction;
    }

    const distanceSinceDirectionChange = Math.abs(
      current - lastDirectionChangeY.current
    );

    if (current <= 20) {
      setCondensed(false);
    } else if (direction === "down" && distanceSinceDirectionChange > 40) {
      setCondensed(true);
    } else if (direction === "up" && distanceSinceDirectionChange > 30) {
      setCondensed(false);
    }

    prevScrollY.current = current;
  });

  const spring = {
    type: "spring" as const,
    stiffness: 260,
    damping: 28,
    mass: 0.9,
  };

  return (
    <motion.div
      className="fixed left-0 right-0 top-0 z-50 flex justify-center pointer-events-none"
      initial={false}
      animate={{ padding: condensed ? "10px 16px 0" : "0px 0px 0" }}
      transition={spring}
    >
      <motion.nav
        className="pointer-events-auto relative flex items-center justify-between w-full"
        initial={false}
        animate={{
          maxWidth: condensed ? 540 : 2000,
          borderRadius: condensed ? 40 : 0,
          paddingTop: condensed ? 10 : 16,
          paddingBottom: condensed ? 10 : 16,
          paddingLeft: condensed ? 22 : 48,
          paddingRight: condensed ? 22 : 48,
          boxShadow: condensed
            ? "0 4px 20px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)"
            : "0 0px 0px rgba(0,0,0,0)",
        }}
        transition={spring}
        style={{ background: "var(--cream)" }}
      >
        {/* Logo */}
        <a href="/" className="group flex items-center gap-2">
          <motion.span
            className="font-normal tracking-tight transition-colors duration-300 group-hover:text-[var(--accent)]"
            style={{ fontFamily: "var(--font-display)" }}
            initial={false}
            animate={{ fontSize: condensed ? "1.15rem" : "1.5rem" }}
            transition={spring}
          >
            Clean
          </motion.span>
        </a>

        {/* Nav Links — absolutely centered */}
        <motion.div
          className="pointer-events-auto absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex items-center gap-8"
          initial={false}
          animate={{
            opacity: condensed ? 0 : 1,
          }}
          transition={{ opacity: { duration: 0.2 } }}
          style={{ pointerEvents: condensed ? "none" : "auto" }}
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group relative text-sm font-medium text-[var(--ink-light)] transition-colors duration-300 hover:text-[var(--ink)]"
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-[var(--accent)] transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </motion.div>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <motion.a
            href="/sign-in"
            className="hidden text-sm font-medium text-[var(--ink-light)] transition-colors duration-300 hover:text-[var(--ink)] sm:block"
            initial={false}
            animate={{
              opacity: condensed ? 0 : 1,
              width: condensed ? 0 : "auto",
              marginRight: condensed ? -8 : 0,
            }}
            transition={{ ...spring, opacity: { duration: 0.2 } }}
            style={{ overflow: "hidden", whiteSpace: "nowrap" }}
          >
            Sign In
          </motion.a>
          <a
            href="/waitlist"
            className="btn-primary rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            Join Waitlist
          </a>
        </div>
      </motion.nav>
    </motion.div>
  );
}
