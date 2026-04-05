"use client";

import { useRef, useEffect, useState } from "react";
import {
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  useAnimationFrame,
} from "framer-motion";
import Image from "next/image";

interface Logo {
  src: string;
  alt: string;
  name?: string; // display name — omitted for logos that already contain text
}

interface TrustedByMarqueeProps {
  logos: Logo[];
}

const BASE_VELOCITY = 30; // px/s — positive = moves right
const DAMPING = 50;
const STIFFNESS = 400;

export default function TrustedByMarquee({ logos }: TrustedByMarqueeProps) {
  if (logos.length === 0) return null;

  return (
    <section className="bg-white pt-4 pb-8 sm:pt-6 sm:pb-10" aria-label="Trusted by">
      <p
        className="text-center text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] mb-4 sm:mb-6"
        style={{ color: "#8B949E", fontFamily: "var(--font-jakarta)" }}
      >
        Trusted by
      </p>
      <div className="marquee-mask relative overflow-hidden">
        <LogoStrip logos={logos} />
      </div>
    </section>
  );
}

function LogoStrip({ logos }: { logos: Logo[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const xPos = useRef<number | null>(null);
  const initialized = useRef(false);

  // Scroll-velocity coupling (same as ScrollVelocity.tsx)
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: DAMPING,
    stiffness: STIFFNESS,
    mass: 0.5,
  });
  const velocityFactor = useTransform(
    smoothVelocity,
    [-1000, 0, 1000],
    [-2, 0, 2],
    { clamp: true }
  );

  // Repeat logos enough times to guarantee fill
  const repeatsPerCopy = Math.max(6, Math.ceil(20 / logos.length));
  const logoSet = Array.from({ length: repeatsPerCopy }, () => logos).flat();

  // Measure one copy's width for seamless reset
  useEffect(() => {
    if (!scrollerRef.current) return;

    const measure = () => {
      const firstCopy = scrollerRef.current?.querySelector('[data-copy="0"]');
      if (firstCopy) {
        const width = firstCopy.getBoundingClientRect().width;
        setContentWidth(width);

        if (!initialized.current && width > 0) {
          xPos.current = -width;
          initialized.current = true;
        }
      }
    };

    const timer = setTimeout(measure, 50);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measure);
    };
  }, [logos]);

  // Animation loop — positive velocity = moves right
  useAnimationFrame((_, delta) => {
    if (contentWidth === 0 || !scrollerRef.current || xPos.current === null)
      return;

    const scrollBoost = velocityFactor.get();
    const baseMove = BASE_VELOCITY * (delta / 1000);
    const velocityMultiplier = 1 + Math.abs(scrollBoost) * 0.5;
    const totalMove = baseMove * velocityMultiplier;

    xPos.current += totalMove;

    // Seamless wrap: when we've scrolled past one full copy, reset
    if (xPos.current >= 0) {
      xPos.current -= contentWidth;
    } else if (xPos.current <= -contentWidth * 2) {
      xPos.current += contentWidth;
    }

    scrollerRef.current.style.transform = `translateX(${xPos.current}px)`;
  });

  return (
    <div
      ref={scrollerRef}
      className="flex whitespace-nowrap will-change-transform"
      style={{ transform: "translateX(-25%)" }}
    >
      {[0, 1, 2, 3].map((copyIndex) => (
        <div
          key={copyIndex}
          data-copy={copyIndex}
          className="flex shrink-0 items-center gap-10 sm:gap-14 lg:gap-16 px-5 sm:px-7 lg:px-8"
          aria-hidden={copyIndex > 0 ? "true" : undefined}
        >
          {logoSet.map((logo, i) =>
            logo.name ? (
              /* Icon + text label */
              <div
                key={`${copyIndex}-${i}`}
                className="flex-shrink-0 flex items-center gap-2"
              >
                <div className="h-6 sm:h-7 lg:h-8 w-6 sm:w-7 lg:w-8 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={logo.src}
                    alt={copyIndex === 0 ? logo.alt : ""}
                    width={32}
                    height={32}
                    className="h-full w-full object-cover grayscale opacity-60"
                    loading="eager"
                    draggable={false}
                  />
                </div>
                <span
                  className="text-sm sm:text-base font-semibold whitespace-nowrap opacity-50"
                  style={{ color: "#1a1a1a", fontFamily: "var(--font-jakarta)" }}
                >
                  {logo.name}
                </span>
              </div>
            ) : (
              /* Wide logo with text baked into image (e.g. Talunt, LeanMCP) */
              <div
                key={`${copyIndex}-${i}`}
                className={`flex-shrink-0 ${logo.alt === "LeanMCP" ? "h-5 sm:h-6 lg:h-7" : "h-7 sm:h-8 lg:h-9"}`}
              >
                <Image
                  src={logo.src}
                  alt={copyIndex === 0 ? logo.alt : ""}
                  width={logo.alt === "LeanMCP" ? 400 : 160}
                  height={logo.alt === "LeanMCP" ? 72 : 36}
                  className="h-full w-auto object-contain grayscale opacity-50"
                  loading="eager"
                  draggable={false}
                />
              </div>
            )
          )}
        </div>
      ))}
    </div>
  );
}
