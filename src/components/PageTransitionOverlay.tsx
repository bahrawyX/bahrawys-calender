"use client";

import { motion } from "framer-motion";
import { usePageTransition } from "@/context/TransitionContext";

const BG = "hsl(240 8% 8%)";
const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

export function PageTransitionOverlay() {
  const { phase, onCoverDone, onRevealDone } = usePageTransition();

  if (phase === "idle") return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[9999]">
      {phase === "covering" && (
        <motion.div
          className="absolute inset-0"
          style={{ background: BG }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, ease: EASE }}
          onAnimationComplete={onCoverDone}
        />
      )}
      {phase === "revealing" && (
        <motion.div
          className="absolute inset-0"
          style={{ background: BG }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          onAnimationComplete={onRevealDone}
        />
      )}
    </div>
  );
}
