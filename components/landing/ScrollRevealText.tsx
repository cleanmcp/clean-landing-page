"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";

function Character({ children, progress, range, baseColor, activeColor }: { children: string; progress: MotionValue<number>; range: [number, number]; baseColor: string; activeColor: string }) {
  const color = useTransform(progress, range, [baseColor, activeColor]);
  return (
    <motion.span className="inline-block" style={{ color }}>
      {children}
    </motion.span>
  );
}

function Word({ children, progress, range, baseColor, activeColor }: { children: string; progress: MotionValue<number>; range: [number, number]; baseColor: string; activeColor: string }) {
  const characters = children.split("");
  const amount = range[1] - range[0];
  const step = amount / children.length;
  return (
    <span className="inline-block whitespace-pre">
      {characters.map((char: string, i: number) => {
        const start = range[0] + i * step;
        const end = range[0] + (i + 1) * step;
        return (
          <Character key={i} progress={progress} range={[start, end]} baseColor={baseColor} activeColor={activeColor}>
            {char}
          </Character>
        );
      })}
    </span>
  );
}

export default function ScrollRevealText({
  text,
  baseOverlayColor = "rgba(255,255,255,0.2)",
  activeColor = "#ffffff",
  className = "",
  style = {},
}: {
  text: string;
  baseOverlayColor?: string;
  activeColor?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end 50%"],
  });

  const words = text.split(" ");
  return (
    <h2 ref={containerRef} className={`flex flex-wrap justify-center gap-x-3 gap-y-1 ${className}`} style={style}>
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;
        return (
          <Word key={i} progress={scrollYProgress} range={[start, end]} baseColor={baseOverlayColor} activeColor={activeColor}>
            {word}
          </Word>
        );
      })}
    </h2>
  );
}
