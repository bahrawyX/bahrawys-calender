"use client";

/**
 * ScrollProgressBar — fixed 2px brand-gradient reading progress bar.
 *
 * Adapted from 21st.dev Scroll Progress component.
 * Spring-smoothed scaleX driven by useScroll, origin-left.
 * Glows purple to match the site's accent.
 */

import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 42,
    bounce: 0,
  });

  return (
    <motion.div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[200] h-[2px] origin-left pointer-events-none"
      style={{
        scaleX,
        background:
          "linear-gradient(90deg, hsl(249 66% 64%), hsl(258 64% 58%), hsl(268 60% 52%))",
        boxShadow: "0 0 10px hsl(249 66% 60% / 0.55), 0 0 20px hsl(249 66% 60% / 0.2)",
      }}
    />
  );
}
