'use client';

import * as React from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';

import { cn } from '@/lib/utils';

interface CardStickyProps {
  index?: number;
  incrementY?: number;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const CardsStackContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLProps<HTMLDivElement>
>(({ children, className, style, ...props }, ref) => {
  const localRef = React.useRef<HTMLDivElement>(null);
  const stackRef = (ref as React.RefObject<HTMLDivElement>) ?? localRef;
  const items = React.Children.toArray(children);
  const total = Math.max(items.length, 1);

  const { scrollYProgress } = useScroll({
    target: stackRef,
    offset: ['start start', 'end end'],
  });

  return (
    <div
      ref={stackRef}
      className={cn('relative w-full', className)}
      style={{
        height: `${total * 100}vh`,
        ...style,
      }}
      {...props}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        <div className="relative w-full" style={{ height: 730 }}>
        {items.map((child, index) => {
          if (!React.isValidElement(child)) return child;
          return React.cloneElement(
            child as React.ReactElement<CardStickyProps>,
            {
              index,
              'data-total': total,
              scrollYProgress,
            } as unknown as Partial<CardStickyProps>,
          );
        })}
        </div>
      </div>
    </div>
  );
});
CardsStackContainer.displayName = 'CardsStackContainer';

type InternalCardStickyProps = CardStickyProps & {
  scrollYProgress?: MotionValue<number>;
  'data-total'?: number;
};

export const CardSticky = React.forwardRef<HTMLDivElement, InternalCardStickyProps>(
  (
    {
      index = 0,
      incrementY = 20,
      children,
      className,
      style,
      scrollYProgress,
      'data-total': total = 1,
    },
    ref,
  ) => {
    const step = 1 / total;
    const start = index * step;
    const end = Math.min(1, start + step * 0.5);

    // Each card slides up from below the viewport to its stacked position
    const yOffset = index * incrementY;
    const y = useTransform(
      scrollYProgress ?? fallback,
      [Math.max(0, start - step * 0.1), end],
      [index === 0 ? yOffset : 800, yOffset],
    );

    // Earlier cards scale down slightly as later cards arrive
    const nextStart = Math.min(1, (index + 1) * step);
    const nextEnd = Math.min(1, nextStart + step * 0.5);
    const scale = useTransform(
      scrollYProgress ?? fallback,
      [nextStart, nextEnd],
      [1, 0.95],
    );

    return (
      <motion.div
        ref={ref}
        className={cn('absolute inset-x-0 top-0 w-full', className)}
        style={{
          y,
          scale: index < total - 1 ? scale : undefined,
          zIndex: index + 1,
          transformOrigin: 'top center',
          ...style,
        }}
      >
        {children}
      </motion.div>
    );
  },
);
CardSticky.displayName = 'CardSticky';

const fallback = {
  get: () => 0,
  on: () => () => undefined,
} as unknown as MotionValue<number>;
