"use client";

/**
 * Reveal — shared scroll-entry primitive.
 *
 * Per high-end-visual-design §5.C: "Elements never appear statically on
 * load. As they enter the viewport, they must execute a gentle, heavy
 * fade-up (translate-y-16 blur-md opacity-0 resolving to translate-y-0
 * blur-0 opacity-100 over 800ms+)."
 *
 * Uses Framer Motion's whileInView (which is IntersectionObserver
 * underneath), never window scroll listeners. Honours reduced-motion.
 */

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const EASE_OUT_QUART: [number, number, number, number] = [0.165, 0.84, 0.44, 1];

export function Reveal({
  children,
  delay = 0,
  y = 28,
  blur = 8,
  duration = 0.8,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  blur?: number;
  duration?: number;
  className?: string;
  as?: "div" | "section" | "article" | "header" | "footer";
}) {
  const shouldReduce = useReducedMotion();

  const MotionTag = motion[as] as any;

  if (shouldReduce) {
    // Reduced motion: opacity only, no movement or blur. Per emil-design-eng:
    // "Keep opacity and color transitions that aid comprehension. Remove
    // movement and position animations."
    return (
      <MotionTag
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.4, ease: EASE_OUT_QUART, delay }}
        className={className}
      >
        {children}
      </MotionTag>
    );
  }

  return (
    <MotionTag
      initial={{ opacity: 0, y, filter: `blur(${blur}px)` }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration, ease: EASE_OUT_QUART, delay }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Stagger — wraps children with sequential delays.
 * Pass `step` to control the gap; per emil-design-eng, keep it 30–80ms.
 */
export function Stagger({
  children,
  step = 0.06,
  baseDelay = 0,
}: {
  children: ReactNode[];
  step?: number;
  baseDelay?: number;
}) {
  return (
    <>
      {children.map((child, i) => (
        <Reveal key={i} delay={baseDelay + i * step}>
          {child}
        </Reveal>
      ))}
    </>
  );
}
