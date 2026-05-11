"use client";

/**
 * PageTransitionOverlay — the liquid portal.
 *
 * Renders a full-viewport overlay that:
 *
 *  1. COVERING: a dark circle with a glowing purple hot-spot expands from the
 *     exact pixel where the CTA was clicked, using clip-path circle().
 *     Duration 580ms ease-out-quart — feels snappy but not abrupt.
 *
 *  2. REVEALING: once the calendar page has mounted beneath it, the overlay
 *     fades + drifts slightly upward (y: 0 → -18px), uncovering the app.
 *     Duration 520ms ease-out-quart.
 *
 * The covering phase and revealing phase use two separate motion.div elements
 * that swap atomically in one React render, preventing any flash between states.
 */

import { motion } from "framer-motion";
import { usePageTransition } from "@/context/TransitionContext";

const EASE_OUT_QUART: [number, number, number, number] = [0.165, 0.84, 0.44, 1];

function overlayGradient(cx: number, cy: number) {
  // Deep purple hot-spot at the click origin → calendar's own background color
  return (
    `radial-gradient(circle at ${cx}px ${cy}px, ` +
    `hsl(249 68% 16%) 0%, ` +
    `hsl(249 50% 10%) 18%, ` +
    `hsl(240 8% 8%) 48%)`
  );
}

export function PageTransitionOverlay() {
  const { phase, origin, onCoverDone, onRevealDone } = usePageTransition();

  if (phase === "idle") return null;

  const { x: cx, y: cy } = origin;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9999]"
    >
      {/* ── Phase 1: cover ─────────────────────────────────────────── */}
      {phase === "covering" && (
        <motion.div
          className="absolute inset-0"
          style={{ background: overlayGradient(cx, cy) }}
          initial={{ clipPath: `circle(0% at ${cx}px ${cy}px)` }}
          animate={{ clipPath: `circle(200% at ${cx}px ${cy}px)` }}
          transition={{ duration: 0.58, ease: EASE_OUT_QUART }}
          onAnimationComplete={onCoverDone}
        />
      )}

      {/* ── Phase 2: reveal ────────────────────────────────────────── */}
      {phase === "revealing" && (
        <motion.div
          className="absolute inset-0"
          style={{ background: overlayGradient(cx, cy) }}
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -18 }}
          transition={{ duration: 0.52, ease: EASE_OUT_QUART }}
          onAnimationComplete={onRevealDone}
        />
      )}
    </div>
  );
}
