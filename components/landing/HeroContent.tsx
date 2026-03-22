"use client";

import { motion } from "framer-motion";
import RotatingText from "@/components/RotatingText";

export function HeroAnimatedWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="absolute left-1/2 -translate-x-1/2 top-[120px] sm:top-[150px] lg:top-[182px] flex flex-col items-center gap-4 sm:gap-6 w-full max-w-[603px] px-5 z-10"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {children}
    </motion.div>
  );
}

export function HeroRotatingText() {
  return (
    <div className="h-[80px] sm:h-[120px] lg:h-[165px] flex items-end justify-center overflow-hidden min-w-[320px] sm:min-w-[540px] lg:min-w-[750px]">
      <RotatingText
        texts={["agents", "engineers", "codebases"]}
        mainClassName="text-[60px] sm:text-[100px] lg:text-[140px] font-bold tracking-[-2px] sm:tracking-[-4px] inline-flex items-center justify-center"
        style={{ fontFamily: "var(--font-display)" }}
        elementLevelClassName="gradient-text-hero"
        staggerFrom="last"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "-100%" }}
        staggerDuration={0.025}
        splitLevelClassName="overflow-hidden"
        transition={{ type: "spring", damping: 30, stiffness: 400 }}
        rotationInterval={2500}
      />
    </div>
  );
}
