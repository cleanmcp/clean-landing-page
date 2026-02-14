"use client";

import { useRef, useState, useCallback } from "react";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlowCard({ children, className = "" }: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [glowStyle, setGlowStyle] = useState<React.CSSProperties>({});
  const [hovering, setHovering] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setGlowStyle({
        background: `radial-gradient(320px circle at ${x}px ${y}px, var(--accent-glow), transparent 60%)`,
      });
    },
    []
  );

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          ...glowStyle,
          opacity: hovering ? 1 : 0,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
