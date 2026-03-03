"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

interface FeatureItem {
  title: string;
  child: React.ReactNode;
}

interface FeatureCarouselProps {
  children: React.ReactNode;
  titles?: string[];
}

export default function FeatureCarousel({
  children,
  titles = [],
}: FeatureCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cards = React.Children.toArray(children);
  const count = cards.length;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <section
      ref={containerRef}
      className="relative"
      style={{ height: `${100 + count * 80}vh` }}
    >
      <div className="sticky top-0 flex h-screen items-center">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-6 md:grid-cols-[280px_1fr] md:gap-16 md:px-12 lg:grid-cols-[320px_1fr]">
          {/* Left — section title + feature nav */}
          <div className="flex flex-col justify-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-wider text-[var(--accent)]">
              [ FEATURES ]
            </p>
            <h2
              className="mb-10 text-3xl font-normal leading-tight md:text-4xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              We have <em>everything</em> you need.
            </h2>

            {/* Feature nav items */}
            <div className="hidden md:flex md:flex-col md:gap-1">
              {titles.map((title, i) => (
                <NavItem
                  key={i}
                  index={i}
                  total={count}
                  title={title}
                  progress={scrollYProgress}
                />
              ))}
            </div>

            {/* Mobile progress dots */}
            <div className="flex gap-2 md:hidden">
              {cards.map((_, i) => (
                <MobileDot
                  key={i}
                  index={i}
                  total={count}
                  progress={scrollYProgress}
                />
              ))}
            </div>
          </div>

          {/* Right — card display area */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-full" style={{ height: 420 }}>
              {cards.map((child, i) => (
                <CardLayer
                  key={i}
                  index={i}
                  total={count}
                  progress={scrollYProgress}
                >
                  {child}
                </CardLayer>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Feature nav item on the left ────────────────── */

function NavItem({
  index,
  total,
  title,
  progress,
}: {
  index: number;
  total: number;
  title: string;
  progress: MotionValue<number>;
}) {
  const segStart = index / total;
  const segEnd = (index + 1) / total;

  const isActive = useTransform(progress, (p) => p >= segStart && p < segEnd);
  const textOpacity = useTransform(isActive, (a) => (a ? 1 : 0.35));
  const barWidth = useTransform(isActive, (a) => (a ? 24 : 0));
  const textX = useTransform(isActive, (a) => (a ? 0 : -4));

  return (
    <motion.div
      className="flex items-center gap-3 rounded-lg px-3 py-2.5"
      style={{ opacity: textOpacity }}
    >
      <motion.div
        className="h-[2px] rounded-full bg-[var(--accent)]"
        style={{ width: barWidth }}
      />
      <span className="flex items-baseline gap-2.5">
        <span className="font-mono text-[11px] text-[var(--ink-muted)]">
          0{index + 1}
        </span>
        <span className="text-sm font-medium text-[var(--ink)]">{title}</span>
      </span>
    </motion.div>
  );
}

/* ── Mobile progress dot ─────────────────────────── */

function MobileDot({
  index,
  total,
  progress,
}: {
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const segStart = index / total;
  const segEnd = (index + 1) / total;

  const isActive = useTransform(progress, (p) => p >= segStart && p < segEnd);
  const w = useTransform(isActive, (a) => (a ? 24 : 8));
  const op = useTransform(isActive, (a) => (a ? 1 : 0.3));

  return (
    <motion.div
      className="h-2 rounded-full bg-[var(--accent)]"
      style={{ width: w, opacity: op }}
    />
  );
}

/* ── Stacked card layer ──────────────────────────── */

function CardLayer({
  children,
  index,
  total,
  progress,
}: {
  children: React.ReactNode;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const isLast = index === total - 1;
  const segStart = index / total;
  const segEnd = (index + 1) / total;
  const zIndex = total - index;

  // Hold card visible for 60% of segment, then peel away in the last 40%
  const peelStart = segStart + (segEnd - segStart) * 0.55;

  const scale = useTransform(
    progress,
    [segStart, peelStart, segEnd],
    [1, 1, isLast ? 1 : 0.96]
  );
  const opacity = useTransform(
    progress,
    [segStart, peelStart, segEnd],
    [1, 1, isLast ? 1 : 0]
  );
  const y = useTransform(
    progress,
    [segStart, peelStart, segEnd],
    [0, 0, isLast ? 0 : -50]
  );

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        zIndex,
        scale,
        opacity,
        y,
        transformOrigin: "center top",
        willChange: "transform, opacity",
      }}
    >
      {children}
    </motion.div>
  );
}
