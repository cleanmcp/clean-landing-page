"use client";

import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Navbar() {
  const [condensed, setCondensed] = useState(false);
  const { scrollY } = useScroll();
  const lastDirectionChangeY = useRef(0);
  const lastDirection = useRef<"up" | "down">("up");
  const prevScrollY = useRef(0);
  useEffect(() => {
    prevScrollY.current = window.scrollY;
    lastDirectionChangeY.current = window.scrollY;
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
        className="pointer-events-auto relative flex items-center justify-between w-full bg-white"
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
      >
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-1">
          <Image src="/landing/clean-icon.svg" alt="" width={20} height={20} />
          <motion.span
            className="font-bold tracking-tight text-[var(--ink)] transition-colors duration-300 group-hover:text-[var(--blue-dark)]"
            style={{ fontFamily: "var(--font-jakarta)" }}
            initial={false}
            animate={{ fontSize: condensed ? "1.05rem" : "1.25rem" }}
            transition={spring}
          >
            lean.ai
          </motion.span>
        </Link>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <motion.div
            className="hidden text-sm font-medium text-[var(--ink-muted)] transition-colors duration-300 hover:text-[var(--ink)] sm:block"
            initial={false}
            animate={{
              opacity: condensed ? 0 : 1,
              width: condensed ? 0 : "auto",
              marginRight: condensed ? -8 : 0,
            }}
            transition={{ ...spring, opacity: { duration: 0.2 } }}
            style={{ overflow: "hidden", whiteSpace: "nowrap" }}
          >
            <Link href="/sign-in">Sign In</Link>
          </motion.div>
          <Link
            href="/sign-up"
            className="btn-gradient rounded-full px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:scale-105"
          >
            Try Now
          </Link>
        </div>
      </motion.nav>
    </motion.div>
  );
}
