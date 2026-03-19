"use client";

import React, { ReactNode, useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

export function ScrollStackItem({
  children,
  className = "",
  index = 0,
  total = 3,
  progress,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
  total?: number;
  progress?: MotionValue<number>;
}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: localProgress } = useScroll({ target: targetRef });
  const activeProgress = progress || localProgress;

  const start = total > 0 ? index / total : 0;
  const end = 1;

  const scale = useTransform(activeProgress, [start, end], [1, 1 - (total - index - 1) * 0.04]);
  const blurValue = useTransform(activeProgress, [start, end], [0, (total - index - 1) * 2]);
  const filter = useTransform(blurValue, (v) => `blur(${v}px)`);

  return (
    <div 
      ref={targetRef}
      className={`sticky w-full ${className}`.trim()}
      style={{
        top: `calc(15vh + ${index * 30}px)`,
        marginTop: index === 0 ? '0' : '50vh',
      }}
    >
      <motion.div style={{ scale, filter, transformOrigin: 'top center', willChange: 'transform, filter' }}>
        {children}
      </motion.div>
    </div>
  );
}

export default function ScrollStack({
  children,
  className = "",
  ...props
}: {
  children: ReactNode;
  className?: string;
  [key: string]: any;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const count = React.Children.count(children);

  return (
    <div ref={containerRef} className={`relative w-full pb-[20vh] ${className}`.trim()}>
      <div className="flex flex-col w-full relative">
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, { 
              index, 
              total: count,
              progress: scrollYProgress
            });
          }
          return child;
        })}
      </div>
    </div>
  );
}
