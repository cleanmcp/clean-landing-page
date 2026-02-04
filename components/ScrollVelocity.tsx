"use client";

import { useRef, useEffect, useState } from "react";
import {
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  useAnimationFrame,
} from "framer-motion";

interface ScrollVelocityProps {
  texts: string[];
  velocity?: number;
  className?: string;
  damping?: number;
  stiffness?: number;
  parallaxClassName?: string;
}

function VelocityRow({
  children,
  baseVelocity,
  className,
  damping,
  stiffness,
}: {
  children: React.ReactNode;
  baseVelocity: number;
  className: string;
  damping: number;
  stiffness: number;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const xPos = useRef<number | null>(null);
  const initialized = useRef(false);

  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping,
    stiffness,
    mass: 0.5,
  });
  const velocityFactor = useTransform(
    smoothVelocity,
    [-1000, 0, 1000],
    [-2, 0, 2],
    { clamp: true }
  );

  useEffect(() => {
    if (!scrollerRef.current) return;

    const measureWidth = () => {
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

    const timer = setTimeout(measureWidth, 50);
    window.addEventListener("resize", measureWidth);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measureWidth);
    };
  }, [children, baseVelocity]);

  useAnimationFrame((_, delta) => {
    if (contentWidth === 0 || !scrollerRef.current || xPos.current === null) return;

    const scrollBoost = velocityFactor.get();
    const baseMove = baseVelocity * (delta / 1000);
    const velocityMultiplier = 1 + Math.abs(scrollBoost) * 0.5;
    const totalMove = baseMove * velocityMultiplier;

    xPos.current += totalMove;

    if (xPos.current <= -contentWidth) {
      xPos.current += contentWidth;
    } else if (xPos.current >= 0) {
      xPos.current -= contentWidth;
    }

    scrollerRef.current.style.transform = `translateX(${xPos.current}px)`;
  });

  const repeatedContent = (
    <>
      {children}{children}{children}{children}{children}
    </>
  );

  return (
    <div className="relative overflow-hidden">
      <div
        ref={scrollerRef}
        className="flex whitespace-nowrap will-change-transform"
        style={{ transform: "translateX(-25%)" }}
      >
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            data-copy={i}
            className={`shrink-0 ${className}`}
          >
            {repeatedContent}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ScrollVelocity({
  texts = [],
  velocity = 100,
  className = "",
  damping = 50,
  stiffness = 400,
  parallaxClassName = "",
}: ScrollVelocityProps) {
  return (
    <div className={parallaxClassName}>
      {texts.map((text, index) => (
        <VelocityRow
          key={index}
          baseVelocity={index % 2 === 0 ? -velocity : velocity}
          className={className}
          damping={damping}
          stiffness={stiffness}
        >
          {text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </VelocityRow>
      ))}
    </div>
  );
}
