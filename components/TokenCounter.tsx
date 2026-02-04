"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform, AnimatePresence } from "framer-motion";

interface TokenCounterProps {
  from?: number;
  to?: number;
  duration?: number;
}

export default function TokenCounter({
  from = 300000,
  to = 10000,
  duration = 3,
}: TokenCounterProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const spring = useSpring(from, {
    stiffness: 50,
    damping: 30,
    duration: duration * 1000,
  });

  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString()
  );

  // Track when we reach the target
  useEffect(() => {
    const unsubscribe = spring.on("change", (value) => {
      if (value <= to + 500 && !showComparison) {
        setShowComparison(true);
      }
    });
    return () => unsubscribe();
  }, [spring, to, showComparison]);

  useEffect(() => {
    if (isVisible) {
      spring.set(to);
    }
  }, [isVisible, spring, to]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-baseline justify-center gap-2">
        <AnimatePresence mode="wait">
          {!showComparison ? (
            <motion.div
              key="counting"
              className="flex items-baseline gap-2"
              exit={{ opacity: 0, x: 50, transition: { duration: 0.3 } }}
            >
              <motion.span
                className="font-mono text-6xl font-bold tracking-tight md:text-8xl"
                style={{ color: "var(--ink)" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {display}
              </motion.span>
              <span className="text-2xl font-medium text-[var(--ink-muted)] md:text-3xl">
                tokens
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="comparison"
              className="flex flex-col items-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Labels row */}
              <div className="flex items-end gap-4 md:gap-6">
                <motion.span
                  className="w-32 text-center text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)] md:w-44"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  Before
                </motion.span>
                {/* spacer for arrow */}
                <span className="w-6 md:w-8" />
                <motion.span
                  className="w-36 text-center text-xs font-medium uppercase tracking-wider text-[var(--accent)] md:w-44"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  With Clean
                </motion.span>
                {/* spacer for tokens */}
                <span className="w-16" />
              </div>

              {/* Numbers row */}
              <div className="flex items-center gap-4 md:gap-6">
                <motion.span
                  className="w-32 text-center font-mono text-3xl font-bold tracking-tight text-[var(--ink-muted)] line-through decoration-[var(--accent)] decoration-2 md:w-44 md:text-5xl"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  300,000
                </motion.span>

                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                  className="flex items-center self-center"
                >
                  <svg
                    className="h-6 w-6 text-[var(--accent)] md:h-8 md:w-8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </motion.div>

                <motion.span
                  className="w-36 text-center font-mono text-4xl font-bold tracking-tight text-[var(--ink)] md:w-44 md:text-6xl"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  10,000
                </motion.span>

                <motion.span
                  className="ml-5 text-xl font-medium text-[var(--ink-muted)] md:text-2xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.6 }}
                >
                  tokens
                </motion.span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showComparison && (
          <motion.p
            className="text-lg text-[var(--ink-light)]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            per codebase exploration
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
